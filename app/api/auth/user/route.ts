import { NextResponse } from "next/server";

import { resolveUserIdFromRequest } from "@/lib/server/auth";
import { assertUserCanReadMessenger } from "@/lib/server/admin";
import { getStore, toPublicUser } from "@/lib/server/store";

export async function GET(request: Request) {
  const userId = await resolveUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = await getStore();
  const user = store.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  try {
    assertUserCanReadMessenger(store, user.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Your account is suspended.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}
