import { NextResponse } from "next/server";

import { isAvatarDecorationId } from "@/lib/shared/avatar-decorations";
import {
  canUseAvatarDecoration,
  getStore,
  updateStore,
} from "@/lib/server/store";
import {
  createAvatarDecorationPayment,
  createPrimePayment,
} from "@/lib/server/yookassa";

type CreatePaymentPayload = {
  userId?: string;
  product?: "prime" | "avatar_decoration";
  avatarDecoration?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreatePaymentPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const product = body?.product === "avatar_decoration" ? "avatar_decoration" : "prime";
  const avatarDecoration =
    typeof body?.avatarDecoration === "string" && isAvatarDecorationId(body.avatarDecoration)
      ? body.avatarDecoration
      : "none";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

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
