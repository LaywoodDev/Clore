import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import {
  getAvatarDecorationPriceRub,
  getPrimePriceRub,
} from "@/lib/server/yookassa";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const claimedUserId = searchParams.get("userId")?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = await getStore();
  const user = store.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const now = Date.now();
  const expiresAt =
    typeof user.primeExpiresAt === "number" && Number.isFinite(user.primeExpiresAt)
      ? Math.max(0, Math.trunc(user.primeExpiresAt))
      : 0;
  const rawStatus =
    user.primeStatus === "pending" ||
    user.primeStatus === "active" ||
    user.primeStatus === "canceled"
      ? user.primeStatus
      : "inactive";
  const effectiveStatus =
    rawStatus === "active" && expiresAt > 0 && expiresAt <= now ? "inactive" : rawStatus;

  return NextResponse.json({
    status: effectiveStatus,
    expiresAt,
    autoRenew: user.primeAutoRenew === true,
    pendingPaymentId: typeof user.primePendingPaymentId === "string" ? user.primePendingPaymentId : "",
    priceRub: getPrimePriceRub(),
    avatarDecorationPriceRub: getAvatarDecorationPriceRub(),
    isActive: effectiveStatus === "active" && expiresAt > now,
  });
}
