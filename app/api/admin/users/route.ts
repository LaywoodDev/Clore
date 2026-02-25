import { NextResponse } from "next/server";

import { isAdminUser, requireAdminUser } from "@/lib/server/admin";
import {
  createEntityId,
  normalizeEmail,
  normalizeUsername,
  type GroupRole,
  type StoreData,
  type StoredChatThread,
  type StoredModerationAuditAction,
  type StoredModerationAuditLog,
  type StoredUserSanction,
  updateStore,
} from "@/lib/server/store";

type AdminUserAction = "update_user_profile" | "set_user_blocked" | "delete_user";

type AdminUserProfilePayload = {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  birthday?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

type AdminUserActionPayload = {
  userId?: string;
  action?: AdminUserAction;
  targetUserId?: string;
  profile?: AdminUserProfilePayload;
  blocked?: boolean;
  durationHours?: number;
  reason?: string;
};

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AUDIT_LOGS = 500;
const MIN_BLOCK_DURATION_HOURS = 1;
const MAX_BLOCK_DURATION_HOURS = 24 * 365 * 20;
const DEFAULT_BLOCK_DURATION_HOURS = 24 * 30;

type NormalizedProfileInput = {
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  avatarUrl: string;
  bannerUrl: string;
};

function clampText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function clampReason(value: string | undefined): string {
  return clampText(value ?? "", 400);
}

function normalizeDurationHours(
  rawValue: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const candidate =
    typeof rawValue === "number" && Number.isFinite(rawValue)
      ? Math.trunc(rawValue)
      : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function isValidBirthday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.toISOString().slice(0, 10) === value;
}

function normalizeProfileInput(profile: AdminUserProfilePayload | undefined): NormalizedProfileInput {
  return {
    name: clampText(profile?.name ?? "", 80),
    username: normalizeUsername(profile?.username ?? ""),
    email: normalizeEmail(profile?.email ?? ""),
    bio: clampText(profile?.bio ?? "", 1000),
    birthday: clampText(profile?.birthday ?? "", 10),
    avatarUrl: clampText(profile?.avatarUrl ?? "", 2000),
    bannerUrl: clampText(profile?.bannerUrl ?? "", 2000),
  };
}

function appendAuditLog(
  store: StoreData,
  entry: Omit<StoredModerationAuditLog, "id" | "createdAt">
): void {
  const created: StoredModerationAuditLog = {
    id: createEntityId("audit"),
    actorUserId: entry.actorUserId,
    action: entry.action,
    targetUserId: entry.targetUserId,
    reportId: entry.reportId,
    messageId: entry.messageId,
    reason: clampReason(entry.reason),
    createdAt: Date.now(),
  };
  store.moderationAuditLogs = [created, ...store.moderationAuditLogs].slice(
    0,
    MAX_AUDIT_LOGS
  );
}

function getOrCreateSanction(store: StoreData, userId: string): StoredUserSanction {
  const existing = store.userSanctions[userId];
  if (existing) {
    return {
      mutedUntil: Math.max(0, Math.trunc(existing.mutedUntil)),
      bannedUntil: Math.max(0, Math.trunc(existing.bannedUntil)),
      reason: clampText(existing.reason, 300),
      updatedAt: Math.max(0, Math.trunc(existing.updatedAt)),
    };
  }
  return {
    mutedUntil: 0,
    bannedUntil: 0,
    reason: "",
    updatedAt: 0,
  };
}

function commitSanction(
  store: StoreData,
  userId: string,
  sanction: StoredUserSanction,
  now: number
): void {
  if (sanction.mutedUntil <= now && sanction.bannedUntil <= now) {
    delete store.userSanctions[userId];
    return;
  }
  store.userSanctions[userId] = {
    mutedUntil: sanction.mutedUntil,
    bannedUntil: sanction.bannedUntil,
    reason: clampText(sanction.reason, 300),
    updatedAt: now,
  };
}

function ensureSingleGroupOwner(
  thread: StoredChatThread,
  memberIds: string[]
): Record<string, GroupRole> {
  const nextRoles: Record<string, GroupRole> = {};
  for (const memberId of memberIds) {
    const role = thread.groupRoles[memberId];
    nextRoles[memberId] =
      role === "owner" || role === "admin" || role === "member" ? role : "member";
  }

  const ownerIds = memberIds.filter((memberId) => nextRoles[memberId] === "owner");
  if (ownerIds.length === 0) {
    const fallbackOwnerId = memberIds.includes(thread.createdById)
      ? thread.createdById
      : (memberIds[0] ?? "");
    if (fallbackOwnerId) {
      nextRoles[fallbackOwnerId] = "owner";
    }
  } else if (ownerIds.length > 1) {
    const primaryOwner = ownerIds[0];
    for (const ownerId of ownerIds) {
      if (ownerId !== primaryOwner) {
        nextRoles[ownerId] = "admin";
      }
    }
  }

  const finalOwnerId =
    memberIds.find((memberId) => nextRoles[memberId] === "owner") ?? memberIds[0] ?? "";
  if (finalOwnerId) {
    nextRoles[finalOwnerId] = "owner";
  }

  return nextRoles;
}

function rebuildReadBy(
  source: Record<string, number>,
  memberIds: string[]
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const memberId of memberIds) {
    const value = source[memberId];
    next[memberId] =
      typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.trunc(value))
        : 0;
  }
  return next;
}

function rebuildBoolMap(
  source: Record<string, boolean>,
  memberIds: string[]
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const memberId of memberIds) {
    if (source[memberId] === true) {
      next[memberId] = true;
    }
  }
  return next;
}

function rebuildPositiveNumberMap(
  source: Record<string, number>,
  memberIds: string[]
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const memberId of memberIds) {
    const value = source[memberId];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      next[memberId] = Math.trunc(value);
    }
  }
  return next;
}

function deleteUserFromStore(store: StoreData, targetUserId: string): void {
  const removedThreadIds = new Set<string>();

  store.threads = store.threads.filter((thread) => {
    if (!thread.memberIds.includes(targetUserId)) {
      return true;
    }
    if (thread.threadType === "direct") {
      removedThreadIds.add(thread.id);
      return false;
    }

    const remainingMemberIds = thread.memberIds.filter(
      (memberId) => memberId !== targetUserId
    );
    if (remainingMemberIds.length < 2) {
      removedThreadIds.add(thread.id);
      return false;
    }

    thread.memberIds = remainingMemberIds;
    thread.readBy = rebuildReadBy(thread.readBy, remainingMemberIds);
    thread.pinnedBy = rebuildBoolMap(thread.pinnedBy, remainingMemberIds);
    thread.mutedBy = rebuildBoolMap(thread.mutedBy, remainingMemberIds);
    thread.typingBy = rebuildPositiveNumberMap(thread.typingBy, remainingMemberIds);

    const nextRoles = ensureSingleGroupOwner(thread, remainingMemberIds);
    thread.groupRoles = nextRoles;
    thread.createdById =
      remainingMemberIds.find((memberId) => nextRoles[memberId] === "owner") ??
      remainingMemberIds[0] ??
      "";
    return true;
  });

  store.messages = store.messages.filter((message) => {
    if (removedThreadIds.has(message.chatId)) {
      return false;
    }
    if (message.authorId === targetUserId) {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(message.savedBy, targetUserId)) {
      delete message.savedBy[targetUserId];
    }
    return true;
  });

  const remainingThreadIds = new Set(store.threads.map((thread) => thread.id));
  const remainingMessageIds = new Set(store.messages.map((message) => message.id));

  store.callSignals = store.callSignals.filter(
    (signal) =>
      !removedThreadIds.has(signal.chatId) &&
      signal.fromUserId !== targetUserId &&
      signal.toUserId !== targetUserId &&
      remainingThreadIds.has(signal.chatId)
  );

  store.moderationReports = store.moderationReports.filter(
    (report) =>
      report.reporterUserId !== targetUserId &&
      report.targetUserId !== targetUserId &&
      remainingThreadIds.has(report.chatId) &&
      remainingMessageIds.has(report.messageId)
  );

  for (const user of store.users) {
    if (user.id === targetUserId) {
      continue;
    }
    user.blockedUserIds = user.blockedUserIds.filter((userId) => userId !== targetUserId);
    user.lastSeenAllowedUserIds = user.lastSeenAllowedUserIds.filter(
      (userId) => userId !== targetUserId
    );
    user.avatarAllowedUserIds = user.avatarAllowedUserIds.filter(
      (userId) => userId !== targetUserId
    );
    user.bioAllowedUserIds = user.bioAllowedUserIds.filter(
      (userId) => userId !== targetUserId
    );
    user.birthdayAllowedUserIds = user.birthdayAllowedUserIds.filter(
      (userId) => userId !== targetUserId
    );
  }

  delete store.userSanctions[targetUserId];
  store.users = store.users.filter((user) => user.id !== targetUserId);

  const existingUserIds = new Set(store.users.map((user) => user.id));
  for (const sanctionedUserId of Object.keys(store.userSanctions)) {
    if (!existingUserIds.has(sanctionedUserId)) {
      delete store.userSanctions[sanctionedUserId];
    }
  }

  const latestMessageByChatId = new Map<string, number>();
  for (const message of store.messages) {
    const current = latestMessageByChatId.get(message.chatId) ?? 0;
    if (message.createdAt > current) {
      latestMessageByChatId.set(message.chatId, message.createdAt);
    }
  }
  for (const thread of store.threads) {
    const latestMessageAt = latestMessageByChatId.get(thread.id);
    thread.updatedAt = latestMessageAt && latestMessageAt > 0 ? latestMessageAt : thread.createdAt;
  }
}

function getErrorStatus(message: string): number {
  if (
    message === "Missing userId." ||
    message === "Missing action." ||
    message === "Missing targetUserId." ||
    message === "Missing profile fields." ||
    message === "Missing blocked flag." ||
    message === "Username: 3-20 chars, latin letters, digits or underscore." ||
    message === "Enter a valid email." ||
    message === "Birthday must be in YYYY-MM-DD format."
  ) {
    return 400;
  }
  if (
    message === "Username is already taken." ||
    message === "Email is already registered."
  ) {
    return 409;
  }
  if (
    message === "Forbidden." ||
    message === "Cannot modify admin account." ||
    message === "You cannot moderate your own account."
  ) {
    return 403;
  }
  if (message === "User not found." || message === "Target user not found.") {
    return 404;
  }
  return 400;
}

function actionToAuditAction(action: AdminUserAction, blocked?: boolean): StoredModerationAuditAction {
  if (action === "update_user_profile") {
    return "user_profile_updated";
  }
  if (action === "delete_user") {
    return "user_deleted";
  }
  return blocked ? "user_banned" : "user_unbanned";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AdminUserActionPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const action = body?.action;
  const targetUserId = body?.targetUserId?.trim() ?? "";
  const reason = clampReason(body?.reason);

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const actor = requireAdminUser(store, userId);
      const target = store.users.find((candidate) => candidate.id === targetUserId);
      if (!target) {
        throw new Error("Target user not found.");
      }
      if (isAdminUser(target)) {
        throw new Error("Cannot modify admin account.");
      }
      if (action !== "update_user_profile" && target.id === actor.id) {
        throw new Error("You cannot moderate your own account.");
      }

      const now = Date.now();

      if (action === "update_user_profile") {
        const profile = normalizeProfileInput(body?.profile);
        if (!profile.name || !profile.username || !profile.email) {
          throw new Error("Missing profile fields.");
        }
        if (!USERNAME_REGEX.test(profile.username)) {
          throw new Error("Username: 3-20 chars, latin letters, digits or underscore.");
        }
        if (!EMAIL_REGEX.test(profile.email)) {
          throw new Error("Enter a valid email.");
        }
        if (profile.birthday && !isValidBirthday(profile.birthday)) {
          throw new Error("Birthday must be in YYYY-MM-DD format.");
        }

        const usernameTaken = store.users.some(
          (candidate) =>
            candidate.id !== target.id && candidate.username === profile.username
        );
        if (usernameTaken) {
          throw new Error("Username is already taken.");
        }
        const emailTaken = store.users.some(
          (candidate) => candidate.id !== target.id && candidate.email === profile.email
        );
        if (emailTaken) {
          throw new Error("Email is already registered.");
        }

        target.name = profile.name;
        target.username = profile.username;
        target.email = profile.email;
        target.bio = profile.bio;
        target.birthday = profile.birthday;
        target.avatarUrl = profile.avatarUrl;
        target.bannerUrl = profile.bannerUrl;
      } else if (action === "set_user_blocked") {
        if (typeof body?.blocked !== "boolean") {
          throw new Error("Missing blocked flag.");
        }

        const sanction = getOrCreateSanction(store, target.id);
        if (body.blocked) {
          const durationHours = normalizeDurationHours(
            body.durationHours,
            DEFAULT_BLOCK_DURATION_HOURS,
            MIN_BLOCK_DURATION_HOURS,
            MAX_BLOCK_DURATION_HOURS
          );
          sanction.bannedUntil = now + durationHours * 60 * 60 * 1000;
          sanction.reason = reason || sanction.reason || "Account blocked by admin.";
        } else {
          sanction.bannedUntil = 0;
          if (reason) {
            sanction.reason = reason;
          }
        }
        sanction.updatedAt = now;
        commitSanction(store, target.id, sanction, now);
      } else if (action === "delete_user") {
        deleteUserFromStore(store, target.id);
      } else {
        const exhaustive: never = action;
        throw new Error(`Unsupported action: ${String(exhaustive)}`);
      }

      appendAuditLog(store, {
        actorUserId: actor.id,
        action: actionToAuditAction(action, body?.blocked),
        targetUserId: target.id,
        reportId: "",
        messageId: "",
        reason:
          reason ||
          (action === "update_user_profile"
            ? "User profile updated by admin."
            : action === "delete_user"
              ? "User account deleted by admin."
              : body?.blocked
                ? "User account blocked by admin."
                : "User account unblocked by admin."),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to manage user.";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
