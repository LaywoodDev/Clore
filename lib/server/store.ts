import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";

import {
  isAvatarDecorationId,
  type AvatarDecorationId,
} from "@/lib/shared/avatar-decorations";
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
  avatarDecoration?: AvatarDecorationId;
  purchasedAvatarDecorations?: AvatarDecorationId[];
  archiveLockEnabled?: boolean;
  archivePasscode?: string;
  loginVerificationEnabled?: boolean;
  primeStatus?: "inactive" | "pending" | "active" | "canceled";
  primeExpiresAt?: number;
  primeAutoRenew?: boolean;
  primePendingPaymentId?: string;
  primeLastPaymentId?: string;
  primePaymentMethodId?: string;
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
  avatarDecoration: AvatarDecorationId;
  purchasedAvatarDecorations: AvatarDecorationId[];
  archiveLockEnabled: boolean;
  loginVerificationEnabled: boolean;
  primeStatus: "inactive" | "pending" | "active" | "canceled";
  primeExpiresAt: number;
  primeAutoRenew: boolean;
};

export type GroupRole = "owner" | "admin" | "member";
export type GroupKind = "group" | "channel";
export type GroupAccessType = "private" | "public";

export type StoredChatThread = {
  id: string;
  memberIds: string[];
  threadType: "direct" | "group";
  groupKind?: GroupKind;
  groupAccess?: GroupAccessType;
  groupUsername?: string;
  groupInviteToken?: string;
  groupInviteUsageLimit?: number;
  groupInviteUsedCount?: number;
  contentProtectionEnabled?: boolean;
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
  archivedBy?: Record<string, boolean>;
  typingBy: Record<string, number>;
  groupRoles: Record<string, GroupRole>;
};

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
};

export type StoredChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  attachments: StoredChatAttachment[];
  replyToMessageId: string;
  pollId?: string;
  createdAt: number;
  scheduledAt: number;
  editedAt: number;
  pinnedAt: number;
  pinnedByUserId: string;
  savedBy: Record<string, number>;
  hiddenFor?: Record<string, number>;
  linkPreview?: LinkPreview;
};

export type StoredChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export type StoredPollOption = {
  id: string;
  text: string;
};

export type StoredPoll = {
  id: string;
  messageId: string;
  chatId: string;
  authorId: string;
  question: string;
  options: StoredPollOption[];
  votes: Record<string, string>; // userId -> optionId
  isAnonymous: boolean;
  createdAt: number;
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

export type StoredAuthToken = {
  userId: string;
  createdAt: number;
  lastUsedAt: number;
  userAgent?: string;
  ip?: string;
};

export type StoredPendingLogin = {
  id: string;
  userId: string;
  code: string;
  expiresAt: number;
  userAgent?: string;
  ip?: string;
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

export type StoredPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type StoreData = {
  users: StoredUser[];
  threads: StoredChatThread[];
  messages: StoredChatMessage[];
  polls: StoredPoll[];
  callSignals: StoredCallSignal[];
  moderationReports: StoredModerationReport[];
  moderationAuditLogs: StoredModerationAuditLog[];
  userSanctions: Record<string, StoredUserSanction>;
  authTokens: Record<string, StoredAuthToken>;
  pendingLogins: Record<string, StoredPendingLogin>;
  pushSubscriptions: Record<string, StoredPushSubscription[]>;
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
    avatarDecoration: "none",
    purchasedAvatarDecorations: [],
    archiveLockEnabled: false,
    archivePasscode: "",
    primeStatus: "inactive",
    primeExpiresAt: 0,
    primeAutoRenew: false,
    primePendingPaymentId: "",
    primeLastPaymentId: "",
    primePaymentMethodId: "",
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
  polls: [],
  callSignals: [],
  moderationReports: [],
  moderationAuditLogs: [],
  userSanctions: {},
  authTokens: {},
  pendingLogins: {},
  pushSubscriptions: {},
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

const GROUP_USERNAME_REGEX = /^[a-z0-9_]{3,32}$/;
const GROUP_INVITE_USAGE_LIMIT_MAX = Number.MAX_SAFE_INTEGER;

export function normalizeGroupUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidGroupUsername(value: string): boolean {
  return GROUP_USERNAME_REGEX.test(value);
}

export function getThreadInviteToken(
  thread: Pick<StoredChatThread, "id" | "groupInviteToken">
): string {
  const candidate =
    typeof thread.groupInviteToken === "string"
      ? thread.groupInviteToken.trim()
      : "";
  return candidate || thread.id;
}

export function normalizeGroupInviteUsageLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  const normalized = Math.trunc(value);
  if (normalized <= 0) {
    return 0;
  }
  return Math.min(normalized, GROUP_INVITE_USAGE_LIMIT_MAX);
}

export function normalizeGroupInviteUsedCount(
  value: unknown,
  usageLimit: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  const normalized = Math.max(0, Math.trunc(value));
  if (usageLimit > 0) {
    return Math.min(normalized, usageLimit);
  }
  return normalized;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function hasActivePrimeSubscription(
  user: Pick<StoredUser, "primeStatus" | "primeExpiresAt">,
  now = Date.now()
): boolean {
  const expiresAt =
    typeof user.primeExpiresAt === "number" && Number.isFinite(user.primeExpiresAt)
      ? Math.max(0, Math.trunc(user.primeExpiresAt))
      : 0;
  return user.primeStatus === "active" && expiresAt > now;
}

export function getPurchasedAvatarDecorations(
  user: { purchasedAvatarDecorations?: unknown }
): AvatarDecorationId[] {
  const raw = Array.isArray(user.purchasedAvatarDecorations)
    ? user.purchasedAvatarDecorations
    : [];

  const unique = new Set<AvatarDecorationId>();
  for (const candidate of raw) {
    if (typeof candidate === "string" && candidate !== "none" && isAvatarDecorationId(candidate)) {
      unique.add(candidate);
    }
  }

  return [...unique];
}

export function canUseAvatarDecoration(
  user: Pick<
    StoredUser,
    "primeStatus" | "primeExpiresAt" | "purchasedAvatarDecorations"
  >,
  decoration: AvatarDecorationId,
  now = Date.now()
): boolean {
  if (decoration === "none") {
    return true;
  }
  if (hasActivePrimeSubscription(user, now)) {
    return true;
  }
  return getPurchasedAvatarDecorations(user).includes(decoration);
}

export function toPublicUser(user: StoredUser): PublicUser {
  const purchasedAvatarDecorations = getPurchasedAvatarDecorations(user);
  const avatarDecoration =
    typeof user.avatarDecoration === "string" && isAvatarDecorationId(user.avatarDecoration)
      ? user.avatarDecoration
      : "none";

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
    avatarDecoration: canUseAvatarDecoration(user, avatarDecoration) ? avatarDecoration : "none",
    purchasedAvatarDecorations,
    archiveLockEnabled: user.archiveLockEnabled === true,
    loginVerificationEnabled: user.loginVerificationEnabled === true,
    primeStatus:
      user.primeStatus === "pending" ||
      user.primeStatus === "active" ||
      user.primeStatus === "canceled"
        ? user.primeStatus
        : "inactive",
    primeExpiresAt:
      typeof user.primeExpiresAt === "number" && Number.isFinite(user.primeExpiresAt)
        ? Math.max(0, Math.trunc(user.primeExpiresAt))
        : 0,
    primeAutoRenew: user.primeAutoRenew === true,
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

export function canUserPostInThread(
  thread: StoredChatThread,
  userId: string
): boolean {
  if (!thread.memberIds.includes(userId)) {
    return false;
  }
  if (thread.threadType !== "group") {
    return true;
  }
  if (thread.groupKind !== "channel") {
    return true;
  }

  const role = getGroupRole(thread, userId);
  return role === "owner" || role === "admin";
}

export function canUserPinMessagesInThread(
  thread: StoredChatThread,
  userId: string
): boolean {
  if (!thread.memberIds.includes(userId)) {
    return false;
  }
  if (thread.threadType !== "group") {
    return true;
  }
  if (thread.groupKind !== "channel") {
    return true;
  }

  return getGroupRole(thread, userId) === "owner";
}

export function getPinnedMessageLimitForThread(
  thread: StoredChatThread
): number | null {
  if (thread.threadType !== "group") {
    return 10;
  }
  if (thread.groupKind === "channel") {
    return null;
  }
  return 20;
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
    max: 3,
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
    const avatarDecoration =
      typeof user.avatarDecoration === "string" && isAvatarDecorationId(user.avatarDecoration)
        ? user.avatarDecoration
        : "none";
    const purchasedAvatarDecorations = getPurchasedAvatarDecorations({
      purchasedAvatarDecorations: user.purchasedAvatarDecorations,
    });
    const archiveLockEnabled = user.archiveLockEnabled === true;
    const archivePasscode =
      typeof user.archivePasscode === "string" ? user.archivePasscode : "";
    const loginVerificationEnabled = user.loginVerificationEnabled === true;
    const primeStatus =
      user.primeStatus === "pending" ||
      user.primeStatus === "active" ||
      user.primeStatus === "canceled"
        ? user.primeStatus
        : "inactive";
    const primeExpiresAt = Math.max(0, Math.trunc(normalizeNumber(user.primeExpiresAt, 0)));
    const primeAutoRenew = user.primeAutoRenew === true;
    const primePendingPaymentId =
      typeof user.primePendingPaymentId === "string" ? user.primePendingPaymentId.trim() : "";
    const primeLastPaymentId =
      typeof user.primeLastPaymentId === "string" ? user.primeLastPaymentId.trim() : "";
    const primePaymentMethodId =
      typeof user.primePaymentMethodId === "string" ? user.primePaymentMethodId.trim() : "";

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
      avatarDecoration,
      purchasedAvatarDecorations,
      archiveLockEnabled,
      archivePasscode,
      loginVerificationEnabled,
      primeStatus,
      primeExpiresAt,
      primeAutoRenew,
      primePendingPaymentId,
      primeLastPaymentId,
      primePaymentMethodId,
    });
  }

  return [...byId.values()];
}

function sanitizeThreads(rawThreads: unknown): StoredChatThread[] {
  if (!Array.isArray(rawThreads)) {
    return [];
  }

  const byId = new Map<string, StoredChatThread>();
  const usedPublicGroupUsernames = new Set<string>();

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

    if (!id || uniqueMemberIds.length === 0) {
      continue;
    }

    const rawThreadType =
      thread.threadType === "group" || thread.threadType === "direct"
        ? thread.threadType
        : null;
    const threadType =
      rawThreadType !== null
        ? rawThreadType
        : uniqueMemberIds.length > 2
          ? "group"
          : "direct";
    if (threadType === "direct" && uniqueMemberIds.length < 2) {
      continue;
    }
    const groupKind: GroupKind | undefined =
      threadType !== "group"
        ? undefined
        : thread.groupKind === "channel"
          ? "channel"
          : "group";
    const rawGroupAccess =
      typeof thread.groupAccess === "string" ? thread.groupAccess.trim() : "";
    const normalizedGroupUsername = normalizeGroupUsername(
      typeof thread.groupUsername === "string" ? thread.groupUsername : ""
    );
    const rawGroupInviteToken =
      typeof thread.groupInviteToken === "string"
        ? thread.groupInviteToken.trim()
        : "";
    const rawGroupInviteUsageLimit = normalizeGroupInviteUsageLimit(
      (thread as Record<string, unknown>).groupInviteUsageLimit
    );
    const rawGroupInviteUsedCount = normalizeGroupInviteUsedCount(
      (thread as Record<string, unknown>).groupInviteUsedCount,
      rawGroupInviteUsageLimit
    );
    const rawContentProtectionEnabled =
      (thread as Record<string, unknown>).contentProtectionEnabled === true;
    let groupAccess: GroupAccessType | undefined;
    let groupUsername: string | undefined;
    let groupInviteToken: string | undefined;
    let groupInviteUsageLimit: number | undefined;
    let groupInviteUsedCount: number | undefined;
    let contentProtectionEnabled: boolean | undefined;
    if (threadType === "group") {
      const canUsePublicUsername =
        rawGroupAccess === "public" &&
        isValidGroupUsername(normalizedGroupUsername) &&
        !usedPublicGroupUsernames.has(normalizedGroupUsername);
      if (canUsePublicUsername) {
        groupAccess = "public";
        groupUsername = normalizedGroupUsername;
        usedPublicGroupUsernames.add(normalizedGroupUsername);
      } else {
        groupAccess = "private";
        groupUsername = "";
      }
      groupInviteToken = rawGroupInviteToken || id;
      groupInviteUsageLimit = rawGroupInviteUsageLimit;
      groupInviteUsedCount = rawGroupInviteUsedCount;
      contentProtectionEnabled = rawContentProtectionEnabled;
    }
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
    const archivedByRaw = asRecord(thread.archivedBy) ?? {};
    const typingByRaw = asRecord(thread.typingBy) ?? {};
    const groupRolesRaw = asRecord(thread.groupRoles) ?? {};
    const readBy: Record<string, number> = {};
    const pinnedBy: Record<string, boolean> = {};
    const mutedBy: Record<string, boolean> = {};
    const archivedBy: Record<string, boolean> = {};
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
    for (const [memberId, archived] of Object.entries(archivedByRaw)) {
      if (!uniqueMemberIds.includes(memberId)) {
        continue;
      }
      archivedBy[memberId] = archived === true;
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
      groupKind,
      groupAccess,
      groupUsername,
      groupInviteToken,
      groupInviteUsageLimit,
      groupInviteUsedCount,
      contentProtectionEnabled,
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
      archivedBy,
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
    const scheduledAtRaw = normalizeNumber(message.scheduledAt, 0);
    const scheduledAt =
      Number.isFinite(scheduledAtRaw) &&
      scheduledAtRaw > 0 &&
      createdAt > Math.trunc(scheduledAtRaw)
        ? Math.trunc(scheduledAtRaw)
        : 0;
    const editedAt = normalizeNumber(message.editedAt, 0);
    const pinnedAt = Math.max(0, normalizeNumber(message.pinnedAt, 0));
    const pinnedByUserId =
      pinnedAt > 0 && typeof message.pinnedByUserId === "string"
        ? message.pinnedByUserId.trim()
        : "";
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
    const hiddenForRaw = asRecord(message.hiddenFor) ?? {};
    const hiddenFor: Record<string, number> = {};
    for (const [userId, rawHiddenAt] of Object.entries(hiddenForRaw)) {
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) {
        continue;
      }
      if (typeof rawHiddenAt === "number" && Number.isFinite(rawHiddenAt)) {
        hiddenFor[normalizedUserId] = Math.max(0, Math.trunc(rawHiddenAt));
      }
    }

    const pollId =
      typeof message.pollId === "string" && message.pollId.trim()
        ? message.pollId.trim()
        : undefined;

    if (!id || !chatId || !authorId || (!text.trim() && attachments.length === 0 && !pollId)) {
      continue;
    }

    byId.set(id, {
      id,
      chatId,
      authorId,
      text,
      attachments,
      replyToMessageId,
      pollId,
      createdAt,
      scheduledAt,
      editedAt,
      pinnedAt,
      pinnedByUserId,
      savedBy,
      hiddenFor,
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

function sanitizePolls(rawPolls: unknown): StoredPoll[] {
  if (!Array.isArray(rawPolls)) {
    return [];
  }

  const byId = new Map<string, StoredPoll>();

  for (const rawPoll of rawPolls) {
    const poll = asRecord(rawPoll);
    if (!poll) {
      continue;
    }

    const id = typeof poll.id === "string" ? poll.id.trim() : "";
    const messageId = typeof poll.messageId === "string" ? poll.messageId.trim() : "";
    const chatId = typeof poll.chatId === "string" ? poll.chatId.trim() : "";
    const authorId = typeof poll.authorId === "string" ? poll.authorId.trim() : "";
    const question = typeof poll.question === "string" ? poll.question.trim() : "";

    if (!id || !messageId || !chatId || !authorId || !question) {
      continue;
    }

    const rawOptions = Array.isArray(poll.options) ? poll.options : [];
    const options: StoredPollOption[] = rawOptions
      .map((rawOption) => {
        const opt = asRecord(rawOption);
        if (!opt) return null;
        const optId = typeof opt.id === "string" ? opt.id.trim() : "";
        const optText = typeof opt.text === "string" ? opt.text.trim() : "";
        if (!optId || !optText) return null;
        return { id: optId, text: optText };
      })
      .filter((opt): opt is StoredPollOption => opt !== null);

    if (options.length < 2) {
      continue;
    }

    const rawVotes = asRecord(poll.votes) ?? {};
    const votes: Record<string, string> = {};
    const validOptionIds = new Set(options.map((o) => o.id));
    for (const [userId, optionId] of Object.entries(rawVotes)) {
      if (typeof userId === "string" && userId && typeof optionId === "string" && validOptionIds.has(optionId)) {
        votes[userId] = optionId;
      }
    }

    const isAnonymous = poll.isAnonymous === true;
    const createdAt = normalizeNumber(poll.createdAt, Date.now());

    byId.set(id, { id, messageId, chatId, authorId, question, options, votes, isAnonymous, createdAt });
  }

  return [...byId.values()];
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
    polls: sanitizePolls(parsed.polls),
    callSignals: sanitizeCallSignals(parsed.callSignals),
    moderationReports: sanitizeModerationReports(parsed.moderationReports),
    moderationAuditLogs: sanitizeModerationAuditLogs(parsed.moderationAuditLogs),
    userSanctions: sanitizeUserSanctions(parsed.userSanctions),
    authTokens: sanitizeAuthTokens(parsed.authTokens),
    pendingLogins: sanitizePendingLogins(parsed.pendingLogins),
    pushSubscriptions: sanitizePushSubscriptions(parsed.pushSubscriptions),
  };
}

function sanitizePushSubscriptions(raw: unknown): Record<string, StoredPushSubscription[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: Record<string, StoredPushSubscription[]> = {};
  for (const [userId, subs] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof userId !== "string" || !userId || !Array.isArray(subs)) {
      continue;
    }
    const validSubs: StoredPushSubscription[] = [];
    for (const sub of subs) {
      if (
        sub &&
        typeof sub === "object" &&
        typeof (sub as Record<string, unknown>).endpoint === "string" &&
        (sub as Record<string, unknown>).endpoint &&
        (sub as Record<string, unknown>).keys &&
        typeof ((sub as Record<string, unknown>).keys as Record<string, unknown>).p256dh === "string" &&
        typeof ((sub as Record<string, unknown>).keys as Record<string, unknown>).auth === "string"
      ) {
        const s = sub as Record<string, unknown>;
        const keys = s.keys as Record<string, unknown>;
        validSubs.push({
          endpoint: s.endpoint as string,
          keys: { p256dh: keys.p256dh as string, auth: keys.auth as string },
        });
      }
    }
    if (validSubs.length > 0) {
      result[userId] = validSubs;
    }
  }
  return result;
}

function sanitizeAuthTokens(raw: unknown): Record<string, StoredAuthToken> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: Record<string, StoredAuthToken> = {};
  const now = Date.now();
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== "string" || key.length === 0) continue;
    // старый формат: строка userId
    if (typeof value === "string" && value.length > 0) {
      result[key] = { userId: value, createdAt: now, lastUsedAt: now };
      continue;
    }
    // новый формат: объект
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      if (typeof v.userId === "string" && v.userId.length > 0) {
        result[key] = {
          userId: v.userId,
          createdAt: typeof v.createdAt === "number" ? v.createdAt : now,
          lastUsedAt: typeof v.lastUsedAt === "number" ? v.lastUsedAt : now,
          userAgent: typeof v.userAgent === "string" ? v.userAgent : undefined,
          ip: typeof v.ip === "string" ? v.ip : undefined,
        };
      }
    }
  }
  return result;
}

function sanitizePendingLogins(raw: unknown): Record<string, StoredPendingLogin> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: Record<string, StoredPendingLogin> = {};
  const now = Date.now();
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const v = value as Record<string, unknown>;
    if (
      typeof v.id === "string" &&
      typeof v.userId === "string" &&
      typeof v.code === "string" &&
      typeof v.expiresAt === "number" &&
      v.expiresAt > now // drop expired entries on load
    ) {
      result[key] = {
        id: v.id,
        userId: v.userId,
        code: v.code,
        expiresAt: v.expiresAt,
        userAgent: typeof v.userAgent === "string" ? v.userAgent : undefined,
        ip: typeof v.ip === "string" ? v.ip : undefined,
      };
    }
  }
  return result;
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
      // Create relational tables
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_users (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_threads (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE INDEX IF NOT EXISTS clore_messages_chat_id_idx ON clore_messages (chat_id)
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_polls (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_call_signals (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_moderation_reports (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_moderation_audit_logs (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_user_sanctions (
          user_id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_auth_tokens (
          token TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_pending_logins (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await currentPool.query(`
        CREATE TABLE IF NOT EXISTS clore_push_subscriptions (
          user_id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Migrate data from legacy clore_store blob table if it exists
      const legacyExists = await currentPool.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'clore_store'
        ) AS exists
      `);
      if (legacyExists.rows[0]?.exists) {
        const legacyResult = await currentPool.query<{ data: unknown }>(
          "SELECT data FROM clore_store WHERE id = $1 LIMIT 1",
          [STORE_ROW_ID]
        );
        const legacyData = legacyResult.rows[0]?.data;
        if (legacyData) {
          const store = sanitizeStore(legacyData);
          // Only migrate if there is real data and relational tables are empty
          const usersCount = await currentPool.query<{ count: string }>(
            "SELECT COUNT(*) AS count FROM clore_users"
          );
          if (parseInt(usersCount.rows[0]?.count ?? "0", 10) === 0 && store.users.length > 0) {
            console.log("[store] Migrating legacy clore_store blob into relational tables...");
            const client = await currentPool.connect();
            try {
              await client.query("BEGIN");
              await _writeStoreTables(client, store);
              await client.query("COMMIT");
              console.log("[store] Migration complete.");
            } catch (err) {
              await client.query("ROLLBACK").catch(() => undefined);
              console.error("[store] Migration failed, keeping legacy table:", err);
            } finally {
              client.release();
            }
          }
        }
      }
    })().catch((error) => {
      ensureDatabaseReadyPromise = null;
      console.error("[store] Failed to initialize database tables:", error);
      throw error;
    });
  }

  await ensureDatabaseReadyPromise;
}

// Low-level helper: write all StoreData into relational tables using an existing client.
// Does full UPSERT for all entities present in `store`, but does NOT delete removed rows.
// Used by migration only. updateStoreInDatabase handles deletes via diff.
async function _writeStoreTables(
  client: import("pg").PoolClient,
  store: StoreData
): Promise<void> {
  for (const user of store.users) {
    await client.query(
      `INSERT INTO clore_users (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [user.id, JSON.stringify(user)]
    );
  }
  for (const thread of store.threads) {
    await client.query(
      `INSERT INTO clore_threads (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [thread.id, JSON.stringify(thread)]
    );
  }
  for (const message of store.messages) {
    await client.query(
      `INSERT INTO clore_messages (id, chat_id, data, updated_at) VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [message.id, message.chatId, JSON.stringify(message)]
    );
  }
  for (const poll of store.polls) {
    await client.query(
      `INSERT INTO clore_polls (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [poll.id, JSON.stringify(poll)]
    );
  }
  for (const signal of store.callSignals) {
    await client.query(
      `INSERT INTO clore_call_signals (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [signal.id, JSON.stringify(signal)]
    );
  }
  for (const report of store.moderationReports) {
    await client.query(
      `INSERT INTO clore_moderation_reports (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [report.id, JSON.stringify(report)]
    );
  }
  for (const log of store.moderationAuditLogs) {
    await client.query(
      `INSERT INTO clore_moderation_audit_logs (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [log.id, JSON.stringify(log)]
    );
  }
  for (const [userId, sanction] of Object.entries(store.userSanctions)) {
    await client.query(
      `INSERT INTO clore_user_sanctions (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [userId, JSON.stringify(sanction)]
    );
  }
  for (const [token, tokenData] of Object.entries(store.authTokens)) {
    await client.query(
      `INSERT INTO clore_auth_tokens (token, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (token) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [token, JSON.stringify(tokenData)]
    );
  }
  for (const [loginId, pendingLogin] of Object.entries(store.pendingLogins)) {
    await client.query(
      `INSERT INTO clore_pending_logins (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [loginId, JSON.stringify(pendingLogin)]
    );
  }
  for (const [userId, subs] of Object.entries(store.pushSubscriptions)) {
    await client.query(
      `INSERT INTO clore_push_subscriptions (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [userId, JSON.stringify(subs)]
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbQuerier = { query(sql: string, params?: any[]): Promise<{ rows: any[] }> };

async function _readStoreTables(q: DbQuerier): Promise<StoreData> {
  const [
    usersResult,
    threadsResult,
    messagesResult,
    pollsResult,
    callSignalsResult,
    modReportsResult,
    modAuditResult,
    sanctionsResult,
    authTokensResult,
    pendingLoginsResult,
    pushSubsResult,
  ] = await Promise.all([
    q.query("SELECT data FROM clore_users"),
    q.query("SELECT data FROM clore_threads"),
    q.query("SELECT data FROM clore_messages"),
    q.query("SELECT data FROM clore_polls"),
    q.query("SELECT data FROM clore_call_signals"),
    q.query("SELECT data FROM clore_moderation_reports"),
    q.query("SELECT data FROM clore_moderation_audit_logs"),
    q.query("SELECT user_id, data FROM clore_user_sanctions"),
    q.query("SELECT token, data FROM clore_auth_tokens"),
    q.query("SELECT id, data FROM clore_pending_logins"),
    q.query("SELECT user_id, data FROM clore_push_subscriptions"),
  ]);

  const rawUserSanctions: Record<string, unknown> = {};
  for (const row of sanctionsResult.rows) rawUserSanctions[row.user_id] = row.data;
  const rawAuthTokens: Record<string, unknown> = {};
  for (const row of authTokensResult.rows) rawAuthTokens[row.token] = row.data;
  const rawPendingLogins: Record<string, unknown> = {};
  for (const row of pendingLoginsResult.rows) rawPendingLogins[row.id] = row.data;
  const rawPushSubs: Record<string, unknown> = {};
  for (const row of pushSubsResult.rows) rawPushSubs[row.user_id] = row.data;

  return sanitizeStore({
    users: usersResult.rows.map((r) => r.data),
    threads: threadsResult.rows.map((r) => r.data),
    messages: messagesResult.rows.map((r) => r.data),
    polls: pollsResult.rows.map((r) => r.data),
    callSignals: callSignalsResult.rows.map((r) => r.data),
    moderationReports: modReportsResult.rows.map((r) => r.data),
    moderationAuditLogs: modAuditResult.rows.map((r) => r.data),
    userSanctions: rawUserSanctions,
    authTokens: rawAuthTokens,
    pendingLogins: rawPendingLogins,
    pushSubscriptions: rawPushSubs,
  });
}

async function readStoreFromDatabase(): Promise<StoreData> {
  await ensureDatabaseStore();
  const currentPool = getPool();
  if (!currentPool) {
    return { ...EMPTY_STORE };
  }
  return _readStoreTables(currentPool);
}

// Applies diff between old and new store, writing only changed/new rows and deleting removed rows.
async function _applyStoreDiff(
  client: import("pg").PoolClient,
  oldStore: StoreData,
  newStore: StoreData
): Promise<void> {
  // Build lookup maps of old JSON snapshots for fast comparison
  const oldUserJson = new Map(oldStore.users.map((u) => [u.id, JSON.stringify(u)]));
  const oldThreadJson = new Map(oldStore.threads.map((t) => [t.id, JSON.stringify(t)]));
  const oldMessageJson = new Map(oldStore.messages.map((m) => [m.id, JSON.stringify(m)]));
  const oldPollJson = new Map(oldStore.polls.map((p) => [p.id, JSON.stringify(p)]));
  const oldSignalJson = new Map(oldStore.callSignals.map((s) => [s.id, JSON.stringify(s)]));
  const oldReportJson = new Map(oldStore.moderationReports.map((r) => [r.id, JSON.stringify(r)]));
  const oldAuditJson = new Map(oldStore.moderationAuditLogs.map((l) => [l.id, JSON.stringify(l)]));

  // --- Users ---
  const newUserIds = new Set<string>();
  for (const user of newStore.users) {
    newUserIds.add(user.id);
    const json = JSON.stringify(user);
    if (oldUserJson.get(user.id) !== json) {
      await client.query(
        `INSERT INTO clore_users (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [user.id, json]
      );
    }
  }
  const deletedUserIds = [...oldUserJson.keys()].filter((id) => !newUserIds.has(id));
  if (deletedUserIds.length > 0) {
    await client.query("DELETE FROM clore_users WHERE id = ANY($1::text[])", [deletedUserIds]);
  }

  // --- Threads ---
  const newThreadIds = new Set<string>();
  for (const thread of newStore.threads) {
    newThreadIds.add(thread.id);
    const json = JSON.stringify(thread);
    if (oldThreadJson.get(thread.id) !== json) {
      await client.query(
        `INSERT INTO clore_threads (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [thread.id, json]
      );
    }
  }
  const deletedThreadIds = [...oldThreadJson.keys()].filter((id) => !newThreadIds.has(id));
  if (deletedThreadIds.length > 0) {
    await client.query("DELETE FROM clore_threads WHERE id = ANY($1::text[])", [deletedThreadIds]);
  }

  // --- Messages ---
  const newMessageIds = new Set<string>();
  for (const message of newStore.messages) {
    newMessageIds.add(message.id);
    const json = JSON.stringify(message);
    if (oldMessageJson.get(message.id) !== json) {
      await client.query(
        `INSERT INTO clore_messages (id, chat_id, data, updated_at) VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [message.id, message.chatId, json]
      );
    }
  }
  const deletedMessageIds = [...oldMessageJson.keys()].filter((id) => !newMessageIds.has(id));
  if (deletedMessageIds.length > 0) {
    await client.query("DELETE FROM clore_messages WHERE id = ANY($1::text[])", [deletedMessageIds]);
  }

  // --- Polls ---
  const newPollIds = new Set<string>();
  for (const poll of newStore.polls) {
    newPollIds.add(poll.id);
    const json = JSON.stringify(poll);
    if (oldPollJson.get(poll.id) !== json) {
      await client.query(
        `INSERT INTO clore_polls (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [poll.id, json]
      );
    }
  }
  const deletedPollIds = [...oldPollJson.keys()].filter((id) => !newPollIds.has(id));
  if (deletedPollIds.length > 0) {
    await client.query("DELETE FROM clore_polls WHERE id = ANY($1::text[])", [deletedPollIds]);
  }

  // --- Call signals ---
  const newSignalIds = new Set<string>();
  for (const signal of newStore.callSignals) {
    newSignalIds.add(signal.id);
    const json = JSON.stringify(signal);
    if (oldSignalJson.get(signal.id) !== json) {
      await client.query(
        `INSERT INTO clore_call_signals (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [signal.id, json]
      );
    }
  }
  const deletedSignalIds = [...oldSignalJson.keys()].filter((id) => !newSignalIds.has(id));
  if (deletedSignalIds.length > 0) {
    await client.query("DELETE FROM clore_call_signals WHERE id = ANY($1::text[])", [deletedSignalIds]);
  }

  // --- Moderation reports ---
  const newReportIds = new Set<string>();
  for (const report of newStore.moderationReports) {
    newReportIds.add(report.id);
    const json = JSON.stringify(report);
    if (oldReportJson.get(report.id) !== json) {
      await client.query(
        `INSERT INTO clore_moderation_reports (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [report.id, json]
      );
    }
  }
  const deletedReportIds = [...oldReportJson.keys()].filter((id) => !newReportIds.has(id));
  if (deletedReportIds.length > 0) {
    await client.query("DELETE FROM clore_moderation_reports WHERE id = ANY($1::text[])", [deletedReportIds]);
  }

  // --- Audit logs ---
  const newAuditIds = new Set<string>();
  for (const log of newStore.moderationAuditLogs) {
    newAuditIds.add(log.id);
    const json = JSON.stringify(log);
    if (oldAuditJson.get(log.id) !== json) {
      await client.query(
        `INSERT INTO clore_moderation_audit_logs (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [log.id, json]
      );
    }
  }
  const deletedAuditIds = [...oldAuditJson.keys()].filter((id) => !newAuditIds.has(id));
  if (deletedAuditIds.length > 0) {
    await client.query("DELETE FROM clore_moderation_audit_logs WHERE id = ANY($1::text[])", [deletedAuditIds]);
  }

  // --- User sanctions (keyed by userId) ---
  const oldSanctionJson = new Map(
    Object.entries(oldStore.userSanctions).map(([k, v]) => [k, JSON.stringify(v)])
  );
  const newSanctionIds = new Set<string>();
  for (const [userId, sanction] of Object.entries(newStore.userSanctions)) {
    newSanctionIds.add(userId);
    const json = JSON.stringify(sanction);
    if (oldSanctionJson.get(userId) !== json) {
      await client.query(
        `INSERT INTO clore_user_sanctions (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [userId, json]
      );
    }
  }
  const deletedSanctionIds = [...oldSanctionJson.keys()].filter((id) => !newSanctionIds.has(id));
  if (deletedSanctionIds.length > 0) {
    await client.query("DELETE FROM clore_user_sanctions WHERE user_id = ANY($1::text[])", [deletedSanctionIds]);
  }

  // --- Auth tokens ---
  const oldTokenJson = new Map(
    Object.entries(oldStore.authTokens).map(([k, v]) => [k, JSON.stringify(v)])
  );
  const newTokenIds = new Set<string>();
  for (const [token, tokenData] of Object.entries(newStore.authTokens)) {
    newTokenIds.add(token);
    const json = JSON.stringify(tokenData);
    if (oldTokenJson.get(token) !== json) {
      await client.query(
        `INSERT INTO clore_auth_tokens (token, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (token) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [token, json]
      );
    }
  }
  const deletedTokenIds = [...oldTokenJson.keys()].filter((t) => !newTokenIds.has(t));
  if (deletedTokenIds.length > 0) {
    await client.query("DELETE FROM clore_auth_tokens WHERE token = ANY($1::text[])", [deletedTokenIds]);
  }

  // --- Pending logins ---
  const oldLoginJson = new Map(
    Object.entries(oldStore.pendingLogins).map(([k, v]) => [k, JSON.stringify(v)])
  );
  const newLoginIds = new Set<string>();
  for (const [loginId, pendingLogin] of Object.entries(newStore.pendingLogins)) {
    newLoginIds.add(loginId);
    const json = JSON.stringify(pendingLogin);
    if (oldLoginJson.get(loginId) !== json) {
      await client.query(
        `INSERT INTO clore_pending_logins (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [loginId, json]
      );
    }
  }
  const deletedLoginIds = [...oldLoginJson.keys()].filter((id) => !newLoginIds.has(id));
  if (deletedLoginIds.length > 0) {
    await client.query("DELETE FROM clore_pending_logins WHERE id = ANY($1::text[])", [deletedLoginIds]);
  }

  // --- Push subscriptions ---
  const oldPushJson = new Map(
    Object.entries(oldStore.pushSubscriptions).map(([k, v]) => [k, JSON.stringify(v)])
  );
  const newPushIds = new Set<string>();
  for (const [userId, subs] of Object.entries(newStore.pushSubscriptions)) {
    newPushIds.add(userId);
    const json = JSON.stringify(subs);
    if (oldPushJson.get(userId) !== json) {
      await client.query(
        `INSERT INTO clore_push_subscriptions (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [userId, json]
      );
    }
  }
  const deletedPushIds = [...oldPushJson.keys()].filter((id) => !newPushIds.has(id));
  if (deletedPushIds.length > 0) {
    await client.query("DELETE FROM clore_push_subscriptions WHERE user_id = ANY($1::text[])", [deletedPushIds]);
  }
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

    // Read current state using the same transaction client
    const oldStore = await _readStoreTables(client);
    ensureBotUserInStore(oldStore);

    // Clone via sanitize so updater gets a clean object; diff against oldStore after
    const newStore: StoreData = sanitizeStore(oldStore);
    const result = await updater(newStore);

    // Only write rows that actually changed
    await _applyStoreDiff(client, oldStore, newStore);

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
    // Return the latest updated_at across all relational tables
    const result = await currentPool.query<{ updated_at_ms: number | string }>(`
      SELECT EXTRACT(EPOCH FROM MAX(updated_at)) * 1000 AS updated_at_ms FROM (
        SELECT updated_at FROM clore_users
        UNION ALL SELECT updated_at FROM clore_threads
        UNION ALL SELECT updated_at FROM clore_messages
        UNION ALL SELECT updated_at FROM clore_polls
        UNION ALL SELECT updated_at FROM clore_call_signals
        UNION ALL SELECT updated_at FROM clore_moderation_reports
        UNION ALL SELECT updated_at FROM clore_moderation_audit_logs
        UNION ALL SELECT updated_at FROM clore_user_sanctions
        UNION ALL SELECT updated_at FROM clore_auth_tokens
        UNION ALL SELECT updated_at FROM clore_pending_logins
        UNION ALL SELECT updated_at FROM clore_push_subscriptions
      ) AS all_tables
    `);
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
