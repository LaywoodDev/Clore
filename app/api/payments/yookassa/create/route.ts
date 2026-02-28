import { NextResponse } from "next/server";

import { getStore, updateStore } from "@/lib/server/store";
import { createPrimePayment } from "@/lib/server/yookassa";

type CreatePaymentPayload = {
  userId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreatePaymentPayload | null;
  const userId = body?.userId?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const store = await getStore();
  const user = store.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    const payment = await createPrimePayment({ userId });
    const confirmationUrl = payment.confirmation?.confirmation_url?.trim() ?? "";
    if (!confirmationUrl) {
      throw new Error("YooKassa did not return a confirmation URL.");
    }

    await updateStore<void>((mutableStore) => {
      const mutableUser = mutableStore.users.find((candidate) => candidate.id === userId);
      if (!mutableUser) {
        throw new Error("User not found.");
      }
      mutableUser.primeStatus = "pending";
      mutableUser.primePendingPaymentId = payment.id;
    });

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl,
      status: "pending",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create YooKassa payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
