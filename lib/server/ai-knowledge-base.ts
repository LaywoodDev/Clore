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

const KNOWLEDGE_BASE_VERSION = "2026-02-28-smart-retrieval";
const DEFAULT_MAX_SECTIONS = 7;
const DEFAULT_MAX_CHARS = 5_800;
const DEFAULT_ENTRY_IDS = [
  "app-overview",
  "ui-navigation-basics",
  "ui-home-layout",
  "ui-settings-map",
  "ui-ai-assistant-screen",
  "assistant-routing",
] as const;
const UI_PRIORITY_ENTRY_IDS = [
  "ui-navigation-basics",
  "ui-home-layout",
  "ui-chat-header-actions",
  "ui-chat-search-flow",
  "ui-chat-personalization",
  "ui-profile-screen",
  "ui-settings-map",
  "ui-ai-assistant-screen",
  "ui-group-settings",
] as const;
const API_PRIORITY_ENTRY_IDS = [
  "assistant-routing",
  "ai-provider-config",
  "auth-and-session",
  "messenger-data-model",
  "messenger-sync",
  "messaging-features",
] as const;
const TROUBLESHOOTING_PRIORITY_ENTRY_IDS = [
  "messenger-sync",
  "privacy-and-permissions",
  "auth-and-session",
  "assistant-routing",
  "ai-provider-config",
  "messenger-data-model",
] as const;
const PERMISSION_PRIORITY_ENTRY_IDS = [
  "privacy-and-permissions",
  "ui-privacy-settings-details",
  "ui-group-settings",
  "admin-moderation",
  "auth-and-session",
] as const;
const COMPARISON_PRIORITY_ENTRY_IDS = [
  "ui-chat-personalization",
  "ui-appearance-customization",
  "ui-settings-map",
  "ui-group-settings",
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
  "\u0438",
  "\u0432",
  "\u0432\u043e",
  "\u043d\u0430",
  "\u043f\u043e",
  "\u043a",
  "\u043a\u043e",
  "\u043e",
  "\u043e\u0431",
  "\u043a\u0430\u043a",
  "\u0447\u0442\u043e",
  "\u044d\u0442\u043e",
  "\u044d\u0442\u043e\u0442",
  "\u044d\u0442\u0430",
  "\u044d\u0442\u0438",
  "\u0438\u043b\u0438",
  "\u0430",
  "\u043d\u043e",
  "\u043d\u0435",
  "\u043c\u043d\u0435",
  "\u043c\u0435\u043d\u044f",
  "\u043c\u043e\u0439",
  "\u043c\u043e\u044f",
  "\u043c\u043e\u044e",
  "\u043d\u0443\u0436\u043d\u043e",
  "\u043c\u043e\u0436\u043d\u043e",
  "\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430",
  "\u043f\u043e\u043a\u0430\u0436\u0438",
  "\u0441\u043a\u0430\u0436\u0438",
  "\u043e\u0431\u044a\u044f\u0441\u043d\u0438",
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
    id: "ui-home-layout",
    title: "Home screen layout and discovery",
    tags: [
      "home",
      "chat list",
      "search",
      "public groups",
      "new group",
      "sidebar",
      "discover",
      "\u0433\u043b\u0430\u0432\u043d\u0430\u044f",
      "\u0447\u0430\u0442\u044b",
      "\u043f\u043e\u0438\u0441\u043a",
      "\u043f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0435 \u0433\u0440\u0443\u043f\u043f\u044b",
      "\u043d\u043e\u0432\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430",
    ],
    content:
      "Home is the main messenger workspace. Desktop shows a left chat list and the active conversation pane. The list has global search, can surface chats, users, and public groups, and includes the New group flow. Global search placeholder is Search across messenger and supports filters like from:@username, has:attachment|image|video|audio|file, on:YYYY-MM-DD, before:YYYY-MM-DD, after:YYYY-MM-DD. Right-clicking a chat exposes Pin/Unpin, Mute/Unmute, Delete chat/Delete group/Delete channel, or Leave group/Unsubscribe when the user is not the owner. On mobile, Home switches between list and chat views instead of showing both columns at once.",
  },
  {
    id: "ui-chat-header-actions",
    title: "Open chat header actions",
    tags: [
      "chat header",
      "search in chat",
      "call",
      "chat profile",
      "menu",
      "clear history",
      "personalization",
      "\u043c\u0435\u043d\u044e",
      "\u043f\u043e\u0438\u0441\u043a \u0432 \u0447\u0430\u0442\u0435",
      "\u0437\u0432\u043e\u043d\u043e\u043a",
      "\u043f\u0440\u043e\u0444\u0438\u043b\u044c \u0447\u0430\u0442\u0430",
      "\u043e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0438\u0441\u0442\u043e\u0440\u0438\u044e",
    ],
    content:
      "When a chat is open, the header shows Search in chat, Call/End call, Chat profile (desktop), and a three-dot Menu. The Menu contains Personalization, Clear history for me, and Delete chat (or Delete favorites in Saved messages). Clicking the header itself opens the current chat profile.",
  },
  {
    id: "ui-chat-search-flow",
    title: "Search inside a chat",
    tags: [
      "search",
      "search in chat",
      "jump to date",
      "date",
      "filter",
      "messages",
      "\u043f\u043e\u0438\u0441\u043a",
      "\u043f\u043e\u0438\u0441\u043a \u0432 \u0447\u0430\u0442\u0435",
      "\u043f\u0435\u0440\u0435\u0439\u0442\u0438 \u043a \u0434\u0430\u0442\u0435",
      "\u0434\u0430\u0442\u0430",
    ],
    content:
      "Search in chat opens a top filter bar inside the conversation. It includes a text field plus a Date button that opens a Jump to date calendar. Users can pick a date to jump to messages from that day, clear the date, or close the search bar to reset the active in-chat search query.",
  },
  {
    id: "ui-message-actions",
    title: "Message actions and quick tools",
    tags: [
      "message",
      "reply",
      "edit",
      "delete message",
      "forward",
      "favorites",
      "copy",
      "\u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      "\u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c",
      "\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c",
      "\u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      "\u043f\u0435\u0440\u0435\u0441\u043b\u0430\u0442\u044c",
      "\u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435",
    ],
    content:
      "Message-level actions in chats include Copy, Reply, Edit, Delete message, Forward, Save to favorites, Remove from favorites, Copy attachment link, and Read by / message views where applicable. The composer supports formatting tools, attachments, voice messages, Enter to send, and Shift+Enter for a new line.",
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
      "Path: Settings -> Appearance -> Chat wallpaper. Choose one option: None, Color Bends, Pixel Blast, Plasma, Dither, or Gradient Blinds. This changes default wallpaper for chats globally.",
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
      "Open target chat -> three-dot Menu -> Personalization -> Chat wallpaper. Pick Inherit global to use global wallpaper or choose a specific wallpaper for only this chat. Available per-chat wallpaper choices are Inherit global, None, Color Bends, Pixel Blast, Plasma, Dither, and Gradient Blinds.",
  },
  {
    id: "ui-chat-personalization",
    title: "Chat personalization dialog",
    tags: [
      "chat personalization",
      "mute this chat",
      "chat font size",
      "auto-load media",
      "per chat settings",
      "\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u0447\u0430\u0442\u0430",
      "\u0437\u0430\u0433\u043b\u0443\u0448\u0438\u0442\u044c \u0447\u0430\u0442",
      "\u0440\u0430\u0437\u043c\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430 \u0447\u0430\u0442\u0430",
      "\u0430\u0432\u0442\u043e\u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043c\u0435\u0434\u0438\u0430",
    ],
    content:
      "Open chat -> Menu -> Personalization opens a chat-specific settings dialog. It contains Mute this chat, Chat wallpaper, Chat font size, and Auto-load media. Chat wallpaper and Chat font size both support Inherit global, so users can either follow global settings or override only the current chat.",
  },
  {
    id: "ui-profile-screen",
    title: "Profile and chat profile panels",
    tags: [
      "profile",
      "edit profile",
      "chat profile",
      "avatar",
      "banner",
      "favorites",
      "\u043f\u0440\u043e\u0444\u0438\u043b\u044c",
      "\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c",
      "\u0430\u0432\u0430\u0442\u0430\u0440",
      "\u0431\u0430\u043d\u043d\u0435\u0440",
    ],
    content:
      "Profile is shown in the Profile tab and also as a compact Chat profile panel from an open conversation. The profile UI displays banner, avatar, name, username, bio, birthday, and media/audio/links activity tabs when viewing another user. For the current user, the main actions are Edit profile, Favorites, and Share contact. Editing allows changing avatar, banner, name, username, bio, and birthday fields.",
  },
  {
    id: "ui-settings-map",
    title: "Settings screen map",
    tags: [
      "settings",
      "privacy",
      "security",
      "appearance",
      "language",
      "theme",
      "sound",
      "\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
      "\u043f\u0440\u0438\u0432\u0430\u0442\u043d\u043e\u0441\u0442\u044c",
      "\u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c",
      "\u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435",
      "\u044f\u0437\u044b\u043a",
      "\u0442\u0435\u043c\u0430",
    ],
    content:
      "Settings is split into three top sections: Privacy, Security, and Appearance. Privacy controls visibility for last seen, avatar, bio, birthday, who can add to groups, who can call, and who can forward messages, each with Everyone / Selected people / Nobody. Security includes Push notifications, account info, app version, and Log out. Appearance includes Language, Theme, UI density, Corner radius, Font size, Font family, global Chat wallpaper, Message sound, Send sound, and a desktop-only Sidebar visibility toggle.",
  },
  {
    id: "ui-ai-assistant-screen",
    title: "AI assistant screen controls",
    tags: [
      "ai",
      "assistant",
      "search mode",
      "agent mode",
      "clear chat",
      "chatgpt",
      "\u0438\u0438",
      "\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442",
      "\u043f\u043e\u0438\u0441\u043a",
      "\u0430\u0433\u0435\u043d\u0442",
      "\u043e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0447\u0430\u0442",
    ],
    content:
      "The AI tab is a dedicated ChatGPT conversation screen. It has a Search toggle for web-enabled answers, an Agent toggle for messenger actions, a Clear chat button, a multiline input, and a Send button. Pressing Enter sends the prompt and Shift+Enter inserts a new line. Enabling Agent opens a warning dialog because Agent can execute messenger actions such as send, delete, create groups, invite/remove members, update groups, and change roles.",
  },
  {
    id: "ui-onboarding",
    title: "First-run personalization onboarding",
    tags: ["onboarding", "personalize your messenger", "defaults", "first run"],
    content:
      "New users can see a Personalize your messenger dialog. It lets them choose Language, Theme, UI density, and Message sound before pressing Apply. The same choices can be changed later from Settings.",
  },
  {
    id: "ui-new-group-flow",
    title: "Create group and channel flows",
    tags: [
      "new group",
      "create group",
      "create channel",
      "group members",
      "group name",
      "channel name",
      "\u043d\u043e\u0432\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430",
      "\u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0433\u0440\u0443\u043f\u043f\u0443",
      "\u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0430\u043d\u0430\u043b",
    ],
    content:
      "Users start from New group in Home. Group creation is a two-step flow: first choose members, then review Group name and create. Channel creation uses a single details step with Channel name plus Username for a public link. Group member selection uses chat/user search, and the creator is always included automatically.",
  },
  {
    id: "ui-favorites-and-forwarding",
    title: "Saved messages, favorites, and forwarding",
    tags: [
      "favorites",
      "saved messages",
      "forward",
      "share contact",
      "open original chat",
      "\u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435",
      "\u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043d\u044b\u0435",
      "\u043f\u0435\u0440\u0435\u0441\u043b\u0430\u0442\u044c",
      "\u043f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043e\u043c",
    ],
    content:
      "Clore has a dedicated Favorites / Saved messages chat. Messages can be saved there from message actions. Forwarding opens a Forward message dialog with Select chats to forward. Saved items can later be removed from favorites, opened in the original chat, or the entire favorites chat can be deleted separately.",
  },
  {
    id: "ui-calls-and-voice",
    title: "Calls and voice message controls",
    tags: [
      "call",
      "audio call",
      "incoming call",
      "voice message",
      "recording",
      "microphone",
      "\u0437\u0432\u043e\u043d\u043e\u043a",
      "\u0433\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      "\u0437\u0430\u043f\u0438\u0441\u044c",
      "\u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d",
    ],
    content:
      "Open chat header includes a Call button. During calls, the UI can show Accept, Decline, End call, Mute mic, Mute sound, Share screen, Stop sharing, Open fullscreen, and Exit fullscreen. Separate voice message controls in the composer include Start recording, Stop recording, and Cancel recording. Audio calls are available only in direct chats.",
  },
  {
    id: "ui-privacy-settings-details",
    title: "Privacy settings details",
    tags: [
      "privacy",
      "last seen",
      "avatar visibility",
      "bio visibility",
      "birthday visibility",
      "call visibility",
      "forward visibility",
      "group add visibility",
      "\u043f\u0440\u0438\u0432\u0430\u0442\u043d\u043e\u0441\u0442\u044c",
      "\u0431\u044b\u043b \u0432 \u0441\u0435\u0442\u0438",
      "\u043a\u0442\u043e \u043c\u043e\u0436\u0435\u0442 \u0437\u0432\u043e\u043d\u0438\u0442\u044c",
    ],
    content:
      "Settings -> Privacy exposes per-field visibility controls for last seen, avatar, bio, birthday, group invites, calls, and message forwarding. Each field uses Everyone, Selected people, or Nobody. When Selected people is chosen, the UI opens a picker so the user can define an allowlist for that specific field.",
  },
  {
    id: "ui-appearance-customization",
    title: "Appearance customization details",
    tags: [
      "appearance",
      "language",
      "theme",
      "ui density",
      "corner radius",
      "font size",
      "font family",
      "sidebar",
      "\u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435",
      "\u043f\u043b\u043e\u0442\u043d\u043e\u0441\u0442\u044c \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
      "\u0440\u0430\u0434\u0438\u0443\u0441 \u0443\u0433\u043b\u043e\u0432",
      "\u0448\u0440\u0438\u0444\u0442",
    ],
    content:
      "Settings -> Appearance lets users adjust Language, Theme, UI density (Comfortable or Compact), Corner radius (Sharp, Normal, Rounded), Font size (Small, Default, Large), and Font family (Default, Modern, Readable, Comfortaa). It also controls global Chat wallpaper, Message sound, Send sound, and on desktop the Sidebar visibility switch.",
  },
  {
    id: "ui-group-settings",
    title: "Group and channel management screens",
    tags: [
      "group settings",
      "channel settings",
      "permissions",
      "invite link",
      "group type",
      "members",
      "\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0433\u0440\u0443\u043f\u043f\u044b",
      "\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043a\u0430\u043d\u0430\u043b\u0430",
      "\u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u044f",
      "\u0441\u0441\u044b\u043b\u043a\u0430-\u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435",
      "\u0442\u0438\u043f \u0433\u0440\u0443\u043f\u043f\u044b",
    ],
    content:
      "For groups and channels, the profile panel can open Group settings or Channel settings. The settings modal lets managers edit avatar, banner, name, and description, then open Type and Permissions. Type can switch between private and public access, manage the public @username or invite link, and toggle Restrict copying. Permissions lists participants with role badges and action menus for Make admin, Remove admin, Transfer ownership, and Remove member. Groups also have an Invitations dialog where private invite links can use limits such as Unlimited, One-time, 5 uses, or a custom number, and new members can be added from search.",
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
  titleTokens: new Set<string>(tokenize(entry.title)),
  contentTokens: new Set<string>(tokenize(entry.content)),
  tagTokens: new Set<string>(entry.tags.flatMap((tag) => tokenize(tag))),
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

function scoreTokenSet(
  tokens: Set<string>,
  token: string,
  exactScore: number,
  fuzzyScore: number
): number {
  if (tokens.has(token)) {
    return exactScore;
  }
  if (token.length < 5) {
    return 0;
  }
  for (const candidate of tokens) {
    if (candidate.startsWith(token) || token.startsWith(candidate)) {
      return fuzzyScore;
    }
  }
  return 0;
}

function hasPriorityEntry(entry: KnowledgeEntry, ids: readonly string[]): boolean {
  return ids.includes(entry.id);
}

function isUiEntry(entry: KnowledgeEntry): boolean {
  return entry.id.startsWith("ui-");
}

function getEntriesByIds(ids: readonly string[]): KnowledgeEntry[] {
  const result: KnowledgeEntry[] = [];
  for (const id of ids) {
    const entry = KNOWLEDGE_ENTRIES.find((candidate) => candidate.id === id);
    if (entry) {
      result.push(entry);
    }
  }
  return result;
}

function appendUniqueEntries(
  target: KnowledgeEntry[],
  additions: Iterable<KnowledgeEntry>,
  maxSections: number
): void {
  for (const entry of additions) {
    if (target.some((candidate) => candidate.id === entry.id)) {
      continue;
    }
    target.push(entry);
    if (target.length >= maxSections) {
      break;
    }
  }
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

function getUiDefaultEntries(maxSections: number): KnowledgeEntry[] {
  const defaults: KnowledgeEntry[] = [];
  appendUniqueEntries(defaults, getEntriesByIds(UI_PRIORITY_ENTRY_IDS), maxSections);
  if (defaults.length < maxSections) {
    appendUniqueEntries(defaults, getDefaultEntries(maxSections), maxSections);
  }
  if (defaults.length < maxSections) {
    appendUniqueEntries(
      defaults,
      KNOWLEDGE_ENTRIES.filter((entry) => isUiEntry(entry)),
      maxSections
    );
  }
  return defaults;
}

const UI_QUERY_REGEX =
  /(ui|interface|screen|layout|flow|menu|button|tab|profile|settings?|home|chat|message|group|channel|call|search|wallpaper|personalization|privacy|appearance|assistant|agent|onboarding|\u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441|\u044d\u043a\u0440\u0430\u043d|\u043c\u0435\u043d\u044e|\u043a\u043d\u043e\u043f\u043a|\u0432\u043a\u043b\u0430\u0434\u043a|\u043f\u0440\u043e\u0444\u0438\u043b|\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a|\u0447\u0430\u0442|\u0441\u043e\u043e\u0431\u0449\u0435\u043d|\u0433\u0440\u0443\u043f\u043f|\u043a\u0430\u043d\u0430\u043b|\u0437\u0432\u043e\u043d|\u043f\u043e\u0438\u0441\u043a|\u043e\u0431\u043e\u0438|\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u0438\u0437|\u043f\u0440\u0438\u0432\u0430\u0442\u043d|\u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d|\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442|\u0430\u0433\u0435\u043d\u0442)/iu;
const API_QUERY_REGEX =
  /(api|endpoint|route|request|response|payload|server|backend|auth|session|model|provider|env|database|store|sse|\u0430\u043f\u0438|\u044d\u043d\u0434\u043f\u043e\u0438\u043d\u0442|\u043c\u0430\u0440\u0448\u0440\u0443\u0442|\u0437\u0430\u043f\u0440\u043e\u0441|\u043e\u0442\u0432\u0435\u0442|\u0441\u0435\u0440\u0432\u0435\u0440|\u0431\u044d\u043a\u0435\u043d\u0434|\u0430\u0432\u0442\u043e\u0440\u0438\u0437|\u0441\u0435\u0441\u0441\u0438|\u0431\u0430\u0437\u0430|\u0445\u0440\u0430\u043d\u0438\u043b\u0438\u0449|\u0445\u0440\u0430\u043d\u0435\u043d|\u0441\u0438\u043d\u0445\u0440\u043e\u043d|\u0441\u043e\u0431\u044b\u0442)/iu;
const TROUBLESHOOTING_QUERY_REGEX =
  /(bug|issue|problem|broken|fail|fails|failed|error|errors|not working|stuck|missing|why|can't|cannot|debug|fix|\u0431\u0430\u0433|\u043e\u0448\u0438\u0431|\u043f\u0440\u043e\u0431\u043b\u0435\u043c|\u043d\u0435 \u0440\u0430\u0431\u043e\u0442|\u043d\u0435\u0442|\u043d\u0435 \u043c\u043e\u0433\u0443|\u043d\u0435 \u043f\u043e\u043b\u0443\u0447|\u043f\u043e\u0447\u0435\u043c\u0443|\u0437\u0430\u0432\u0438\u0441|\u0441\u043b\u043e\u043c\u0430\u043b|\u043f\u043e\u0447\u0438\u043d\u0438|\u0438\u0441\u043f\u0440\u0430\u0432)/iu;
const PERMISSION_QUERY_REGEX =
  /(permission|permissions|privacy|allow|allowed|deny|denied|blocked|block|ban|banned|mute|muted|who can|visibility|\u043f\u0440\u0430\u0432|\u0434\u043e\u0441\u0442\u0443\u043f|\u0440\u0430\u0437\u0440\u0435\u0448|\u0437\u0430\u043f\u0440\u0435\u0442|\u0431\u043b\u043e\u043a|\u0431\u0430\u043d|\u043c\u0443\u0442|\u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442|\u043a\u0442\u043e \u043c\u043e\u0436\u0435\u0442)/iu;
const COMPARISON_QUERY_REGEX =
  /(difference|compare|comparison|vs\b|better|best|which|choose|trade-?off|\u0440\u0430\u0437\u043d\u0438\u0446|\u0441\u0440\u0430\u0432\u043d|\u043b\u0443\u0447\u0448\u0435|\u0447\u0442\u043e \u0432\u044b\u0431\u0440\u0430\u0442\u044c|\u043a\u0430\u043a\u043e\u0439 \u043b\u0443\u0447\u0448\u0435)/iu;

function isUiQuery(query: string): boolean {
  return UI_QUERY_REGEX.test(query);
}

function isApiQuery(query: string): boolean {
  return API_QUERY_REGEX.test(query);
}

function isTroubleshootingQuery(query: string): boolean {
  return TROUBLESHOOTING_QUERY_REGEX.test(query);
}

function isPermissionQuery(query: string): boolean {
  return PERMISSION_QUERY_REGEX.test(query);
}

function isComparisonQuery(query: string): boolean {
  return COMPARISON_QUERY_REGEX.test(query);
}

function scoreEntry(
  index: (typeof ENTRY_INDEX)[number],
  queryTokens: string[],
  query: string
): number {
  let score = 0;
  for (const token of queryTokens) {
    score += scoreTokenSet(
      index.tagTokens,
      token,
      token.length >= 5 ? 5 : 4,
      2
    );
    score += scoreTokenSet(
      index.titleTokens,
      token,
      token.length >= 5 ? 4 : 3,
      2
    );
    score += scoreTokenSet(
      index.contentTokens,
      token,
      token.length >= 5 ? 2 : 1,
      1
    );
  }

  if (isUiQuery(query) && isUiEntry(index.entry)) {
    score += 3;
  }
  if (isApiQuery(query) && hasPriorityEntry(index.entry, API_PRIORITY_ENTRY_IDS)) {
    score += 4;
  }
  if (
    isTroubleshootingQuery(query) &&
    hasPriorityEntry(index.entry, TROUBLESHOOTING_PRIORITY_ENTRY_IDS)
  ) {
    score += 4;
  }
  if (
    isPermissionQuery(query) &&
    hasPriorityEntry(index.entry, PERMISSION_PRIORITY_ENTRY_IDS)
  ) {
    score += 4;
  }
  if (
    isComparisonQuery(query) &&
    hasPriorityEntry(index.entry, COMPARISON_PRIORITY_ENTRY_IDS)
  ) {
    score += 2;
  }

  return score;
}

function getCategoryDefaultEntries(query: string, maxSections: number): KnowledgeEntry[] {
  const defaults: KnowledgeEntry[] = [];

  if (isUiQuery(query)) {
    appendUniqueEntries(defaults, getEntriesByIds(UI_PRIORITY_ENTRY_IDS), maxSections);
  }
  if (isApiQuery(query)) {
    appendUniqueEntries(defaults, getEntriesByIds(API_PRIORITY_ENTRY_IDS), maxSections);
  }
  if (isTroubleshootingQuery(query)) {
    appendUniqueEntries(
      defaults,
      getEntriesByIds(TROUBLESHOOTING_PRIORITY_ENTRY_IDS),
      maxSections
    );
  }
  if (isPermissionQuery(query)) {
    appendUniqueEntries(
      defaults,
      getEntriesByIds(PERMISSION_PRIORITY_ENTRY_IDS),
      maxSections
    );
  }
  if (isComparisonQuery(query)) {
    appendUniqueEntries(
      defaults,
      getEntriesByIds(COMPARISON_PRIORITY_ENTRY_IDS),
      maxSections
    );
  }
  if (defaults.length < maxSections) {
    appendUniqueEntries(defaults, getDefaultEntries(maxSections), maxSections);
  }

  return defaults;
}

function selectEntries(query: string, maxSections: number): KnowledgeEntry[] {
  const queryTokens = tokenize(query).slice(0, 20);
  const uiQuery = isUiQuery(query);
  if (queryTokens.length === 0) {
    return uiQuery
      ? getUiDefaultEntries(maxSections)
      : getCategoryDefaultEntries(query, maxSections);
  }

  const ranked = ENTRY_INDEX.map((index) => ({
    entry: index.entry,
    score: scoreEntry(index, queryTokens, query),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (uiQuery && isUiEntry(left.entry) !== isUiEntry(right.entry)) {
        return isUiEntry(left.entry) ? -1 : 1;
      }
      return 0;
    });

  if (ranked.length === 0) {
    return uiQuery
      ? getUiDefaultEntries(maxSections)
      : getCategoryDefaultEntries(query, maxSections);
  }

  if (uiQuery) {
    const selected: KnowledgeEntry[] = [];
    appendUniqueEntries(
      selected,
      ranked.filter((item) => isUiEntry(item.entry)).map((item) => item.entry),
      maxSections
    );
    if (selected.length < maxSections) {
      appendUniqueEntries(selected, getUiDefaultEntries(maxSections), maxSections);
    }
    if (selected.length < maxSections) {
      appendUniqueEntries(
        selected,
        ranked.map((item) => item.entry),
        maxSections
      );
    }
    if (selected.length < maxSections) {
      appendUniqueEntries(selected, getDefaultEntries(maxSections), maxSections);
    }
    return selected;
  }

  const selected = ranked.slice(0, maxSections).map((item) => item.entry);
  if (selected.length >= maxSections) {
    return selected;
  }

  for (const fallback of getCategoryDefaultEntries(query, maxSections)) {
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
    return "Use this internal Clore knowledge base when the user asks about the Clore UI, app behavior, features, permissions, or API details. If the user writes in Russian, keep the final answer in Russian.";
  }
  if (false) {
    return "Используйте эту внутреннюю базу знаний Clore, когда пользователь спрашивает про интерфейс, поведение приложения, функции или API.";
  }
  return "Use this internal Clore app knowledge base when user asks about product behavior or app internals.";
}

const UI_HOW_TO_QUERY_REGEX =
  /(how|steps?|where|click|tap|open|delete|remove|wallpaper|settings?|guide|tutorial|walkthrough|как|пошаг|шаги?|где|нажм|открой|удал|обои|настройк|оформлен|инструкц|объясни|чат)/iu;

const UI_HOW_TO_QUERY_RU_FIX_REGEX =
  /(how|steps?|where|click|tap|open|delete|remove|wallpaper|settings?|guide|tutorial|walkthrough|\u043a\u0430\u043a|\u043f\u043e\u0448\u0430\u0433|\u0448\u0430\u0433\u0438?|\u0433\u0434\u0435|\u043d\u0430\u0436\u043c|\u043e\u0442\u043a\u0440\u043e\u0439|\u0443\u0434\u0430\u043b|\u043e\u0431\u043e\u0438|\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a|\u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d|\u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446|\u043e\u0431\u044a\u044f\u0441\u043d\u0438|\u0447\u0430\u0442|\u043f\u0443\u0442\u044c)/iu;

function buildAdaptiveBudget(query: string): {
  maxSections: number;
  maxChars: number;
} {
  const queryTokens = tokenize(query);
  let maxSections = DEFAULT_MAX_SECTIONS;
  let maxChars = DEFAULT_MAX_CHARS;

  if (queryTokens.length >= 8) {
    maxSections += 1;
    maxChars += 500;
  }
  if (queryTokens.length >= 14) {
    maxSections += 1;
    maxChars += 900;
  }
  if (UI_HOW_TO_QUERY_RU_FIX_REGEX.test(query)) {
    maxSections += 1;
    maxChars += 500;
  }
  if (isApiQuery(query) || isTroubleshootingQuery(query)) {
    maxSections += 2;
    maxChars += 1_300;
  }
  if (isPermissionQuery(query) || isComparisonQuery(query)) {
    maxSections += 1;
    maxChars += 700;
  }

  return {
    maxSections,
    maxChars,
  };
}

export function buildAiResponseGuidance({
  query,
  language,
}: BuildResponseGuidanceOptions): string {
  const isUiHowToFixed =
    UI_HOW_TO_QUERY_REGEX.test(query) || UI_HOW_TO_QUERY_RU_FIX_REGEX.test(query);
  const uiQueryFixed = isUiQuery(query);
  const apiQuery = isApiQuery(query);
  const troubleshootingQuery = isTroubleshootingQuery(query);
  const permissionQuery = isPermissionQuery(query);
  const comparisonQuery = isComparisonQuery(query);

  if (language === "ru") {
    if (isUiHowToFixed) {
      return [
        "For Clore interface how-to questions, answer in Russian using explicit numbered steps.",
        "Use exact in-app labels when known.",
        "If desktop and mobile flows differ, provide both paths.",
        "Call out confirmation dialogs, warnings, and undo windows when applicable.",
        "If the exact path is not fully known, state what is confirmed and ask one short clarifying question instead of guessing.",
      ].join(" ");
    }
    if (troubleshootingQuery) {
      return [
        "For Clore troubleshooting questions, answer in Russian with this order: likely cause, what to check, what to do next.",
        "Separate confirmed facts from inference.",
        "Do not claim a fix is available unless the internal knowledge confirms it.",
      ].join(" ");
    }
    if (apiQuery) {
      return [
        "For Clore API or backend questions, answer in Russian and stay grounded in the documented routes and server behavior.",
        "Prefer concrete route names, store entities, and server modules when known.",
        "If something is not confirmed, say that it is not confirmed.",
      ].join(" ");
    }
    if (permissionQuery) {
      return [
        "For Clore permission or privacy questions, answer in Russian with clear can/cannot rules and the conditions that change the outcome.",
        "Mention visibility modes, block relationships, sanctions, or role constraints when relevant.",
      ].join(" ");
    }
    if (comparisonQuery) {
      return [
        "For Clore comparison questions, answer in Russian with a compact compare-and-recommend format.",
        "State the difference first, then when to choose each option.",
      ].join(" ");
    }
    if (uiQueryFixed) {
      return "For Clore interface questions from Russian-speaking users, keep the final answer in Russian, rely on the internal UI knowledge, use exact screen and control labels, and do not invent missing buttons, menus, or flows.";
    }
    return "For Clore questions from Russian-speaking users, keep the final answer in Russian, rely only on confirmed internal knowledge, and ask one short clarifying question when the request is ambiguous instead of inventing details.";
  }

  if (isUiHowToFixed) {
    return [
      "For Clore interface how-to questions, answer in explicit numbered steps.",
      "Use exact in-app labels when known.",
      "If desktop and mobile flows differ, provide both.",
      "Call out confirmation dialogs and undo windows when applicable.",
      "If the exact path is uncertain, say what is confirmed and ask one short clarifying question.",
    ].join(" ");
  }

  if (troubleshootingQuery) {
    return [
      "For Clore troubleshooting questions, answer in this order: likely cause, what to check, and what to do next.",
      "Separate confirmed facts from inference.",
      "Do not invent fixes or hidden settings.",
    ].join(" ");
  }

  if (apiQuery) {
    return [
      "For Clore API or backend questions, stay grounded in the documented routes, store behavior, and server modules.",
      "Prefer concrete route names and entities when known.",
      "If something is not confirmed, say so.",
    ].join(" ");
  }

  if (permissionQuery) {
    return [
      "For Clore permission or privacy questions, answer with explicit can/cannot rules and the conditions that affect them.",
      "Mention visibility modes, block relationships, sanctions, or role constraints when relevant.",
    ].join(" ");
  }

  if (comparisonQuery) {
    return [
      "For Clore comparison questions, use a compact compare-and-recommend format.",
      "State the difference first, then when to choose each option.",
    ].join(" ");
  }

  if (uiQueryFixed) {
    return "For Clore interface questions, rely on the internal UI knowledge, use exact screen and control labels, and do not invent missing buttons, menus, or flows.";
  }

  return "For Clore app questions, rely on internal knowledge context, avoid inventing UI controls or API behavior, and ask a short clarifying question instead of guessing when the request is ambiguous.";
  /* const isUiHowTo = UI_HOW_TO_QUERY_REGEX.test(query);
  const uiQuery = isUiQuery(query);

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

  if (uiQuery) {
    return "For Clore interface questions, rely on the internal UI knowledge, use exact screen and control labels, and do not invent missing buttons, menus, or flows.";
  }

  return "For Clore app questions, rely on internal knowledge context and avoid inventing UI controls or API behavior.";
  */
}

export function buildAiKnowledgeContext({
  query,
  language,
  maxSections = DEFAULT_MAX_SECTIONS,
  maxChars = DEFAULT_MAX_CHARS,
}: BuildKnowledgeContextOptions): string {
  const adaptiveBudget = buildAdaptiveBudget(query);
  const usesDefaultSections = maxSections === DEFAULT_MAX_SECTIONS;
  const usesDefaultChars = maxChars === DEFAULT_MAX_CHARS;
  const normalizedMaxSections = Math.max(
    1,
    Math.min(
      10,
      Math.trunc(usesDefaultSections ? adaptiveBudget.maxSections : maxSections)
    )
  );
  const normalizedMaxChars = Math.max(
    500,
    Math.min(
      10_500,
      Math.trunc(usesDefaultChars ? adaptiveBudget.maxChars : maxChars)
    )
  );
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
