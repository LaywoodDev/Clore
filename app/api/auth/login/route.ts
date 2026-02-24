import { NextResponse } from "next/server";

import { getStore, normalizeUsername, toPublicUser } from "@/lib/server/store";

type LoginPayload = {
  identifier?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const identifier = body?.identifier?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Enter username/email and password." },
      { status: 400 }
    );
  }

  try {
    const store = await getStore();
    const normalizedUsername = normalizeUsername(identifier);
    const user = store.users.find(
      (candidate) =>
        candidate.email === identifier || candidate.username === normalizedUsername
    );

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Login route failed.", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
