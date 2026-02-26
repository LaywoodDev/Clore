type SupportedLanguage = "en" | "ru";

type KnowledgeEntry = {
  id: string;
  title: string;
  tags: string[];
  content: string;
};

type BuildKnowledgeContextOptions = {
  query: string;
  language: SupportedLanguage;
  maxSections?: number;
  maxChars?: number;
};

type BuildResponseGuidanceOptions = {
  query: string;
  language: SupportedLanguage;
};

const KNOWLEDGE_BASE_VERSION = "2026-02-26";
const DEFAULT_MAX_SECTIONS = 4;
const DEFAULT_MAX_CHARS = 2_600;
const DEFAULT_ENTRY_IDS = [
  "app-overview",
  "ui-navigation-basics",
  "messenger-data-model",
  "assistant-routing",
] as const;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "help",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "the",
  "to",
  "use",
  "what",
  "with",
  "you",
  "и",
  "в",
  "во",
  "на",
  "по",
  "к",
  "ко",
  "о",
  "об",
  "как",
  "что",
  "это",
  "этот",
  "эта",
  "эти",
  "или",
  "а",
  "но",
  "не",
  "мне",
  "меня",
  "мой",
  "моя",
  "мою",
  "нужно",
  "можно",
  "пожалуйста",
  "покажи",
  "скажи",
  "объясни",
]);

const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: "app-overview",
    title: "Product and stack overview",
    tags: ["clore", "messenger", "nextjs", "app-router", "react", "typescript"],
    content:
      "Clore is a team messenger built on Next.js App Router + React + TypeScript. The main UI lives in components/web-messenger.tsx and is mounted from app/page.tsx via components/auth-gate.tsx.",
  },
  {
    id: "ui-navigation-basics",
    title: "Interface navigation basics",
    tags: [
      "ui",
      "interface",
      "navigation",
      "tabs",
      "settings",
      "навигация",
      "интерфейс",
      "настройки",
      "вкладки",
    ],
    content:
      "Main sections are Home, AI, Profile, Settings. Desktop uses the left sidebar for these tabs. Mobile uses bottom navigation tabs with the same sections.",
  },
  {
    id: "ui-delete-chat-flow",
    title: "How to delete a chat",
    tags: [
      "delete",
      "delete chat",
      "remove chat",
      "delete group",
      "delete for both",
      "удалить",
      "удалить чат",
      "удалить группу",
      "чаты",
      "пошагово",
    ],
    content:
      "Desktop (chat header): open the chat, click three-dot Menu in header, choose Delete chat (or Delete group), confirm in dialog. Desktop (chat list): right-click chat item, choose Delete for both / Delete group, confirm. Mobile: open chat, tap three-dot Menu, choose Delete chat, confirm. After delete, app shows an Undo toast for a few seconds.",
  },
  {
    id: "ui-global-wallpaper-flow",
    title: "How to change default chat wallpaper",
    tags: [
      "wallpaper",
      "chat wallpaper",
      "appearance",
      "settings",
      "обои",
      "обои чата",
      "оформление",
      "настройки",
      "фон чата",
    ],
    content:
      "Path: Settings -> Appearance -> Chat wallpaper. Choose one option: None, Color Bends, Pixel Blast, Plasma, or Dither. This changes default wallpaper for chats globally.",
  },
  {
    id: "ui-chat-wallpaper-flow",
    title: "How to change wallpaper for one chat",
    tags: [
      "personalization",
      "chat personalization",
      "per chat wallpaper",
      "inherit global",
      "персонализация",
      "обои чата",
      "для этого чата",
      "наследовать",
    ],
    content:
      "Open target chat -> three-dot Menu -> Personalization -> Chat wallpaper. Pick Inherit global to use global wallpaper or choose a specific wallpaper for only this chat.",
  },
  {
    id: "auth-and-session",
    title: "Auth and session model",
    tags: ["auth", "login", "register", "profile", "privacy", "session"],
    content:
      "Auth is API-driven with localStorage session key clore_auth_session_v1 on the client. Core auth routes: /api/auth/login, /api/auth/register, /api/auth/user, /api/auth/profile, /api/auth/privacy, /api/auth/block, /api/auth/import.",
  },
  {
    id: "messenger-data-model",
    title: "Store and data model",
    tags: ["store", "database", "postgres", "json", "threads", "messages", "users"],
    content:
      "Server state is centralized in lib/server/store.ts. It supports Postgres when DATABASE_URL is set, otherwise file storage in data/clore-store.json with backup and write queue. Main entities: users, threads (direct/group), messages, callSignals, moderationReports, moderationAuditLogs, userSanctions.",
  },
  {
    id: "messenger-sync",
    title: "Realtime and synchronization",
    tags: ["realtime", "sse", "events", "sync", "polling"],
    content:
      "Realtime updates use SSE endpoint /api/messenger/events with store-update events and heartbeat ping. Client hook components/messenger/use-realtime-sync.ts combines SSE with periodic fallback polling to keep chats consistent.",
  },
  {
    id: "messaging-features",
    title: "Messaging capabilities",
    tags: ["send", "edit", "delete", "reply", "forward", "favorites", "groups"],
    content:
      "Messaging API supports sending, editing, deleting, read receipts, typing status, pin/mute, favorites chat (__favorites__), group creation and group member management. Core route for send is /api/messenger/send.",
  },
  {
    id: "assistant-routing",
    title: "AI assistant route behavior",
    tags: ["ai", "assistant", "api", "chat", "commands", "automation"],
    content:
      "Primary AI endpoint is /api/ai/chat. It validates userId, normalizes conversation, detects command-like intents, can auto-execute send, delete, create-group, and invite-to-group actions in messenger context, and falls back to model-generated reply when no action is triggered. Automation commands run only when agent mode is enabled by client flag.",
  },
  {
    id: "bot-direct-chat",
    title: "Bot in direct dialogs",
    tags: ["bot", "chatgpt", "direct", "auto-reply"],
    content:
      "A built-in bot user exists in store: id bot-chatgpt, username chatgpt. In /api/messenger/send, direct messages to the bot trigger auto-replies generated through the configured AI provider.",
  },
  {
    id: "admin-moderation",
    title: "Admin and moderation",
    tags: ["admin", "moderation", "reports", "mute", "ban", "audit"],
    content:
      "Admin identity is based on username match with lib/shared/admin.ts constant. Admin APIs: /api/admin/dashboard, /api/admin/moderation, /api/admin/users. Moderation supports report resolution, message deletion, mute/ban sanctions, and audit logs.",
  },
  {
    id: "privacy-and-permissions",
    title: "Privacy and permission rules",
    tags: ["privacy", "visibility", "blocked", "permissions", "sanctions"],
    content:
      "User profile fields and actions are filtered by visibility modes everyone/selected/nobody and allowlists. Messaging and read access are restricted by active sanctions and block relationships.",
  },
  {
    id: "ai-provider-config",
    title: "AI provider configuration",
    tags: ["proxyapi", "openai", "api-key", "model", "base-url", "env"],
    content:
      "AI config is resolved in lib/server/ai-provider.ts. Key env vars: PROXYAPI_API_KEY or OPENAI_API_KEY, optional CLORE_BOT_BASE_URL and CLORE_BOT_MODEL. /api/ai/chat builds model candidates and supports search-enabled model fallback.",
  },
];

const ENTRY_INDEX = KNOWLEDGE_ENTRIES.map((entry) => ({
  entry,
  tokens: new Set<string>([
    ...tokenize(entry.title),
    ...tokenize(entry.content),
    ...entry.tags.flatMap((tag) => tokenize(tag)),
  ]),
}));

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function tokenize(value: string): string[] {
  if (!value) {
    return [];
  }
  return normalizeForSearch(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 2 && !STOP_WORDS.has(token)
    );
}

function scoreEntry(tokens: Set<string>, queryTokens: string[]): number {
  let score = 0;
  for (const token of queryTokens) {
    if (tokens.has(token)) {
      score += token.length >= 5 ? 3 : 2;
      continue;
    }
    if (token.length >= 5) {
      for (const candidate of tokens) {
        if (candidate.startsWith(token) || token.startsWith(candidate)) {
          score += 1;
          break;
        }
      }
    }
  }
  return score;
}

function getDefaultEntries(maxSections: number): KnowledgeEntry[] {
  const defaults: KnowledgeEntry[] = [];
  for (const id of DEFAULT_ENTRY_IDS) {
    const found = KNOWLEDGE_ENTRIES.find((entry) => entry.id === id);
    if (found) {
      defaults.push(found);
    }
    if (defaults.length >= maxSections) {
      break;
    }
  }
  if (defaults.length >= maxSections) {
    return defaults;
  }
  for (const entry of KNOWLEDGE_ENTRIES) {
    if (defaults.some((candidate) => candidate.id === entry.id)) {
      continue;
    }
    defaults.push(entry);
    if (defaults.length >= maxSections) {
      break;
    }
  }
  return defaults;
}

function selectEntries(query: string, maxSections: number): KnowledgeEntry[] {
  const queryTokens = tokenize(query).slice(0, 20);
  if (queryTokens.length === 0) {
    return getDefaultEntries(maxSections);
  }

  const ranked = ENTRY_INDEX.map(({ entry, tokens }) => ({
    entry,
    score: scoreEntry(tokens, queryTokens),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    return getDefaultEntries(maxSections);
  }

  const selected = ranked.slice(0, maxSections).map((item) => item.entry);
  if (selected.length >= maxSections) {
    return selected;
  }

  for (const fallback of getDefaultEntries(maxSections)) {
    if (selected.some((entry) => entry.id === fallback.id)) {
      continue;
    }
    selected.push(fallback);
    if (selected.length >= maxSections) {
      break;
    }
  }
  return selected;
}

function buildIntro(language: SupportedLanguage): string {
  if (language === "ru") {
    return "Используйте эту внутреннюю базу знаний Clore, когда пользователь спрашивает про интерфейс, поведение приложения, функции или API.";
  }
  return "Use this internal Clore app knowledge base when user asks about product behavior or app internals.";
}

const UI_HOW_TO_QUERY_REGEX =
  /(how|steps?|where|click|tap|open|delete|remove|wallpaper|settings?|guide|tutorial|walkthrough|как|пошаг|шаги?|где|нажм|открой|удал|обои|настройк|оформлен|инструкц|объясни|чат)/iu;

export function buildAiResponseGuidance({
  query,
  language,
}: BuildResponseGuidanceOptions): string {
  const isUiHowTo = UI_HOW_TO_QUERY_REGEX.test(query);

  if (language === "ru") {
    if (isUiHowTo) {
      return [
        "Для вопросов по интерфейсу Clore отвечайте строго пошагово.",
        "Формат: 1, 2, 3... без длинных вводных.",
        "Используйте точные названия из интерфейса (например: Settings -> Appearance -> Chat wallpaper, Menu -> Delete chat).",
        "Если путь отличается на desktop и mobile, дайте оба варианта отдельными блоками.",
        "Если действие требует подтверждения или доступна отмена, явно укажите это отдельным шагом.",
      ].join(" ");
    }
    return "Для вопросов о Clore используйте только подтвержденные факты из внутренней базы знаний. Не придумывайте отсутствующие кнопки, экраны или API.";
  }

  if (isUiHowTo) {
    return [
      "For Clore interface how-to questions, answer in explicit numbered steps.",
      "Use exact in-app labels when known.",
      "If desktop and mobile flows differ, provide both.",
      "Call out confirmation dialogs and undo windows when applicable.",
    ].join(" ");
  }

  return "For Clore app questions, rely on internal knowledge context and avoid inventing UI controls or API behavior.";
}

export function buildAiKnowledgeContext({
  query,
  language,
  maxSections = DEFAULT_MAX_SECTIONS,
  maxChars = DEFAULT_MAX_CHARS,
}: BuildKnowledgeContextOptions): string {
  const normalizedMaxSections = Math.max(1, Math.min(8, Math.trunc(maxSections)));
  const normalizedMaxChars = Math.max(500, Math.min(8_000, Math.trunc(maxChars)));
  const selectedEntries = selectEntries(query, normalizedMaxSections);

  const header = `${buildIntro(language)}\nKnowledge version: ${KNOWLEDGE_BASE_VERSION}`;
  const body = selectedEntries
    .map(
      (entry, index) =>
        `[${index + 1}] ${entry.title}\n${entry.content}\nTags: ${entry.tags.join(", ")}`
    )
    .join("\n\n");

  const context = `${header}\n\n${body}`.trim();
  if (context.length <= normalizedMaxChars) {
    return context;
  }

  return `${context.slice(0, normalizedMaxChars).trimEnd()}\n...`;
}
