import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { type StoredPushSubscription, updateStore } from "@/lib/server/store";

const MAX_SUBS_PER_USER = 20;

type SubscribeBody = {
  userId?: string;
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

type UnsubscribeBody = {
  userId?: string;
  endpoint?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const endpoint = body?.subscription?.endpoint?.trim() ?? "";
  const p256dh = body?.subscription?.keys?.p256dh?.trim() ?? "";
  const auth = body?.subscription?.keys?.auth?.trim() ?? "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const newSub: StoredPushSubscription = { endpoint, keys: { p256dh, auth } };

  await updateStore<void>((store) => {
    if (!store.pushSubscriptions) {
      store.pushSubscriptions = {};
    }
    const existing = store.pushSubscriptions[userId] ?? [];
    const deduped = existing.filter((s) => s.endpoint !== endpoint);
    deduped.push(newSub);
    store.pushSubscriptions[userId] = deduped.slice(-MAX_SUBS_PER_USER);
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as UnsubscribeBody | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const endpoint = body?.endpoint?.trim() ?? "";
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  await updateStore<void>((store) => {
    if (!store.pushSubscriptions?.[userId]) {
      return;
    }
    store.pushSubscriptions[userId] = store.pushSubscriptions[userId].filter(
      (s) => s.endpoint !== endpoint
    );
  });

  return NextResponse.json({ ok: true });
}
