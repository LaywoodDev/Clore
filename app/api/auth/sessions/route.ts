import { NextResponse } from "next/server";

import { getTokenFromRequest, requireAuth } from "@/lib/server/auth";
import { getStore, updateStore } from "@/lib/server/store";

// GET /api/auth/sessions — список сессий текущего пользователя
export async function GET(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentToken = getTokenFromRequest(request);
  const store = await getStore();

  const sessions = Object.entries(store.authTokens)
    .filter(([, record]) => record.userId === userId)
    .map(([token, record]) => ({
      id: token.slice(0, 8), // короткий публичный идентификатор
      token: token,          // нужен клиенту для отзыва
      createdAt: record.createdAt,
      lastUsedAt: record.lastUsedAt,
      userAgent: record.userAgent ?? null,
      ip: record.ip ?? null,
      isCurrent: token === currentToken,
    }))
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt);

  return NextResponse.json({ sessions });
}

// DELETE /api/auth/sessions — отозвать сессию(и)
// body: { token: string } — отозвать конкретную
// body: { all: true }    — отозвать все кроме текущей
export async function DELETE(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentToken = getTokenFromRequest(request);
  const body = (await request.json().catch(() => null)) as
    | { token?: string; all?: boolean }
    | null;

  if (body?.all) {
    await updateStore((store) => {
      for (const [token, record] of Object.entries(store.authTokens)) {
        if (record.userId === userId && token !== currentToken) {
          delete store.authTokens[token];
        }
      }
    });
    return NextResponse.json({ ok: true, revoked: "all" });
  }

  const targetToken = body?.token;
  if (!targetToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const store = await getStore();
  const record = store.authTokens[targetToken];
  if (!record || record.userId !== userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await updateStore((s) => {
    delete s.authTokens[targetToken];
  });

  return NextResponse.json({ ok: true });
}
