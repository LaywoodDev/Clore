import { NextResponse } from "next/server";

import { createAuthToken } from "@/lib/server/auth";
import { getStore, toPublicUser, updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { pendingId?: string; code?: string }
    | null;

  const pendingId = body?.pendingId?.trim() ?? "";
  const code = body?.code?.trim() ?? "";

  if (!pendingId || !code) {
    return NextResponse.json({ error: "Missing pendingId or code." }, { status: 400 });
  }

  const store = await getStore();
  const pending = store.pendingLogins[pendingId];

  if (!pending) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  if (Date.now() > pending.expiresAt) {
    await updateStore((s) => { delete s.pendingLogins[pendingId]; });
    return NextResponse.json({ error: "Code expired." }, { status: 401 });
  }

  if (pending.code !== code) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 401 });
  }

  // Code correct — create session and delete pending
  const user = store.users.find((u) => u.id === pending.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await updateStore((s) => { delete s.pendingLogins[pendingId]; });
  const token = await createAuthToken(user.id, request);

  return NextResponse.json({ user: toPublicUser(user), token });
}
