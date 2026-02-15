"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Copy,
  Download,
  Home,
  Pin,
  PinOff,
  Plus,
  MoreVertical,
  Paperclip,
  Phone,
  PhoneOff,
  Search,
  SendHorizontal,
  Settings,
  Smile,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type StoredChatThread = {
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

type StoredChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  attachments: StoredChatAttachment[];
  createdAt: number;
};

type StoredChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

type RenderAttachment = {
  id: string;
  name: string;
  size: number;
  url: string;
  kind: "image" | "video" | "file";
};

type PendingAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  kind: "image" | "video" | "file";
};

type RenderMessage = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
  attachments: RenderAttachment[];
  isReadByPeer: boolean;
};

type ChatListItem = {
  id: string;
  memberId: string | null;
  memberIds: string[];
  isGroup: boolean;
  createdById: string;
  isGroupCreator: boolean;
  name: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  accent: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  updatedAt: number;
  isPinned: boolean;
};

type SidebarItem = {
  id: "profile" | "home" | "settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ProfileData = {
  name: string;
  username: string;
  bio: string;
  birthday: string;
  avatarUrl: string;
  bannerUrl: string;
};

type ProfileTabId = "media" | "links";
type SettingsSectionId = "privacy" | "security" | "appearance";
type PrivacyVisibility = "everyone" | "selected" | "nobody";

type AppLanguage = "en" | "ru";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: PrivacyVisibility;
  avatarVisibility: PrivacyVisibility;
  bioVisibility: PrivacyVisibility;
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};

type WebMessengerProps = {
  currentUser: AuthUser;
  onLogout: () => void;
  onProfileUpdate?: (
    profile: Pick<AuthUser, "name" | "username" | "bio" | "birthday" | "avatarUrl" | "bannerUrl">
  ) => void | Promise<void>;
  onPrivacyUpdate?: (
    privacy: Pick<
      AuthUser,
      | "lastSeenVisibility"
      | "avatarVisibility"
      | "bioVisibility"
      | "lastSeenAllowedUserIds"
      | "avatarAllowedUserIds"
      | "bioAllowedUserIds"
    >
  ) => void | Promise<void>;
};

const sidebarItems: SidebarItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

const accentPalette = [
  "from-orange-500 to-amber-400",
  "from-cyan-500 to-sky-400",
  "from-emerald-500 to-lime-500",
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-blue-500 to-indigo-500",
];

const initialProfile: ProfileData = {
  name: "",
  username: "",
  bio: "",
  birthday: "",
  avatarUrl: "",
  bannerUrl: "",
};

const LANGUAGE_STORAGE_KEY = "clore_app_language_v1";
const PUSH_NOTIFICATIONS_STORAGE_KEY = "clore_push_notifications_v1";
const MESSAGE_SOUND_STORAGE_KEY = "clore_message_sound_v1";
const INCOMING_MESSAGE_SOUND_PATH = "/sounds/meet-message-sound-1.mp3";
const MAX_PINNED_CHATS = 5;
const MIN_BIRTH_YEAR = 1900;
const ONLINE_STATUS_WINDOW_MS = 20_000;

const translations = {
  en: {
    home: "Home",
    profile: "Profile",
    settings: "Settings",
    chats: "Chats",
    searchChat: "Search chat",
    searchAll: "Search across messenger",
    users: "Users",
    newGroup: "New group",
    groupName: "Group name",
    createGroup: "Create",
    groupMembers: "Group members",
    groupChat: "Group chat",
    members: "members",
    participants: "Participants",
    creator: "Creator",
    noChatsOrUsersFound: "No chats or users found",
    noChatsYet: "No chats yet. Register another account to start chatting.",
    yesterday: "Yesterday",
    unknownUser: "Unknown user",
    online: "Online",
    offline: "Offline",
    lastSeenAt: "Last seen at",
    lastSeenHidden: "Last seen hidden",
    noMessagesYet: "No messages yet",
    copyText: "Copy",
    copyAttachmentLink: "Copy attachment link",
    deleteMessage: "Delete message",
    pinChat: "Pin chat",
    unpinChat: "Unpin chat",
    deleteForBoth: "Delete for both",
    deleteGroup: "Delete group",
    leaveGroup: "Leave group",
    call: "Call",
    videoCall: "Video call",
    audioCallOnly: "Audio only",
    incomingCall: "Incoming call",
    callingNow: "Calling...",
    connectingCall: "Connecting...",
    inCall: "In call",
    acceptCall: "Accept",
    declineCall: "Decline",
    endCall: "End call",
    callEnded: "Call ended",
    callDeclined: "Call declined",
    callBusy: "User is in another call",
    callFailed: "Unable to start call",
    micAccessDenied: "Microphone access denied",
    callBrowserNotSupported: "Audio calls are not supported in this browser",
    callDirectOnly: "Audio calls are available only in direct chats",
    menu: "Menu",
    typeMessage: "Type a message...",
    attachFiles: "Attach files",
    send: "Send",
    attachment: "Attachment",
    removeAttachment: "Remove attachment",
    previousImage: "Previous image",
    nextImage: "Next image",
    closeViewer: "Close viewer",
    download: "Download",
    selectChat: "Select a chat",
    editProfile: "Edit profile",
    cancel: "Cancel",
    save: "Save",
    chatProfile: "Chat profile",
    name: "Name",
    username: "Username",
    bio: "Bio",
    clickAvatarHint: "Click avatar to change it. Recommended avatar size: 512x512 px (1:1).",
    clickBannerHint: "Click banner to change it. Recommended banner size: 1500x500 px (3:1).",
    profileActivityHint:
      "Profile activity is based on chat history and appears in other users' profiles.",
    messages: "Messages",
    media: "Media",
    links: "Links",
    noSharedActivity: "No shared activity in this chat yet.",
    privacy: "Privacy",
    security: "Security",
    appearance: "Appearance",
    interface: "Interface",
    account: "Account",
    pushNotifications: "Push notifications",
    pushNotificationsHint: "Get notified about new messages",
    messageSound: "Message sound",
    messageSoundHint: "Play sound for incoming messages",
    hideLastSeen: "Hide last seen",
    hideLastSeenHint: "Others won't see when you were last online",
    lastSeenVisibility: "Who can see last seen",
    avatarVisibility: "Who can see avatar",
    bioVisibility: "Who can see bio",
    privacyScopeHint: "Set who can view this profile data",
    everyone: "Everyone",
    selected: "Selected people",
    nobody: "Nobody",
    selectedPeople: "Selected people",
    choosePeople: "Choose people",
    noSelectedPeople: "No people selected",
    pickPeopleHint: "Choose exact users allowed to see this field",
    pinnedChats: "Pinned chats",
    allChats: "All chats",
    logOut: "Log out",
    language: "Language",
    languageHint: "Choose interface language",
    russian: "Русский",
    english: "English",
    you: "You",
    youLabel: "(you)",
    remove: "Remove",
    changeFile: "Change file",
    avatarActions: "Avatar actions",
    bannerActions: "Banner actions",
    avatarActionsHint: "Choose what to do with your avatar image.",
    bannerActionsHint: "Choose what to do with your banner image.",
    avatarSizeHint: "Recommended avatar size: 512x512 px (1:1).",
    bannerSizeHint: "Recommended banner size: 1500x500 px (3:1).",
  },
  ru: {
    home: "Главная",
    profile: "Профиль",
    settings: "Настройки",
    chats: "Чаты",
    searchChat: "Поиск чата",
    searchAll: "Поиск по всему мессенджеру",
    users: "Пользователи",
    newGroup: "Новая группа",
    groupName: "Название группы",
    createGroup: "создать",
    groupMembers: "Участники группы",
    groupChat: "Групповой чат",
    members: "участников",
    participants: "Участники",
    creator: "Создатель",
    noChatsOrUsersFound: "Чаты или пользователи не найдены",
    noChatsYet: "Чатов пока нет. Зарегистрируйте другой аккаунт, чтобы начать переписку.",
    yesterday: "Вчера",
    unknownUser: "Неизвестный пользователь",
    online: "Онлайн",
    offline: "Не в сети",
    lastSeenAt: "Был(а) в",
    lastSeenHidden: "Последний вход скрыт",
    noMessagesYet: "Сообщений пока нет",
    copyText: "Скопировать",
    copyAttachmentLink: "Скопировать ссылку вложения",
    deleteMessage: "Удалить сообщение",
    pinChat: "Закрепить чат",
    unpinChat: "Открепить чат",
    deleteForBoth: "Удалить у обоих",
    deleteGroup: "Удалить группу",
    leaveGroup: "Выйти из группы",
    call: "Звонок",
    videoCall: "Видеозвонок",
    audioCallOnly: "Только аудио",
    incomingCall: "Входящий звонок",
    callingNow: "Звоним...",
    connectingCall: "Соединение...",
    inCall: "В звонке",
    acceptCall: "Принять",
    declineCall: "Отклонить",
    endCall: "Завершить",
    callEnded: "Звонок завершен",
    callDeclined: "Звонок отклонен",
    callBusy: "Пользователь уже в другом звонке",
    callFailed: "Не удалось начать звонок",
    micAccessDenied: "Нет доступа к микрофону",
    callBrowserNotSupported: "Браузер не поддерживает аудиозвонки",
    callDirectOnly: "Аудиозвонки доступны только в личных чатах",
    menu: "Меню",
    typeMessage: "Введите сообщение...",
    attachFiles: "Прикрепить файлы",
    send: "Отправить",
    attachment: "Вложение",
    removeAttachment: "Удалить вложение",
    previousImage: "Предыдущее изображение",
    nextImage: "Следующее изображение",
    closeViewer: "Закрыть просмотр",
    download: "Скачать",
    selectChat: "Выберите чат",
    editProfile: "Редактировать профиль",
    cancel: "Отмена",
    save: "Сохранить",
    chatProfile: "Профиль чата",
    name: "Имя",
    username: "Юзернейм",
    bio: "О себе",
    clickAvatarHint:
      "Нажмите на аватар, чтобы изменить. Рекомендуемый размер: 512x512 px (1:1).",
    clickBannerHint:
      "Нажмите на баннер, чтобы изменить. Рекомендуемый размер: 1500x500 px (3:1).",
    profileActivityHint:
      "Активность профиля формируется по истории чата и отображается в профилях других пользователей.",
    messages: "Сообщения",
    media: "Медиа",
    links: "Ссылки",
    noSharedActivity: "В этом чате пока нет общей активности.",
    privacy: "Приватность",
    security: "Безопасность",
    appearance: "Оформление",
    interface: "Интерфейс",
    account: "Аккаунт",
    pushNotifications: "Push-уведомления",
    pushNotificationsHint: "Получать уведомления о новых сообщениях",
    messageSound: "Звук сообщений",
    messageSoundHint: "Проигрывать звук входящих сообщений",
    hideLastSeen: "Скрыть последний вход",
    hideLastSeenHint: "Другие не будут видеть время вашего последнего входа",
    lastSeenVisibility: "Кто видит последний вход",
    avatarVisibility: "Кто видит аватар",
    bioVisibility: "Кто видит био",
    privacyScopeHint: "Выберите, кто может видеть эти данные профиля",
    everyone: "Все",
    selected: "Выбранные люди",
    nobody: "Никто",
    selectedPeople: "Выбраны",
    choosePeople: "Выбрать людей",
    noSelectedPeople: "Пока никто не выбран",
    pickPeopleHint: "Выберите конкретных пользователей для этого поля",
    pinnedChats: "Закрепленные чаты",
    allChats: "Все чаты",
    logOut: "Выйти",
    language: "Язык",
    languageHint: "Выберите язык интерфейса",
    russian: "Русский",
    english: "English",
    you: "Вы",
    youLabel: "(вы)",
    remove: "Удалить",
    changeFile: "Сменить файл",
    avatarActions: "Действия с аватаром",
    bannerActions: "Действия с баннером",
    avatarActionsHint: "Выберите действие для изображения аватара.",
    bannerActionsHint: "Выберите действие для изображения баннера.",
    avatarSizeHint: "Рекомендуемый размер аватара: 512x512 px (1:1).",
    bannerSizeHint: "Рекомендуемый размер баннера: 1500x500 px (3:1).",
  },
} as const;

type ApiErrorResponse = {
  error?: string;
};

type MessengerDataResponse = {
  users: AuthUser[];
  threads: StoredChatThread[];
  messages: StoredChatMessage[];
};

type OpenOrCreateResponse = {
  chatId: string;
  created: boolean;
};

type CreateGroupResponse = {
  chatId: string;
};

type SendAttachmentPayload = {
  name: string;
  type: string;
  size: number;
  url: string;
};

type CallSignalType = "offer" | "answer" | "ice" | "hangup" | "reject";

type CallSignalData = {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: string;
};

type CallSignal = {
  id: string;
  chatId: string;
  fromUserId: string;
  toUserId: string;
  type: CallSignalType;
  data?: unknown;
  createdAt: number;
};

type CallSignalPollResponse = {
  signals: CallSignal[];
};

type CallSessionState = {
  phase: "incoming" | "outgoing" | "connecting" | "active";
  chatId: string;
  peerUserId: string;
  peerName: string;
  startedAt: number | null;
};

async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as (T & ApiErrorResponse) | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  if (!payload) {
    throw new Error("Empty response.");
  }

  return payload as T;
}

function formatChatTime(timestamp: number, language: AppLanguage): string {
  const date = new Date(timestamp);
  const now = new Date();
  const locale = language === "ru" ? "ru-RU" : "en-US";

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return language === "ru" ? "Вчера" : "Yesterday";
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function formatLastSeen(timestamp: number, language: AppLanguage): string {
  if (!timestamp || timestamp <= 0) {
    return language === "ru" ? "недавно" : "recently";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatBirthday(value: string, language: AppLanguage): string {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type BirthdayParts = {
  year: string;
  month: string;
  day: string;
};

function parseBirthdayParts(value: string): BirthdayParts {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { year: "", month: "", day: "" };
  }

  const [year, month, day] = value.split("-");
  return { year, month, day };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pickAccent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % accentPalette.length;
  }
  return accentPalette[hash];
}

function normalizeSearchQuery(value: string) {
  const normalized = value.trim().toLowerCase();
  return {
    raw: normalized,
    username: normalized.replace(/^@+/, ""),
  };
}

function normalizePrivacyVisibility(
  value: string | null | undefined,
  fallback: PrivacyVisibility
): PrivacyVisibility {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "everyone" || normalized === "selected" || normalized === "nobody") {
    return normalized;
  }

  if (normalized === "contacts") {
    return "selected";
  }

  return fallback;
}

const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)(\?[^?\s]*)?$/i;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi;
const CHAT_SMILEY_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰",
  "😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","😏","😒",
  "😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡",
  "🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤭","🫢","🫠",
  "😶","🫥","😐","🫤","😑","😬","🫨","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤",
  "😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","💀","👻",
  "🤡","💩","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
] as const;

function extractUrls(text: string): string[] {
  return text.match(URL_PATTERN) ?? [];
}

function extractMediaUrls(text: string): string[] {
  const markdownImages = [...text.matchAll(MARKDOWN_IMAGE_PATTERN)].map(
    (match) => match[1]
  );
  const directImages = extractUrls(text).filter((url) =>
    IMAGE_EXTENSION_PATTERN.test(url)
  );
  return [...new Set([...markdownImages, ...directImages])];
}

function getAttachmentKind(type: string): RenderAttachment["kind"] {
  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  return "file";
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function getMediaKindFromUrl(url: string): "image" | "video" {
  const normalized = url.toLowerCase();
  if (
    normalized.startsWith("data:video/") ||
    /\.(mp4|webm|ogg|mov|m4v)(\?[^?\s]*)?$/.test(normalized)
  ) {
    return "video";
  }
  return "image";
}

function getMediaNameFromUrl(url: string): string {
  if (url.startsWith("data:")) {
    return "media";
  }
  try {
    const parsed = new URL(url);
    const raw = parsed.pathname.split("/").pop() || "";
    return decodeURIComponent(raw) || "media";
  } catch {
    return "media";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseSignalSdp(value: unknown): RTCSessionDescriptionInit | null {
  if (!isRecord(value)) {
    return null;
  }
  const sdpValue = value.sdp;
  if (!isRecord(sdpValue)) {
    return null;
  }

  const typeValue = sdpValue.type;
  const sessionValue = sdpValue.sdp;
  if (
    (typeValue !== "offer" &&
      typeValue !== "answer" &&
      typeValue !== "pranswer" &&
      typeValue !== "rollback") ||
    typeof sessionValue !== "string"
  ) {
    return null;
  }

  return {
    type: typeValue,
    sdp: sessionValue,
  };
}

function parseSignalIceCandidate(value: unknown): RTCIceCandidateInit | null {
  if (!isRecord(value)) {
    return null;
  }
  const candidateValue = value.candidate;
  if (!isRecord(candidateValue)) {
    return null;
  }
  if (typeof candidateValue.candidate !== "string") {
    return null;
  }

  const sdpMid =
    typeof candidateValue.sdpMid === "string" ? candidateValue.sdpMid : null;
  const sdpMLineIndex =
    typeof candidateValue.sdpMLineIndex === "number"
      ? candidateValue.sdpMLineIndex
      : null;
  const usernameFragment =
    typeof candidateValue.usernameFragment === "string"
      ? candidateValue.usernameFragment
      : undefined;

  return {
    candidate: candidateValue.candidate,
    sdpMid,
    sdpMLineIndex,
    usernameFragment,
  };
}

function parseSignalReason(value: unknown): string {
  if (!isRecord(value)) {
    return "";
  }
  return typeof value.reason === "string" ? value.reason : "";
}

function formatCallDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function WebMessenger({
  currentUser,
  onLogout,
  onProfileUpdate,
  onPrivacyUpdate,
}: WebMessengerProps) {
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const emojiMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiCloseTimerRef = useRef<number | null>(null);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);
  const remoteCallAudioRef = useRef<HTMLAudioElement | null>(null);
  const callPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localCallStreamRef = useRef<MediaStream | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingRemoteIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callTargetRef = useRef<{ chatId: string; peerUserId: string } | null>(null);
  const callSignalPollInFlightRef = useRef(false);
  const isCallSignalingUnavailableRef = useRef(false);
  const hasLoadedInitialChatDataRef = useRef(false);
  const hasNotificationBaselineRef = useRef(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const baseDocumentTitleRef = useRef("Clore");
  const [threads, setThreads] = useState<StoredChatThread[]>([]);
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [knownUsers, setKnownUsers] = useState<AuthUser[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<SidebarItem["id"]>("home");
  const [query, setQuery] = useState("");
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupMemberIdsDraft, setGroupMemberIdsDraft] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [viewerImageId, setViewerImageId] = useState<string | null>(null);
  const [viewerSource, setViewerSource] = useState<"chat" | "profile">("chat");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [profile, setProfile] = useState<ProfileData>(() => ({
    ...initialProfile,
    name: currentUser.name,
    username: currentUser.username,
    bio: currentUser.bio,
    birthday: currentUser.birthday,
    avatarUrl: currentUser.avatarUrl,
    bannerUrl: currentUser.bannerUrl,
  }));
  const [profileDraft, setProfileDraft] = useState<ProfileData>(() => ({
    ...initialProfile,
    name: currentUser.name,
    username: currentUser.username,
    bio: currentUser.bio,
    birthday: currentUser.birthday,
    avatarUrl: currentUser.avatarUrl,
    bannerUrl: currentUser.bannerUrl,
  }));
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [birthdayDraft, setBirthdayDraft] = useState<BirthdayParts>(() =>
    parseBirthdayParts(currentUser.birthday)
  );
  const [imagePickerTarget, setImagePickerTarget] = useState<
    "avatar" | "banner" | null
  >(null);
  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "ru" || stored === "en" ? stored : "en";
  });
  const [profileTab, setProfileTab] = useState<ProfileTabId>("media");
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem(PUSH_NOTIFICATIONS_STORAGE_KEY) !== "0";
  });
  const [messageSoundEnabled, setMessageSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem(MESSAGE_SOUND_STORAGE_KEY) !== "0";
  });
  const [hiddenNotificationCount, setHiddenNotificationCount] = useState(0);
  const [callSession, setCallSession] = useState<CallSessionState | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [callNotice, setCallNotice] = useState("");
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSectionId>("privacy");
  const [privacyPickerField, setPrivacyPickerField] = useState<
    "lastSeen" | "avatar" | "bio" | null
  >(null);
  const [privacyPickerQuery, setPrivacyPickerQuery] = useState("");
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const birthdayYearOptions = useMemo(
    () =>
      Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, index) =>
        String(currentYear - index)
      ),
    [currentYear]
  );
  const birthdayMonthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = String(index + 1).padStart(2, "0");
        const label = new Date(2000, index, 1).toLocaleString(
          language === "ru" ? "ru-RU" : "en-US",
          { month: "long" }
        );
        return { value: month, label };
      }),
    [language]
  );
  const birthdayDayOptions = useMemo(() => {
    const year = Number(birthdayDraft.year);
    const month = Number(birthdayDraft.month);
    const maxDays =
      year > 0 && month > 0 ? getDaysInMonth(year, month) : 31;

    return Array.from({ length: maxDays }, (_, index) =>
      String(index + 1).padStart(2, "0")
    );
  }, [birthdayDraft.month, birthdayDraft.year]);
  const t = useCallback(
    <K extends keyof (typeof translations)["en"]>(key: K) =>
      translations[language][key],
    [language]
  );
  const getPrivacyVisibilityLabel = useCallback(
    (value: unknown) => {
      if (typeof value !== "string") {
        return "";
      }
      const normalized = normalizePrivacyVisibility(value, "everyone");
      return t(normalized);
    },
    [t]
  );
  const privacyVisibilityOptions: PrivacyVisibility[] = [
    "everyone",
    "selected",
    "nobody",
  ];
  const currentLastSeenVisibility = normalizePrivacyVisibility(
    currentUser.lastSeenVisibility,
    currentUser.showLastSeen ? "everyone" : "nobody"
  );
  const currentAvatarVisibility = normalizePrivacyVisibility(
    currentUser.avatarVisibility,
    "everyone"
  );
  const currentBioVisibility = normalizePrivacyVisibility(
    currentUser.bioVisibility,
    "everyone"
  );
  const currentLastSeenAllowedUserIds = currentUser.lastSeenAllowedUserIds ?? [];
  const currentAvatarAllowedUserIds = currentUser.avatarAllowedUserIds ?? [];
  const currentBioAllowedUserIds = currentUser.bioAllowedUserIds ?? [];
  const availablePrivacyUsers = useMemo(
    () => knownUsers.filter((user) => user.id !== currentUser.id),
    [currentUser.id, knownUsers]
  );
  const filteredPrivacyUsers = useMemo(() => {
    const normalized = normalizeSearchQuery(privacyPickerQuery);
    if (!normalized.raw) {
      return availablePrivacyUsers;
    }
    return availablePrivacyUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized.raw) ||
        user.username.toLowerCase().includes(normalized.username) ||
        user.email.toLowerCase().includes(normalized.raw)
    );
  }, [availablePrivacyUsers, privacyPickerQuery]);

  const updatePrivacyVisibility = useCallback(
    (field: "lastSeenVisibility" | "avatarVisibility" | "bioVisibility", value: PrivacyVisibility) => {
      const next = {
        lastSeenVisibility: currentLastSeenVisibility,
        avatarVisibility: currentAvatarVisibility,
        bioVisibility: currentBioVisibility,
        lastSeenAllowedUserIds: currentLastSeenAllowedUserIds,
        avatarAllowedUserIds: currentAvatarAllowedUserIds,
        bioAllowedUserIds: currentBioAllowedUserIds,
        [field]: value,
      };
      if (value !== "selected") {
        if (field === "lastSeenVisibility") {
          next.lastSeenAllowedUserIds = [];
        }
        if (field === "avatarVisibility") {
          next.avatarAllowedUserIds = [];
        }
        if (field === "bioVisibility") {
          next.bioAllowedUserIds = [];
        }
      }
      void onPrivacyUpdate?.(next);
    },
    [
      currentAvatarVisibility,
      currentAvatarAllowedUserIds,
      currentBioVisibility,
      currentBioAllowedUserIds,
      currentLastSeenVisibility,
      currentLastSeenAllowedUserIds,
      onPrivacyUpdate,
    ]
  );

  const toggleAllowedPrivacyUser = useCallback(
    (
      field: "lastSeenAllowedUserIds" | "avatarAllowedUserIds" | "bioAllowedUserIds",
      visibilityField: "lastSeenVisibility" | "avatarVisibility" | "bioVisibility",
      targetUserId: string
    ) => {
      const next = {
        lastSeenVisibility: currentLastSeenVisibility,
        avatarVisibility: currentAvatarVisibility,
        bioVisibility: currentBioVisibility,
        lastSeenAllowedUserIds: currentLastSeenAllowedUserIds,
        avatarAllowedUserIds: currentAvatarAllowedUserIds,
        bioAllowedUserIds: currentBioAllowedUserIds,
      };
      const currentIds = next[field];
      next[field] = currentIds.includes(targetUserId)
        ? currentIds.filter((id) => id !== targetUserId)
        : [...currentIds, targetUserId];
      next[visibilityField] = "selected";
      void onPrivacyUpdate?.(next);
    },
    [
      currentAvatarVisibility,
      currentAvatarAllowedUserIds,
      currentBioVisibility,
      currentBioAllowedUserIds,
      currentLastSeenVisibility,
      currentLastSeenAllowedUserIds,
      onPrivacyUpdate,
    ]
  );
  const pickerAllowedField =
    privacyPickerField === "lastSeen"
      ? "lastSeenAllowedUserIds"
      : privacyPickerField === "avatar"
        ? "avatarAllowedUserIds"
        : privacyPickerField === "bio"
          ? "bioAllowedUserIds"
          : null;
  const pickerVisibilityField =
    privacyPickerField === "lastSeen"
      ? "lastSeenVisibility"
      : privacyPickerField === "avatar"
        ? "avatarVisibility"
        : privacyPickerField === "bio"
          ? "bioVisibility"
          : null;
  const pickerSelectedUserIds =
    privacyPickerField === "lastSeen"
      ? currentLastSeenAllowedUserIds
      : privacyPickerField === "avatar"
        ? currentAvatarAllowedUserIds
        : privacyPickerField === "bio"
          ? currentBioAllowedUserIds
          : [];

  useEffect(() => {
    if (!isEmojiMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && emojiMenuRef.current?.contains(target)) {
        return;
      }
      setIsEmojiMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isEmojiMenuOpen]);

  useEffect(() => {
    setIsEmojiMenuOpen(false);
  }, [activeChatId]);

  useEffect(() => {
    return () => {
      if (emojiCloseTimerRef.current !== null) {
        window.clearTimeout(emojiCloseTimerRef.current);
      }
    };
  }, []);

  const openEmojiMenu = () => {
    if (emojiCloseTimerRef.current !== null) {
      window.clearTimeout(emojiCloseTimerRef.current);
      emojiCloseTimerRef.current = null;
    }
    setIsEmojiMenuOpen(true);
  };

  const scheduleCloseEmojiMenu = () => {
    if (emojiCloseTimerRef.current !== null) {
      window.clearTimeout(emojiCloseTimerRef.current);
    }
    emojiCloseTimerRef.current = window.setTimeout(() => {
      setIsEmojiMenuOpen(false);
      emojiCloseTimerRef.current = null;
    }, 140);
  };

  const handleBirthdayPartChange = (
    part: keyof BirthdayParts,
    value: string | null
  ) => {
    const normalizedValue = value ?? "";
    setBirthdayDraft((prev) => {
      const next: BirthdayParts = {
        ...prev,
        [part]: normalizedValue,
      };

      if (next.year && next.month && next.day) {
        const maxDays = getDaysInMonth(Number(next.year), Number(next.month));
        if (Number(next.day) > maxDays) {
          next.day = String(maxDays).padStart(2, "0");
        }
      }

      const isoBirthday =
        next.year && next.month && next.day
          ? `${next.year}-${next.month}-${next.day}`
          : "";

      setProfileDraft((profilePrev) => ({
        ...profilePrev,
        birthday: isoBirthday,
      }));

      return next;
    });
  };

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    const audio = new Audio(INCOMING_MESSAGE_SOUND_PATH);
    audio.preload = "auto";
    messageSoundRef.current = audio;
    return () => {
      messageSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      PUSH_NOTIFICATIONS_STORAGE_KEY,
      pushNotificationsEnabled ? "1" : "0"
    );
    if (!pushNotificationsEnabled) {
      setHiddenNotificationCount(0);
    }
  }, [pushNotificationsEnabled]);

  useEffect(() => {
    window.localStorage.setItem(
      MESSAGE_SOUND_STORAGE_KEY,
      messageSoundEnabled ? "1" : "0"
    );
  }, [messageSoundEnabled]);

  useEffect(() => {
    baseDocumentTitleRef.current = document.title || "Clore";
    return () => {
      document.title = baseDocumentTitleRef.current;
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setHiddenNotificationCount(0);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const baseTitle = baseDocumentTitleRef.current || "Clore";
    if (
      pushNotificationsEnabled &&
      hiddenNotificationCount > 0 &&
      document.visibilityState === "hidden"
    ) {
      const label = language === "ru" ? "Новые сообщения" : "New messages";
      document.title = `(${hiddenNotificationCount}) ${label}`;
      return;
    }
    document.title = baseTitle;
  }, [hiddenNotificationCount, language, pushNotificationsEnabled]);

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: currentUser.name,
      username: currentUser.username,
      bio: currentUser.bio,
      birthday: currentUser.birthday,
      avatarUrl: currentUser.avatarUrl,
      bannerUrl: currentUser.bannerUrl,
    }));
    setProfileDraft((prev) => ({
      ...prev,
      name: currentUser.name,
      username: currentUser.username,
      bio: currentUser.bio,
      birthday: currentUser.birthday,
      avatarUrl: currentUser.avatarUrl,
      bannerUrl: currentUser.bannerUrl,
    }));
    setBirthdayDraft(parseBirthdayParts(currentUser.birthday));
  }, [
    currentUser.name,
    currentUser.username,
    currentUser.bio,
    currentUser.birthday,
    currentUser.avatarUrl,
    currentUser.bannerUrl,
  ]);

  const loadChatData = useCallback(async () => {
    try {
      const data = await requestJson<MessengerDataResponse>(
        `/api/messenger/data?userId=${encodeURIComponent(currentUser.id)}`,
        {
          method: "GET",
        }
      );
      setKnownUsers(data.users);
      setThreads(data.threads);
      setMessages(data.messages);
      hasLoadedInitialChatDataRef.current = true;
      if (!hasNotificationBaselineRef.current) {
        seenMessageIdsRef.current = new Set(data.messages.map((message) => message.id));
        hasNotificationBaselineRef.current = true;
      }
    } catch {
      // Keep current state on temporary API errors.
    }
  }, [currentUser.id]);

  useEffect(() => {
    void loadChatData();
  }, [loadChatData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadChatData();
    }, 2000);
    return () => window.clearInterval(intervalId);
  }, [loadChatData]);

  const chatItems = useMemo<ChatListItem[]>(() => {
    const isDesktopViewport =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    const isActiveChatVisible =
      activeSidebar === "home" && (isDesktopViewport || mobileView === "chat");
    const usersById = new Map(knownUsers.map((user) => [user.id, user]));
    const messagesByChat = new Map<string, StoredChatMessage[]>();

    for (const message of messages) {
      const existing = messagesByChat.get(message.chatId);
      if (existing) {
        existing.push(message);
      } else {
        messagesByChat.set(message.chatId, [message]);
      }
    }

    return [...threads]
      .map((thread) => {
        const isGroup = thread.threadType === "group";
        const directMemberId = isGroup
          ? null
          : (thread.memberIds.find((userId) => userId !== currentUser.id) ??
            currentUser.id);
        const directMember = directMemberId ? usersById.get(directMemberId) : null;
        const groupMembers = thread.memberIds
          .filter((userId) => userId !== currentUser.id)
          .map((memberId) => usersById.get(memberId))
          .filter((member): member is AuthUser => member !== undefined);
        const threadMessages = messagesByChat.get(thread.id) ?? [];
        const lastMessage = threadMessages[threadMessages.length - 1];
        const lastMessagePreview = lastMessage
          ? lastMessage.text.trim() ||
            (lastMessage.attachments.length > 0 ? t("attachment") : t("noMessagesYet"))
          : t("noMessagesYet");
        const readAt = thread.readBy?.[currentUser.id] ?? 0;
        const unread = threadMessages.filter(
          (message) =>
            message.authorId !== currentUser.id && message.createdAt > readAt
        ).length;

        const displayName = isGroup
          ? thread.title || t("groupChat")
          : (directMember?.name ?? t("unknownUser"));
        const displayUsername = isGroup
          ? `${groupMembers.length + 1} ${t("members")}`
          : (directMember?.username ?? "deleted");
        const displayAvatarUrl = isGroup
          ? thread.avatarUrl
          : (directMember?.avatarUrl ?? "");
        const displayBannerUrl = isGroup ? thread.bannerUrl : "";
        const accentId = isGroup ? thread.id : directMemberId ?? thread.id;

        return {
          id: thread.id,
          memberId: directMemberId,
          memberIds: thread.memberIds,
          isGroup,
          createdById: thread.createdById,
          isGroupCreator: isGroup && thread.createdById === currentUser.id,
          name: displayName,
          username: displayUsername,
          avatarUrl: displayAvatarUrl,
          bannerUrl: displayBannerUrl,
          accent: pickAccent(accentId),
          lastMessage: lastMessagePreview,
          lastTime: lastMessage
            ? formatChatTime(lastMessage.createdAt, language)
            : "",
          unread:
            isActiveChatVisible && thread.id === activeChatId ? 0 : unread,
          updatedAt: thread.updatedAt,
          isPinned: thread.pinnedBy?.[currentUser.id] === true,
        };
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [
    threads,
    messages,
    knownUsers,
    currentUser.id,
    language,
    t,
    activeSidebar,
    mobileView,
    activeChatId,
  ]);

  const filteredChats = useMemo(() => {
    const normalized = normalizeSearchQuery(query);
    const source =
      normalized.raw.length === 0
        ? chatItems
        : chatItems.filter(
            (chat) =>
              chat.name.toLowerCase().includes(normalized.raw) ||
              chat.username.toLowerCase().includes(normalized.username)
          );

    return [...source].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [chatItems, query]);

  const visiblePinnedChats = useMemo(
    () => filteredChats.filter((chat) => chat.isPinned),
    [filteredChats]
  );
  const visibleRegularChats = useMemo(
    () => filteredChats.filter((chat) => !chat.isPinned),
    [filteredChats]
  );
  const pinnedChatsCount = useMemo(
    () => chatItems.filter((chat) => chat.isPinned).length,
    [chatItems]
  );

  useEffect(() => {
    if (activeChatId && chatItems.some((chat) => chat.id === activeChatId)) {
      return;
    }
    setActiveChatId(chatItems[0]?.id ?? null);
  }, [chatItems, activeChatId]);

  const activeChat =
    chatItems.find((chat) => chat.id === activeChatId) ??
    filteredChats[0] ??
    null;
  const activeChatUser = useMemo(
    () =>
      activeChat && !activeChat.isGroup && activeChat.memberId
        ? knownUsers.find((user) => user.id === activeChat.memberId) ?? null
        : null,
    [activeChat, knownUsers]
  );
  const activeChatLastSeenText = useMemo(() => {
    if (!activeChatUser) {
      return t("lastSeenHidden");
    }
    if (!activeChatUser.showLastSeen) {
      return t("lastSeenHidden");
    }
    const isOnline =
      activeChatUser.lastSeenAt > 0 &&
      Date.now() - activeChatUser.lastSeenAt <= ONLINE_STATUS_WINDOW_MS;
    if (isOnline) {
      return t("online");
    }
    return `${t("lastSeenAt")} ${formatLastSeen(activeChatUser.lastSeenAt, language)}`;
  }, [activeChatUser, t, language]);
  const callStatusText = useMemo(() => {
    if (!callSession) {
      return "";
    }
    if (callSession.phase === "incoming") {
      return t("incomingCall");
    }
    if (callSession.phase === "outgoing") {
      return t("callingNow");
    }
    if (callSession.phase === "connecting") {
      return t("connectingCall");
    }
    return `${t("inCall")} · ${formatCallDuration(callDurationSeconds)}`;
  }, [callSession, callDurationSeconds, t]);
  const callChatMatchesActive =
    callSession !== null &&
    activeChat !== null &&
    callSession.chatId === activeChat.id &&
    callSession.peerUserId === activeChat.memberId;
  const shouldDisableCallButton =
    !activeChat ||
    activeChat.isGroup ||
    !activeChat.memberId ||
    (callSession !== null && !callChatMatchesActive);

  const closeCallResources = useCallback(() => {
    const connection = callPeerConnectionRef.current;
    if (connection) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
      callPeerConnectionRef.current = null;
    }

    const stream = localCallStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      localCallStreamRef.current = null;
    }

    const remoteAudio = remoteCallAudioRef.current;
    if (remoteAudio) {
      remoteAudio.pause();
      remoteAudio.srcObject = null;
    }

    pendingRemoteIceCandidatesRef.current = [];
    incomingOfferRef.current = null;
    callTargetRef.current = null;
  }, []);

  const closeCallSession = useCallback(
    (notice?: string) => {
      closeCallResources();
      setCallSession(null);
      setCallDurationSeconds(0);
      if (notice) {
        setCallNotice(notice);
      }
    },
    [closeCallResources]
  );

  const sendCallSignal = useCallback(
    async (
      chatId: string,
      toUserId: string,
      type: CallSignalType,
      data?: CallSignalData
    ) => {
      try {
        await requestJson<{ ok: boolean }>("/api/messenger/call-signal", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId,
            toUserId,
            type,
            data: data ?? {},
          }),
        });
        return true;
      } catch {
        return false;
      }
    },
    [currentUser.id]
  );

  const createCallPeerConnection = useCallback(
    (chatId: string, peerUserId: string) => {
      const connection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      connection.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }
        void sendCallSignal(chatId, peerUserId, "ice", {
          candidate: event.candidate.toJSON(),
        });
      };

      connection.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) {
          return;
        }
        const audio = remoteCallAudioRef.current;
        if (!audio) {
          return;
        }
        audio.srcObject = stream;
        void audio.play().catch(() => undefined);
      };

      connection.onconnectionstatechange = () => {
        if (connection.connectionState === "connected") {
          setCallSession((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "active",
                  startedAt: prev.startedAt ?? Date.now(),
                }
              : prev
          );
          return;
        }
        if (
          connection.connectionState === "failed" ||
          connection.connectionState === "disconnected" ||
          connection.connectionState === "closed"
        ) {
          closeCallSession(t("callEnded"));
        }
      };

      return connection;
    },
    [closeCallSession, sendCallSignal, t]
  );

  const flushPendingRemoteIceCandidates = useCallback(async () => {
    const connection = callPeerConnectionRef.current;
    if (!connection || !connection.remoteDescription) {
      return;
    }

    const queuedCandidates = [...pendingRemoteIceCandidatesRef.current];
    pendingRemoteIceCandidatesRef.current = [];

    for (const candidate of queuedCandidates) {
      try {
        await connection.addIceCandidate(candidate);
      } catch {
        // Ignore malformed or stale ICE candidates.
      }
    }
  }, []);

  const isAudioCallSupported = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
  }, []);

  const hangupCurrentCall = useCallback(async () => {
    const target = callTargetRef.current;
    closeCallSession();
    if (!target) {
      return;
    }
    await sendCallSignal(target.chatId, target.peerUserId, "hangup", {
      reason: "hangup",
    });
  }, [closeCallSession, sendCallSignal]);

  const startAudioCall = useCallback(async () => {
    if (!activeChat || activeChat.isGroup || !activeChat.memberId) {
      setCallNotice(t("callDirectOnly"));
      return;
    }
    if (callSession) {
      setCallNotice(t("callBusy"));
      return;
    }
    if (!isAudioCallSupported()) {
      setCallNotice(t("callBrowserNotSupported"));
      return;
    }

    const chatId = activeChat.id;
    const peerUserId = activeChat.memberId;
    callTargetRef.current = {
      chatId,
      peerUserId,
    };
    incomingOfferRef.current = null;
    pendingRemoteIceCandidatesRef.current = [];
    setCallSession({
      phase: "outgoing",
      chatId,
      peerUserId,
      peerName: activeChat.name,
      startedAt: null,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localCallStreamRef.current = stream;

      const connection = createCallPeerConnection(chatId, peerUserId);
      callPeerConnectionRef.current = connection;
      for (const track of stream.getTracks()) {
        connection.addTrack(track, stream);
      }

      const offer = await connection.createOffer({
        offerToReceiveAudio: true,
      });
      await connection.setLocalDescription(offer);
      const delivered = await sendCallSignal(chatId, peerUserId, "offer", {
        sdp: offer,
      });

      if (!delivered) {
        closeCallSession(t("callFailed"));
        return;
      }

      setCallSession((prev) =>
        prev
          ? {
              ...prev,
              phase: "connecting",
            }
          : prev
      );
    } catch {
      closeCallSession(t("micAccessDenied"));
    }
  }, [
    activeChat,
    callSession,
    closeCallSession,
    createCallPeerConnection,
    isAudioCallSupported,
    sendCallSignal,
    t,
  ]);

  const declineIncomingCall = useCallback(async () => {
    if (!callSession || callSession.phase !== "incoming") {
      return;
    }
    const target = callTargetRef.current;
    closeCallSession();
    if (!target) {
      return;
    }
    await sendCallSignal(target.chatId, target.peerUserId, "reject", {
      reason: "declined",
    });
  }, [callSession, closeCallSession, sendCallSignal]);

  const acceptIncomingCall = useCallback(async () => {
    if (!callSession || callSession.phase !== "incoming") {
      return;
    }
    if (!isAudioCallSupported()) {
      closeCallSession(t("callBrowserNotSupported"));
      return;
    }

    const offer = incomingOfferRef.current;
    if (!offer) {
      closeCallSession(t("callFailed"));
      return;
    }

    const target = callTargetRef.current;
    if (!target) {
      closeCallSession(t("callFailed"));
      return;
    }

    setCallSession((prev) =>
      prev
        ? {
            ...prev,
            phase: "connecting",
          }
        : prev
    );

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localCallStreamRef.current = stream;

      const connection = createCallPeerConnection(target.chatId, target.peerUserId);
      callPeerConnectionRef.current = connection;
      for (const track of stream.getTracks()) {
        connection.addTrack(track, stream);
      }

      await connection.setRemoteDescription(offer);
      await flushPendingRemoteIceCandidates();
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      const delivered = await sendCallSignal(
        target.chatId,
        target.peerUserId,
        "answer",
        {
          sdp: answer,
        }
      );

      if (!delivered) {
        closeCallSession(t("callFailed"));
        return;
      }

      setCallSession((prev) =>
        prev
          ? {
              ...prev,
              phase: "active",
              startedAt: Date.now(),
            }
          : prev
      );
    } catch {
      closeCallSession(t("micAccessDenied"));
      await sendCallSignal(target.chatId, target.peerUserId, "reject", {
        reason: "accept-failed",
      });
    }
  }, [
    callSession,
    closeCallSession,
    createCallPeerConnection,
    flushPendingRemoteIceCandidates,
    isAudioCallSupported,
    sendCallSignal,
    t,
  ]);

  const handleCallSignal = useCallback(
    async (signal: CallSignal) => {
      if (signal.toUserId !== currentUser.id) {
        return;
      }

      const activeTarget = callTargetRef.current;
      const fromUser = knownUsers.find((user) => user.id === signal.fromUserId);
      const peerName = fromUser?.name ?? t("unknownUser");

      if (signal.type === "offer") {
        const sdp = parseSignalSdp(signal.data);
        if (!sdp) {
          return;
        }
        if (callSession && callSession.phase !== "incoming") {
          await sendCallSignal(signal.chatId, signal.fromUserId, "reject", {
            reason: "busy",
          });
          return;
        }
        if (
          activeTarget &&
          (activeTarget.chatId !== signal.chatId ||
            activeTarget.peerUserId !== signal.fromUserId)
        ) {
          await sendCallSignal(signal.chatId, signal.fromUserId, "reject", {
            reason: "busy",
          });
          return;
        }

        incomingOfferRef.current = sdp;
        pendingRemoteIceCandidatesRef.current = [];
        callTargetRef.current = {
          chatId: signal.chatId,
          peerUserId: signal.fromUserId,
        };
        setCallSession({
          phase: "incoming",
          chatId: signal.chatId,
          peerUserId: signal.fromUserId,
          peerName,
          startedAt: null,
        });
        return;
      }

      if (
        !activeTarget ||
        activeTarget.chatId !== signal.chatId ||
        activeTarget.peerUserId !== signal.fromUserId
      ) {
        return;
      }

      if (signal.type === "answer") {
        const sdp = parseSignalSdp(signal.data);
        const connection = callPeerConnectionRef.current;
        if (!sdp || !connection) {
          return;
        }
        try {
          await connection.setRemoteDescription(sdp);
          await flushPendingRemoteIceCandidates();
          setCallSession((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "active",
                  startedAt: Date.now(),
                }
              : prev
          );
        } catch {
          closeCallSession(t("callFailed"));
        }
        return;
      }

      if (signal.type === "ice") {
        const candidate = parseSignalIceCandidate(signal.data);
        if (!candidate) {
          return;
        }
        const connection = callPeerConnectionRef.current;
        if (!connection || !connection.remoteDescription) {
          pendingRemoteIceCandidatesRef.current = [
            ...pendingRemoteIceCandidatesRef.current,
            candidate,
          ];
          return;
        }
        try {
          await connection.addIceCandidate(candidate);
        } catch {
          // Ignore malformed or stale ICE candidates.
        }
        return;
      }

      if (signal.type === "hangup") {
        closeCallSession(t("callEnded"));
        return;
      }

      if (signal.type === "reject") {
        const reason = parseSignalReason(signal.data);
        if (reason === "busy") {
          closeCallSession(t("callBusy"));
          return;
        }
        closeCallSession(t("callDeclined"));
      }
    },
    [
      callSession,
      closeCallSession,
      currentUser.id,
      flushPendingRemoteIceCandidates,
      knownUsers,
      sendCallSignal,
      t,
    ]
  );

  const pollCallSignals = useCallback(async () => {
    if (callSignalPollInFlightRef.current || isCallSignalingUnavailableRef.current) {
      return;
    }
    callSignalPollInFlightRef.current = true;

    try {
      const response = await fetch(
        `/api/messenger/call-signal?userId=${encodeURIComponent(currentUser.id)}`,
        {
          cache: "no-store",
          method: "GET",
        }
      );

      if (response.status === 404) {
        isCallSignalingUnavailableRef.current = true;
        return;
      }
      if (!response.ok) {
        return;
      }

      const payload = (await response
        .json()
        .catch(() => null)) as CallSignalPollResponse | null;
      const signals = Array.isArray(payload?.signals) ? payload.signals : [];
      for (const signal of signals) {
        await handleCallSignal(signal);
      }
    } catch {
      // Ignore transient signaling errors and continue polling.
    } finally {
      callSignalPollInFlightRef.current = false;
    }
  }, [currentUser.id, handleCallSignal]);

  const activeMessages = useMemo<RenderMessage[]>(() => {
    if (!activeChat) {
      return [];
    }
    const activeThread = threads.find((thread) => thread.id === activeChat.id);
    const peerReadAt =
      !activeChat.isGroup && activeChat.memberId
        ? activeThread?.readBy?.[activeChat.memberId] ?? 0
        : 0;

    return messages
      .filter((message) => message.chatId === activeChat.id)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message.id,
        author: message.authorId === currentUser.id ? "me" : "them",
        text: message.text,
        attachments: message.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          url: attachment.url,
          kind: getAttachmentKind(attachment.type),
        })),
        time: formatChatTime(message.createdAt, language),
        isReadByPeer:
          !activeChat.isGroup &&
          message.authorId === currentUser.id &&
          message.createdAt <= peerReadAt,
      }));
  }, [activeChat, messages, currentUser.id, language, threads]);

  const activeChatImages = useMemo(
    () =>
      activeMessages.flatMap((message) =>
        message.attachments
          .filter((attachment) => attachment.kind === "image")
          .map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            url: attachment.url,
          }))
      ),
    [activeMessages]
  );

  const availableUsers = useMemo(() => {
    const normalized = normalizeSearchQuery(query);
    return knownUsers.filter((user) => {
      if (user.id === currentUser.id) {
        return false;
      }
      if (!normalized.raw) {
        return true;
      }
      return (
        user.name.toLowerCase().includes(normalized.raw) ||
        user.username.toLowerCase().includes(normalized.username) ||
        user.email.toLowerCase().includes(normalized.raw)
      );
    });
  }, [knownUsers, query, currentUser.id]);
  const groupCandidates = useMemo(
    () => knownUsers.filter((user) => user.id !== currentUser.id),
    [knownUsers, currentUser.id]
  );

  const markChatAsRead = useCallback(
    async (chatId: string) => {
      const now = Date.now();
      setThreads((prev) => {
        return prev.map((thread) => {
          if (thread.id !== chatId) {
            return thread;
          }
          return {
            ...thread,
            readBy: {
              ...thread.readBy,
              [currentUser.id]: now,
            },
          };
        });
      });

      try {
        await requestJson<{ ok: boolean }>("/api/messenger/read", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId,
          }),
        });
      } catch {
        // UI state is already updated optimistically.
      }
    },
    [currentUser.id]
  );

  const openChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      setMobileView("chat");
      setPendingAttachments([]);
      setViewerImageId(null);
      void markChatAsRead(chatId);
    },
    [markChatAsRead]
  );

  const handlePushNotificationsChange = useCallback((enabled: boolean) => {
    setPushNotificationsEnabled(enabled);
    if (!enabled || !("Notification" in window)) {
      return;
    }
    if (window.Notification.permission === "default") {
      void window.Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const copyToClipboard = useCallback(async (value: string) => {
    if (!value.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }, []);

  const playIncomingMessageSound = useCallback(() => {
    if (!messageSoundEnabled) {
      return;
    }
    const audio = messageSoundRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [messageSoundEnabled]);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeChat) {
        return;
      }

      const chatId = activeChat.id;
      setMessages((prev) => prev.filter((message) => message.id !== messageId));

      try {
        await requestJson<{ ok: boolean }>("/api/messenger/delete-message", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId,
            messageId,
          }),
        });
      } finally {
        await loadChatData();
      }
    },
    [activeChat, currentUser.id, loadChatData]
  );

  useEffect(() => {
    if (!activeChat || activeSidebar !== "home") {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const isChatVisible = isDesktop || mobileView === "chat";
    if (!isChatVisible) {
      return;
    }

    const activeThread = threads.find((thread) => thread.id === activeChat.id);
    const readAt = activeThread?.readBy?.[currentUser.id] ?? 0;
    const hasUnreadIncoming = messages.some(
      (message) =>
        message.chatId === activeChat.id &&
        message.authorId !== currentUser.id &&
        message.createdAt > readAt
    );

    if (!hasUnreadIncoming) {
      return;
    }

    void markChatAsRead(activeChat.id);
  }, [
    activeChat,
    activeSidebar,
    mobileView,
    threads,
    messages,
    currentUser.id,
    markChatAsRead,
  ]);

  useEffect(() => {
    if (!hasLoadedInitialChatDataRef.current || !hasNotificationBaselineRef.current) {
      return;
    }

    const unseenMessages = messages.filter(
      (message) => !seenMessageIdsRef.current.has(message.id)
    );
    if (unseenMessages.length === 0) {
      return;
    }

    for (const message of unseenMessages) {
      seenMessageIdsRef.current.add(message.id);
    }

    const incomingUnseen = unseenMessages.filter(
      (message) => message.authorId !== currentUser.id
    );
    if (incomingUnseen.length === 0) {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const isChatVisible = activeSidebar === "home" && (isDesktop || mobileView === "chat");
    const isDocumentVisible = document.visibilityState === "visible";
    const incomingForAlert = incomingUnseen.filter((message) => {
      if (!isChatVisible || !isDocumentVisible) {
        return true;
      }
      return message.chatId !== activeChatId;
    });

    if (incomingForAlert.length === 0) {
      return;
    }

    playIncomingMessageSound();

    if (!pushNotificationsEnabled) {
      return;
    }

    if (document.visibilityState === "hidden") {
      setHiddenNotificationCount((prev) => prev + incomingForAlert.length);
    }

    if (!("Notification" in window) || window.Notification.permission !== "granted") {
      return;
    }

    const usersById = new Map(knownUsers.map((user) => [user.id, user]));
    const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
    const latestMessage = incomingForAlert[incomingForAlert.length - 1];
    const sender = usersById.get(latestMessage.authorId);
    const thread = threadsById.get(latestMessage.chatId);
    const isGroup = thread?.threadType === "group";
    const senderName = sender?.name ?? t("unknownUser");
    const chatName = isGroup
      ? thread?.title?.trim() || t("groupChat")
      : senderName;
    const title = isGroup ? `${senderName} • ${chatName}` : senderName;
    const baseBody =
      latestMessage.text.trim() ||
      (latestMessage.attachments.length > 0 ? t("attachment") : t("noMessagesYet"));
    const extraCount = incomingForAlert.length - 1;
    const body = extraCount > 0 ? `${baseBody} (+${extraCount})` : baseBody;

    try {
      const notification = new window.Notification(title, {
        body: body.slice(0, 180),
        tag: `chat-${latestMessage.chatId}`,
      });
      notification.onclick = () => {
        window.focus();
        setActiveSidebar("home");
        openChat(latestMessage.chatId);
        notification.close();
      };
    } catch {
      // Ignore browser notification failures and keep polling.
    }
  }, [
    activeChatId,
    activeSidebar,
    currentUser.id,
    knownUsers,
    messages,
    mobileView,
    openChat,
    playIncomingMessageSound,
    pushNotificationsEnabled,
    t,
    threads,
  ]);

  useEffect(() => {
    void pollCallSignals();
    const intervalId = window.setInterval(() => {
      void pollCallSignals();
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [pollCallSignals]);

  useEffect(() => {
    if (!callSession || callSession.phase !== "active" || !callSession.startedAt) {
      setCallDurationSeconds(0);
      return;
    }
    const startedAt = callSession.startedAt;

    const tick = () => {
      setCallDurationSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
      );
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [callSession]);

  useEffect(() => {
    if (!callNotice) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCallNotice("");
    }, 3200);
    return () => window.clearTimeout(timeoutId);
  }, [callNotice]);

  useEffect(() => {
    return () => {
      closeCallResources();
    };
  }, [closeCallResources]);

  const createOrOpenChat = async (targetUserId: string) => {
    if (targetUserId === currentUser.id) {
      return;
    }

    try {
      const result = await requestJson<OpenOrCreateResponse>(
        "/api/messenger/open-or-create",
        {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            targetUserId,
          }),
        }
      );
      setActiveChatId(result.chatId);
      setMobileView("chat");
      setQuery("");
      setPendingAttachments([]);
      setViewerImageId(null);
      await loadChatData();
    } catch {
      // Keep current view if API request failed.
    }
  };

  const toggleGroupMember = (userId: string) => {
    setGroupMemberIdsDraft((prev) =>
      prev.includes(userId)
        ? prev.filter((candidate) => candidate !== userId)
        : [...prev, userId]
    );
  };

  const createGroupChat = async () => {
    const title = groupNameDraft.trim();
    if (!title || groupMemberIdsDraft.length < 2) {
      return;
    }

    setIsCreatingGroup(true);
    try {
      const result = await requestJson<CreateGroupResponse>(
        "/api/messenger/create-group",
        {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            title,
            memberIds: groupMemberIdsDraft,
          }),
        }
      );
      setGroupNameDraft("");
      setGroupMemberIdsDraft([]);
      setIsGroupMenuOpen(false);
      setActiveChatId(result.chatId);
      setMobileView("chat");
      setQuery("");
      await loadChatData();
    } catch {
      // Keep draft data on API failure.
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const setChatPinned = async (chatId: string, pinned: boolean) => {
    const targetChat = chatItems.find((chat) => chat.id === chatId);
    if (pinned && !targetChat?.isPinned && pinnedChatsCount >= MAX_PINNED_CHATS) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== chatId) {
          return thread;
        }
        return {
          ...thread,
          pinnedBy: {
            ...thread.pinnedBy,
            [currentUser.id]: pinned,
          },
        };
      })
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/pin", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId,
          pinned,
        }),
      });
    } catch {
      await loadChatData();
    }
  };

  const deleteChat = async (chatId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== chatId));
    setMessages((prev) => prev.filter((message) => message.chatId !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMobileView("list");
      setPendingAttachments([]);
      setViewerImageId(null);
    }

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/delete", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId,
        }),
      });
      await loadChatData();
    } catch {
      await loadChatData();
    }
  };

  const leaveGroup = async (chatId: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== chatId) {
          return thread;
        }
        return {
          ...thread,
          memberIds: thread.memberIds.filter((memberId) => memberId !== currentUser.id),
        };
      })
    );

    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMobileView("list");
      setPendingAttachments([]);
      setViewerImageId(null);
    }

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/leave-group", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId,
        }),
      });
      await loadChatData();
    } catch {
      await loadChatData();
    }
  };

  const addChatAttachments = async (fileList: FileList | null) => {
    const files = fileList ? [...fileList] : [];
    if (files.length === 0) {
      return;
    }

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }
          reject(new Error("Unsupported file result."));
        };
        reader.onerror = () => reject(new Error("Unable to read file."));
        reader.readAsDataURL(file);
      });

    try {
      const loaded = await Promise.all(
        files.map(async (file, index) => {
          const url = await readAsDataUrl(file);
          return {
            id: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            url,
            kind: getAttachmentKind(file.type || "application/octet-stream"),
          } satisfies PendingAttachment;
        })
      );

      setPendingAttachments((prev) => [...prev, ...loaded].slice(0, 10));
    } catch {
      // Ignore failed file reads and keep existing attachments.
    }
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const openAttachmentPicker = () => {
    chatAttachmentInputRef.current?.click();
  };

  const insertEmojiToDraft = (emoji: string) => {
    const input = messageInputRef.current;
    if (!input) {
      setDraft((prev) => `${prev}${emoji}`);
      return;
    }

    const selectionStart = input.selectionStart ?? draft.length;
    const selectionEnd = input.selectionEnd ?? draft.length;
    const nextValue = `${draft.slice(0, selectionStart)}${emoji}${draft.slice(selectionEnd)}`;
    setDraft(nextValue);

    requestAnimationFrame(() => {
      input.focus();
      const nextCaret = selectionStart + emoji.length;
      input.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const sendMessage = async () => {
    const text = draft.trim();
    const attachments = pendingAttachments;
    if ((!text && attachments.length === 0) || !activeChat) {
      return;
    }

    setDraft("");
    setPendingAttachments([]);
    setIsEmojiMenuOpen(false);

    try {
      await requestJson<{ messageId: string; createdAt: number }>(
        "/api/messenger/send",
        {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: activeChat.id,
            text,
            attachments: attachments.map(
              (attachment): SendAttachmentPayload => ({
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                url: attachment.url,
              })
            ),
          }),
        }
      );
      await loadChatData();
    } catch {
      setDraft(text);
      setPendingAttachments(attachments);
    }
  };

  const selectedGroupChat = useMemo(
    () =>
      profileUserId
        ? chatItems.find((chat) => chat.isGroup && chat.id === profileUserId) ?? null
        : null,
    [chatItems, profileUserId]
  );
  const isGroupProfile = selectedGroupChat !== null;
  const isOwnProfile =
    !profileUserId ||
    profileUserId.trim() === "" ||
    (!isGroupProfile && profileUserId === currentUser.id);
  const viewedProfile = useMemo<ProfileData>(() => {
    if (isOwnProfile) {
      return profile;
    }
    if (selectedGroupChat) {
      return {
        name: selectedGroupChat.name,
        username: "",
        bio: `${selectedGroupChat.memberIds.length} ${t("members")}`,
        birthday: "",
        avatarUrl: selectedGroupChat.avatarUrl,
        bannerUrl: selectedGroupChat.bannerUrl,
      };
    }

    const user = knownUsers.find((candidate) => candidate.id === profileUserId);
    return {
      name: user?.name ?? t("unknownUser"),
      username: user?.username ?? "unknown",
      bio: user?.bio ?? "",
      birthday: user?.birthday ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      bannerUrl: user?.bannerUrl ?? "",
    };
  }, [isOwnProfile, profile, selectedGroupChat, t, knownUsers, profileUserId]);
  const groupParticipants = useMemo(() => {
    if (!selectedGroupChat) {
      return [];
    }

    return selectedGroupChat.memberIds.map((memberId) => {
      const user = knownUsers.find((candidate) => candidate.id === memberId);
      return {
        id: memberId,
        name: user?.name ?? t("unknownUser"),
        username: user?.username ?? "unknown",
        avatarUrl: user?.avatarUrl ?? "",
        isCreator: selectedGroupChat.createdById === memberId,
      };
    });
  }, [selectedGroupChat, knownUsers, t]);

  const viewedChatId = useMemo(() => {
    if (isOwnProfile || !profileUserId) {
      return null;
    }
    if (isGroupProfile) {
      return profileUserId;
    }
    if (activeChat && !activeChat.isGroup && activeChat.memberId === profileUserId) {
      return activeChat.id;
    }
    return (
      chatItems.find((chat) => !chat.isGroup && chat.memberId === profileUserId)?.id ??
      null
    );
  }, [isOwnProfile, profileUserId, isGroupProfile, activeChat, chatItems]);

  const profileHistoryMessages = useMemo(() => {
    if (!viewedChatId) {
      return [];
    }
    return messages
      .filter((message) => message.chatId === viewedChatId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [messages, viewedChatId]);

  const profileMediaItems = useMemo(() => {
    return profileHistoryMessages.flatMap((message) => {
      const textMediaUrls = extractMediaUrls(message.text);
      const attachmentMediaUrls = message.attachments
        .filter((attachment) => {
          const kind = getAttachmentKind(attachment.type);
          return kind === "image" || kind === "video";
        })
        .map((attachment) => attachment.url);
      const mediaUrls = [...new Set([...textMediaUrls, ...attachmentMediaUrls])];
      return mediaUrls.map((url, index) => ({
        id: `${message.id}-${index}`,
        url,
        name: getMediaNameFromUrl(url),
        kind: getMediaKindFromUrl(url),
        time: formatChatTime(message.createdAt, language),
      }));
    });
  }, [profileHistoryMessages, language]);
  const profileMediaImages = useMemo(
    () =>
      profileMediaItems
        .filter((item) => item.kind === "image")
        .map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
        })),
    [profileMediaItems]
  );
  const viewerImages = viewerSource === "profile" ? profileMediaImages : activeChatImages;
  const activeViewerIndex = useMemo(
    () =>
      viewerImageId
        ? viewerImages.findIndex((image) => image.id === viewerImageId)
        : -1,
    [viewerImages, viewerImageId]
  );
  const viewerImage =
    activeViewerIndex >= 0 ? viewerImages[activeViewerIndex] : null;

  const closeImageViewer = useCallback(() => {
    setViewerImageId(null);
  }, []);

  const openImageViewer = useCallback(
    (imageId: string, source: "chat" | "profile" = "chat") => {
      setViewerSource(source);
      setViewerImageId(imageId);
    },
    []
  );

  const showPreviousImage = useCallback(() => {
    if (viewerImages.length === 0) {
      return;
    }
    const nextIndex =
      activeViewerIndex <= 0 ? viewerImages.length - 1 : activeViewerIndex - 1;
    setViewerImageId(viewerImages[nextIndex].id);
  }, [viewerImages, activeViewerIndex]);

  const showNextImage = useCallback(() => {
    if (viewerImages.length === 0) {
      return;
    }
    const nextIndex =
      activeViewerIndex >= viewerImages.length - 1 ? 0 : activeViewerIndex + 1;
    setViewerImageId(viewerImages[nextIndex].id);
  }, [viewerImages, activeViewerIndex]);

  useEffect(() => {
    setViewerImageId(null);
  }, [activeChat?.id]);

  useEffect(() => {
    if (!viewerImage) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeImageViewer();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerImage, closeImageViewer, showPreviousImage, showNextImage]);

  const profileLinkItems = useMemo(() => {
    return profileHistoryMessages.flatMap((message) => {
      const textUrls = extractUrls(message.text).filter(
        (url) => !IMAGE_EXTENSION_PATTERN.test(url)
      );
      const fileAttachmentUrls = message.attachments
        .filter((attachment) => getAttachmentKind(attachment.type) === "file")
        .map((attachment) => attachment.url);
      const urls = [...new Set([...textUrls, ...fileAttachmentUrls])];
      return urls.map((url, index) => ({
        id: `${message.id}-link-${index}`,
        url,
        time: formatChatTime(message.createdAt, language),
      }));
    });
  }, [profileHistoryMessages, language]);

  const availableProfileTabs = useMemo<
    { id: ProfileTabId; label: string; count: number }[]
  >(() => {
    if (isOwnProfile) {
      return [];
    }

    const tabs: { id: ProfileTabId; label: string; count: number }[] = [];
    if (profileMediaItems.length > 0) {
      tabs.push({
        id: "media",
        label: t("media"),
        count: profileMediaItems.length,
      });
    }
    if (profileLinkItems.length > 0) {
      tabs.push({
        id: "links",
        label: t("links"),
        count: profileLinkItems.length,
      });
    }
    return tabs;
  }, [
    isOwnProfile,
    profileMediaItems.length,
    profileLinkItems.length,
    t,
  ]);

  useEffect(() => {
    if (isOwnProfile) {
      return;
    }
    const hasCurrent = availableProfileTabs.some((tab) => tab.id === profileTab);
    if (!hasCurrent) {
      setProfileTab(availableProfileTabs[0]?.id ?? "media");
    }
  }, [isOwnProfile, availableProfileTabs, profileTab]);

  const openOwnProfile = () => {
    setProfileUserId(null);
    setProfileTab("media");
    setIsEditingProfile(false);
    setActiveSidebar("profile");
  };

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "q") {
        setActiveSidebar("home");
      } else if (key === "w") {
        openOwnProfile();
      } else if (key === "e") {
        setActiveSidebar("settings");
      } else {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [openOwnProfile]);

  const openActiveChatProfile = () => {
    if (!activeChat) {
      return;
    }
    if (activeChat.isGroup) {
      setProfileUserId(activeChat.id);
    } else if (activeChat.memberId) {
      setProfileUserId(activeChat.memberId);
    } else {
      return;
    }
    setProfileTab("media");
    setIsEditingProfile(false);
    setActiveSidebar("profile");
  };

  const profileInitials = useMemo(() => {
    return viewedProfile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [viewedProfile.name]);

  const startProfileEdit = () => {
    setProfileDraft(profile);
    setBirthdayDraft(parseBirthdayParts(profile.birthday));
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setProfileDraft(profile);
    setBirthdayDraft(parseBirthdayParts(profile.birthday));
    setIsEditingProfile(false);
    setImagePickerTarget(null);
  };

  const saveProfileEdit = async () => {
    const trimmedName = profileDraft.name.trim();
    const trimmedUsername = profileDraft.username.trim().replace(/^@+/, "");
    const trimmedBio = profileDraft.bio.trim();
    const trimmedBirthday = profileDraft.birthday.trim();
    const trimmedAvatarUrl = profileDraft.avatarUrl.trim();
    const trimmedBannerUrl = profileDraft.bannerUrl.trim();

    if (!trimmedName || !trimmedUsername) {
      return;
    }

    setProfile({
      ...profileDraft,
      name: trimmedName,
      username: trimmedUsername,
      bio: trimmedBio,
      birthday: trimmedBirthday,
      avatarUrl: trimmedAvatarUrl,
      bannerUrl: trimmedBannerUrl,
    });
    await onProfileUpdate?.({
      name: trimmedName,
      username: trimmedUsername,
      bio: trimmedBio,
      birthday: trimmedBirthday,
      avatarUrl: trimmedAvatarUrl,
      bannerUrl: trimmedBannerUrl,
    });
    setIsEditingProfile(false);
  };

  const updateGroupProfileImages = async (payload: {
    avatarUrl: string;
    bannerUrl: string;
  }) => {
    const groupChatId = selectedGroupChat?.id;
    if (!groupChatId) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== groupChatId) {
          return thread;
        }
        return {
          ...thread,
          avatarUrl: payload.avatarUrl,
          bannerUrl: payload.bannerUrl,
        };
      })
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/group-profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          avatarUrl: payload.avatarUrl,
          bannerUrl: payload.bannerUrl,
        }),
      });
    } catch {
      await loadChatData();
    }
  };

  const handleProfileImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "avatarUrl" | "bannerUrl"
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        return;
      }

      if (isGroupProfile && selectedGroupChat) {
        const payload = {
          avatarUrl: target === "avatarUrl" ? result : selectedGroupChat.avatarUrl,
          bannerUrl: target === "bannerUrl" ? result : selectedGroupChat.bannerUrl,
        };
        void updateGroupProfileImages(payload);
        return;
      }

      if (!isEditingProfile) {
        const nextProfile: ProfileData = {
          ...profile,
          [target]: result,
        };
        setProfile(nextProfile);
        setProfileDraft(nextProfile);
        void onProfileUpdate?.({
          name: nextProfile.name,
          username: nextProfile.username,
          bio: nextProfile.bio,
          birthday: nextProfile.birthday,
          avatarUrl: nextProfile.avatarUrl,
          bannerUrl: nextProfile.bannerUrl,
        });
        return;
      }

      setProfileDraft((prev) => ({ ...prev, [target]: result }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const openImagePickerDialog = (target: "avatar" | "banner") => {
    if (!isOwnProfile && !isGroupProfile) {
      return;
    }
    setImagePickerTarget(target);
  };

  const triggerImagePick = () => {
    const target = imagePickerTarget;
    setImagePickerTarget(null);

    window.setTimeout(() => {
      if (target === "avatar") {
        avatarFileInputRef.current?.click();
      } else if (target === "banner") {
        bannerFileInputRef.current?.click();
      }
    }, 0);
  };

  const removeSelectedImage = () => {
    const target = imagePickerTarget;
    if (!target) {
      return;
    }

    if (isGroupProfile && selectedGroupChat) {
      void updateGroupProfileImages({
        avatarUrl: target === "avatar" ? "" : selectedGroupChat.avatarUrl,
        bannerUrl: target === "banner" ? "" : selectedGroupChat.bannerUrl,
      });
      setImagePickerTarget(null);
      return;
    }

    if (!isEditingProfile) {
      const nextProfile: ProfileData = {
        ...profile,
        avatarUrl: target === "avatar" ? "" : profile.avatarUrl,
        bannerUrl: target === "banner" ? "" : profile.bannerUrl,
      };
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      void onProfileUpdate?.({
        name: nextProfile.name,
        username: nextProfile.username,
        bio: nextProfile.bio,
        birthday: nextProfile.birthday,
        avatarUrl: nextProfile.avatarUrl,
        bannerUrl: nextProfile.bannerUrl,
      });
      setImagePickerTarget(null);
      return;
    }

    if (target === "avatar") {
      setProfileDraft((prev) => ({ ...prev, avatarUrl: "" }));
    } else {
      setProfileDraft((prev) => ({ ...prev, bannerUrl: "" }));
    }
    setImagePickerTarget(null);
  };

  const selectedImageExists =
    isGroupProfile && selectedGroupChat
      ? imagePickerTarget === "avatar"
        ? Boolean(selectedGroupChat.avatarUrl)
        : imagePickerTarget === "banner"
          ? Boolean(selectedGroupChat.bannerUrl)
          : false
      : imagePickerTarget === "avatar"
        ? Boolean(profileDraft.avatarUrl)
        : imagePickerTarget === "banner"
          ? Boolean(profileDraft.bannerUrl)
          : false;

  return (
    <>
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => handleProfileImageFileChange(event, "avatarUrl")}
        className="hidden"
      />
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => handleProfileImageFileChange(event, "bannerUrl")}
        className="hidden"
      />
      <input
        ref={chatAttachmentInputRef}
        type="file"
        multiple
        onChange={(event) => {
          void addChatAttachments(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />
      <main className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_10%_8%,rgba(132,204,22,0.14),transparent_32%),radial-gradient(circle_at_88%_0%,rgba(132,204,22,0.09),transparent_28%),linear-gradient(160deg,#151515_0%,#1f1f1f_55%,#2a2a2a_100%)] text-zinc-100">
      <section className="flex h-full w-full">
        <div className="flex h-full w-full overflow-hidden border border-zinc-700 bg-zinc-900/85">
          <aside className="flex w-[82px] flex-col border-r border-zinc-700 bg-zinc-800 p-3 text-zinc-100">
            <nav className="mt-1 flex flex-1 flex-col gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeSidebar;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "profile") {
                        openOwnProfile();
                        return;
                      }
                      setActiveSidebar(item.id);
                    }}
                    className={`relative flex items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium ${
                      active
                        ? "border-lime-500 bg-lime-500 text-zinc-900"
                        : "border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100"
                    }`}
                    aria-label={t(item.id)}
                    title={t(item.id)}
                  >
                    <Icon className="size-4 shrink-0" />
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1">
            {activeSidebar === "home" ? (
              <>
                <aside
              className={`${
                mobileView === "chat" ? "hidden" : "flex"
              } w-full flex-col border-r border-zinc-700 bg-zinc-800/95 md:flex md:w-[380px]`}
            >
              <div className="border-b border-zinc-700 px-5 py-5">
                <div className="mt-2 flex items-center justify-between gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                    {t("chats")}
                  </h1>
                  <Button
                    type="button"
                    onClick={() => setIsGroupMenuOpen(true)}
                    aria-label={t("newGroup")}
                    title={t("newGroup")}
                    className="h-9 w-9 rounded-lg bg-lime-500 p-0 text-zinc-900 hover:bg-lime-400"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder={t("searchChat")}
                    className="h-11 rounded-lg border-zinc-600 bg-zinc-700 pl-9 text-zinc-100 placeholder:text-zinc-400"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <AlertDialog open={isGroupMenuOpen} onOpenChange={setIsGroupMenuOpen}>
                <AlertDialogContent className="border border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-zinc-100">
                      {t("newGroup")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      {t("groupMembers")}: {groupMemberIdsDraft.length}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={groupNameDraft}
                      onChange={(event) => setGroupNameDraft(event.target.value)}
                      placeholder={t("groupName")}
                      className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-400"
                    />
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                      {groupCandidates.map((user) => {
                        const selected = groupMemberIdsDraft.includes(user.id);
                        return (
                          <button
                            key={`group-dialog-${user.id}`}
                            type="button"
                            onClick={() => toggleGroupMember(user.id)}
                            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                              selected
                                ? "border-lime-500/50 bg-zinc-700 text-zinc-100"
                                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            <span className="truncate">{user.name}</span>
                            {selected ? <Check className="size-4 text-lime-400" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                      {t("cancel")}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      onClick={() => void createGroupChat()}
                      disabled={
                        isCreatingGroup ||
                        groupNameDraft.trim().length === 0 ||
                        groupMemberIdsDraft.length < 2
                      }
                      className="h-10 rounded-lg bg-lime-500 text-zinc-900 hover:bg-lime-400"
                    >
                      {t("createGroup")}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {visiblePinnedChats.length > 0 ? (
                  <div className="space-y-2">
                    <p className="px-1 pb-1 text-xs uppercase tracking-[0.12em] text-lime-400/90">
                      {t("pinnedChats")}
                    </p>
                    {visiblePinnedChats.map((chat) => {
                      const selected = chat.id === activeChat?.id;
                      const pinLimitReached =
                        !chat.isPinned && pinnedChatsCount >= MAX_PINNED_CHATS;
                      return (
                        <ContextMenu key={chat.id}>
                          <ContextMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={() => openChat(chat.id)}
                              className={`w-full rounded-lg border px-3 py-3 text-left ${
                                selected
                                  ? "border-lime-400/35 bg-zinc-700 text-zinc-100"
                                  : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700/90"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {chat.avatarUrl ? (
                                  <span
                                    className="inline-flex size-10 shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${chat.avatarUrl})` }}
                                    aria-label={`${chat.name} avatar`}
                                  />
                                ) : (
                                  <span
                                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white ${chat.accent}`}
                                  >
                                    {chat.isGroup ? <Users className="size-4" /> : chat.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="truncate font-medium">
                                      {chat.name}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        selected ? "text-lime-300" : "text-zinc-500"
                                      }`}
                                    >
                                      {chat.lastTime}
                                    </span>
                                  </span>
                                  <span
                                    className={`mt-1 block truncate text-sm ${
                                      selected ? "text-zinc-300" : "text-zinc-400"
                                    }`}
                                  >
                                    {chat.lastMessage}
                                  </span>
                                </span>
                                <Pin className="size-4 shrink-0 text-lime-400" />
                                {chat.unread > 0 ? (
                                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-lime-400 px-2 py-0.5 text-xs font-semibold text-zinc-900">
                                    {chat.unread}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-52 border border-zinc-700 bg-zinc-900/95 p-1 text-zinc-100 shadow-xl backdrop-blur">
                            <ContextMenuItem
                              className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-lime-500/20 focus:text-lime-300"
                              onSelect={() => void setChatPinned(chat.id, !chat.isPinned)}
                              disabled={pinLimitReached}
                            >
                              {chat.isPinned ? (
                                <PinOff className="size-4" />
                              ) : (
                                <Pin className="size-4" />
                              )}
                              {chat.isPinned ? t("unpinChat") : t("pinChat")}
                            </ContextMenuItem>
                            <ContextMenuSeparator className="mx-1 bg-zinc-700/80" />
                            {chat.isGroup && !chat.isGroupCreator ? (
                              <ContextMenuItem
                                variant="destructive"
                                className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-red-500/15"
                                onSelect={() => void leaveGroup(chat.id)}
                              >
                                <ArrowLeft className="size-4" />
                                {t("leaveGroup")}
                              </ContextMenuItem>
                            ) : (
                              <ContextMenuItem
                                variant="destructive"
                                className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-red-500/15"
                                onSelect={() => void deleteChat(chat.id)}
                              >
                                <Trash2 className="size-4" />
                                {chat.isGroup ? t("deleteGroup") : t("deleteForBoth")}
                              </ContextMenuItem>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </div>
                ) : null}
                {visibleRegularChats.length > 0 ? (
                  <div className="space-y-2">
                    {visiblePinnedChats.length > 0 ? (
                      <p className="px-1 pb-1 pt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                        {t("allChats")}
                      </p>
                    ) : null}
                    {visibleRegularChats.map((chat) => {
                  const selected = chat.id === activeChat?.id;
                  const pinLimitReached =
                    !chat.isPinned && pinnedChatsCount >= MAX_PINNED_CHATS;
                  return (
                    <ContextMenu key={chat.id}>
                      <ContextMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={() => openChat(chat.id)}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected
                              ? "border-lime-400/35 bg-zinc-700 text-zinc-100"
                              : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700/90"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {chat.avatarUrl ? (
                              <span
                                className="inline-flex size-10 shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center"
                                style={{ backgroundImage: `url(${chat.avatarUrl})` }}
                                aria-label={`${chat.name} avatar`}
                              />
                            ) : (
                              <span
                                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white ${chat.accent}`}
                              >
                                {chat.isGroup ? <Users className="size-4" /> : chat.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium">
                                  {chat.name}
                                </span>
                                <span
                                  className={`text-xs ${
                                    selected ? "text-lime-300" : "text-zinc-500"
                                  }`}
                                >
                                  {chat.lastTime}
                                </span>
                              </span>
                              <span
                                className={`mt-1 block truncate text-sm ${
                                  selected ? "text-zinc-300" : "text-zinc-400"
                                }`}
                              >
                                {chat.lastMessage}
                              </span>
                            </span>
                            {chat.unread > 0 ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-lime-400 px-2 py-0.5 text-xs font-semibold text-zinc-900">
                                {chat.unread}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-52 border border-zinc-700 bg-zinc-900/95 p-1 text-zinc-100 shadow-xl backdrop-blur">
                        <ContextMenuItem
                          className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-lime-500/20 focus:text-lime-300"
                          onSelect={() => void setChatPinned(chat.id, !chat.isPinned)}
                          disabled={pinLimitReached}
                        >
                          {chat.isPinned ? (
                            <PinOff className="size-4" />
                          ) : (
                            <Pin className="size-4" />
                          )}
                          {chat.isPinned ? t("unpinChat") : t("pinChat")}
                        </ContextMenuItem>
                        <ContextMenuSeparator className="mx-1 bg-zinc-700/80" />
                        {chat.isGroup && !chat.isGroupCreator ? (
                          <ContextMenuItem
                            variant="destructive"
                            className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-red-500/15"
                            onSelect={() => void leaveGroup(chat.id)}
                          >
                            <ArrowLeft className="size-4" />
                            {t("leaveGroup")}
                          </ContextMenuItem>
                        ) : (
                          <ContextMenuItem
                            variant="destructive"
                            className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-red-500/15"
                            onSelect={() => void deleteChat(chat.id)}
                          >
                            <Trash2 className="size-4" />
                            {chat.isGroup ? t("deleteGroup") : t("deleteForBoth")}
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                    })}
                  </div>
                ) : null}
                {query.trim().length > 0 && availableUsers.length > 0 ? (
                  <div className="pt-1">
                    <p className="px-1 pb-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
                      {t("users")}
                    </p>
                    <div className="space-y-2">
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => createOrOpenChat(user.id)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-700 px-3 py-3 text-left hover:bg-zinc-600"
                        >
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-zinc-400">
                            @{user.username}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {filteredChats.length === 0 && availableUsers.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-zinc-500">
                    {query.trim().length > 0
                      ? t("noChatsOrUsersFound")
                      : t("noChatsYet")}
                  </p>
                ) : null}
              </div>
                </aside>

                <div
              className={`${
                mobileView === "list" ? "hidden" : "flex"
              } min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#202020_0%,#2a2a2a_100%)] md:flex`}
            >
              {activeChat ? (
                <>
                  <header
                    className="flex cursor-pointer items-center gap-3 border-b border-zinc-700 bg-zinc-800 px-4 py-4 sm:px-6"
                    onClick={openActiveChatProfile}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 md:hidden"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMobileView("list");
                      }}
                    >
                      <ArrowLeft />
                    </Button>
                    <div className="-ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 pl-3 text-left">
                      {activeChat.avatarUrl ? (
                        <span
                          className="inline-flex size-10 shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center"
                          style={{ backgroundImage: `url(${activeChat.avatarUrl})` }}
                          aria-label={`${activeChat.name} avatar`}
                        />
                      ) : (
                        <span
                          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white ${activeChat.accent}`}
                        >
                          {activeChat.isGroup ? <Users className="size-4" /> : activeChat.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                      <p className="truncate font-semibold text-zinc-100">
                        {activeChat.name}
                      </p>
                      <p
                        className={`text-sm ${
                          activeChat.isGroup
                            ? "text-zinc-500"
                            : "text-zinc-500"
                        }`}
                      >
                        {activeChat.isGroup
                          ? `${Math.max(2, activeChat.memberIds.length)} ${t("members")}`
                          : activeChatLastSeenText}
                      </p>
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={callChatMatchesActive ? t("endCall") : t("call")}
                        onClick={() => {
                          if (callChatMatchesActive) {
                            void hangupCurrentCall();
                            return;
                          }
                          void startAudioCall();
                        }}
                        disabled={shouldDisableCallButton && !callChatMatchesActive}
                        className="border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                        title={t("audioCallOnly")}
                      >
                        {callChatMatchesActive ? <PhoneOff /> : <Phone />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("menu")}
                        className="border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100"
                      >
                        <MoreVertical />
                      </Button>
                    </div>
                  </header>

                  <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-6">
                    {activeMessages.map((message) => {
                      const hasMessageText = message.text.trim().length > 0;
                      const firstAttachmentUrl = message.attachments[0]?.url ?? "";
                      const canDeleteMessage = message.author === "me";
                      const hasCopyActions = hasMessageText || firstAttachmentUrl.length > 0;

                      return (
                        <ContextMenu key={message.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className={`flex ${
                                message.author === "me" ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[70%] ${
                                  message.author === "me"
                                    ? "bg-lime-500 text-zinc-900"
                                    : "border border-zinc-600 bg-zinc-700 text-zinc-100"
                                }`}
                              >
                                {message.text ? (
                                  <p className="text-sm leading-6">{message.text}</p>
                                ) : null}
                                {message.attachments.length > 0 ? (
                                  <div className={`${message.text ? "mt-2" : ""} space-y-2`}>
                                    {message.attachments.map((attachment) => {
                                      if (attachment.kind === "image") {
                                        return (
                                          <button
                                            key={attachment.id}
                                            type="button"
                                            onClick={() => openImageViewer(attachment.id)}
                                            className="block overflow-hidden rounded-lg border border-zinc-400/30 bg-black/10"
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.name}
                                              className="max-h-64 w-full cursor-zoom-in object-cover"
                                            />
                                          </button>
                                        );
                                      }
                                      if (attachment.kind === "video") {
                                        return (
                                          <video
                                            key={attachment.id}
                                            controls
                                            className="max-h-64 w-full rounded-lg border border-zinc-400/30 bg-black/30"
                                            src={attachment.url}
                                          />
                                        );
                                      }
                                      return (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          download={attachment.name}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                            message.author === "me"
                                              ? "border-zinc-900/30 bg-zinc-900/10"
                                              : "border-zinc-500/40 bg-zinc-800/70"
                                          }`}
                                        >
                                          <span className="truncate">{attachment.name}</span>
                                          <span
                                            className={`ml-3 shrink-0 text-xs ${
                                              message.author === "me"
                                                ? "text-zinc-900/70"
                                                : "text-zinc-400"
                                            }`}
                                          >
                                            {formatFileSize(attachment.size)}
                                          </span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                ) : null}
                                <div
                                  className={`mt-1 flex items-center gap-1 text-right text-xs ${
                                    message.author === "me"
                                      ? "justify-end text-zinc-900/70"
                                      : "justify-end text-zinc-500"
                                  }`}
                                >
                                  <span>{message.time}</span>
                                  {message.author === "me" ? (
                                    message.isReadByPeer ? (
                                      <CheckCheck className="size-3 text-emerald-800" />
                                    ) : (
                                      <Check className="size-3" />
                                    )
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56 border border-zinc-700 bg-zinc-900/95 p-1 text-zinc-100 shadow-xl backdrop-blur">
                            {hasMessageText ? (
                              <ContextMenuItem
                                className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-lime-500/20 focus:text-lime-300"
                                onSelect={() => void copyToClipboard(message.text)}
                              >
                                <Copy className="size-4" />
                                {t("copyText")}
                              </ContextMenuItem>
                            ) : null}
                            {firstAttachmentUrl ? (
                              <ContextMenuItem
                                className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-lime-500/20 focus:text-lime-300"
                                onSelect={() => void copyToClipboard(firstAttachmentUrl)}
                              >
                                <Copy className="size-4" />
                                {t("copyAttachmentLink")}
                              </ContextMenuItem>
                            ) : null}
                            {canDeleteMessage ? (
                              <>
                                {hasCopyActions ? (
                                  <ContextMenuSeparator className="mx-1 bg-zinc-700/80" />
                                ) : null}
                                <ContextMenuItem
                                  variant="destructive"
                                  className="rounded-md px-2.5 py-2 text-sm font-medium focus:bg-red-500/15"
                                  onSelect={() => void deleteMessage(message.id)}
                                >
                                  <Trash2 className="size-4" />
                                  {t("deleteMessage")}
                                </ContextMenuItem>
                              </>
                            ) : null}
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </div>

                  <form
                    className="border-t border-zinc-700 bg-zinc-800 p-3 sm:p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    {pendingAttachments.length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {pendingAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-600 bg-zinc-700 px-3 py-1 text-xs text-zinc-100"
                          >
                            <span className="truncate">
                              {attachment.name} • {formatFileSize(attachment.size)}
                            </span>
                            <button
                              type="button"
                              aria-label={t("removeAttachment")}
                              className="inline-flex rounded-full p-0.5 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100"
                              onClick={() => removePendingAttachment(attachment.id)}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div ref={emojiMenuRef} className="relative flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("attachFiles")}
                        title={t("attachFiles")}
                        className="h-11 w-11 shrink-0 border border-zinc-600 bg-zinc-700 text-zinc-200 hover:border-lime-500 hover:bg-zinc-600 hover:text-lime-300"
                        onClick={openAttachmentPicker}
                      >
                        <Paperclip className="size-4" />
                      </Button>
                      <div className="relative flex-1">
                        <div
                          className={`absolute bottom-12 right-0 z-50 w-[min(360px,calc(100vw-3rem))] rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl transition-all duration-150 ${
                            isEmojiMenuOpen
                              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                              : "pointer-events-none translate-y-2 scale-95 opacity-0"
                          }`}
                          onMouseEnter={openEmojiMenu}
                          onMouseLeave={scheduleCloseEmojiMenu}
                        >
                          <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500">
                            <div className="grid grid-cols-8 gap-1">
                              {CHAT_SMILEY_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmojiToDraft(emoji)}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-zinc-700"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Input
                          ref={messageInputRef}
                          placeholder={t("typeMessage")}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          className="h-11 rounded-lg border-zinc-600 bg-zinc-700 pr-12 text-zinc-100 placeholder:text-zinc-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Emoji"
                          title="Emoji"
                          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md border-0 bg-transparent p-0 text-zinc-300 shadow-none hover:bg-transparent hover:text-lime-300 focus-visible:ring-0"
                          onClick={() => setIsEmojiMenuOpen((prev) => !prev)}
                          onMouseEnter={openEmojiMenu}
                          onMouseLeave={scheduleCloseEmojiMenu}
                        >
                          <Smile className="size-4" />
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        className="h-11 shrink-0 rounded-lg bg-lime-500 px-4 text-zinc-900 hover:bg-lime-400"
                        disabled={draft.trim().length === 0 && pendingAttachments.length === 0}
                      >
                        <SendHorizontal />
                        {t("send")}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-zinc-500">{t("selectChat")}</p>
                </div>
              )}
                </div>
              </>
            ) : null}
                        {activeSidebar === "profile" ? (
              <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#202020_0%,#2a2a2a_100%)]">
                <AlertDialog
                  open={imagePickerTarget !== null}
                  onOpenChange={(open) => {
                    if (!open) {
                      setImagePickerTarget(null);
                    }
                  }}
                >
                  <AlertDialogContent className="border border-zinc-700 bg-zinc-900 text-zinc-100">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {imagePickerTarget === "avatar"
                          ? t("avatarActions")
                          : t("bannerActions")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        <span className="block">
                          {imagePickerTarget === "avatar"
                            ? t("avatarActionsHint")
                            : t("bannerActionsHint")}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {imagePickerTarget === "avatar"
                            ? t("avatarSizeHint")
                            : t("bannerSizeHint")}
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <AlertDialogCancel className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                        {t("cancel")}
                      </AlertDialogCancel>
                      {selectedImageExists ? (
                        <AlertDialogAction
                          variant="outline"
                          className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          onClick={removeSelectedImage}
                        >
                          {t("remove")}
                        </AlertDialogAction>
                      ) : null}
                      <AlertDialogAction
                        className="bg-lime-500 text-zinc-900 hover:bg-lime-400"
                        onClick={triggerImagePick}
                      >
                        {t("changeFile")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div
                  className={`h-36 w-full sm:h-44 ${
                    viewedProfile.bannerUrl
                      ? "bg-zinc-800 bg-cover bg-center"
                      : "bg-[linear-gradient(130deg,#65a30d_0%,#3f6212_45%,#27272a_100%)]"
                  } ${isOwnProfile || isGroupProfile ? "cursor-pointer" : ""}`}
                  style={
                    viewedProfile.bannerUrl
                      ? {
                          backgroundImage: `linear-gradient(130deg,rgba(39,39,42,0.45),rgba(24,24,27,0.55)),url(${viewedProfile.bannerUrl})`,
                        }
                      : undefined
                  }
                  onClick={() => openImagePickerDialog("banner")}
                />
                <div className="border-b border-zinc-700 px-4 pb-4 sm:px-6">
                  <div className="-mt-12 flex items-end justify-between sm:-mt-14">
                    {viewedProfile.avatarUrl ? (
                      <span
                        className={`inline-flex size-24 shrink-0 rounded-full border-4 border-zinc-900 bg-zinc-800 bg-cover bg-center sm:size-28 ${
                          isOwnProfile || isGroupProfile ? "cursor-pointer" : ""
                        }`}
                        style={{ backgroundImage: `url(${viewedProfile.avatarUrl})` }}
                        aria-label={`${viewedProfile.name} avatar`}
                        onClick={() => openImagePickerDialog("avatar")}
                      />
                    ) : (
                      <span
                        className={`inline-flex size-24 items-center justify-center rounded-full border-4 border-zinc-900 bg-lime-500 text-2xl font-semibold text-zinc-900 sm:size-28 ${
                          isOwnProfile || isGroupProfile ? "cursor-pointer" : ""
                        }`}
                        onClick={() => openImagePickerDialog("avatar")}
                      >
                        {profileInitials || "LW"}
                      </span>
                    )}
                    {isOwnProfile && isEditingProfile ? (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={cancelProfileEdit}
                          className="rounded-full border border-zinc-600 bg-zinc-800 px-4 text-zinc-200 hover:bg-zinc-700"
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          type="button"
                          onClick={saveProfileEdit}
                          className="rounded-full bg-lime-500 px-4 text-zinc-900 hover:bg-lime-400"
                        >
                          {t("save")}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {isOwnProfile ? (
                          <Button
                            type="button"
                            onClick={startProfileEdit}
                            className="rounded-full bg-lime-500 px-4 text-zinc-900 hover:bg-lime-400"
                          >
                            {t("editProfile")}
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    {isOwnProfile && isEditingProfile ? (
                      <div className="space-y-3">
                        <Input
                          value={profileDraft.name}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          placeholder={t("name")}
                          className="h-10 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                        />
                        <Input
                          value={profileDraft.username}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              username: event.target.value.replace(/^@+/, ""),
                            }))
                          }
                          placeholder={t("username")}
                          className="h-10 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                        />
                        <Textarea
                          value={profileDraft.bio}
                          onChange={(event) =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              bio: event.target.value,
                            }))
                          }
                          placeholder={t("bio")}
                          className="min-h-24 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={birthdayDraft.day || undefined}
                            onValueChange={(value) =>
                              handleBirthdayPartChange("day", value)
                            }
                          >
                            <SelectTrigger className="h-10 flex-1 border-zinc-600 bg-zinc-700 text-zinc-100 hover:bg-zinc-600">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {birthdayDayOptions.map((day) => (
                                <SelectItem
                                  key={day}
                                  value={day}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900"
                                >
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={birthdayDraft.month || undefined}
                            onValueChange={(value) =>
                              handleBirthdayPartChange("month", value)
                            }
                          >
                            <SelectTrigger className="h-10 flex-1 border-zinc-600 bg-zinc-700 text-zinc-100 hover:bg-zinc-600">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {birthdayMonthOptions.map((month) => (
                                <SelectItem
                                  key={month.value}
                                  value={month.value}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900"
                                >
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={birthdayDraft.year || undefined}
                            onValueChange={(value) =>
                              handleBirthdayPartChange("year", value)
                            }
                          >
                            <SelectTrigger className="h-10 flex-1 border-zinc-600 bg-zinc-700 text-zinc-100 hover:bg-zinc-600">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {birthdayYearOptions.map((year) => (
                                <SelectItem
                                  key={year}
                                  value={year}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900"
                                >
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {profileDraft.birthday ? (
                            <button
                              type="button"
                              onClick={() => {
                                setBirthdayDraft({ year: "", month: "", day: "" });
                                setProfileDraft((prev) => ({
                                  ...prev,
                                  birthday: "",
                                }));
                              }}
                              className="h-10 rounded-lg border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-600"
                            >
                              {t("remove")}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-semibold text-zinc-100">{viewedProfile.name}</p>
                        {!isGroupProfile ? (
                          <p className="text-sm text-zinc-500">@{viewedProfile.username}</p>
                        ) : null}
                        {!isGroupProfile && viewedProfile.birthday ? (
                          <p className="mt-2 text-sm text-zinc-400">
                            Birthday: {formatBirthday(viewedProfile.birthday, language)}
                          </p>
                        ) : null}
                        {viewedProfile.bio ? (
                          <p className="mt-3 text-sm text-zinc-300">{viewedProfile.bio}</p>
                        ) : null}
                        {isGroupProfile ? (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                              {t("participants")} ({groupParticipants.length})
                            </p>
                            <div className="mt-2 space-y-1">
                              {groupParticipants.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-zinc-100">{member.name}</p>
                                    <p className="truncate text-xs text-zinc-500">
                                      @{member.username}
                                    </p>
                                  </div>
                                  {member.isCreator ? (
                                    <span className="rounded-full border border-lime-500/40 bg-lime-500/10 px-2 py-0.5 text-[10px] font-medium text-lime-300">
                                      {t("creator")}
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                {!isOwnProfile && availableProfileTabs.length > 0 ? (
                  <div className="border-b border-zinc-700 px-4 sm:px-6">
                    <div className="flex flex-wrap">
                      {availableProfileTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setProfileTab(tab.id)}
                          className={`border-b-2 px-4 py-3 text-sm font-medium ${
                            profileTab === tab.id
                              ? "border-lime-400 text-zinc-100"
                              : "border-transparent text-zinc-500"
                          }`}
                        >
                          {tab.label}
                          <span className="ml-2 text-xs text-zinc-400">{tab.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto">
                  {isOwnProfile ? (
                    <div className="px-4 py-8 text-sm text-zinc-500 sm:px-6">
                      {t("profileActivityHint")}
                    </div>
                  ) : null}

                  {!isOwnProfile &&
                  availableProfileTabs.length > 0 &&
                  profileTab === "media" ? (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
                      {profileMediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative aspect-square overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 hover:border-lime-500/50"
                        >
                          {item.kind === "video" ? (
                            <video
                              src={item.url}
                              className="h-full w-full bg-black object-cover"
                              muted
                              playsInline
                              controls
                            />
                          ) : (
                            <button
                              type="button"
                              className="group h-full w-full"
                              onClick={() => openImageViewer(item.id, "profile")}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                              />
                            </button>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2 py-1">
                            <p className="truncate text-[11px] text-zinc-200">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!isOwnProfile &&
                  availableProfileTabs.length > 0 &&
                  profileTab === "links" ? (
                    <div className="space-y-2 p-4 sm:p-6">
                      {profileLinkItems.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 hover:border-lime-500/50"
                        >
                          <p className="truncate text-sm text-zinc-200">{item.url}</p>
                          <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {!isOwnProfile && availableProfileTabs.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-zinc-500 sm:px-6">
                      {t("noSharedActivity")}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {activeSidebar === "settings" ? (
              <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#202020_0%,#2a2a2a_100%)]">
                <div className="border-b border-zinc-700 px-4 py-4 sm:px-6">
                  <h2 className="text-xl font-semibold text-zinc-100">{t("settings")}</h2>
                  <div className="mt-4 rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-1.5">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                    {(["privacy", "security", "appearance"] as const).map((section) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => setActiveSettingsSection(section)}
                        className={`h-10 rounded-lg border px-3 text-sm font-medium transition-all ${
                          activeSettingsSection === section
                            ? "border-lime-400 bg-lime-500 text-zinc-900"
                            : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                        }`}
                      >
                        {section === "privacy"
                          ? t("privacy")
                          : section === "security"
                            ? t("security")
                            : t("appearance")}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeSettingsSection === "privacy" ? (
                  <section className="border-b border-zinc-700 px-4 py-4 sm:px-6">
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                        <p className="text-sm font-medium text-zinc-100">{t("lastSeenVisibility")}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-2">
                          <Select
                            value={currentLastSeenVisibility}
                            onValueChange={(value) => {
                              if (value === "everyone" || value === "selected" || value === "nobody") {
                                updatePrivacyVisibility("lastSeenVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("lastSeen");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-lime-500 hover:bg-zinc-700 focus-visible:border-lime-500 focus-visible:ring-lime-500">
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`last-seen-${scope}`}
                                  value={scope}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 focus:**:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900 data-highlighted:**:text-zinc-900"
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentLastSeenVisibility === "selected" ? (
                          <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900/60 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentLastSeenAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("lastSeen");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-700 px-3 text-xs text-zinc-100 hover:bg-zinc-600"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                        <p className="text-sm font-medium text-zinc-100">{t("avatarVisibility")}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-2">
                          <Select
                            value={currentAvatarVisibility}
                            onValueChange={(value) => {
                              if (value === "everyone" || value === "selected" || value === "nobody") {
                                updatePrivacyVisibility("avatarVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("avatar");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-lime-500 hover:bg-zinc-700 focus-visible:border-lime-500 focus-visible:ring-lime-500">
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`avatar-${scope}`}
                                  value={scope}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 focus:**:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900 data-highlighted:**:text-zinc-900"
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentAvatarVisibility === "selected" ? (
                          <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900/60 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentAvatarAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("avatar");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-700 px-3 text-xs text-zinc-100 hover:bg-zinc-600"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                        <p className="text-sm font-medium text-zinc-100">{t("bioVisibility")}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-2">
                          <Select
                            value={currentBioVisibility}
                            onValueChange={(value) => {
                              if (value === "everyone" || value === "selected" || value === "nobody") {
                                updatePrivacyVisibility("bioVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("bio");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-lime-500 hover:bg-zinc-700 focus-visible:border-lime-500 focus-visible:ring-lime-500">
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`bio-${scope}`}
                                  value={scope}
                                  className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 focus:**:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900 data-highlighted:**:text-zinc-900"
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentBioVisibility === "selected" ? (
                          <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900/60 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentBioAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("bio");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-700 px-3 text-xs text-zinc-100 hover:bg-zinc-600"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {activeSettingsSection === "security" ? (
                  <section className="border-b border-zinc-700 px-4 py-4 sm:px-6">
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{t("pushNotifications")}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{t("pushNotificationsHint")}</p>
                        </div>
                        <Switch
                          checked={pushNotificationsEnabled}
                          onCheckedChange={handlePushNotificationsChange}
                          aria-label={t("pushNotifications")}
                        />
                      </div>
                      <div className="pt-1">
                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {currentUser.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {currentUser.email}
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={onLogout}
                            className="h-10 rounded-lg border border-zinc-600 bg-zinc-700 px-4 text-zinc-100 hover:bg-zinc-600"
                          >
                            {t("logOut")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {activeSettingsSection === "appearance" ? (
                  <section className="border-b border-zinc-700 px-4 py-4 sm:px-6">
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{t("language")}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{t("languageHint")}</p>
                        <div className="mt-2">
                          <Select
                            value={language}
                            onValueChange={(value) => {
                              if (value === "en" || value === "ru") {
                                setLanguage(value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-lime-500 hover:bg-zinc-700 focus-visible:border-lime-500 focus-visible:ring-lime-500">
                              <SelectValue className="text-zinc-100" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100 shadow-xl">
                              <SelectItem
                                value="en"
                                className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 focus:**:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900 data-highlighted:**:text-zinc-900"
                              >
                                {t("english")}
                              </SelectItem>
                              <SelectItem
                                value="ru"
                                className="text-zinc-100 focus:bg-lime-500 focus:text-zinc-900 focus:**:text-zinc-900 data-highlighted:bg-lime-500 data-highlighted:text-zinc-900 data-highlighted:**:text-zinc-900"
                              >
                                {t("russian")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{t("messageSound")}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{t("messageSoundHint")}</p>
                        </div>
                        <Switch
                          checked={messageSoundEnabled}
                          onCheckedChange={setMessageSoundEnabled}
                          aria-label={t("messageSound")}
                        />
                      </div>
                    </div>
                  </section>
                  ) : null}

                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <AlertDialog
        open={privacyPickerField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPrivacyPickerField(null);
            setPrivacyPickerQuery("");
          }
        }}
      >
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 relative grid h-[min(70vh,560px)] w-[min(92vw,520px)] max-w-none grid-rows-[auto_auto_1fr] border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setPrivacyPickerField(null);
              setPrivacyPickerQuery("");
            }}
            aria-label={t("closeViewer")}
            className="absolute right-4 top-4 rounded-md border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-300 hover:border-lime-500 hover:text-lime-300"
          >
            <X className="size-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {privacyPickerField === "lastSeen"
                ? t("lastSeenVisibility")
                : privacyPickerField === "avatar"
                  ? t("avatarVisibility")
                  : t("bioVisibility")}
            </AlertDialogTitle>
            <AlertDialogDescription className="hidden" />
          </AlertDialogHeader>
          <div className="space-y-3 overflow-hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t("searchChat")}
                className="h-10 rounded-lg border-zinc-700 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-400"
                value={privacyPickerQuery}
                onChange={(event) => setPrivacyPickerQuery(event.target.value)}
              />
            </div>
            <div className="h-full space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
              {filteredPrivacyUsers.length > 0 ? (
                filteredPrivacyUsers.map((user) => {
                  const selected = pickerSelectedUserIds.includes(user.id);
                  return (
                    <button
                      key={`privacy-picker-${user.id}`}
                      type="button"
                      onClick={() => {
                        if (!pickerAllowedField || !pickerVisibilityField) {
                          return;
                        }
                        toggleAllowedPrivacyUser(
                          pickerAllowedField,
                          pickerVisibilityField,
                          user.id
                        );
                      }}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                        selected
                          ? "border-lime-500/70 bg-zinc-700 text-zinc-100"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                      }`}
                    >
                      <span className="truncate">
                        {user.name} (@{user.username})
                      </span>
                      {selected ? <Check className="size-4 text-lime-400" /> : null}
                    </button>
                  );
                })
              ) : null}
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </main>
      <audio ref={remoteCallAudioRef} autoPlay playsInline className="hidden" />
      {callNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[120] -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-100 shadow-xl">
          {callNotice}
        </div>
      ) : null}
      {callSession ? (
        <div className="fixed bottom-4 right-4 z-[120] w-[min(92vw,360px)] rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 text-zinc-100 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold">{callSession.peerName}</p>
          <p className="mt-1 text-xs text-zinc-400">{callStatusText}</p>
          <div className="mt-3 flex items-center gap-2">
            {callSession.phase === "incoming" ? (
              <>
                <Button
                  type="button"
                  onClick={() => void declineIncomingCall()}
                  className="h-10 flex-1 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                  {t("declineCall")}
                </Button>
                <Button
                  type="button"
                  onClick={() => void acceptIncomingCall()}
                  className="h-10 flex-1 rounded-lg bg-lime-500 text-zinc-900 hover:bg-lime-400"
                >
                  {t("acceptCall")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => void hangupCurrentCall()}
                className="h-10 w-full rounded-lg border border-red-500/70 bg-red-500/20 text-red-100 hover:bg-red-500/30"
              >
                <PhoneOff className="size-4" />
                {t("endCall")}
              </Button>
            )}
          </div>
        </div>
      ) : null}
      {viewerImage ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            type="button"
            aria-label={t("closeViewer")}
            className="absolute right-4 top-4 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 hover:border-lime-500 hover:text-lime-300"
            onClick={closeImageViewer}
          >
            <X className="size-5" />
          </button>
          <a
            href={viewerImage.url}
            download={viewerImage.name}
            aria-label={t("download")}
            className="absolute right-16 top-4 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 hover:border-lime-500 hover:text-lime-300"
          >
            <Download className="size-5" />
          </a>
          {viewerImages.length > 1 ? (
            <>
              <button
                type="button"
                aria-label={t("previousImage")}
                className="absolute left-3 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 hover:border-lime-500 hover:text-lime-300 sm:left-6"
                onClick={showPreviousImage}
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label={t("nextImage")}
                className="absolute right-3 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 hover:border-lime-500 hover:text-lime-300 sm:right-6"
                onClick={showNextImage}
              >
                <ArrowRight className="size-5" />
              </button>
            </>
          ) : null}
          <div className="flex max-h-full w-full max-w-6xl flex-col items-center gap-2">
            <img
              src={viewerImage.url}
              alt={viewerImage.name}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
            />
            <p className="max-w-full truncate text-sm text-zinc-300">
              {viewerImage.name}
              {viewerImages.length > 1
                ? ` (${activeViewerIndex + 1}/${viewerImages.length})`
                : ""}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
