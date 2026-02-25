import {
  getActiveUserSanction,
  normalizeUsername,
  type StoreData,
  type StoredUser,
} from "@/lib/server/store";
import { ADMIN_PANEL_USERNAME } from "@/lib/shared/admin";

export const ADMIN_USERNAME = normalizeUsername(ADMIN_PANEL_USERNAME);

function formatUntilIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function isAdminUsername(username: string): boolean {
  return normalizeUsername(username) === ADMIN_USERNAME;
}

export function isAdminUser(user: Pick<StoredUser, "username"> | null | undefined): boolean {
  return Boolean(user && isAdminUsername(user.username));
}

export function requireAdminUser(store: StoreData, userId: string): StoredUser {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("Missing userId.");
  }

  const user = store.users.find((candidate) => candidate.id === normalizedUserId);
  if (!user) {
    throw new Error("User not found.");
  }
  if (!isAdminUser(user)) {
    throw new Error("Forbidden.");
  }
  return user;
}

export function assertUserCanReadMessenger(
  store: StoreData,
  userId: string,
  now = Date.now()
): void {
  const sanction = getActiveUserSanction(store, userId, now);
  if (sanction?.bannedUntil && sanction.bannedUntil > now) {
    throw new Error(
      `Your account is suspended until ${formatUntilIso(sanction.bannedUntil)}.`
    );
  }
}

export function assertUserCanSendMessages(
  store: StoreData,
  userId: string,
  now = Date.now()
): void {
  const sanction = getActiveUserSanction(store, userId, now);
  if (!sanction) {
    return;
  }
  if (sanction.bannedUntil > now) {
    throw new Error(
      `Your account is suspended until ${formatUntilIso(sanction.bannedUntil)}.`
    );
  }
  if (sanction.mutedUntil > now) {
    throw new Error(`You are muted until ${formatUntilIso(sanction.mutedUntil)}.`);
  }
}
