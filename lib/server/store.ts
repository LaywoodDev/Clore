import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

export type StoredUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: "everyone" | "selected" | "nobody";
  avatarVisibility: "everyone" | "selected" | "nobody";
  bioVisibility: "everyone" | "selected" | "nobody";
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: "everyone" | "selected" | "nobody";
  avatarVisibility: "everyone" | "selected" | "nobody";
  bioVisibility: "everyone" | "selected" | "nobody";
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};

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
};

export type StoredChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  attachments: StoredChatAttachment[];
  createdAt: number;
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
const EMPTY_STORE: StoreData = {
  users: [],
  threads: [],
  messages: [],
  callSignals: [],
};

let writeQueue: Promise<void> = Promise.resolve();
let pool: Pool | null = null;
let ensureDatabaseReadyPromise: Promise<void> | null = null;

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
    bio: user.bio,
    birthday: user.birthday,
    showLastSeen: user.showLastSeen,
    lastSeenVisibility: user.lastSeenVisibility,
    avatarVisibility: user.avatarVisibility,
    bioVisibility: user.bioVisibility,
    lastSeenAllowedUserIds: user.lastSeenAllowedUserIds,
    avatarAllowedUserIds: user.avatarAllowedUserIds,
    bioAllowedUserIds: user.bioAllowedUserIds,
    lastSeenAt: user.lastSeenAt,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  };
}

export function createEntityId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
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
    const lastSeenAllowedUserIds = sanitizeAllowedUserIds(
      user.lastSeenAllowedUserIds
    );
    const avatarAllowedUserIds = sanitizeAllowedUserIds(user.avatarAllowedUserIds);
    const bioAllowedUserIds = sanitizeAllowedUserIds(user.bioAllowedUserIds);
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
      bio,
      birthday,
      showLastSeen,
      lastSeenVisibility,
      avatarVisibility,
      bioVisibility,
      lastSeenAllowedUserIds,
      avatarAllowedUserIds,
      bioAllowedUserIds,
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

    if (!id || memberIds.length < 2) {
      continue;
    }

    const threadType =
      thread.threadType === "group" || thread.threadType === "direct"
        ? thread.threadType
        : memberIds.length > 2
          ? "group"
          : "direct";
    const title = typeof thread.title === "string" ? thread.title.trim() : "";
    const avatarUrl =
      typeof thread.avatarUrl === "string" ? thread.avatarUrl.trim() : "";
    const bannerUrl =
      typeof thread.bannerUrl === "string" ? thread.bannerUrl.trim() : "";
    const createdById =
      typeof thread.createdById === "string" && thread.createdById.trim()
        ? thread.createdById.trim()
        : memberIds[0] ?? "";
    const createdAt = normalizeNumber(thread.createdAt, Date.now());
    const updatedAt = normalizeNumber(thread.updatedAt, createdAt);
    const readByRaw = asRecord(thread.readBy) ?? {};
    const pinnedByRaw = asRecord(thread.pinnedBy) ?? {};
    const readBy: Record<string, number> = {};
    const pinnedBy: Record<string, boolean> = {};

    for (const [memberId, readAt] of Object.entries(readByRaw)) {
      readBy[memberId] = normalizeNumber(readAt, 0);
    }
    for (const [memberId, pinned] of Object.entries(pinnedByRaw)) {
      pinnedBy[memberId] = pinned === true;
    }

    byId.set(id, {
      id,
      memberIds: [...new Set(memberIds)],
      threadType,
      title,
      avatarUrl,
      bannerUrl,
      createdById,
      createdAt,
      updatedAt,
      readBy,
      pinnedBy,
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
    const createdAt = normalizeNumber(message.createdAt, Date.now());

    if (!id || !chatId || !authorId || (!text.trim() && attachments.length === 0)) {
      continue;
    }

    byId.set(id, {
      id,
      chatId,
      authorId,
      text,
      attachments,
      createdAt,
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

  try {
    const raw = await fs.readFile(STORE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeStore(parsed);
  } catch {
    return {
      ...EMPTY_STORE,
    };
  }
}

async function writeStoreFile(store: StoreData): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
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
            resolve(result);
            return;
          }

          const store = await readStoreFile();
          const result = await updater(store);
          await writeStoreFile(store);
          resolve(result);
        } catch (error) {
          reject(error);
          throw error;
        }
      });
  });
}
