import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";

import { publishStoreUpdate } from "@/lib/server/realtime";

export type StoredUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  blockedUserIds: string[];
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: "everyone" | "selected" | "nobody";
  avatarVisibility: "everyone" | "selected" | "nobody";
  bioVisibility: "everyone" | "selected" | "nobody";
  birthdayVisibility: "everyone" | "selected" | "nobody";
  callVisibility: "everyone" | "selected" | "nobody";
  forwardVisibility: "everyone" | "selected" | "nobody";
  groupAddVisibility: "everyone" | "selected" | "nobody";
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  birthdayAllowedUserIds: string[];
  callAllowedUserIds: string[];
  forwardAllowedUserIds: string[];
  groupAddAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  blockedUserIds: string[];
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: "everyone" | "selected" | "nobody";
  avatarVisibility: "everyone" | "selected" | "nobody";
  bioVisibility: "everyone" | "selected" | "nobody";
  birthdayVisibility: "everyone" | "selected" | "nobody";
  callVisibility: "everyone" | "selected" | "nobody";
  forwardVisibility: "everyone" | "selected" | "nobody";
  groupAddVisibility: "everyone" | "selected" | "nobody";
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  birthdayAllowedUserIds: string[];
  callAllowedUserIds: string[];
  forwardAllowedUserIds: string[];
  groupAddAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};

export type GroupRole = "owner" | "admin" | "member";

export type StoredChatThread = {
  id: string;
  memberIds: string[];
  threadType: "direct" | "group";
  title: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  createdById: string;
  createdAt: number;
  updatedAt: number;
  readBy: Record<string, number>;
  pinnedBy: Record<string, boolean>;
  mutedBy: Record<string, boolean>;
  typingBy: Record<string, number>;
  groupRoles: Record<string, GroupRole>;
};

export type StoredChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  attachments: StoredChatAttachment[];
  replyToMessageId: string;
  createdAt: number;
  editedAt: number;
  savedBy: Record<string, number>;
};

export type StoredChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export type StoredCallSignal = {
  id: string;
  chatId: string;
  fromUserId: string;
  toUserId: string;
  type: "offer" | "answer" | "ice" | "hangup" | "reject";
  payload: string;
  createdAt: number;
};

export type StoredModerationReportStatus = "open" | "resolved";
export type StoredModerationAuditAction =
  | "report_resolved"
  | "message_deleted"
  | "user_muted"
  | "user_unmuted"
  | "user_banned"
  | "user_unbanned"
  | "user_profile_updated"
  | "user_deleted";

export type StoredModerationReport = {
  id: string;
  reporterUserId: string;
  targetUserId: string;
  chatId: string;
  messageId: string;
  reason: string;
  details: string;
  status: StoredModerationReportStatus;
  createdAt: number;
  resolvedAt: number;
  resolvedByUserId: string;
  resolutionNote: string;
};

export type StoredModerationAuditLog = {
  id: string;
  actorUserId: string;
  action: StoredModerationAuditAction;
  targetUserId: string;
  reportId: string;
  messageId: string;
  reason: string;
  createdAt: number;
};

export type StoredUserSanction = {
  mutedUntil: number;
  bannedUntil: number;
  reason: string;
  updatedAt: number;
};

export type StoreData = {
  users: StoredUser[];
  threads: StoredChatThread[];
  messages: StoredChatMessage[];
  callSignals: StoredCallSignal[];
  moderationReports: StoredModerationReport[];
  moderationAuditLogs: StoredModerationAuditLog[];
  userSanctions: Record<string, StoredUserSanction>;
};

export const BOT_USER_ID = "bot-chatgpt";
export const BOT_USERNAME = "chatgpt";

function createBotStoredUser(): StoredUser {
  const now = Date.now();
  return {
    id: BOT_USER_ID,
    name: "ChatGPT",
    username: BOT_USERNAME,
    email: "chatgpt@clore.bot",
    password: "__bot_account__",
    blockedUserIds: [],
    bio: "AI assistant bot",
    birthday: "",
    showLastSeen: true,
    lastSeenVisibility: "everyone",
    avatarVisibility: "everyone",
    bioVisibility: "everyone",
    birthdayVisibility: "everyone",
    callVisibility: "everyone",
    forwardVisibility: "everyone",
    groupAddVisibility: "everyone",
    lastSeenAllowedUserIds: [],
    avatarAllowedUserIds: [],
    bioAllowedUserIds: [],
    birthdayAllowedUserIds: [],
    callAllowedUserIds: [],
    forwardAllowedUserIds: [],
    groupAddAllowedUserIds: [],
    lastSeenAt: now,
    avatarUrl: "",
    bannerUrl: "",
  };
}

function ensureBotUserInStore(store: StoreData): void {
  const hasBot = store.users.some((user) => user.id === BOT_USER_ID);
  if (hasBot) {
    return;
  }
  store.users.push(createBotStoredUser());
}

export function isBotUserId(userId: string): boolean {
  return userId.trim() === BOT_USER_ID;
}

export function getBotPublicUser(): PublicUser {
  return toPublicUser(createBotStoredUser());
}

const IS_VERCEL_RUNTIME =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  Boolean(process.env.VERCEL_ENV);
const REQUIRE_DATABASE_STORE =
  process.env.CLORE_REQUIRE_DATABASE_STORE?.trim().toLowerCase() === "true";
const DATABASE_URL_RAW =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  "";
const SSL_URL_PARAMS = new Set([
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "sslcrl",
  "sslpassword",
]);

function sanitizeDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }
  try {
    const url = new URL(rawUrl);
    for (const key of SSL_URL_PARAMS) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function getDatabaseHost(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

const DATABASE_URL = sanitizeDatabaseUrl(DATABASE_URL_RAW);
const USE_DATABASE_STORE = DATABASE_URL.length > 0;
const STORE_ROW_ID = "main";
const DEFAULT_STORE_FILE_PATH =
  process.env.CLORE_STORE_FILE_PATH?.trim() ??
  (IS_VERCEL_RUNTIME
    ? path.join("/tmp", "clore-store.json")
    : path.join(process.cwd(), "data", "clore-store.json"));
const FALLBACK_STORE_FILE_PATH = path.join(os.tmpdir(), "clore-store.json");
const EMPTY_STORE: StoreData = {
  users: [],
  threads: [],
  messages: [],
  callSignals: [],
  moderationReports: [],
  moderationAuditLogs: [],
  userSanctions: {},
};

let writeQueue: Promise<void> = Promise.resolve();
let pool: Pool | null = null;
let ensureDatabaseReadyPromise: Promise<void> | null = null;
let lastValidFileStoreSnapshot: StoreData | null = null;
let storeFilePath = DEFAULT_STORE_FILE_PATH;

function resolveStoreFilePaths(): {
  storeFilePath: string;
  backupFilePath: string;
  tmpFilePath: string;
} {
  return {
    storeFilePath,
    backupFilePath: `${storeFilePath}.backup`,
    tmpFilePath: `${storeFilePath}.tmp`,
  };
}

function isPermissionOrReadOnlyError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code === "EACCES" || code === "EPERM" || code === "EROFS";
}

async function runWithStorePathFallback<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (
      storeFilePath === FALLBACK_STORE_FILE_PATH ||
      !isPermissionOrReadOnlyError(error)
    ) {
      throw error;
    }
    const errorCode = (error as NodeJS.ErrnoException | null)?.code ?? "UNKNOWN";
    console.warn(
      `[store] File store path "${storeFilePath}" is not writable (${errorCode}), falling back to "${FALLBACK_STORE_FILE_PATH}".`
    );
    storeFilePath = FALLBACK_STORE_FILE_PATH;
    return action();
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    blockedUserIds: user.blockedUserIds,
    bio: user.bio,
    birthday: user.birthday,
    showLastSeen: user.showLastSeen,
    lastSeenVisibility: user.lastSeenVisibility,
    avatarVisibility: user.avatarVisibility,
    bioVisibility: user.bioVisibility,
    birthdayVisibility: user.birthdayVisibility,
    callVisibility: user.callVisibility,
    forwardVisibility: user.forwardVisibility,
    groupAddVisibility: user.groupAddVisibility,
    lastSeenAllowedUserIds: user.lastSeenAllowedUserIds,
    avatarAllowedUserIds: user.avatarAllowedUserIds,
    bioAllowedUserIds: user.bioAllowedUserIds,
    birthdayAllowedUserIds: user.birthdayAllowedUserIds,
    callAllowedUserIds: user.callAllowedUserIds,
    forwardAllowedUserIds: user.forwardAllowedUserIds,
    groupAddAllowedUserIds: user.groupAddAllowedUserIds,
    lastSeenAt: user.lastSeenAt,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  };
}

export function getUserSanction(
  store: StoreData,
  userId: string
): StoredUserSanction {
  const raw = store.userSanctions[userId];
  if (!raw) {
    return {
      mutedUntil: 0,
      bannedUntil: 0,
      reason: "",
      updatedAt: 0,
    };
  }

  return {
    mutedUntil:
      typeof raw.mutedUntil === "number" && Number.isFinite(raw.mutedUntil)
        ? Math.max(0, Math.trunc(raw.mutedUntil))
        : 0,
    bannedUntil:
      typeof raw.bannedUntil === "number" && Number.isFinite(raw.bannedUntil)
        ? Math.max(0, Math.trunc(raw.bannedUntil))
        : 0,
    reason: typeof raw.reason === "string" ? raw.reason.trim().slice(0, 300) : "",
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? Math.max(0, Math.trunc(raw.updatedAt))
        : 0,
  };
}

export function getActiveUserSanction(
  store: StoreData,
  userId: string,
  now = Date.now()
): StoredUserSanction | null {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return null;
  }
  const sanction = getUserSanction(store, normalizedUserId);
  if (sanction.bannedUntil > now || sanction.mutedUntil > now) {
    return sanction;
  }
  return null;
}

export function createEntityId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function canUserBeAddedToGroupBy(
  user: Pick<StoredUser, "id" | "groupAddVisibility" | "groupAddAllowedUserIds">,
  actorUserId: string
): boolean {
  const normalizedActorId = actorUserId.trim();
  if (!normalizedActorId) {
    return false;
  }
  if (user.id === normalizedActorId) {
    return true;
  }
  if (user.groupAddVisibility === "everyone") {
    return true;
  }
  if (user.groupAddVisibility === "selected") {
    return user.groupAddAllowedUserIds.includes(normalizedActorId);
  }
  return false;
}

export function canUserBeCalledBy(
  user: Pick<StoredUser, "id" | "callVisibility" | "callAllowedUserIds">,
  actorUserId: string
): boolean {
  const normalizedActorId = actorUserId.trim();
  if (!normalizedActorId) {
    return false;
  }
  if (user.id === normalizedActorId) {
    return true;
  }
  if (user.callVisibility === "everyone") {
    return true;
  }
  if (user.callVisibility === "selected") {
    return user.callAllowedUserIds.includes(normalizedActorId);
  }
  return false;
}

export function canUserMessagesBeForwardedBy(
  user: Pick<StoredUser, "id" | "forwardVisibility" | "forwardAllowedUserIds">,
  actorUserId: string
): boolean {
  const normalizedActorId = actorUserId.trim();
  if (!normalizedActorId) {
    return false;
  }
  if (user.id === normalizedActorId) {
    return true;
  }
  if (user.forwardVisibility === "everyone") {
    return true;
  }
  if (user.forwardVisibility === "selected") {
    return user.forwardAllowedUserIds.includes(normalizedActorId);
  }
  return false;
}

function isGroupRole(value: unknown): value is GroupRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function getGroupRole(
  thread: StoredChatThread,
  userId: string
): GroupRole | null {
  if (thread.threadType !== "group" || !thread.memberIds.includes(userId)) {
    return null;
  }
  const directRole = thread.groupRoles[userId];
  if (isGroupRole(directRole)) {
    return directRole;
  }
  return thread.createdById === userId ? "owner" : "member";
}

export function isGroupOwner(thread: StoredChatThread, userId: string): boolean {
  return getGroupRole(thread, userId) === "owner";
}

export function canModerateGroup(
  thread: StoredChatThread,
  userId: string
): boolean {
  const role = getGroupRole(thread, userId);
  return role === "owner" || role === "admin";
}

export function canRemoveGroupMember(
  thread: StoredChatThread,
  actorUserId: string,
  targetUserId: string
): boolean {
  if (
    thread.threadType !== "group" ||
    actorUserId === targetUserId ||
    !thread.memberIds.includes(actorUserId) ||
    !thread.memberIds.includes(targetUserId)
  ) {
    return false;
  }

  const actorRole = getGroupRole(thread, actorUserId);
  const targetRole = getGroupRole(thread, targetUserId);
  if (!actorRole || !targetRole) {
    return false;
  }
  if (targetRole === "owner") {
    return false;
  }
  if (actorRole === "owner") {
    return true;
  }
  if (actorRole === "admin") {
    return targetRole === "member";
  }
  return false;
}

function ensureDatabaseConfigured() {
  if (REQUIRE_DATABASE_STORE && !USE_DATABASE_STORE) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) is required when CLORE_REQUIRE_DATABASE_STORE=true."
    );
  }
}

function resolveDatabaseSsl() {
  const sslMode = process.env.PGSSLMODE?.trim().toLowerCase() ?? "";
  if (sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
    return undefined;
  }
  const host = getDatabaseHost(DATABASE_URL_RAW);
  if (host === "localhost" || host === "127.0.0.1") {
    return undefined;
  }
  const forceVerify =
    process.env.DB_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase() === "true";
  if (forceVerify) {
    return {
      rejectUnauthorized: true,
    };
  }
  return {
    rejectUnauthorized: false,
  };
}

function getPool() {
  if (!USE_DATABASE_STORE) {
    return null;
  }
  if (pool) {
    return pool;
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: resolveDatabaseSsl(),
  });
  return pool;
}

async function ensureStoreFile() {
  await runWithStorePathFallback(async () => {
    const paths = resolveStoreFilePaths();
    await fs.mkdir(path.dirname(paths.storeFilePath), { recursive: true });
    try {
      await fs.access(paths.storeFilePath);
    } catch {
      await fs.writeFile(
        paths.storeFilePath,
        JSON.stringify(EMPTY_STORE, null, 2),
        "utf8"
      );
    }
  });
}

function isPotentiallyDataLossStore(store: StoreData): boolean {
  const hasNonBotUsers = store.users.some((user) => !isBotUserId(user.id));
  return (
    !hasNonBotUsers &&
    store.threads.length === 0 &&
    store.messages.length === 0 &&
    store.callSignals.length === 0 &&
    store.moderationReports.length === 0 &&
    store.moderationAuditLogs.length === 0 &&
    Object.keys(store.userSanctions).length === 0
  );
}

async function readStoreSnapshotFromPath(filePath: string): Promise<StoreData | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeStore(parsed);
  } catch {
    return null;
  }
}

function sanitizeUsers(rawUsers: unknown): StoredUser[] {
  if (!Array.isArray(rawUsers)) {
    return [];
  }

  const byId = new Map<string, StoredUser>();

  for (const rawUser of rawUsers) {
    const user = asRecord(rawUser);
    if (!user) {
      continue;
    }

    const id = typeof user.id === "string" ? user.id.trim() : "";
    const name = typeof user.name === "string" ? user.name.trim() : "";
    const username = normalizeUsername(
      typeof user.username === "string" ? user.username : ""
    );
    const email = normalizeEmail(
      typeof user.email === "string" ? user.email : ""
    );
    const password = typeof user.password === "string" ? user.password : "";
    const bio = typeof user.bio === "string" ? user.bio.trim() : "";
    const birthday = typeof user.birthday === "string" ? user.birthday.trim() : "";
    const sanitizeAllowedUserIds = (value: unknown): string[] => {
      if (!Array.isArray(value)) {
        return [];
      }
      const unique = new Set<string>();
      for (const item of value) {
        if (typeof item !== "string") {
          continue;
        }
        const trimmed = item.trim();
        if (!trimmed) {
          continue;
        }
        unique.add(trimmed);
      }
      return [...unique];
    };
    const blockedUserIds = sanitizeAllowedUserIds(user.blockedUserIds);
    const rawLastSeenVisibility =
      typeof user.lastSeenVisibility === "string"
        ? user.lastSeenVisibility.trim()
        : "";
    const rawAvatarVisibility =
      typeof user.avatarVisibility === "string"
        ? user.avatarVisibility.trim()
        : "";
    const rawBioVisibility =
      typeof user.bioVisibility === "string" ? user.bioVisibility.trim() : "";
    const rawBirthdayVisibility =
      typeof user.birthdayVisibility === "string"
        ? user.birthdayVisibility.trim()
        : "";
    const rawCallVisibility =
      typeof user.callVisibility === "string" ? user.callVisibility.trim() : "";
    const rawForwardVisibility =
      typeof user.forwardVisibility === "string" ? user.forwardVisibility.trim() : "";
    const rawGroupAddVisibility =
      typeof user.groupAddVisibility === "string"
        ? user.groupAddVisibility.trim()
        : "";
    const lastSeenVisibility =
      rawLastSeenVisibility === "everyone" ||
      rawLastSeenVisibility === "selected" ||
      rawLastSeenVisibility === "nobody"
        ? rawLastSeenVisibility
        : rawLastSeenVisibility === "contacts"
          ? "selected"
        : user.showLastSeen === false
          ? "nobody"
          : "everyone";
    const avatarVisibility =
      rawAvatarVisibility === "everyone" ||
      rawAvatarVisibility === "selected" ||
      rawAvatarVisibility === "nobody"
        ? rawAvatarVisibility
        : rawAvatarVisibility === "contacts"
          ? "selected"
        : "everyone";
    const bioVisibility =
      rawBioVisibility === "everyone" ||
      rawBioVisibility === "selected" ||
      rawBioVisibility === "nobody"
        ? rawBioVisibility
        : rawBioVisibility === "contacts"
          ? "selected"
        : "everyone";
    const birthdayVisibility =
      rawBirthdayVisibility === "everyone" ||
      rawBirthdayVisibility === "selected" ||
      rawBirthdayVisibility === "nobody"
        ? rawBirthdayVisibility
        : rawBirthdayVisibility === "contacts"
          ? "selected"
          : "everyone";
    const callVisibility =
      rawCallVisibility === "everyone" ||
      rawCallVisibility === "selected" ||
      rawCallVisibility === "nobody"
        ? rawCallVisibility
        : rawCallVisibility === "contacts"
          ? "selected"
          : "everyone";
    const forwardVisibility =
      rawForwardVisibility === "everyone" ||
      rawForwardVisibility === "selected" ||
      rawForwardVisibility === "nobody"
        ? rawForwardVisibility
        : rawForwardVisibility === "contacts"
          ? "selected"
          : "everyone";
    const groupAddVisibility =
      rawGroupAddVisibility === "everyone" ||
      rawGroupAddVisibility === "selected" ||
      rawGroupAddVisibility === "nobody"
        ? rawGroupAddVisibility
        : rawGroupAddVisibility === "contacts"
          ? "selected"
          : "everyone";
    const lastSeenAllowedUserIds = sanitizeAllowedUserIds(
      user.lastSeenAllowedUserIds
    );
    const avatarAllowedUserIds = sanitizeAllowedUserIds(user.avatarAllowedUserIds);
    const bioAllowedUserIds = sanitizeAllowedUserIds(user.bioAllowedUserIds);
    const birthdayAllowedUserIds = sanitizeAllowedUserIds(
      user.birthdayAllowedUserIds
    );
    const callAllowedUserIds = sanitizeAllowedUserIds(user.callAllowedUserIds);
    const forwardAllowedUserIds = sanitizeAllowedUserIds(
      user.forwardAllowedUserIds
    );
    const groupAddAllowedUserIds = sanitizeAllowedUserIds(
      user.groupAddAllowedUserIds
    );
    const showLastSeen = lastSeenVisibility !== "nobody";
    const lastSeenAt = normalizeNumber(user.lastSeenAt, 0);
    const avatarUrl =
      typeof user.avatarUrl === "string" ? user.avatarUrl.trim() : "";
    const bannerUrl =
      typeof user.bannerUrl === "string" ? user.bannerUrl.trim() : "";

    if (!id || !name || !username || !password) {
      continue;
    }

    byId.set(id, {
      id,
      name,
      username,
      email,
      password,
      blockedUserIds,
      bio,
      birthday,
      showLastSeen,
      lastSeenVisibility,
      avatarVisibility,
      bioVisibility,
      birthdayVisibility,
      callVisibility,
      forwardVisibility,
      groupAddVisibility,
      lastSeenAllowedUserIds,
      avatarAllowedUserIds,
      bioAllowedUserIds,
      birthdayAllowedUserIds,
      callAllowedUserIds,
      forwardAllowedUserIds,
      groupAddAllowedUserIds,
      lastSeenAt,
      avatarUrl,
      bannerUrl,
    });
  }

  return [...byId.values()];
}

function sanitizeThreads(rawThreads: unknown): StoredChatThread[] {
  if (!Array.isArray(rawThreads)) {
    return [];
  }

  const byId = new Map<string, StoredChatThread>();

  for (const rawThread of rawThreads) {
    const thread = asRecord(rawThread);
    if (!thread) {
      continue;
    }

    const id = typeof thread.id === "string" ? thread.id.trim() : "";
    const memberIdsRaw = Array.isArray(thread.memberIds) ? thread.memberIds : [];
    const memberIds = memberIdsRaw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    const uniqueMemberIds = [...new Set(memberIds)];

    if (!id || uniqueMemberIds.length < 2) {
      continue;
    }

    const threadType =
      thread.threadType === "group" || thread.threadType === "direct"
        ? thread.threadType
        : uniqueMemberIds.length > 2
          ? "group"
          : "direct";
    const title = typeof thread.title === "string" ? thread.title.trim() : "";
    const description =
      typeof thread.description === "string" ? thread.description.trim() : "";
    const avatarUrl =
      typeof thread.avatarUrl === "string" ? thread.avatarUrl.trim() : "";
    const bannerUrl =
      typeof thread.bannerUrl === "string" ? thread.bannerUrl.trim() : "";
    const createdByCandidate =
      typeof thread.createdById === "string" && thread.createdById.trim()
        ? thread.createdById.trim()
        : uniqueMemberIds[0] ?? "";
    let createdById = uniqueMemberIds.includes(createdByCandidate)
      ? createdByCandidate
      : (uniqueMemberIds[0] ?? "");
    const createdAt = normalizeNumber(thread.createdAt, Date.now());
    const updatedAt = normalizeNumber(thread.updatedAt, createdAt);
    const readByRaw = asRecord(thread.readBy) ?? {};
    const pinnedByRaw = asRecord(thread.pinnedBy) ?? {};
    const mutedByRaw = asRecord(thread.mutedBy) ?? {};
    const typingByRaw = asRecord(thread.typingBy) ?? {};
    const groupRolesRaw = asRecord(thread.groupRoles) ?? {};
    const readBy: Record<string, number> = {};
    const pinnedBy: Record<string, boolean> = {};
    const mutedBy: Record<string, boolean> = {};
    const typingBy: Record<string, number> = {};
    const groupRoles: Record<string, GroupRole> = {};

    for (const memberId of uniqueMemberIds) {
      readBy[memberId] = normalizeNumber(readByRaw[memberId], 0);
    }
    for (const [memberId, pinned] of Object.entries(pinnedByRaw)) {
      if (!uniqueMemberIds.includes(memberId)) {
        continue;
      }
      pinnedBy[memberId] = pinned === true;
    }
    for (const [memberId, muted] of Object.entries(mutedByRaw)) {
      if (!uniqueMemberIds.includes(memberId)) {
        continue;
      }
      mutedBy[memberId] = muted === true;
    }
    for (const [memberId, typingAt] of Object.entries(typingByRaw)) {
      if (!uniqueMemberIds.includes(memberId)) {
        continue;
      }
      typingBy[memberId] = normalizeNumber(typingAt, 0);
    }
    if (threadType === "group") {
      const fallbackOwnerId = createdById || uniqueMemberIds[0] || "";
      for (const memberId of uniqueMemberIds) {
        const nextRole = groupRolesRaw[memberId];
        if (isGroupRole(nextRole)) {
          groupRoles[memberId] = nextRole;
        } else {
          groupRoles[memberId] = memberId === fallbackOwnerId ? "owner" : "member";
        }
      }

      const ownerIds = uniqueMemberIds.filter(
        (memberId) => groupRoles[memberId] === "owner"
      );
      if (ownerIds.length === 0 && fallbackOwnerId) {
        groupRoles[fallbackOwnerId] = "owner";
      } else if (ownerIds.length > 1) {
        for (const memberId of ownerIds.slice(1)) {
          groupRoles[memberId] = "admin";
        }
      }

      const normalizedOwnerId =
        uniqueMemberIds.find((memberId) => groupRoles[memberId] === "owner") ??
        fallbackOwnerId;
      if (normalizedOwnerId) {
        groupRoles[normalizedOwnerId] = "owner";
        createdById = normalizedOwnerId;
      }
    }

    byId.set(id, {
      id,
      memberIds: uniqueMemberIds,
      threadType,
      title,
      description,
      avatarUrl,
      bannerUrl,
      createdById,
      createdAt,
      updatedAt,
      readBy,
      pinnedBy,
      mutedBy,
      typingBy,
      groupRoles,
    });
  }

  return [...byId.values()];
}

function sanitizeMessages(rawMessages: unknown): StoredChatMessage[] {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  const byId = new Map<string, StoredChatMessage>();

  for (const rawMessage of rawMessages) {
    const message = asRecord(rawMessage);
    if (!message) {
      continue;
    }

    const id = typeof message.id === "string" ? message.id.trim() : "";
    const chatId = typeof message.chatId === "string" ? message.chatId.trim() : "";
    const authorId =
      typeof message.authorId === "string" ? message.authorId.trim() : "";
    const text = typeof message.text === "string" ? message.text : "";
    const attachmentsRaw = Array.isArray(message.attachments)
      ? message.attachments
      : [];
    const attachments: StoredChatAttachment[] = attachmentsRaw
      .map((rawAttachment) => {
        const attachment = asRecord(rawAttachment);
        if (!attachment) {
          return null;
        }
        const id =
          typeof attachment.id === "string" ? attachment.id.trim() : "";
        const name =
          typeof attachment.name === "string" ? attachment.name.trim() : "";
        const type =
          typeof attachment.type === "string"
            ? attachment.type.trim()
            : "application/octet-stream";
        const size = normalizeNumber(attachment.size, 0);
        const url =
          typeof attachment.url === "string" ? attachment.url.trim() : "";
        if (!id || !name || !url) {
          return null;
        }
        return {
          id,
          name,
          type,
          size: Math.max(0, size),
          url,
        };
      })
      .filter((attachment): attachment is StoredChatAttachment => attachment !== null);
    const replyToMessageId =
      typeof message.replyToMessageId === "string"
        ? message.replyToMessageId.trim()
        : "";
    const createdAt = normalizeNumber(message.createdAt, Date.now());
    const editedAt = normalizeNumber(message.editedAt, 0);
    const savedByRaw = asRecord(message.savedBy) ?? {};
    const savedBy: Record<string, number> = {};
    for (const [userId, rawSavedAt] of Object.entries(savedByRaw)) {
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) {
        continue;
      }
      if (typeof rawSavedAt === "number" && Number.isFinite(rawSavedAt)) {
        savedBy[normalizedUserId] = Math.trunc(rawSavedAt);
        continue;
      }
      if (rawSavedAt === true) {
        savedBy[normalizedUserId] = createdAt;
      } else if (rawSavedAt === false) {
        savedBy[normalizedUserId] = -createdAt;
      }
    }

    if (!id || !chatId || !authorId || (!text.trim() && attachments.length === 0)) {
      continue;
    }

    byId.set(id, {
      id,
      chatId,
      authorId,
      text,
      attachments,
      replyToMessageId,
      createdAt,
      editedAt,
      savedBy,
    });
  }

  return [...byId.values()];
}

function sanitizeCallSignals(rawSignals: unknown): StoredCallSignal[] {
  if (!Array.isArray(rawSignals)) {
    return [];
  }

  const allowedTypes = new Set(["offer", "answer", "ice", "hangup", "reject"]);
  const byId = new Map<string, StoredCallSignal>();

  for (const rawSignal of rawSignals) {
    const signal = asRecord(rawSignal);
    if (!signal) {
      continue;
    }

    const id = typeof signal.id === "string" ? signal.id.trim() : "";
    const chatId = typeof signal.chatId === "string" ? signal.chatId.trim() : "";
    const fromUserId =
      typeof signal.fromUserId === "string" ? signal.fromUserId.trim() : "";
    const toUserId =
      typeof signal.toUserId === "string" ? signal.toUserId.trim() : "";
    const type = typeof signal.type === "string" ? signal.type.trim() : "";
    const payload =
      typeof signal.payload === "string" && signal.payload.length > 0
        ? signal.payload
        : "{}";
    const createdAt = normalizeNumber(signal.createdAt, Date.now());

    if (
      !id ||
      !chatId ||
      !fromUserId ||
      !toUserId ||
      !allowedTypes.has(type)
    ) {
      continue;
    }

    byId.set(id, {
      id,
      chatId,
      fromUserId,
      toUserId,
      type: type as StoredCallSignal["type"],
      payload,
      createdAt,
    });
  }

  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

function sanitizeModerationReports(rawReports: unknown): StoredModerationReport[] {
  if (!Array.isArray(rawReports)) {
    return [];
  }

  const byId = new Map<string, StoredModerationReport>();
  for (const rawReport of rawReports) {
    const report = asRecord(rawReport);
    if (!report) {
      continue;
    }

    const id = typeof report.id === "string" ? report.id.trim() : "";
    const reporterUserId =
      typeof report.reporterUserId === "string" ? report.reporterUserId.trim() : "";
    const targetUserId =
      typeof report.targetUserId === "string" ? report.targetUserId.trim() : "";
    const chatId = typeof report.chatId === "string" ? report.chatId.trim() : "";
    const messageId =
      typeof report.messageId === "string" ? report.messageId.trim() : "";
    const reason =
      typeof report.reason === "string" ? report.reason.trim().slice(0, 300) : "";
    const details =
      typeof report.details === "string" ? report.details.trim().slice(0, 1000) : "";
    const status =
      report.status === "resolved" || report.status === "open"
        ? report.status
        : "open";
    const createdAt = normalizeNumber(report.createdAt, Date.now());
    const resolvedAt = normalizeNumber(report.resolvedAt, 0);
    const resolvedByUserId =
      typeof report.resolvedByUserId === "string"
        ? report.resolvedByUserId.trim()
        : "";
    const resolutionNote =
      typeof report.resolutionNote === "string"
        ? report.resolutionNote.trim().slice(0, 400)
        : "";

    if (!id || !reporterUserId || !targetUserId || !chatId || !messageId || !reason) {
      continue;
    }

    byId.set(id, {
      id,
      reporterUserId,
      targetUserId,
      chatId,
      messageId,
      reason,
      details,
      status,
      createdAt,
      resolvedAt: status === "resolved" ? resolvedAt : 0,
      resolvedByUserId: status === "resolved" ? resolvedByUserId : "",
      resolutionNote: status === "resolved" ? resolutionNote : "",
    });
  }

  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function sanitizeModerationAuditLogs(rawLogs: unknown): StoredModerationAuditLog[] {
  if (!Array.isArray(rawLogs)) {
    return [];
  }

  const allowedActions = new Set<StoredModerationAuditAction>([
    "report_resolved",
    "message_deleted",
    "user_muted",
    "user_unmuted",
    "user_banned",
    "user_unbanned",
    "user_profile_updated",
    "user_deleted",
  ]);
  const byId = new Map<string, StoredModerationAuditLog>();

  for (const rawLog of rawLogs) {
    const log = asRecord(rawLog);
    if (!log) {
      continue;
    }

    const id = typeof log.id === "string" ? log.id.trim() : "";
    const actorUserId =
      typeof log.actorUserId === "string" ? log.actorUserId.trim() : "";
    const action =
      typeof log.action === "string" ? log.action.trim() : "";
    const targetUserId =
      typeof log.targetUserId === "string" ? log.targetUserId.trim() : "";
    const reportId = typeof log.reportId === "string" ? log.reportId.trim() : "";
    const messageId =
      typeof log.messageId === "string" ? log.messageId.trim() : "";
    const reason =
      typeof log.reason === "string" ? log.reason.trim().slice(0, 400) : "";
    const createdAt = normalizeNumber(log.createdAt, Date.now());

    if (!id || !actorUserId || !allowedActions.has(action as StoredModerationAuditAction)) {
      continue;
    }

    byId.set(id, {
      id,
      actorUserId,
      action: action as StoredModerationAuditAction,
      targetUserId,
      reportId,
      messageId,
      reason,
      createdAt,
    });
  }

  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function sanitizeUserSanctions(rawSanctions: unknown): Record<string, StoredUserSanction> {
  const sanctions = asRecord(rawSanctions);
  if (!sanctions) {
    return {};
  }

  const normalized: Record<string, StoredUserSanction> = {};
  for (const [rawUserId, rawValue] of Object.entries(sanctions)) {
    const userId = rawUserId.trim();
    if (!userId) {
      continue;
    }
    const entry = asRecord(rawValue);
    if (!entry) {
      continue;
    }

    const mutedUntil = Math.max(0, Math.trunc(normalizeNumber(entry.mutedUntil, 0)));
    const bannedUntil = Math.max(0, Math.trunc(normalizeNumber(entry.bannedUntil, 0)));
    if (mutedUntil <= 0 && bannedUntil <= 0) {
      continue;
    }
    const reason =
      typeof entry.reason === "string" ? entry.reason.trim().slice(0, 300) : "";
    const updatedAt = Math.max(
      0,
      Math.trunc(normalizeNumber(entry.updatedAt, Math.max(mutedUntil, bannedUntil)))
    );

    normalized[userId] = {
      mutedUntil,
      bannedUntil,
      reason,
      updatedAt,
    };
  }

  return normalized;
}

function sanitizeStore(raw: unknown): StoreData {
  const parsed = asRecord(raw);
  if (!parsed) {
    return {
      ...EMPTY_STORE,
    };
  }

  return {
    users: sanitizeUsers(parsed.users),
    threads: sanitizeThreads(parsed.threads),
    messages: sanitizeMessages(parsed.messages),
    callSignals: sanitizeCallSignals(parsed.callSignals),
    moderationReports: sanitizeModerationReports(parsed.moderationReports),
    moderationAuditLogs: sanitizeModerationAuditLogs(parsed.moderationAuditLogs),
    userSanctions: sanitizeUserSanctions(parsed.userSanctions),
  };
}

async function ensureDatabaseStore(): Promise<void> {
  if (!USE_DATABASE_STORE) {
    return;
  }

  if (!ensureDatabaseReadyPromise) {
    const currentPool = getPool();
    if (!currentPool) {
      return;
    }
    ensureDatabaseReadyPromise = (async () => {
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_store (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(
        `
          INSERT INTO clore_store (id, data, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (id) DO NOTHING
        `,
        [STORE_ROW_ID, JSON.stringify(EMPTY_STORE)]
      );
    })().catch((error) => {
      ensureDatabaseReadyPromise = null;
      throw error;
    });
  }

  await ensureDatabaseReadyPromise;
}

async function readStoreFromDatabase(): Promise<StoreData> {
  await ensureDatabaseStore();
  const currentPool = getPool();
  if (!currentPool) {
    return {
      ...EMPTY_STORE,
    };
  }

  const result = await currentPool.query<{ data: unknown }>(
    "SELECT data FROM clore_store WHERE id = $1 LIMIT 1",
    [STORE_ROW_ID]
  );
  const rawData = result.rows[0]?.data;
  if (!rawData) {
    return {
      ...EMPTY_STORE,
    };
  }
  return sanitizeStore(rawData);
}

async function updateStoreInDatabase<T>(
  updater: (store: StoreData) => T | Promise<T>
): Promise<T> {
  await ensureDatabaseStore();
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error("Database connection is not configured.");
  }

  const client = await currentPool.connect();
  try {
    await client.query("BEGIN");

    const selectResult = await client.query<{ data: unknown }>(
      "SELECT data FROM clore_store WHERE id = $1 FOR UPDATE",
      [STORE_ROW_ID]
    );
    let store = sanitizeStore(selectResult.rows[0]?.data);

    if (selectResult.rows.length === 0) {
      store = {
        ...EMPTY_STORE,
      };
      await client.query(
        `
          INSERT INTO clore_store (id, data, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (id) DO NOTHING
        `,
        [STORE_ROW_ID, JSON.stringify(store)]
      );
    }

    ensureBotUserInStore(store);

    const result = await updater(store);
    await client.query(
      `
        UPDATE clore_store
        SET data = $2::jsonb, updated_at = NOW()
        WHERE id = $1
      `,
      [STORE_ROW_ID, JSON.stringify(store)]
    );

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function readStoreFile(): Promise<StoreData> {
  await ensureStoreFile();
  const paths = resolveStoreFilePaths();

  const maybeRestoreFromBackup = async (
    primarySnapshot: StoreData
  ): Promise<StoreData> => {
    if (!isPotentiallyDataLossStore(primarySnapshot)) {
      return primarySnapshot;
    }
    const backupSnapshot = await readStoreSnapshotFromPath(paths.backupFilePath);
    if (backupSnapshot && !isPotentiallyDataLossStore(backupSnapshot)) {
      lastValidFileStoreSnapshot = backupSnapshot;
      return backupSnapshot;
    }
    return primarySnapshot;
  };

  const firstAttempt = await readStoreSnapshotFromPath(paths.storeFilePath);
  if (firstAttempt) {
    const restored = await maybeRestoreFromBackup(firstAttempt);
    lastValidFileStoreSnapshot = restored;
    return restored;
  }

  // In local file mode reads can overlap writes and briefly observe incomplete JSON.
  await new Promise((resolve) => setTimeout(resolve, 20));
  const secondAttempt = await readStoreSnapshotFromPath(paths.storeFilePath);
  if (secondAttempt) {
    const restored = await maybeRestoreFromBackup(secondAttempt);
    lastValidFileStoreSnapshot = restored;
    return restored;
  }

  const backupAttempt = await readStoreSnapshotFromPath(paths.backupFilePath);
  if (backupAttempt) {
    lastValidFileStoreSnapshot = backupAttempt;
    return backupAttempt;
  }

  if (lastValidFileStoreSnapshot) {
    return sanitizeStore(lastValidFileStoreSnapshot);
  }

  return {
    ...EMPTY_STORE,
  };
}

async function writeStoreFile(store: StoreData): Promise<void> {
  await runWithStorePathFallback(async () => {
    await ensureStoreFile();
    const sanitizedNextStore = sanitizeStore(store);
    const paths = resolveStoreFilePaths();
    const currentSnapshot = await readStoreSnapshotFromPath(paths.storeFilePath);

    if (
      currentSnapshot &&
      !isPotentiallyDataLossStore(currentSnapshot) &&
      isPotentiallyDataLossStore(sanitizedNextStore)
    ) {
      throw new Error(
        "Refusing to overwrite non-empty store with potentially empty snapshot."
      );
    }

    try {
      const currentRaw = await fs.readFile(paths.storeFilePath, "utf8");
      await fs.writeFile(paths.backupFilePath, currentRaw, "utf8");
    } catch {
      // Best-effort backup.
    }

    await fs.writeFile(
      paths.tmpFilePath,
      JSON.stringify(sanitizedNextStore, null, 2),
      "utf8"
    );

    try {
      await fs.rename(paths.tmpFilePath, paths.storeFilePath);
    } catch {
      await fs.unlink(paths.storeFilePath).catch(() => undefined);
      await fs.rename(paths.tmpFilePath, paths.storeFilePath);
    } finally {
      await fs.unlink(paths.tmpFilePath).catch(() => undefined);
    }

    lastValidFileStoreSnapshot = sanitizedNextStore;
  });
}

export async function getStoreUpdateMarker(): Promise<number> {
  if (USE_DATABASE_STORE) {
    await ensureDatabaseStore();
    const currentPool = getPool();
    if (!currentPool) {
      return 0;
    }
    const result = await currentPool.query<{ updated_at_ms: number | string }>(
      `
        SELECT EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_at_ms
        FROM clore_store
        WHERE id = $1
        LIMIT 1
      `,
      [STORE_ROW_ID]
    );
    const rawValue = result.rows[0]?.updated_at_ms;
    const marker = typeof rawValue === "number" ? rawValue : Number(rawValue);
    return Number.isFinite(marker) ? marker : 0;
  }

  try {
    await ensureStoreFile();
    const stats = await runWithStorePathFallback(async () => {
      const paths = resolveStoreFilePaths();
      return fs.stat(paths.storeFilePath);
    });
    return Number.isFinite(stats.mtimeMs) ? stats.mtimeMs : 0;
  } catch {
    return 0;
  }
}

export async function getStore(): Promise<StoreData> {
  ensureDatabaseConfigured();
  if (USE_DATABASE_STORE) {
    return readStoreFromDatabase();
  }
  return readStoreFile();
}

export function updateStore<T>(
  updater: (store: StoreData) => T | Promise<T>
): Promise<T> {
  ensureDatabaseConfigured();

  return new Promise<T>((resolve, reject) => {
    writeQueue = writeQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          if (USE_DATABASE_STORE) {
            const result = await updateStoreInDatabase(updater);
            publishStoreUpdate();
            resolve(result);
            return;
          }

          const store = await readStoreFile();
          ensureBotUserInStore(store);
          const result = await updater(store);
          await writeStoreFile(store);
          publishStoreUpdate();
          resolve(result);
        } catch (error) {
          reject(error);
          throw error;
        }
      });
  });
}
