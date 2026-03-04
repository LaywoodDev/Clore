// In-memory rate limiter: Map<"userId:key", number[]>
const timestamps = new Map<string, number[]>();

/**
 * Returns true if the action is allowed, false if rate-limited.
 * @param userId  Authenticated user id
 * @param key     Action name (e.g. "send", "create-poll")
 * @param limit   Max actions allowed within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  userId: string,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const mapKey = `${userId}:${key}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = timestamps.get(mapKey) ?? [];
  // Drop entries outside the current window
  const recent = existing.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    timestamps.set(mapKey, recent);
    return false;
  }

  recent.push(now);
  timestamps.set(mapKey, recent);
  return true;
}
