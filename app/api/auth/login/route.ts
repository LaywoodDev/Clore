import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import { createAuthToken } from "@/lib/server/auth";
import { assertUserCanReadMessenger } from "@/lib/server/admin";
import { getStore, normalizeUsername, toPublicUser, updateStore } from "@/lib/server/store";
import { publishUserEvent } from "@/lib/server/realtime";

type LoginPayload = {
  identifier?: string;
  password?: string;
};

function generateCode(): string {
  // 6-digit numeric code
  return String(Math.floor(100000 + (randomBytes(4).readUInt32BE(0) % 900000)));
}

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

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isHashed = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
    let passwordValid: boolean;
    if (isHashed) {
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      passwordValid = user.password === password;
      if (passwordValid) {
        const newHash = await bcrypt.hash(password, 10);
        await updateStore<void>((s) => {
          const stored = s.users.find((u) => u.id === user.id);
          if (stored) stored.password = newHash;
        }).catch(() => undefined);
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    try {
      assertUserCanReadMessenger(store, user.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Your account is suspended.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Check for existing active sessions
    const hasActiveSessions = Object.values(store.authTokens).some(
      (t) => t.userId === user.id
    );

    if (hasActiveSessions) {
      // Require verification — create pending login
      const pendingId = randomBytes(16).toString("hex");
      const code = generateCode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      const userAgent = request.headers.get("user-agent") ?? undefined;
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        undefined;

      await updateStore((s) => {
        s.pendingLogins[pendingId] = { id: pendingId, userId: user.id, code, expiresAt, userAgent, ip };
      });

      // Notify all active sessions of this user via SSE
      publishUserEvent(user.id, {
        type: "login_verification",
        pendingId,
        code,
        userAgent: userAgent ?? null,
        ip: ip ?? null,
        expiresAt,
      });

      return NextResponse.json({ requiresVerification: true, pendingId });
    }

    // No existing sessions — login directly
    const token = await createAuthToken(user.id, request);
    return NextResponse.json({ user: toPublicUser(user), token });
  } catch (error) {
    console.error("Login route failed.", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
