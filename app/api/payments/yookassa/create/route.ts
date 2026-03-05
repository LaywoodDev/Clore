import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { isAvatarDecorationId } from "@/lib/shared/avatar-decorations";
import {
  canUseAvatarDecoration,
  getStore,
  updateStore,
  hasActivePrimeSubscription,
} from "@/lib/server/store";
import {
  createAvatarDecorationPayment,
  createGiftPrimePayment,
  createPrimePayment,
} from "@/lib/server/yookassa";

type CreatePaymentPayload = {
  userId?: string;
  product?: "prime" | "avatar_decoration" | "prime_gift";
  avatarDecoration?: string;
  recipientUserId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreatePaymentPayload | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawProduct = body?.product ?? "prime";
  const product =
    rawProduct === "avatar_decoration" || rawProduct === "prime_gift"
      ? rawProduct
      : "prime";

  const avatarDecoration =
    typeof body?.avatarDecoration === "string" && isAvatarDecorationId(body.avatarDecoration)
      ? body.avatarDecoration
      : "none";

  const store = await getStore();
  const user = store.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (product === "avatar_decoration") {
    if (avatarDecoration === "none") {
      return NextResponse.json({ error: "Choose a valid avatar frame." }, { status: 400 });
    }
    if (canUseAvatarDecoration(user, avatarDecoration)) {
      return NextResponse.json(
        { error: "This avatar frame is already available on your account." },
        { status: 409 }
      );
    }
  }

  if (product === "prime_gift") {
    const recipientUserId = body?.recipientUserId?.trim() ?? "";
    if (!recipientUserId) {
      return NextResponse.json({ error: "Missing recipientUserId." }, { status: 400 });
    }
    if (recipientUserId === userId) {
      return NextResponse.json({ error: "Cannot gift Prime to yourself." }, { status: 400 });
    }
    const recipient = store.users.find((candidate) => candidate.id === recipientUserId);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
    }
    if (hasActivePrimeSubscription(recipient)) {
      return NextResponse.json(
        { error: "This user already has an active Prime subscription." },
        { status: 409 }
      );
    }
    try {
      const payment = await createGiftPrimePayment({ senderUserId: userId, recipientUserId });
      const confirmationUrl = payment.confirmation?.confirmation_url?.trim() ?? "";
      if (!confirmationUrl) {
        throw new Error("YooKassa did not return a confirmation URL.");
      }
      return NextResponse.json({ paymentId: payment.id, confirmationUrl, status: "pending", product });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create gift prime payment.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    const payment =
      product === "avatar_decoration"
        ? await createAvatarDecorationPayment({ userId, avatarDecoration })
        : await createPrimePayment({ userId });
    const confirmationUrl = payment.confirmation?.confirmation_url?.trim() ?? "";
    if (!confirmationUrl) {
      throw new Error("YooKassa did not return a confirmation URL.");
    }

    if (product === "prime") {
      await updateStore<void>((mutableStore) => {
        const mutableUser = mutableStore.users.find((candidate) => candidate.id === userId);
        if (!mutableUser) {
          throw new Error("User not found.");
        }
        mutableUser.primeStatus = "pending";
        mutableUser.primePendingPaymentId = payment.id;
      });
    }

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl,
      status: "pending",
      product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create YooKassa payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
