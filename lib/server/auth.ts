import { randomBytes } from "node:crypto";

import { getStore, updateStore } from "./store";

function extractToken(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}

function extractIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}

export async function createAuthToken(
  userId: string,
  request?: Request
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  await updateStore((store) => {
    store.authTokens[token] = {
      userId,
      createdAt: now,
      lastUsedAt: now,
      userAgent: request?.headers.get("user-agent") ?? undefined,
      ip: request ? extractIp(request) : undefined,
    };
    return token;
  });
  return token;
}

export async function resolveUserIdFromRequest(
  request: Request
): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;
  const store = await getStore();
  const record = store.authTokens[token];
  if (!record) return null;
  // обновить lastUsedAt асинхронно (без await — не блокируем запрос)
  void updateStore((s) => {
    const r = s.authTokens[token];
    if (r) r.lastUsedAt = Date.now();
  });
  return record.userId;
}

/**
 * Verifies the Bearer token and optionally checks it matches claimedUserId.
 * Returns the resolved userId or null if unauthorized.
 */
export async function requireAuth(
  request: Request,
  claimedUserId?: string
): Promise<string | null> {
  const tokenUserId = await resolveUserIdFromRequest(request);
  if (!tokenUserId) return null;
  if (claimedUserId && claimedUserId !== tokenUserId) return null;
  return tokenUserId;
}

/**
 * Like resolveUserIdFromRequest but also accepts ?token= query param
 * for SSE connections (EventSource cannot set custom headers).
 */
export async function resolveUserIdFromRequestOrQuery(
  request: Request
): Promise<string | null> {
  const fromHeader = await resolveUserIdFromRequest(request);
  if (fromHeader) return fromHeader;
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token")?.trim() ?? "";
  if (!queryToken) return null;
  const store = await getStore();
  const record = store.authTokens[queryToken];
  if (!record) return null;
  void updateStore((s) => {
    const r = s.authTokens[queryToken];
    if (r) r.lastUsedAt = Date.now();
  });
  return record.userId;
}

/** Возвращает токен из заголовка (для отзыва текущей сессии) */
export function getTokenFromRequest(request: Request): string {
  return extractToken(request);
}
