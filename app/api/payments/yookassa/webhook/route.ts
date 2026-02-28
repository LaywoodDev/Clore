import { NextResponse } from "next/server";

import { isAvatarDecorationId } from "@/lib/shared/avatar-decorations";
import { getPurchasedAvatarDecorations, updateStore } from "@/lib/server/store";
import {
  AVATAR_DECORATION_PRODUCT_CODE,
  getYooKassaPayment,
  PRIME_PLAN_CODE,
  PRIME_SUBSCRIPTION_DURATION_MS,
} from "@/lib/server/yookassa";

type YooKassaWebhookBody = {
  event?: string;
  object?: {
    id?: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as YooKassaWebhookBody | null;
  const event = body?.event?.trim() ?? "";
  const paymentId = body?.object?.id?.trim() ?? "";

  if (!event || !paymentId) {
    return NextResponse.json({ error: "Invalid YooKassa webhook payload." }, { status: 400 });
  }

  try {
    const payment = await getYooKassaPayment(paymentId);
    const metadata = payment.metadata ?? {};
    const isPrimePayment = metadata.plan === PRIME_PLAN_CODE;
    const isAvatarDecorationPayment = metadata.product === AVATAR_DECORATION_PRODUCT_CODE;
    if (!isPrimePayment && !isAvatarDecorationPayment) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const userId = metadata.userId?.trim() ?? "";
    if (!userId) {
      throw new Error("YooKassa payment metadata is missing userId.");
    }

    await updateStore<void>((store) => {
      const user = store.users.find((candidate) => candidate.id === userId);
      if (!user) {
        throw new Error("User not found.");
      }

      if (isAvatarDecorationPayment) {
        const avatarDecoration =
          typeof metadata.avatarDecoration === "string" && isAvatarDecorationId(metadata.avatarDecoration)
            ? metadata.avatarDecoration
            : "none";
        if (avatarDecoration === "none") {
          throw new Error("YooKassa payment metadata is missing avatarDecoration.");
        }

        if (event === "payment.succeeded" && payment.status === "succeeded") {
          const purchased = getPurchasedAvatarDecorations(user);
          if (!purchased.includes(avatarDecoration)) {
            user.purchasedAvatarDecorations = [...purchased, avatarDecoration];
          } else {
            user.purchasedAvatarDecorations = purchased;
          }
          return;
        }

        return;
      }

      if (event === "payment.succeeded" && payment.status === "succeeded") {
        if (user.primeLastPaymentId === payment.id) {
          user.primePendingPaymentId = "";
          return;
        }

        const now = Date.now();
        const currentExpiry =
          typeof user.primeExpiresAt === "number" && Number.isFinite(user.primeExpiresAt)
            ? Math.max(0, Math.trunc(user.primeExpiresAt))
            : 0;
        const nextPeriodStart = currentExpiry > now ? currentExpiry : now;

        user.primeStatus = "active";
        user.primeExpiresAt = nextPeriodStart + PRIME_SUBSCRIPTION_DURATION_MS;
        user.primePendingPaymentId = "";
        user.primeLastPaymentId = payment.id;
        user.primeAutoRenew = Boolean(payment.payment_method?.id);
        if (payment.payment_method?.id?.trim()) {
          user.primePaymentMethodId = payment.payment_method.id.trim();
        }
        return;
      }

      if (event === "payment.canceled" || payment.status === "canceled") {
        if (user.primePendingPaymentId === payment.id) {
          user.primePendingPaymentId = "";
        }
        if (user.primeStatus !== "active") {
          user.primeStatus = "canceled";
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
