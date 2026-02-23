import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
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
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  birthdayAllowedUserIds: string[];
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
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  birthdayAllowedUserIds: string[];
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

export type StoreData = {
  users: StoredUser[];
  threads: StoredChatThread[];
  messages: StoredChatMessage[];
  callSignals: StoredCallSignal[];
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
    lastSeenAllowedUserIds: [],
    avatarAllowedUserIds: [],
    bioAllowedUserIds: [],
    birthdayAllowedUserIds: [],
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
const REQUIRE_DATABASE_STORE = IS_VERCEL_RUNTIME;
const STORE_ROW_ID = "main";
const STORE_FILE_PATH =
  process.env.CLORE_STORE_FILE_PATH?.trim() ??
  path.join(process.cwd(), "data", "clore-store.json");
const STORE_BACKUP_FILE_PATH = `${STORE_FILE_PATH}.backup`;
const STORE_TMP_FILE_PATH = `${STORE_FILE_PATH}.tmp`;
const EMPTY_STORE: StoreData = {
  users: [],
  threads: [],
  messages: [],
  callSignals: [],
};

let writeQueue: Promise<void> = Promise.resolve();
let pool: Pool | null = null;
let ensureDatabaseReadyPromise: Promise<void> | null = null;
let lastValidFileStoreSnapshot: StoreData | null = null;

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
    lastSeenAllowedUserIds: user.lastSeenAllowedUserIds,
    avatarAllowedUserIds: user.avatarAllowedUserIds,
    bioAllowedUserIds: user.bioAllowedUserIds,
    birthdayAllowedUserIds: user.birthdayAllowedUserIds,
    lastSeenAt: user.lastSeenAt,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  };
}

export function createEntityId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
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
      "DATABASE_URL (or POSTGRES_URL) is required in production."
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
  await fs.mkdir(path.dirname(STORE_FILE_PATH), { recursive: true });
  try {
    await fs.access(STORE_FILE_PATH);
  } catch {
    await fs.writeFile(
      STORE_FILE_PATH,
      JSON.stringify(EMPTY_STORE, null, 2),
      "utf8"
    );
  }
}

function isPotentiallyDataLossStore(store: StoreData): boolean {
  const hasNonBotUsers = store.users.some((user) => !isBotUserId(user.id));
  return (
    !hasNonBotUsers &&
    store.threads.length === 0 &&
    store.messages.length === 0 &&
    store.callSignals.length === 0
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
    const lastSeenAllowedUserIds = sanitizeAllowedUserIds(
      user.lastSeenAllowedUserIds
    );
    const avatarAllowedUserIds = sanitizeAllowedUserIds(user.avatarAllowedUserIds);
    const bioAllowedUserIds = sanitizeAllowedUserIds(user.bioAllowedUserIds);
    const birthdayAllowedUserIds = sanitizeAllowedUserIds(
      user.birthdayAllowedUserIds
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
      lastSeenAllowedUserIds,
      avatarAllowedUserIds,
      bioAllowedUserIds,
      birthdayAllowedUserIds,
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

  const maybeRestoreFromBackup = async (
    primarySnapshot: StoreData
  ): Promise<StoreData> => {
    if (!isPotentiallyDataLossStore(primarySnapshot)) {
      return primarySnapshot;
    }
    const backupSnapshot = await readStoreSnapshotFromPath(STORE_BACKUP_FILE_PATH);
    if (backupSnapshot && !isPotentiallyDataLossStore(backupSnapshot)) {
      lastValidFileStoreSnapshot = backupSnapshot;
      return backupSnapshot;
    }
    return primarySnapshot;
  };

  const firstAttempt = await readStoreSnapshotFromPath(STORE_FILE_PATH);
  if (firstAttempt) {
    const restored = await maybeRestoreFromBackup(firstAttempt);
    lastValidFileStoreSnapshot = restored;
    return restored;
  }

  // In local file mode reads can overlap writes and briefly observe incomplete JSON.
  await new Promise((resolve) => setTimeout(resolve, 20));
  const secondAttempt = await readStoreSnapshotFromPath(STORE_FILE_PATH);
  if (secondAttempt) {
    const restored = await maybeRestoreFromBackup(secondAttempt);
    lastValidFileStoreSnapshot = restored;
    return restored;
  }

  const backupAttempt = await readStoreSnapshotFromPath(STORE_BACKUP_FILE_PATH);
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
  await ensureStoreFile();
  const sanitizedNextStore = sanitizeStore(store);
  const currentSnapshot = await readStoreSnapshotFromPath(STORE_FILE_PATH);

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
    const currentRaw = await fs.readFile(STORE_FILE_PATH, "utf8");
    await fs.writeFile(STORE_BACKUP_FILE_PATH, currentRaw, "utf8");
  } catch {
    // Best-effort backup.
  }

  await fs.writeFile(
    STORE_TMP_FILE_PATH,
    JSON.stringify(sanitizedNextStore, null, 2),
    "utf8"
  );

  try {
    await fs.rename(STORE_TMP_FILE_PATH, STORE_FILE_PATH);
  } catch {
    await fs.unlink(STORE_FILE_PATH).catch(() => undefined);
    await fs.rename(STORE_TMP_FILE_PATH, STORE_FILE_PATH);
  } finally {
    await fs.unlink(STORE_TMP_FILE_PATH).catch(() => undefined);
  }

  lastValidFileStoreSnapshot = sanitizedNextStore;
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
    const stats = await fs.stat(STORE_FILE_PATH);
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
