"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BellOff,
  Bookmark,
  Bold,
  Check,
  CheckCheck,
  Clock3,
  Copy,
  Download,
  Eraser,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  MessageCircle,
  EllipsisVertical as MoreVertical,
  House as Home,
  Italic,
  ListChecks as List,
  Pause,
  PencilLine as Pencil,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Search,
  Shield,
  ScreenShare,
  ScreenShareOff,
  Smile,
  Square,
  SquareCode as Code2,
  Strikethrough,
  TextQuote as Quote,
  Trash2,
  Undo2 as CornerUpLeft,
  Users,
  Volume2,
  VolumeX,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ColorBends from "@/components/ui/color-bends";
import Dither from "@/components/ui/dither";
import GradientBlinds from "@/components/ui/gradient-blinds";
import PixelBlast from "@/components/ui/pixel-blast";
import Plasma from "@/components/ui/plasma";
import { requestJson } from "@/components/messenger/api";
import { ModerationPanel } from "@/components/messenger/moderation-panel";
import {
  type ModerationActionPayload,
  type ModerationPanelAuditLog,
  type ModerationPanelReport,
  type ModerationPanelSanction,
  type ModerationPanelSnapshot,
} from "@/components/messenger/moderation-types";
import { type AuthUser, type PrivacyVisibility } from "@/components/messenger/types";
import { useRealtimeSync } from "@/components/messenger/use-realtime-sync";
import { ADMIN_PANEL_USERNAME } from "@/lib/shared/admin";
import { AI_FEATURE_ENABLED } from "@/lib/shared/ai-feature";

const ProfileSidebarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
);

const SettingsSidebarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
  </svg>
);

const AiSidebarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M17.964 2.733c.156 .563 .312 1 .484 1.353c.342 .71 .758 1.125 1.47 1.467c.353 .17 .79 .326 1.352 .484c.98 .276 .97 1.668 -.013 1.93a8.3 8.3 0 0 0 -1.34 .481c-.71 .342 -1.127 .757 -1.463 1.453a8 8 0 0 0 -.486 1.352c-.258 .988 -1.658 1 -1.932 .015c-.156 -.565 -.312 -1.002 -.484 -1.354c-.342 -.71 -.758 -1.124 -1.458 -1.46a8 8 0 0 0 -1.374 -.495a.4 .4 0 0 1 -.06 -.02l-.044 -.017l-.045 -.02l-.049 -.025l-.035 -.02a.4 .4 0 0 1 -.049 -.03l-.032 -.023l-.043 -.034l-.033 -.028l-.036 -.035l-.034 -.035l-.028 -.033l-.035 -.043l-.022 -.032a.4 .4 0 0 1 -.032 -.049l-.02 -.035l-.025 -.05l-.02 -.044l-.017 -.043a.4 .4 0 0 1 -.02 -.06l-.01 -.034a.5 .5 0 0 1 -.02 -.098l-.006 -.065l-.005 -.035v-.05a.4 .4 0 0 1 .003 -.085a.5 .5 0 0 1 .013 -.093a.5 .5 0 0 1 .024 -.103a.4 .4 0 0 1 .02 -.06l.017 -.044l.02 -.045l.025 -.049l.02 -.035a.4 .4 0 0 1 .03 -.049l.023 -.032l.034 -.043l.028 -.033l.035 -.036l.035 -.034q .015 -.015 .033 -.028l.043 -.035l.032 -.022a.4 .4 0 0 1 .049 -.032l.035 -.02l.05 -.025l.044 -.02l.043 -.017a.4 .4 0 0 1 .06 -.02l.027 -.008a8.3 8.3 0 0 0 1.339 -.48c.71 -.342 1.127 -.757 1.47 -1.466c.17 -.354 .327 -.792 .483 -1.355c.272 -.976 1.657 -.976 1.928 0" />
    <path d="M10.965 6.737q .219 .801 .503 1.574c.856 2.28 1.945 3.363 4.23 4.22q .708 .265 1.571 .506c.976 .272 .974 1.656 -.002 1.927q -.798 .221 -1.568 .504c-2.288 .858 -3.376 1.94 -4.229 4.216a19 19 0 0 0 -.505 1.579c-.268 .983 -1.662 .983 -1.93 0a19 19 0 0 0 -.503 -1.574c-.856 -2.281 -1.944 -3.363 -4.226 -4.219a20 20 0 0 0 -1.594 -.513a.4 .4 0 0 1 -.054 -.018l-.044 -.017l-.043 -.02a.3 .3 0 0 1 -.048 -.024l-.036 -.02a.4 .4 0 0 1 -.048 -.03l-.032 -.024l-.044 -.034l-.033 -.029l-.037 -.034l-.034 -.037l-.03 -.033l-.033 -.044l-.023 -.032a.4 .4 0 0 1 -.03 -.048l-.021 -.036a.3 .3 0 0 1 -.024 -.048l-.02 -.043l-.017 -.044a.4 .4 0 0 1 -.018 -.054a.2 .2 0 0 1 -.01 -.039a.4 .4 0 0 1 -.014 -.059l-.007 -.04l-.007 -.056l-.003 -.044l-.002 -.05v-.05q 0 -.023 .004 -.044q .001 -.03 .007 -.057l.007 -.04a.4 .4 0 0 1 .017 -.076l.007 -.021a.4 .4 0 0 1 .018 -.054l.017 -.044l.02 -.043a.3 .3 0 0 1 .024 -.048l.02 -.036a.4 .4 0 0 1 .03 -.048l.024 -.032l.034 -.044l.029 -.033l.034 -.037l.037 -.034l.033 -.03l.044 -.033l.032 -.023a.4 .4 0 0 1 .048 -.03l.036 -.021a.3 .3 0 0 1 .048 -.024l.043 -.02l.044 -.017a.4 .4 0 0 1 .054 -.018l.021 -.007a20 20 0 0 0 1.568 -.504c2.287 -.858 3.375 -1.94 4.229 -4.216a19 19 0 0 0 .505 -1.579c.268 -.983 1.662 -.983 1.93 0" />
  </svg>
);

const ChatProfileSidebarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
    <path d="M15 4l0 16" />
  </svg>
);

const PinFilledIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
    <path d="M9 15l-4.5 4.5" />
    <path d="M14.5 4l5.5 5.5" />
  </svg>
);

const PinOffIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 3l18 18" />
    <path d="M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251" />
    <path d="M9 15l-4.5 4.5" />
    <path d="M14.5 4l5.5 5.5" />
  </svg>
);

const ShareContactIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7" />
  </svg>
);

const LeaveGroupMenuIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M10 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2" />
    <path d="M15 12h-12l3 -3" />
    <path d="M6 15l-3 -3" />
  </svg>
);

const ForwardUpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 14l4 -4l-4 -4" />
    <path d="M19 10h-11a4 4 0 1 0 0 8h1" />
  </svg>
);

const ViewsEyeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
  </svg>
);

const CHAT_ACTION_MENU_CONTENT_CLASS_NAME =
  "w-56 rounded-2xl border border-zinc-700 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl ring-1 ring-foreground/5 backdrop-blur";
const CHAT_ACTION_MENU_ITEM_CLASS_NAME =
  "cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-100 [&_svg]:text-zinc-100 data-[highlighted]:!text-zinc-100 data-[highlighted]:[&_svg]:!text-zinc-100";
const CHAT_ACTION_MENU_DESTRUCTIVE_ITEM_CLASS_NAME =
  "cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-200 [&_svg]:text-red-200 data-[highlighted]:text-red-200 data-[highlighted]:[&_svg]:text-red-200";
const CHAT_ACTION_MENU_SEPARATOR_CLASS_NAME = "mx-1 bg-zinc-700/80";
const PROFILE_ACTION_MENU_CONTENT_CLASS_NAME =
  "w-52 origin-top-right rounded-xl border border-zinc-700/90 bg-zinc-900/98 p-1 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur data-[state=open]:animate-[clore-profile-menu-in_180ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[clore-profile-menu-out_120ms_ease-in]";
const PROFILE_ACTION_MENU_ITEM_CLASS_NAME =
  "cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-sm font-medium !text-zinc-100 data-[highlighted]:!text-zinc-100 [&_svg]:text-zinc-300 data-[highlighted]:[&_svg]:!text-zinc-100";
const PROFILE_ACTION_MENU_SEPARATOR_CLASS_NAME = "mx-1 bg-zinc-700/70";
const PROFILE_AVATAR_VIEWER_IMAGE_ID = "profile-avatar";
const EMPTY_USER_IDS: string[] = [];
const PRIVACY_VISIBILITY_OPTIONS: PrivacyVisibility[] = [
  "everyone",
  "selected",
  "nobody",
];

type StoredChatThread = {
  id: string;
  memberIds: string[];
  threadType: "direct" | "group";
  groupKind?: "group" | "channel";
  groupAccess?: "private" | "public";
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
  typingBy: Record<string, number>;
  groupRoles: Record<string, GroupRole>;
};

type StoredChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  attachments: StoredChatAttachment[];
  replyToMessageId: string;
  createdAt: number;
  scheduledAt: number;
  editedAt: number;
  savedBy: Record<string, number>;
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
  kind: "image" | "video" | "audio" | "file";
};

type PendingAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  kind: "image" | "video" | "audio" | "file";
};

type RenderMessage = {
  id: string;
  chatId: string;
  authorId: string;
  author: "me" | "them";
  authorLabel: string;
  authorUsername: string;
  authorAvatarUrl: string;
  text: string;
  time: string;
  createdAt: number;
  attachments: RenderAttachment[];
  isReadByPeer: boolean;
  groupReadByCount: number;
  groupReadByLabels: string[];
  isEdited: boolean;
  reply: {
    targetMessageId: string;
    authorLabel: string;
    previewText: string;
    missing: boolean;
  } | null;
  isFavorite: boolean;
  sourceChatId: string | null;
  sourceChatName: string;
  isScheduledPending: boolean;
};

type ForwardMessageDraft = {
  id: string;
  sourceChatId: string;
  text: string;
  attachments: RenderAttachment[];
};

type ViewerImage = {
  id: string;
  name: string;
  url: string;
  downloadBlocked: boolean;
};

type ChatListItem = {
  id: string;
  memberId: string | null;
  memberIds: string[];
  memberCount: number;
  groupRoles: Record<string, GroupRole>;
  isGroup: boolean;
  groupKind: "group" | "channel" | null;
  groupAccess: "private" | "public" | null;
  groupUsername: string;
  groupInviteToken: string;
  groupInviteUsageLimit: number;
  groupInviteUsedCount: number;
  contentProtectionEnabled: boolean;
  isFavorites: boolean;
  isPreview: boolean;
  createdById: string;
  isGroupCreator: boolean;
  myGroupRole: GroupRole | null;
  name: string;
  description: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  accent: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  updatedAt: number;
  isPinned: boolean;
  isMuted: boolean;
};

type SidebarItem = {
  id: "profile" | "home" | "assistant" | "settings";
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

type ProfileTabId = "media" | "audio" | "links";
type ProfileMediaItem = {
  id: string;
  url: string;
  name: string;
  kind: "image" | "video";
  time: string;
};
type ProfileAudioItem = {
  id: string;
  url: string;
  time: string;
};
type SettingsSectionId = "privacy" | "security" | "appearance";
type ToastAction = {
  label: string;
  onClick: () => void;
};

type InlineToast = {
  id: number;
  message: string;
  action?: ToastAction;
};

type MobileBackSwipeGestureState = {
  tracking: boolean;
  activated: boolean;
  axisLock: "horizontal" | "vertical" | null;
  startX: number;
  startY: number;
};

type AppLanguage = "en" | "ru";
type UiTheme = "dark" | "light";
type UiDensity = "comfortable" | "compact";
type UiFontSize = "small" | "default" | "large";
type UiRadius = "sharp" | "normal" | "rounded";
type UiFontFamily = "default" | "modern" | "readable" | "comfortaa";
type ChatWallpaper =
  | "none"
  | "color-bends"
  | "pixel-blast"
  | "plasma"
  | "dither"
  | "gradient-blinds";
type ChatWallpaperSetting = ChatWallpaper | "inherit";
type ChatFontSizeSetting = UiFontSize | "inherit";
type ChatPersonalization = {
  wallpaper: ChatWallpaperSetting;
  fontSize: ChatFontSizeSetting;
  autoLoadMedia: boolean;
};
type AiAssistantMessageRole = "user" | "assistant";
type AiAssistantMessage = {
  id: string;
  role: AiAssistantMessageRole;
  content: string;
  createdAt: number;
  pending?: boolean;
  error?: boolean;
};
type GroupRole = "owner" | "admin" | "member";
type GroupKind = "group" | "channel";
type GroupAccessType = "private" | "public";
type TextFormattingAction = "bold" | "italic" | "strike" | "code" | "quote" | "list";

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
      | "birthdayVisibility"
      | "callVisibility"
      | "forwardVisibility"
      | "groupAddVisibility"
      | "lastSeenAllowedUserIds"
      | "avatarAllowedUserIds"
      | "bioAllowedUserIds"
      | "birthdayAllowedUserIds"
      | "callAllowedUserIds"
      | "forwardAllowedUserIds"
      | "groupAddAllowedUserIds"
    >
  ) => void | Promise<void>;
};

const sidebarItems: SidebarItem[] = AI_FEATURE_ENABLED
  ? [
      { id: "home", label: "Home", icon: Home },
      { id: "assistant", label: "AI", icon: AiSidebarIcon },
      { id: "profile", label: "Profile", icon: ProfileSidebarIcon },
      { id: "settings", label: "Settings", icon: SettingsSidebarIcon },
    ]
  : [
      { id: "home", label: "Home", icon: Home },
      { id: "profile", label: "Profile", icon: ProfileSidebarIcon },
      { id: "settings", label: "Settings", icon: SettingsSidebarIcon },
    ];
const SIDEBAR_ITEM_IDS: SidebarItem["id"][] = sidebarItems.map((item) => item.id);
const DEFAULT_SIDEBAR_VISIBILITY: Record<SidebarItem["id"], boolean> = {
  home: true,
  assistant: AI_FEATURE_ENABLED,
  profile: true,
  settings: true,
};
const CHAT_WALLPAPER_OPTIONS: ChatWallpaper[] = [
  "none",
  "color-bends",
  "pixel-blast",
  "plasma",
  "dither",
  "gradient-blinds",
];
const CHAT_WALLPAPER_BACKGROUNDS: Record<ChatWallpaper, string> = {
  none: "radial-gradient(circle at top, rgba(139,92,246,0.1), transparent 45%)",
  "color-bends": "none",
  "pixel-blast": "none",
  plasma: "none",
  dither: "none",
  "gradient-blinds": "none",
};
const DEFAULT_CHAT_PERSONALIZATION: ChatPersonalization = {
  wallpaper: "inherit",
  fontSize: "inherit",
  autoLoadMedia: true,
};
const MOBILE_VIEWPORT_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_BACK_SWIPE_EDGE_WIDTH = 28;
const MOBILE_BACK_SWIPE_TRIGGER_DISTANCE = 72;

const accentPalette = [
  "from-orange-500 to-amber-400",
  "from-cyan-500 to-sky-400",
  "from-purple-500 to-primary",
  "from-primary to-fuchsia-500",
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
const SEND_MESSAGE_SOUND_STORAGE_KEY = "clore_send_message_sound_v1";
const UI_THEME_STORAGE_KEY = "clore_ui_theme_v1";
const UI_DENSITY_STORAGE_KEY = "clore_ui_density_v1";
const UI_FONT_SIZE_STORAGE_KEY = "clore_ui_font_size_v1";
const UI_RADIUS_STORAGE_KEY = "clore_ui_radius_v1";
const UI_FONT_FAMILY_STORAGE_KEY = "clore_ui_font_family_v1";
const GLOBAL_CHAT_WALLPAPER_STORAGE_KEY = "clore_global_chat_wallpaper_v1";
const SIDEBAR_LAYOUT_STORAGE_KEY_PREFIX = "clore_sidebar_layout_v1_";
const CHAT_PERSONALIZATION_STORAGE_KEY_PREFIX = "clore_chat_personalization_v1_";
const PERSONALIZATION_ONBOARDING_DONE_STORAGE_KEY =
  "clore_personalization_onboarding_done_v1";
const CHAT_CLEAR_HISTORY_STORAGE_PREFIX = "clore_chat_clear_history_v1_";
const CHAT_DRAFTS_STORAGE_PREFIX = "clore_chat_drafts_v1_";
const FAVORITES_CHAT_VISIBILITY_STORAGE_KEY_PREFIX =
  "clore_favorites_chat_visibility_v1_";
const FAVORITES_CHAT_PINNED_STORAGE_KEY_PREFIX =
  "clore_favorites_chat_pinned_v1_";
const AI_ASSISTANT_HISTORY_STORAGE_KEY_PREFIX = "clore_ai_assistant_history_v1_";
const AI_ASSISTANT_SEARCH_MODE_STORAGE_KEY_PREFIX =
  "clore_ai_assistant_search_mode_v1_";
const AI_ASSISTANT_AGENT_MODE_STORAGE_KEY_PREFIX =
  "clore_ai_assistant_agent_mode_v1_";
const EMOJI_USAGE_STORAGE_KEY_PREFIX = "clore_emoji_usage_v1_";
const INCOMING_MESSAGE_SOUND_PATH = "/sounds/meet-message-sound-1.mp3";
const INCOMING_CALL_RINGTONE_PATH =
  "/sounds/zapsplat_multimedia_ringtone_smartphone_mallet_musical_001_79295.mp3";
const OUTGOING_MESSAGE_SOUND_PATH =
  "/sounds/zapsplat_multimedia_button_click_003_78080.mp3";
const MAX_PINNED_CHATS = 5;
const MIN_BIRTH_YEAR = 1900;
const ONLINE_STATUS_WINDOW_MS = 20_000;
const INCREMENTAL_FULL_SYNC_INTERVAL_MS = 30_000;
const TYPING_ACTIVE_WINDOW_MS = 7_000;
const TYPING_PING_INTERVAL_MS = 2_500;
const MESSAGE_APPEAR_ANIMATION_MS = 220;
const MESSAGE_TARGET_HIGHLIGHT_MS = 1_200;
const UNDO_WINDOW_MS = 5_000;
const APP_VERSION = "beta 1.1.1";
const SCHEDULE_MIN_LEAD_MS = 60_000;
const SCHEDULE_DEFAULT_LEAD_MS = 60 * 60 * 1000;
const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);
const SCHEDULE_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);
const GROUP_TITLE_MIN_LENGTH = 3;
const GROUP_TITLE_MAX_LENGTH = 64;
const GROUP_DESCRIPTION_MAX_LENGTH = 280;
const GROUP_MAX_MEMBERS = 50;
const GROUP_USERNAME_REGEX = /^[a-z0-9_]{3,32}$/;
const GROUP_INVITE_USAGE_LIMIT_MAX = Number.MAX_SAFE_INTEGER;
const GROUP_INVITE_USAGE_PRESET_VALUES = [0, 1, 5] as const;
const MAX_AI_ASSISTANT_HISTORY_MESSAGES = 40;
const MAX_TRACKED_EMOJI_USAGE_ITEMS = 300;
const MAX_HOVER_MENU_EMOJIS = 20;
const BUILT_IN_ASSISTANT_USER_ID = "bot-chatgpt";
const FAVORITES_CHAT_ID = "__favorites__";
const PREVIEW_CHAT_ID_PREFIX = "__preview__";
const translations = {
  en: {
    home: "Home",
    assistant: "AI",
    profile: "Profile",
    settings: "Settings",
    chats: "Chats",
    searchChat: "Search chat",
    searchAll: "Search across messenger",
    users: "Users",
    publicGroups: "Public groups",
    newGroup: "New group",
    groupName: "Group name",
    createGroup: "Create",
    groupMembers: "Group members",
    groupChat: "Group chat",
    members: "members",
    subscribers: "subscribers",
    participants: "Participants",
    creator: "Creator",
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    yourRole: "Your role",
    renameGroup: "Rename group",
    groupNameMinError: `Group name must be at least ${GROUP_TITLE_MIN_LENGTH} characters`,
    groupNameMaxError: `Group name must be at most ${GROUP_TITLE_MAX_LENGTH} characters`,
    groupMembersMinError: "Select at least 2 members",
    groupMembersOptionalHint: "Adding members is optional",
    groupMembersLimitHint: `Up to ${GROUP_MAX_MEMBERS} members`,
    addMembers: "Add members",
    addMember: "Add",
    removeMember: "Remove member",
    promoteToAdmin: "Make admin",
    demoteToMember: "Remove admin",
    transferOwnership: "Transfer ownership",
    openGroupSettings: "Open settings",
    hideGroupSettings: "Hide settings",
    groupRenamedToast: "Group renamed",
    memberAddedToast: "Member added",
    memberRemovedToast: "Member removed",
    roleUpdatedToast: "Role updated",
    ownershipTransferredToast: "Ownership transferred",
    readBy: "Read by",
    noChatsOrUsersFound: "No chats or users found",
    noChatsYet: "No chats yet. Register another account to start chatting.",
    yesterday: "Yesterday",
    unknownUser: "Unknown user",
    online: "Online",
    offline: "Offline",
    lastSeenAt: "Last seen at",
    lastSeenHidden: "Last seen hidden",
    typingNow: "Typing...",
    noMessagesYet: "No messages yet",
    copyText: "Copy",
    replyToMessage: "Reply",
    replyingTo: "Replying to",
    cancelReply: "Cancel reply",
    originalMessageUnavailable: "Original message not found",
    editMessage: "Edit",
    editingMessage: "Editing message",
    cancelEdit: "Cancel edit",
    saveEdit: "Save",
    editedLabel: "edited",
    copyAttachmentLink: "Copy attachment link",
    forwardMessageAction: "Forward",
    forwardMessageTitle: "Forward message",
    selectChatsToForward: "Select chats to forward",
    forwardingMessage: "Message to forward",
    forwarding: "Forwarding...",
    messageForwarded: "Message forwarded",
    messagesForwarded: "Messages forwarded",
    messagesForwardedPartially: "Partially forwarded",
    saveToFavorites: "Save to favorites",
    removeFromFavorites: "Remove from favorites",
    favorites: "Favorites",
    openFavorites: "Open favorites",
    deleteFavoritesAction: "Delete favorites",
    favoritesDeleted: "Favorites deleted",
    savedMessages: "Saved messages",
    fromChat: "From",
    openOriginalChat: "Open original chat",
    deleteMessage: "Delete message",
    pinChat: "Pin chat",
    unpinChat: "Unpin chat",
    muteChat: "Mute chat",
    unmuteChat: "Unmute chat",
    deleteForBoth: "Delete chat",
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
    muteMic: "Mute mic",
    unmuteMic: "Unmute mic",
    muteSound: "Mute sound",
    unmuteSound: "Unmute sound",
    shareScreen: "Share screen",
    stopShareScreen: "Stop sharing",
    openFullscreenCall: "Open fullscreen",
    closeFullscreenCall: "Exit fullscreen",
    callEnded: "Call ended",
    callDeclined: "Call declined",
    callBusy: "User is in another call",
    callFailed: "Unable to start call",
    micAccessDenied: "Microphone access denied",
    callBrowserNotSupported: "Calls are not supported in this browser",
    screenShareNotSupported: "Screen sharing is not supported in this browser",
    screenShareFailed: "Unable to start screen sharing",
    callDirectOnly: "Audio calls are available only in direct chats",
    menu: "Menu",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    searchInChat: "Search in chat",
    deleteOptions: "Delete options",
    clearHistoryForMe: "Clear history for me",
    historyClearedForMe: "History cleared only for you",
    noMessagesFound: "No messages found",
    unreadMessages: "Unread messages",
    draftLabel: "Draft",
    searchAdvancedHint:
      "Filters: from:@username has:attachment|image|video|audio|file on:YYYY-MM-DD before:YYYY-MM-DD after:YYYY-MM-DD",
    jumpToDate: "Jump to date",
    date: "Date",
    deleteChatAction: "Delete chat",
    deleteChatConfirmTitle: "Delete this chat?",
    deleteChatConfirmDescription:
      "This action removes the chat for all participants. You can undo for a few seconds after delete.",
    typeMessage: "Type a message...",
    formattingHint: "Formatting",
    formattingHotkeyHint: "Enter to send, Shift+Enter for new line",
    formatBold: "Bold",
    formatItalic: "Italic",
    formatStrike: "Strikethrough",
    formatCode: "Code",
    formatQuote: "Quote",
    formatList: "List",
    attachFiles: "Attach files",
    voiceMessage: "Voice message",
    startVoiceRecording: "Start recording",
    stopVoiceRecording: "Stop recording",
    cancelVoiceRecording: "Cancel recording",
    recordingVoice: "Recording",
    voiceBrowserNotSupported: "Voice messages are not supported in this browser",
    voiceMessageCaptured: "Voice message added",
    send: "Send",
    attachment: "Attachment",
    removeAttachment: "Remove attachment",
    undo: "Undo",
    messageDeleted: "Message deleted",
    chatDeleted: "Chat deleted",
    chatMutedToast: "Chat muted",
    chatUnmutedToast: "Chat unmuted",
    actionFailed: "Action failed. Try again.",
    previousImage: "Previous image",
    nextImage: "Next image",
    closeViewer: "Close viewer",
    download: "Download",
    selectChat: "Select a chat",
    openChat: "Open chat",
    editProfile: "Edit profile",
    shareContact: "Share contact",
    selectChatToShareContact: "Select a chat to share this contact",
    contactSharedToast: "Contact shared",
    sharingContact: "Sharing...",
    blockUser: "Block user",
    unblockUser: "Unblock user",
    userBlockedToast: "User blocked",
    userUnblockedToast: "User unblocked",
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
    audio: "Audio",
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
    sendMessageSound: "Send sound",
    sendMessageSoundHint: "Play sound when you send messages",
    hideLastSeen: "Hide last seen",
    hideLastSeenHint: "Others won't see when you were last online",
    lastSeenVisibility: "Who can see last seen",
    avatarVisibility: "Who can see avatar",
    bioVisibility: "Who can see bio",
    birthdayVisibility: "Who can see birthday",
    callVisibility: "Who can call you",
    forwardVisibility: "Who can forward your messages",
    groupAddVisibility: "Who can add you to groups",
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
    theme: "Theme",
    themeHint: "Switch between dark and light appearance",
    themeDark: "Dark",
    themeLight: "Light",
    accentColor: "Accent color",
    accentColorHint: "Choose the main color for buttons and highlights",
    accentViolet: "Violet",
    accentBlue: "Blue",
    accentEmerald: "Emerald",
    accentRose: "Rose",
    accentAmber: "Amber",
    sidebarVisibility: "Sidebar",
    sidebarVisibilityHint: "Show or hide the main left sidebar",
    hideSidebar: "Hide sidebar",
    showSidebar: "Show sidebar",
    russian: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
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
    syncConnected: "Realtime connected",
    syncReconnecting: "Realtime reconnecting",
    syncFallback: "Fallback sync",
    onboardingTitle: "Personalize your messenger",
    onboardingDescription: "Choose your defaults. You can change them later in settings.",
    density: "UI density",
    densityHint: "Controls spacing in lists and compactness",
    densityComfortable: "Comfortable",
    densityCompact: "Compact",
    fontSize: "Font size",
    fontSizeHint: "Controls text size across chat interface",
    fontSizeSmall: "Small",
    fontSizeDefault: "Default",
    fontSizeLarge: "Large",
    fontFamily: "Font family",
    fontFamilyHint: "Controls the typeface across interface",
    fontFamilyDefault: "Default",
    fontFamilyModern: "Modern",
    fontFamilyReadable: "Readable",
    fontFamilyComfortaa: "Comfortaa",
    radius: "Corner radius",
    radiusHint: "Controls roundness of cards, buttons and bubbles",
    radiusSharp: "Sharp",
    radiusNormal: "Normal",
    radiusRounded: "Rounded",
    chatWallpaper: "Chat wallpaper",
    chatWallpaperHint: "Choose default wallpaper for chats",
    wallpaperNone: "None",
    wallpaperColorBends: "Color Bends",
    wallpaperPixelBlast: "Pixel Blast",
    wallpaperPlasma: "Plasma",
    wallpaperDither: "Dither",
    wallpaperGradientBlinds: "Gradient Blinds",
    navigationTabs: "Navigation tabs",
    navigationTabsHint: "Choose which tabs are visible and their order",
    showTab: "Show tab",
    moveUp: "Move up",
    moveDown: "Move down",
    keepAtLeastOneTab: "Keep at least one tab visible",
    chatPersonalization: "Chat personalization",
    chatPersonalizationHint: "Settings for this chat only",
    openChatPersonalization: "Personalization",
    muteThisChat: "Mute this chat",
    chatWallpaperPerChat: "Chat wallpaper",
    chatWallpaperPerChatHint: "Override wallpaper only for this chat",
    chatFontSize: "Chat font size",
    chatFontSizeHint: "Override text size only in this chat",
    inheritGlobal: "Inherit global",
    autoLoadMedia: "Auto-load media",
    autoLoadMediaHint: "Automatically load images and videos in this chat",
    loadMedia: "Load media",
    aiAssistantTitle: "ChatGPT",
    aiAssistantSubtitle: "Built-in AI assistant for ideas, writing, and coding help.",
    aiAssistantPlaceholder: "Ask anything...",
    aiAssistantEmptyTitle: "Start a new conversation",
    aiAssistantEmptyHint: "Ask a question and ChatGPT will answer right here.",
    aiAssistantClear: "Clear chat",
    aiAssistantSearchMode: "Search",
    aiAssistantSearchHint: "Allow web search for up-to-date answers",
    aiAssistantAgentMode: "Agent",
    aiAssistantAgentModeHint:
      "Allow AI to execute messenger commands (send/delete/create groups/invite/remove members, update groups, change roles)",
    aiAssistantAgentWarningTitle: "Enable Agent (Beta)?",
    aiAssistantAgentWarningDescription:
      "Agent is in beta and can execute actions in your messenger (for example send/delete/create groups/invite/remove members, update groups, change roles). This may modify your chats and related data.",
    aiAssistantAgentWarningConfirm: "Enable agent",
    aiAssistantThinking: "Thinking...",
    groupTypePrivate: "Private group",
    groupTypePublic: "Public group",
    groupTypePrivateDescription: "Join by invite link or if added by owner/admin.",
    groupTypePublicDescription: "Anyone can join using the public @username link.",
    groupUsernameLabel: "Public username",
    groupUsernameHint: "3-32 chars: a-z, 0-9, underscore",
    invalidGroupUsername: "Invalid group username format.",
    groupInviteLink: "Invite link",
    publicGroupLink: "Public link",
    copyLink: "Copy link",
    groupTypeSavedToast: "Group type updated",
    joinGroupSuccess: "Joined group",
    joinGroupAlreadyMember: "You are already a member of this group",
    joinGroupAction: "Join",
    joinGroupToWrite: "Join this group to send messages.",
    channelReadOnlyPlaceholder: "Only admins can post in this channel.",
    channelPostingRestricted: "Only channel owner or admins can post messages.",
    joiningGroup: "Joining...",
    inviteUsageLimit: "Invite link usage limit",
    inviteUsageLimitHint: "0 means unlimited. For one-time link use 1.",
    inviteUsageUnlimited: "Unlimited",
    inviteUsageOne: "One-time",
    inviteUsageFive: "5 uses",
    inviteUsageCustom: "Custom",
    inviteUsageUsed: "Used",
    inviteUsageRemaining: "Remaining",
    inviteUsageSet: "Set limit",
    inviteUsageSavedToast: "Invite link limit updated",
    invalidInviteUsageLimit: "Invite usage limit must be a non-negative integer.",
    groupContentProtection: "Restrict copying",
    groupContentProtectionHint:
      "Block copying, forwarding, and downloads in this group.",
    groupContentProtectionSavedToast: "Content protection updated",
    groupContentProtectionBlockedToast: "This action is disabled in this group.",
    onboardingApply: "Apply",
  },
  ru: {
    home: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    assistant: "AI",
    profile: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    settings: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    chats: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    searchChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    searchAll: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™",
    users: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    publicGroups: "Публичные группы",
    newGroup: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    groupName: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    createGroup: "Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    groupMembers: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    groupChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    members: "Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    subscribers: "РџРѕРґРїРёСЃС‡РёРєРё",
    participants: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    creator: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    owner: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В ",
    admin: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    member: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    yourRole: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    renameGroup: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™",
    groupNameMinError: `Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В ${GROUP_TITLE_MIN_LENGTH} Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°`,
    groupNameMaxError: `Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В ${GROUP_TITLE_MAX_LENGTH} Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°`,
    groupMembersMinError: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В 2 Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    groupMembersOptionalHint:
      "\u0414\u043e\u0431\u0430\u0432\u043b\u044f\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u043d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e",
    groupMembersLimitHint: `Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› ${GROUP_MAX_MEMBERS} Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В `,
    addMembers: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    addMember: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    removeMember: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    promoteToAdmin: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    demoteToMember: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    transferOwnership: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    openGroupSettings: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    hideGroupSettings: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    groupRenamedToast: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    memberAddedToast: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    memberRemovedToast: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    roleUpdatedToast: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    ownershipTransferredToast: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    readBy: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    noChatsOrUsersFound: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    noChatsYet: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ. Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ, Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™.",
    yesterday: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    unknownUser: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    online: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    offline: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    lastSeenAt: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»(Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°) Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    lastSeenHidden: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    typingNow: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ...",
    noMessagesYet: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    copyText: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    replyToMessage: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    replyingTo: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    cancelReply: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    originalMessageUnavailable: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    editMessage: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    editingMessage: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    cancelEdit: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    saveEdit: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    editedLabel: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    copyAttachmentLink: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    forwardMessageAction: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    forwardMessageTitle: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    selectChatsToForward: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    forwardingMessage: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    forwarding: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°...",
    messageForwarded: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    messagesForwarded: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    messagesForwardedPartially: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    saveToFavorites: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    removeFromFavorites: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    favorites: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    openFavorites: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    deleteFavoritesAction: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    favoritesDeleted: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    savedMessages: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    fromChat: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    openOriginalChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    deleteMessage: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    pinChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    unpinChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    muteChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    unmuteChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    deleteForBoth: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦",
    deleteGroup: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™",
    leaveGroup: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    call: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    videoCall: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    audioCallOnly: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    incomingCall: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    callingNow: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В...",
    connectingCall: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ...",
    inCall: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    acceptCall: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    declineCall: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    endCall: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    muteMic: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    unmuteMic: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    muteSound: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    unmuteSound: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    shareScreen: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    stopShareScreen: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·",
    openFullscreenCall: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    closeFullscreenCall: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    callEnded: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    callDeclined: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    callBusy: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    callFailed: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    micAccessDenied: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™",
    callBrowserNotSupported: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    screenShareNotSupported: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    screenShareFailed: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    callDirectOnly: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦",
    menu: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“",
    collapseSidebar: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    expandSidebar: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    searchInChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    deleteOptions: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    clearHistoryForMe: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    historyClearedForMe: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ",
    noMessagesFound: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    unreadMessages: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    draftLabel: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    searchAdvancedHint:
      "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¤Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ: from:@username has:attachment|image|video|audio|file on:YYYY-MM-DD before:YYYY-MM-DD after:YYYY-MM-DD",
    jumpToDate: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС› Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    date: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    deleteChatAction: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    deleteChatConfirmTitle: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ?",
    deleteChatConfirmDescription:
      "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В­Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В . Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В.",
    typeMessage: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ...",
    formattingHint: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¤Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    formattingHotkeyHint: "Enter Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°, Shift+Enter Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    formatBold: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    formatItalic: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    formatStrike: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    formatCode: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В",
    formatQuote: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    formatList: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    attachFiles: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    voiceMessage: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    startVoiceRecording: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    stopVoiceRecording: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    cancelVoiceRecording: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    recordingVoice: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    voiceBrowserNotSupported: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    voiceMessageCaptured: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    send: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    attachment: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    removeAttachment: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    undo: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    messageDeleted: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    chatDeleted: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    chatMutedToast: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    chatUnmutedToast: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    actionFailed: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ. Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°.",
    previousImage: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    nextImage: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    closeViewer: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    download: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    selectChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    openChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    editProfile: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    shareContact: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    selectChatToShareContact: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    contactSharedToast: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    sharingContact: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°...",
    blockUser: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    unblockUser: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    userBlockedToast: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    userUnblockedToast: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    cancel: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    save: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    chatProfile: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    name: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    username: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В®Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    bio: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    clickAvatarHint:
      "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў, Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°. Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў: 512x512 px (1:1).",
    clickBannerHint:
      "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў, Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°. Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў: 1500x500 px (3:1).",
    profileActivityHint:
      "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ.",
    messages: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    media: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    audio: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    links: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    noSharedActivity: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС› Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В.",
    privacy: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    security: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    appearance: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    interface: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ",
    account: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    pushNotifications: "Push-Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    pushNotificationsHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦",
    messageSound: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    messageSoundHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    sendMessageSound: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    sendMessageSoundHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    hideLastSeen: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В",
    hideLastSeenHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    lastSeenVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’В",
    avatarVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    bioVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    birthdayVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    callVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    forwardVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    groupAddVisibility: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    privacyScopeHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    everyone: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    selected: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    nobody: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›",
    selectedPeople: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    choosePeople: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    noSelectedPeople: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦",
    pickPeopleHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    pinnedChats: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    allChats: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    logOut: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    language: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР Р‹Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    languageHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    theme: "\u0422\u0435\u043c\u0430",
    themeHint: "\u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u043c\u0435\u0436\u0434\u0443 \u0442\u0435\u043c\u043d\u043e\u0439 \u0438 \u0441\u0432\u0435\u0442\u043b\u043e\u0439 \u0442\u0435\u043c\u043e\u0439",
    themeDark: "\u0422\u0435\u043c\u043d\u0430\u044f",
    themeLight: "\u0421\u0432\u0435\u0442\u043b\u0430\u044f",
    accentColor: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    accentColorHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    accentViolet: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¤Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    accentBlue: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    accentEmerald: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    accentRose: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    accentAmber: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР Р‹Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    sidebarVisibility: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    sidebarVisibilityHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    hideSidebar: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    showSidebar: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    russian: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    english: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    you: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ",
    youLabel: "(Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ)",
    remove: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
    changeFile: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»",
    avatarActions: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    bannerActions: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В",
    avatarActionsHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°.",
    bannerActionsHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°.",
    avatarSizeHint: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°: 512x512 px (1:1).",
    bannerSizeHint: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°: 1500x500 px (3:1).",
    syncConnected: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    syncReconnecting: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    syncFallback: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    onboardingTitle: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў",
    onboardingDescription: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“. Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦.",
    density: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    densityHint: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    densityComfortable: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    densityCompact: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ",
    fontSize: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    fontSizeHint: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    fontSizeSmall: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    fontSizeDefault: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    fontSizeLarge: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    fontFamily: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    fontFamilyHint: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    fontFamilyDefault: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“",
    fontFamilyModern: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    fontFamilyReadable: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В§Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    fontFamilyComfortaa: "Comfortaa",
    radius: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    radiusHint: "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    radiusSharp: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    radiusNormal: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    radiusRounded: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    chatWallpaper: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatWallpaperHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    wallpaperNone: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    wallpaperColorBends: "Color Bends",
    wallpaperPixelBlast: "Pixel Blast",
    wallpaperPlasma: "Plasma",
    wallpaperDither: "Dither",
    wallpaperGradientBlinds: "Gradient Blinds",
    navigationTabs: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В",
    navigationTabsHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    showTab: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™",
    moveUp: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦",
    moveDown: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·",
    keepAtLeastOneTab: "Р В Р’В Р вЂ™Р’В Р В РЎС›Р РЋРІР‚в„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ",
    chatPersonalization: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatPersonalizationHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    openChatPersonalization: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    muteThisChat: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatWallpaperPerChat: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatWallpaperPerChatHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatFontSize: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІР‚С”Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    chatFontSizeHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    inheritGlobal: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    autoLoadMedia: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    autoLoadMediaHint: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ",
    loadMedia: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    aiAssistantTitle: "ChatGPT",
    aiAssistantSubtitle: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ AI-Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ, Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°.",
    aiAssistantPlaceholder: "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›...",
    aiAssistantEmptyTitle: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚Сљ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚Сљ",
    aiAssistantEmptyHint: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚Сљ, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В ChatGPT Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°.",
    aiAssistantClear: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    aiAssistantSearchMode: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ",
    aiAssistantSearchHint: "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±-Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В ",
    aiAssistantAgentMode: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ",
    aiAssistantAgentModeHint:
      "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° AI Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° (Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°/Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ/Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚Сњ/Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ)",
    aiAssistantAgentWarningTitle: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° (Beta)?",
    aiAssistantAgentWarningDescription:
      "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°-Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В  Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ (Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ў, Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°/Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ/Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚Сњ/Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ). Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В­Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ.",
    aiAssistantAgentWarningConfirm: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°",
    aiAssistantThinking: "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“...",
    groupTypePrivate: "Р В РЎСџР РЋР вЂљР В РЎвЂР В Р вЂ Р В Р’В°Р РЋРІР‚С™Р В Р вЂ¦Р В Р’В°Р РЋР РЏ Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р В Р’В°",
    groupTypePublic: "Р В РЎСџР РЋРЎвЂњР В Р’В±Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В Р’В°Р РЋР РЏ Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р В Р’В°",
    groupTypePrivateDescription: "Р В РІР‚в„ўР РЋР С“Р РЋРІР‚С™Р РЋРЎвЂњР В РЎвЂ”Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ Р В РЎвЂ”Р В РЎвЂў Р РЋР С“Р РЋР С“Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂќР В Р’Вµ-Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В РЎвЂ“Р В Р’В»Р В Р’В°Р РЋРІвЂљВ¬Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР вЂ№ Р В РЎвЂР В Р’В»Р В РЎвЂ Р В РЎвЂ”Р В РЎвЂў Р В РўвЂР В РЎвЂўР В Р’В±Р В Р’В°Р В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР вЂ№ Р В Р’В°Р В РўвЂР В РЎВР В РЎвЂР В Р вЂ¦Р В РЎвЂўР В РЎВ.",
    groupTypePublicDescription: "Р В РІР‚С”Р РЋР вЂ№Р В Р’В±Р В РЎвЂўР В РІвЂћвЂ“ Р В РЎВР В РЎвЂўР В Р’В¶Р В Р’ВµР РЋРІР‚С™ Р В Р вЂ Р РЋР С“Р РЋРІР‚С™Р РЋРЎвЂњР В РЎвЂ”Р В РЎвЂР РЋРІР‚С™Р РЋР Р‰ Р В РЎвЂ”Р В РЎвЂў Р В РЎвЂ”Р РЋРЎвЂњР В Р’В±Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В РЎвЂўР В РІвЂћвЂ“ Р РЋР С“Р РЋР С“Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂќР В Р’Вµ Р РЋР С“ @username.",
    groupUsernameLabel: "Р В РЎСџР РЋРЎвЂњР В Р’В±Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ username",
    groupUsernameHint: "3-32 Р РЋР С“Р В РЎвЂР В РЎВР В Р вЂ Р В РЎвЂўР В Р’В»Р В Р’В°: a-z, 0-9, _",
    invalidGroupUsername: "Р В РЎСљР В Р’ВµР В Р вЂ Р В Р’ВµР РЋР вЂљР В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ Р РЋРІР‚С›Р В РЎвЂўР РЋР вЂљР В РЎВР В Р’В°Р РЋРІР‚С™ username Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р РЋРІР‚в„–.",
    groupInviteLink: "Р В Р Р‹Р РЋР С“Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂќР В Р’В°-Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В РЎвЂ“Р В Р’В»Р В Р’В°Р РЋРІвЂљВ¬Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ",
    publicGroupLink: "Р В РЎСџР РЋРЎвЂњР В Р’В±Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В Р’В°Р РЋР РЏ Р РЋР С“Р РЋР С“Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂќР В Р’В°",
    copyLink: "Р В РЎв„ўР В РЎвЂўР В РЎвЂ”Р В РЎвЂР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р’В°Р РЋРІР‚С™Р РЋР Р‰ Р РЋР С“Р РЋР С“Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂќР РЋРЎвЂњ",
    groupTypeSavedToast: "Р В РЎС›Р В РЎвЂР В РЎвЂ” Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р РЋРІР‚в„– Р В РЎвЂўР В Р’В±Р В Р вЂ¦Р В РЎвЂўР В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦",
    joinGroupSuccess: "Р В РІР‚в„ўР РЋРІР‚в„– Р В Р вЂ Р РЋР С“Р РЋРІР‚С™Р РЋРЎвЂњР В РЎвЂ”Р В РЎвЂР В Р’В»Р В РЎвЂ Р В Р вЂ  Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р РЋРЎвЂњ",
    joinGroupAlreadyMember: "Р В РІР‚в„ўР РЋРІР‚в„– Р РЋРЎвЂњР В Р’В¶Р В Р’Вµ Р РЋР С“Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂўР В РЎвЂР РЋРІР‚С™Р В Р’Вµ Р В Р вЂ  Р РЋР РЉР РЋРІР‚С™Р В РЎвЂўР В РІвЂћвЂ“ Р В РЎвЂ“Р РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В РЎвЂ”Р В Р’Вµ",
    joinGroupAction: "Присоединиться",
    joinGroupToWrite: "Вступите в эту группу, чтобы отправлять сообщения.",
    channelReadOnlyPlaceholder: "В этом канале писать могут только админы.",
    channelPostingRestricted: "Только владелец и админы канала могут писать сообщения.",
    joiningGroup: "Вступаем...",
    inviteUsageLimit: "Лимит использований ссылки",
    inviteUsageLimitHint: "0 — без ограничений. Для одноразовой ссылки укажите 1.",
    inviteUsageUnlimited: "Без ограничений",
    inviteUsageOne: "Одноразовая",
    inviteUsageFive: "5 использований",
    inviteUsageCustom: "Свое число",
    inviteUsageUsed: "Использовано",
    inviteUsageRemaining: "Осталось",
    inviteUsageSet: "Сохранить лимит",
    inviteUsageSavedToast: "Лимит ссылки обновлен",
    invalidInviteUsageLimit: "Лимит использований ссылки должен быть неотрицательным целым числом.",
    groupContentProtection: "Запретить копирование",
    groupContentProtectionHint:
      "Блокирует копирование, пересылку и скачивание в этой группе.",
    groupContentProtectionSavedToast: "Ограничения обновлены",
    groupContentProtectionBlockedToast: "Это действие запрещено в этой группе.",
    onboardingApply: "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°",
  },
} as const;

type MessengerDataResponse = {
  users: AuthUser[];
  threads: StoredChatThread[];
  messages: StoredChatMessage[];
  fullSync?: boolean;
  serverTime?: number;
};

type OpenOrCreateResponse = {
  chatId: string;
  created: boolean;
};

type BlockUserResponse = {
  user: AuthUser;
};

type CreateGroupResponse = {
  chatId: string;
};
type UpdateGroupAccessResponse = {
  ok: boolean;
  accessType: GroupAccessType;
  username: string;
  inviteToken: string;
  inviteUsageLimit: number;
  inviteUsedCount: number;
};
type UpdateGroupInviteSettingsResponse = {
  ok: boolean;
  inviteToken: string;
  usageLimit: number;
  usedCount: number;
  remainingUses: number | null;
};
type UpdateGroupContentProtectionResponse = {
  ok: boolean;
  enabled: boolean;
};
type JoinGroupResponse = {
  chatId: string;
  joined: boolean;
};
type PublicGroupSearchResult = {
  chatId: string;
  title: string;
  description: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  memberCount: number;
  updatedAt: number;
  groupKind: "group" | "channel";
};
type SearchPublicGroupsResponse = {
  groups: PublicGroupSearchResult[];
};
type AiAssistantRequestMessage = {
  role: AiAssistantMessageRole;
  content: string;
};
type AiAssistantChatResponse = {
  message: string;
  sentMessages?: number;
  deletedChats?: number;
  createdGroups?: number;
  invitedMembers?: number;
  removedMembers?: number;
  updatedGroups?: number;
  updatedMemberRoles?: number;
};

function normalizeAiAssistantMessages(value: unknown): AiAssistantMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const candidate = item as Record<string, unknown>;
      const id =
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim()
          : "";
      const role = candidate.role;
      const content = typeof candidate.content === "string" ? candidate.content : "";
      const createdAt =
        typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
          ? candidate.createdAt
          : Date.now();
      if (!id || (role !== "user" && role !== "assistant") || !content.trim()) {
        return null;
      }
      return {
        id,
        role,
        content,
        createdAt,
      } satisfies AiAssistantMessage;
    })
    .filter((message): message is AiAssistantMessage => message !== null)
    .slice(-MAX_AI_ASSISTANT_HISTORY_MESSAGES);
}

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
  isGroup: boolean;
  initiatorUserId: string;
  initiatorName: string;
  participantUserIds: string[];
  startedAt: number | null;
};

type AdminCallJoinRequest = {
  chatId: string;
  joinCall: boolean;
  targetUserIds: string[];
};

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
    return language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р вЂ Р Р†Р вЂљРЎвЂєР РЋРЎвЂєР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°" : "Yesterday";
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(timestamp: number, language: AppLanguage): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const locale = language === "ru" ? "ru-RU" : "en-US";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLastSeen(timestamp: number, language: AppLanguage): string {
  if (!timestamp || timestamp <= 0) {
    return language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р РЋРЎвЂєР В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРЎвЂє" : "recently";
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

function formatAbsoluteDateTime(timestamp: number, language: AppLanguage): string {
  if (!timestamp || timestamp <= 0) {
    return "";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const locale = language === "ru" ? "ru-RU" : "en-US";
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toSchedulePickerParts(timestamp: number): {
  date: Date;
  hour: string;
  minute: string;
} {
  const source = new Date(timestamp);
  if (Number.isNaN(source.getTime())) {
    const fallback = new Date();
    return {
      date: new Date(
        fallback.getFullYear(),
        fallback.getMonth(),
        fallback.getDate()
      ),
      hour: "00",
      minute: "00",
    };
  }

  return {
    date: new Date(
      source.getFullYear(),
      source.getMonth(),
      source.getDate()
    ),
    hour: String(source.getHours()).padStart(2, "0"),
    minute: String(source.getMinutes()).padStart(2, "0"),
  };
}

function buildScheduledTimestamp(
  date: Date | undefined,
  hour: string,
  minute: string
): number {
  if (!date) {
    return 0;
  }
  const parsedHour = Number.parseInt(hour, 10);
  const parsedMinute = Number.parseInt(minute, 10);
  if (
    !Number.isInteger(parsedHour) ||
    parsedHour < 0 ||
    parsedHour > 23 ||
    !Number.isInteger(parsedMinute) ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return 0;
  }

  const nextDate = new Date(date);
  nextDate.setHours(parsedHour, parsedMinute, 0, 0);
  const timestamp = nextDate.getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
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

function normalizeGroupUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function isValidGroupUsername(value: string): boolean {
  return GROUP_USERNAME_REGEX.test(value);
}

function normalizeGroupInviteUsageLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  const normalized = Math.trunc(value);
  if (normalized <= 0) {
    return 0;
  }
  return Math.min(normalized, GROUP_INVITE_USAGE_LIMIT_MAX);
}

function normalizeGroupInviteUsedCount(value: unknown, usageLimit: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  const normalized = Math.max(0, Math.trunc(value));
  if (usageLimit > 0) {
    return Math.min(normalized, usageLimit);
  }
  return normalized;
}

function parseGroupInviteUsageLimitDraft(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < 0 || parsed > GROUP_INVITE_USAGE_LIMIT_MAX) {
    return null;
  }
  return parsed;
}

function buildMessengerGroupJoinLink(options: {
  username?: string;
  inviteToken?: string;
}): string {
  if (typeof window === "undefined") {
    return "";
  }
  const url = new URL(window.location.origin + window.location.pathname);
  const username = normalizeGroupUsername(options.username ?? "");
  const inviteToken = options.inviteToken?.trim() ?? "";
  if (username) {
    url.searchParams.set("group", username);
  }
  if (inviteToken) {
    url.searchParams.set("invite", inviteToken);
  }
  return url.toString();
}

function getLocalDayRangeFromIsoDate(value: string): { start: number; end: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const start = date.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { start, end };
}

function parseActiveChatSearchQuery(rawValue: string) {
  const source = rawValue.trim();
  if (!source) {
    return {
      textTerms: [] as string[],
      authorTerm: "",
      hasKinds: new Set<RenderAttachment["kind"]>(),
      requireAttachment: false,
      onDayRange: null as { start: number; end: number } | null,
      beforeTs: null as number | null,
      afterTs: null as number | null,
    };
  }

  const textTerms: string[] = [];
  let authorTerm = "";
  let requireAttachment = false;
  const hasKinds = new Set<RenderAttachment["kind"]>();
  let onDayRange: { start: number; end: number } | null = null;
  let beforeTs: number | null = null;
  let afterTs: number | null = null;

  for (const part of source.split(/\s+/)) {
    const token = part.trim();
    if (!token) {
      continue;
    }

    if (token.startsWith("from:")) {
      authorTerm = token.slice(5).replace(/^@+/, "").toLowerCase();
      continue;
    }

    if (token.startsWith("has:")) {
      const value = token.slice(4).toLowerCase();
      if (value === "attachment") {
        requireAttachment = true;
      } else if (
        value === "image" ||
        value === "video" ||
        value === "audio" ||
        value === "file"
      ) {
        hasKinds.add(value);
      }
      continue;
    }

    if (token.startsWith("on:")) {
      onDayRange = getLocalDayRangeFromIsoDate(token.slice(3));
      continue;
    }

    if (token.startsWith("before:")) {
      const dayRange = getLocalDayRangeFromIsoDate(token.slice(7));
      beforeTs = dayRange ? dayRange.start : null;
      continue;
    }

    if (token.startsWith("after:")) {
      const dayRange = getLocalDayRangeFromIsoDate(token.slice(6));
      afterTs = dayRange ? dayRange.end : null;
      continue;
    }

    textTerms.push(token.toLowerCase());
  }

  return {
    textTerms,
    authorTerm,
    hasKinds,
    requireAttachment,
    onDayRange,
    beforeTs,
    afterTs,
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

function normalizeGroupRole(
  value: string | null | undefined,
  fallback: GroupRole
): GroupRole {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "owner" || normalized === "admin" || normalized === "member") {
    return normalized;
  }
  return fallback;
}

function getThreadRoleForUser(thread: StoredChatThread, userId: string): GroupRole | null {
  if (thread.threadType !== "group" || !thread.memberIds.includes(userId)) {
    return null;
  }
  if (thread.createdById === userId) {
    return "owner";
  }
  return normalizeGroupRole(thread.groupRoles?.[userId], "member");
}

function canRolePostInChannel(role: GroupRole | null): boolean {
  return role === "owner" || role === "admin";
}

function isThreadContentProtectionEnabled(
  thread: StoredChatThread | null | undefined
): boolean {
  return Boolean(
    thread &&
      thread.threadType === "group" &&
      thread.contentProtectionEnabled === true
  );
}

const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)(\?[^?\s]*)?$/i;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi;
const INLINE_LINK_PATTERN = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/gi;
const INLINE_STYLE_PATTERN = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|~~[^~\n]+?~~|`[^`\n]+?`)/g;
const ORDERED_FORMATTING_ACTIONS: TextFormattingAction[] = [
  "bold",
  "italic",
  "strike",
  "code",
  "quote",
  "list",
];
type EmojiCategoryId =
  | "smileys"
  | "people"
  | "animals"
  | "food"
  | "travel"
  | "activities"
  | "objects"
  | "symbols"
  | "flags";

type EmojiRange = readonly [number, number];

type EmojiCategory = {
  id: EmojiCategoryId;
  label: string;
  emojis: string[];
};

function createEmojiRange(start: number, end: number): string[] {
  const emojis: string[] = [];
  for (let codePoint = start; codePoint <= end; codePoint += 1) {
    emojis.push(String.fromCodePoint(codePoint));
  }
  return emojis;
}

function createEmojiCategory(
  ranges: readonly EmojiRange[],
  extras: readonly string[] = []
): string[] {
  const rangeEmojis = ranges.flatMap(([start, end]) => createEmojiRange(start, end));
  return Array.from(new Set([...rangeEmojis, ...extras]));
}

function createRegionalIndicatorFlags(): string[] {
  const flags: string[] = [];
  for (let first = 0x1f1e6; first <= 0x1f1ff; first += 1) {
    for (let second = 0x1f1e6; second <= 0x1f1ff; second += 1) {
      flags.push(String.fromCodePoint(first, second));
    }
  }
  return flags;
}

const CHAT_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    label: "Смайлы",
    emojis: createEmojiCategory([
      [0x1f600, 0x1f64f],
      [0x1f910, 0x1f92f],
      [0x1f970, 0x1f97b],
      [0x1fae0, 0x1fae8],
    ]),
  },
  {
    id: "people",
    label: "Люди",
    emojis: createEmojiCategory(
      [
        [0x1f44a, 0x1f487],
        [0x1f48f, 0x1f491],
        [0x1f574, 0x1f57a],
        [0x1f590, 0x1f596],
        [0x1f645, 0x1f64f],
        [0x1f6a3, 0x1f6b6],
        [0x1f9b0, 0x1f9b3],
        [0x1f9cd, 0x1f9dd],
      ],
      [
        "\u{1F9D1}\u{200D}\u{1F4BB}",
        "\u{1F9D1}\u{200D}\u{1F3EB}",
        "\u{1F9D1}\u{200D}\u{1F33E}",
        "\u{1F9D1}\u{200D}\u{2695}\u{FE0F}",
        "\u{1F9D1}\u{200D}\u{1F680}",
        "\u{1F9D1}\u{200D}\u{1F692}",
        "\u{1F9D1}\u{200D}\u{1F52C}",
        "\u{1F9D1}\u{200D}\u{1F3A8}",
        "\u{1F9D1}\u{200D}\u{1F373}",
        "\u{1F9D1}\u{200D}\u{1F9AF}",
      ]
    ),
  },
  {
    id: "animals",
    label: "Животные и природа",
    emojis: createEmojiCategory([
      [0x1f400, 0x1f43e],
      [0x1f980, 0x1f997],
      [0x1f998, 0x1f9ae],
      [0x1f331, 0x1f34a],
      [0x1f30a, 0x1f320],
    ]),
  },
  {
    id: "food",
    label: "Еда и напитки",
    emojis: createEmojiCategory([
      [0x1f345, 0x1f37f],
      [0x1f950, 0x1f96f],
      [0x1fad0, 0x1fadb],
    ]),
  },
  {
    id: "travel",
    label: "Путешествия и места",
    emojis: createEmojiCategory([
      [0x1f680, 0x1f6c5],
      [0x1f6e0, 0x1f6ec],
      [0x1f6f3, 0x1f6fc],
      [0x1f5fa, 0x1f5ff],
      [0x1f3d4, 0x1f3df],
      [0x1f3e0, 0x1f3f0],
      [0x1f30d, 0x1f30f],
    ]),
  },
  {
    id: "activities",
    label: "Активности",
    emojis: createEmojiCategory([
      [0x1f383, 0x1f3c4],
      [0x1f3c6, 0x1f3d3],
      [0x1f3f8, 0x1f3fa],
      [0x1f93a, 0x1f94f],
    ]),
  },
  {
    id: "objects",
    label: "Предметы",
    emojis: createEmojiCategory([
      [0x1f4a1, 0x1f4ff],
      [0x1f507, 0x1f56b],
      [0x1f5a5, 0x1f5fa],
      [0x1f9f0, 0x1f9ff],
      [0x1fa70, 0x1fa7c],
      [0x1fa80, 0x1fa89],
      [0x1fa90, 0x1fa9c],
      [0x1faa0, 0x1faaf],
    ]),
  },
  {
    id: "symbols",
    label: "Символы",
    emojis: createEmojiCategory(
      [
        [0x1f300, 0x1f321],
        [0x1f500, 0x1f53d],
        [0x1f546, 0x1f54f],
        [0x1f55b, 0x1f567],
        [0x1f570, 0x1f573],
        [0x1f5a4, 0x1f5a4],
        [0x1f5e8, 0x1f5ef],
      ],
      [
        "\u{2764}\u{FE0F}",
        "\u{1F90D}",
        "\u{1F90E}",
        "\u{1F90F}",
        "\u{1F9E1}",
        "\u{1F49B}",
        "\u{1F49A}",
        "\u{1F499}",
        "\u{1F49C}",
        "\u{1F5A4}",
        "\u{262E}\u{FE0F}",
        "\u{262A}\u{FE0F}",
        "\u{262F}\u{FE0F}",
        "\u{271D}\u{FE0F}",
        "\u{2638}\u{FE0F}",
        "\u{2620}\u{FE0F}",
        "\u{26A0}\u{FE0F}",
        "\u{26D4}",
        "\u{2757}",
        "\u{2753}",
        "\u{2754}",
        "\u{203C}\u{FE0F}",
        "\u{2049}\u{FE0F}",
        "\u{303D}\u{FE0F}",
      ]
    ),
  },
  {
    id: "flags",
    label: "Флаги",
    emojis: createEmojiCategory([], [
      ...createRegionalIndicatorFlags(),
      "\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}",
      "\u{1F3F3}\u{FE0F}\u{200D}\u{26A7}\u{FE0F}",
      "\u{1F3F4}\u{200D}\u{2620}\u{FE0F}",
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
    ]),
  },
];

const CHAT_HOVER_EMOJIS = [
  "\u{1F600}", "\u{1F603}", "\u{1F604}", "\u{1F601}", "\u{1F606}", "\u{1F605}",
  "\u{1F602}", "\u{1F923}", "\u{1F60A}", "\u{1F609}", "\u{1F60D}", "\u{1F618}",
  "\u{1F61A}", "\u{1F61C}", "\u{1F61D}", "\u{1F60E}", "\u{1F914}", "\u{1F928}",
  "\u{1F644}", "\u{1F62E}", "\u{1F62F}", "\u{1F632}", "\u{1F60F}", "\u{1F610}",
  "\u{1F611}", "\u{1F636}", "\u{1F62C}", "\u{1F634}", "\u{1F62A}", "\u{1F924}",
  "\u{1F915}", "\u{1F912}", "\u{1F922}", "\u{1F92E}", "\u{1F92F}", "\u{1F975}",
  "\u{1F976}", "\u{1F630}", "\u{1F628}", "\u{1F627}", "\u{1F622}", "\u{1F62D}",
  "\u{1F621}", "\u{1F620}", "\u{1F92C}", "\u{1F479}", "\u{1F47B}", "\u{1F47D}",
  "\u{1F916}", "\u{1F4A9}", "\u{1F63A}", "\u{1F638}", "\u{1F639}", "\u{1F63B}",
  "\u{1F63C}", "\u{1F63D}", "\u{1F640}", "\u{1F63F}", "\u{1F63E}", "\u{1F64C}",
  "\u{1F44D}", "\u{1F44E}", "\u{1F44F}", "\u{1F64F}", "\u{1F91D}", "\u{1F525}",
  "\u{1F4AF}", "\u{2764}\u{FE0F}", "\u{1FAE1}", "\u{1F48E}", "\u{1F389}",
  "\u{1F381}", "\u{1F680}", "\u{1F31F}", "\u{1F308}", "\u{1F973}", "\u{1F60B}",
] as const;

function parseEmojiUsageCounts(rawValue: string | null): Record<string, number> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const normalized: Record<string, number> = {};
    for (const [emoji, value] of Object.entries(parsed)) {
      const count = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(count) || count <= 0) {
        continue;
      }
      normalized[emoji] = Math.floor(count);
    }
    return normalized;
  } catch {
    return {};
  }
}

function extractUrls(text: string): string[] {
  return text.match(URL_PATTERN) ?? [];
}

function renderInlineStyledText(segment: string, keyPrefix: string): ReactNode[] {
  if (!segment) {
    return [];
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of segment.matchAll(INLINE_STYLE_PATTERN)) {
    const full = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(segment.slice(lastIndex, start));
    }

    const tokenKey = `${keyPrefix}-style-${tokenIndex}`;
    if (full.startsWith("**") && full.endsWith("**")) {
      nodes.push(<strong key={tokenKey}>{full.slice(2, -2)}</strong>);
    } else if (full.startsWith("*") && full.endsWith("*")) {
      nodes.push(<em key={tokenKey}>{full.slice(1, -1)}</em>);
    } else if (full.startsWith("~~") && full.endsWith("~~")) {
      nodes.push(<s key={tokenKey}>{full.slice(2, -2)}</s>);
    } else if (full.startsWith("`") && full.endsWith("`")) {
      nodes.push(
        <code
          key={tokenKey}
          className="rounded bg-zinc-900/25 px-1 py-0.5 font-mono text-[0.92em]"
        >
          {full.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(full);
    }

    lastIndex = start + full.length;
    tokenIndex += 1;
  }

  if (lastIndex < segment.length) {
    nodes.push(segment.slice(lastIndex));
  }

  return nodes;
}

function renderFormattedInlineContent(text: string, keyPrefix: string): ReactNode[] {
  if (!text) {
    return [];
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(INLINE_LINK_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(
        ...renderInlineStyledText(text.slice(lastIndex, start), `${keyPrefix}-plain-${tokenIndex}`)
      );
    }

    const label = match[1];
    const markdownHref = match[2];
    const plainHref = match[3];
    const href = markdownHref ?? plainHref;
    const linkText = label ?? href;

    if (href) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${tokenIndex}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-current/50 underline-offset-4 hover:decoration-current"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = start + match[0].length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(
      ...renderInlineStyledText(text.slice(lastIndex), `${keyPrefix}-plain-tail`)
    );
  }

  return nodes;
}

function renderFormattedMessageText(text: string): ReactNode {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockLines: string[] = [];

  const flushCodeBlock = (key: string) => {
    if (!inCodeBlock) {
      return;
    }
    nodes.push(
      <pre
        key={key}
        className="overflow-x-auto rounded-lg border border-zinc-700/80 bg-zinc-950/90 px-3 py-2 text-[13px] leading-5"
      >
        {codeBlockLanguage ? (
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            {codeBlockLanguage}
          </div>
        ) : null}
        <code className="whitespace-pre text-zinc-100">
          {codeBlockLines.join("\n")}
        </code>
      </pre>
    );
    inCodeBlock = false;
    codeBlockLanguage = "";
    codeBlockLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const key = `line-${index}`;
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(`${key}-code-close`);
      } else {
        inCodeBlock = true;
        codeBlockLanguage = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (!trimmed) {
      nodes.push(<div key={`${key}-spacer`} className="h-1.5" />);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 1;
      const headingContent = headingMatch[2] ?? "";
      const headingClassName =
        level <= 1
          ? "text-lg font-semibold"
          : level === 2
            ? "text-base font-semibold"
            : "text-sm font-semibold";
      nodes.push(
        <div key={`${key}-heading`} className={`${headingClassName} leading-6`}>
          {renderFormattedInlineContent(headingContent, `${key}-heading`)}
        </div>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      nodes.push(
        <div key={key} className="border-l-2 border-primary/70 pl-2 opacity-95">
          {renderFormattedInlineContent(line.slice(2), `${key}-quote`)}
        </div>
      );
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      nodes.push(
        <div key={key} className="flex items-start gap-2">
          <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-current/80" />
          <span>{renderFormattedInlineContent(unorderedMatch[1] ?? "", `${key}-list`)}</span>
        </div>
      );
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      nodes.push(
        <div key={key} className="flex items-start gap-2">
          <span className="min-w-[1.25rem] shrink-0 text-right text-current/80">
            {(orderedMatch[1] ?? "1").slice(0, 4)}.
          </span>
          <span>{renderFormattedInlineContent(orderedMatch[2] ?? "", `${key}-olist`)}</span>
        </div>
      );
      continue;
    }

    nodes.push(
      <div key={key} className="whitespace-pre-wrap">
        {renderFormattedInlineContent(line, `${key}-text`)}
      </div>
    );
  }

  if (inCodeBlock) {
    flushCodeBlock("line-code-eof");
  }

  return <div className="space-y-1 leading-6 break-words">{nodes}</div>;
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
  if (type.startsWith("audio/")) {
    return "audio";
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

type PreparedCallAudioStream = {
  stream: MediaStream;
  cleanup: () => void;
};

function prepareCallAudioStream(sourceStream: MediaStream): PreparedCallAudioStream {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return { stream: sourceStream, cleanup: () => undefined };
  }

  try {
    const audioContext = new window.AudioContext({ latencyHint: "interactive" });
    const sourceNode = audioContext.createMediaStreamSource(sourceStream);
    const highPassFilter = audioContext.createBiquadFilter();
    const lowPassFilter = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const destination = audioContext.createMediaStreamDestination();

    highPassFilter.type = "highpass";
    highPassFilter.frequency.value = 120;
    highPassFilter.Q.value = 0.707;

    lowPassFilter.type = "lowpass";
    lowPassFilter.frequency.value = 7600;
    lowPassFilter.Q.value = 0.8;

    compressor.threshold.value = -48;
    compressor.knee.value = 30;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.14;

    sourceNode.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(compressor);
    compressor.connect(destination);

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }

    const processedTrack = destination.stream.getAudioTracks()[0];
    // Fail-safe: suspended WebAudio contexts can produce silent outgoing audio.
    const stream =
      processedTrack && processedTrack.readyState === "live" && audioContext.state === "running"
        ? new MediaStream([processedTrack])
        : sourceStream;

    if (processedTrack && stream !== sourceStream) {
      processedTrack.contentHint = "speech";
    }

    return {
      stream,
      cleanup: () => {
        sourceNode.disconnect();
        highPassFilter.disconnect();
        lowPassFilter.disconnect();
        compressor.disconnect();
        destination.disconnect();
        void audioContext.close().catch(() => undefined);
      },
    };
  } catch {
    return { stream: sourceStream, cleanup: () => undefined };
  }
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

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unsupported file result."));
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(blob);
  });
}

function pickVoiceMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

function resolvePlayableAudioMimeTypeFallback(): string {
  if (typeof document === "undefined") {
    return "audio/webm";
  }
  const audio = document.createElement("audio");
  const candidates = ["audio/mp4", "audio/webm", "audio/ogg"];
  for (const candidate of candidates) {
    const support = audio.canPlayType(candidate);
    if (support === "probably" || support === "maybe") {
      return candidate;
    }
  }
  return "audio/webm";
}

function getVoiceExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  if (mimeType.includes("webm")) {
    return "webm";
  }
  return "bin";
}

function buildVoiceAttachmentName(timestamp: number, mimeType: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const extension = getVoiceExtension(mimeType);
  return `voice-${year}${month}${day}-${hours}${minutes}${seconds}.${extension}`;
}

let activeAudioAttachmentElement: HTMLAudioElement | null = null;

type AudioAttachmentPlayerProps = {
  src: string;
  disableDownload?: boolean;
  onBlockedAction?: () => void;
};

function AudioAttachmentPlayer({
  src,
  disableDownload = false,
  onBlockedAction,
}: AudioAttachmentPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoadedMetadata = () => {
      const value = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(Math.max(0, value));
    };
    const handleTimeUpdate = () => {
      const value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      setCurrentTime(Math.max(0, value));
    };
    const handlePlay = () => {
      if (
        activeAudioAttachmentElement &&
        activeAudioAttachmentElement !== audio
      ) {
        activeAudioAttachmentElement.pause();
      }
      activeAudioAttachmentElement = audio;
      setIsPlaying(true);
    };
    const handlePause = () => {
      if (activeAudioAttachmentElement === audio) {
        activeAudioAttachmentElement = null;
      }
      setIsPlaying(false);
    };
    const handleEnded = () => {
      if (activeAudioAttachmentElement === audio) {
        activeAudioAttachmentElement = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      if (activeAudioAttachmentElement === audio) {
        activeAudioAttachmentElement = null;
        audio.pause();
      }
    };
  }, []);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      if (
        activeAudioAttachmentElement &&
        activeAudioAttachmentElement !== audio
      ) {
        activeAudioAttachmentElement.pause();
      }
      void audio
        .play()
        .then(() => {
          activeAudioAttachmentElement = audio;
        })
        .catch(() => undefined);
      return;
    }
    audio.pause();
  };

  return (
    <div
      className="w-[248px] max-w-full rounded-xl border border-zinc-600/70 bg-zinc-800/70 px-2.5 py-2"
      onContextMenu={
        disableDownload
          ? (event) => {
              event.preventDefault();
              onBlockedAction?.();
            }
          : undefined
      }
    >
      <audio ref={audioRef} preload="metadata" src={src} className="hidden" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-500 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            {`${formatCallDuration(Math.floor(currentTime))} / ${
              duration > 0 ? formatCallDuration(Math.floor(duration)) : "--:--"
            }`}
          </p>
        </div>
      </div>
    </div>
  );
}

type SidebarJellyButtonProps = {
  active: boolean;
  onActivate: () => void;
  ariaLabel: string;
  title: string;
  children: ReactNode;
};

function SidebarJellyButton({
  active,
  onActivate,
  ariaLabel,
  title,
  children,
}: SidebarJellyButtonProps) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className={`relative flex touch-none select-none items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out ${
        active
          ? "border-primary bg-primary text-zinc-50"
          : "border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100"
      }`}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}

function createIdleMobileBackSwipeGestureState(): MobileBackSwipeGestureState {
  return {
    tracking: false,
    activated: false,
    axisLock: null,
    startX: 0,
    startY: 0,
  };
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
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeChatSearchInputRef = useRef<HTMLInputElement | null>(null);
  const groupInviteUsageInputRef = useRef<HTMLInputElement | null>(null);
  const activeMessagesScrollRef = useRef<HTMLDivElement | null>(null);
  const aiMessagesScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const chatPersonalizationDialogContentRef = useRef<HTMLDivElement | null>(null);
  const emojiMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const emojiCategorySectionRefs = useRef<Map<EmojiCategoryId, HTMLElement | null>>(
    new Map()
  );
  const emojiCloseTimerRef = useRef<number | null>(null);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);
  const incomingCallRingtoneRef = useRef<HTMLAudioElement | null>(null);
  const sendMessageSoundRef = useRef<HTMLAudioElement | null>(null);
  const callOverlayRef = useRef<HTMLDivElement | null>(null);
  const localCallStreamRef = useRef<MediaStream | null>(null);
  const localCallInputStreamRef = useRef<MediaStream | null>(null);
  const localCallAudioCleanupRef = useRef<(() => void) | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const callPeerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const incomingOffersRef = useRef<Map<string, RTCSessionDescriptionInit>>(new Map());
  const pendingRemoteIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  );
  const callRemoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const callRemoteMediaElementsRef = useRef<Map<string, HTMLMediaElement>>(new Map());
  const callChatMemberIdsRef = useRef<string[]>([]);
  const callSessionRef = useRef<CallSessionState | null>(null);
  const callSignalPollInFlightRef = useRef(false);
  const isCallSignalingUnavailableRef = useRef(false);
  const adminJoinRequestRef = useRef<AdminCallJoinRequest | null>(null);
  const hasHandledAdminJoinRequestRef = useRef(false);
  const hasHandledGroupJoinRequestRef = useRef(false);
  const publicGroupSearchRequestIdRef = useRef(0);
  const mobileBackSwipeGestureRef = useRef<MobileBackSwipeGestureState>(
    createIdleMobileBackSwipeGestureState()
  );
  const hasLoadedInitialChatDataRef = useRef(false);
  const hasNotificationBaselineRef = useRef(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const animatedMessageIdsRef = useRef<Set<string>>(new Set());
  const messageAnimationTimersRef = useRef<Map<string, number>>(new Map());
  const messageNodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const highlightMessageTimerRef = useRef<number | null>(null);
  const skipNextDraftPersistRef = useRef(false);
  const hasInitializedMessageAnimationsRef = useRef(false);
  const messagesRef = useRef<StoredChatMessage[]>([]);
  const draftRef = useRef("");
  const lastTypingChatIdRef = useRef<string | null>(null);
  const lastOpenedChatIdRef = useRef<string | null>(null);
  const isTypingStateSentRef = useRef(false);
  const shouldScrollActiveChatToBottomRef = useRef(false);
  const lastDataSyncTimestampRef = useRef(0);
  const lastFullSyncAtRef = useRef(0);
  const baseDocumentTitleRef = useRef("Clore");
  const toastTimerRef = useRef<number | null>(null);
  const toastProgressAnimationRef = useRef<number | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceRecorderStreamRef = useRef<MediaStream | null>(null);
  const voiceRecorderChunksRef = useRef<Blob[]>([]);
  const voiceRecorderDiscardRef = useRef(false);
  const voiceRecordingTimerRef = useRef<number | null>(null);
  const pendingMessageDeletionRef = useRef<
    Map<string, { timeoutId: number; message: StoredChatMessage; chatId: string }>
  >(new Map());
  const pendingChatDeletionRef = useRef<
    Map<
      string,
      {
        timeoutId: number;
        thread: StoredChatThread;
        messages: StoredChatMessage[];
        wasActive: boolean;
      }
    >
  >(new Map());
  const [toast, setToast] = useState<InlineToast | null>(null);
  const [toastProgress, setToastProgress] = useState(0);
  const toastCounterRef = useRef(0);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminPanelLoading, setIsAdminPanelLoading] = useState(false);
  const [isAdminActionPending, setIsAdminActionPending] = useState(false);
  const [adminReports, setAdminReports] = useState<ModerationPanelReport[]>([]);
  const [adminSanctions, setAdminSanctions] = useState<ModerationPanelSanction[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<ModerationPanelAuditLog[]>([]);
  const [activeChatSearchQuery, setActiveChatSearchQuery] = useState("");
  const [activeChatJumpDate, setActiveChatJumpDate] = useState("");
  const [isActiveChatSearchOpen, setIsActiveChatSearchOpen] = useState(false);
  const [isActiveChatProfileSidebarOpen, setIsActiveChatProfileSidebarOpen] =
    useState(false);
  const [isPinnedUserProfileFromMessage, setIsPinnedUserProfileFromMessage] =
    useState(false);
  const [isDeleteChatDialogOpen, setIsDeleteChatDialogOpen] = useState(false);
  const [chatIdToConfirmDelete, setChatIdToConfirmDelete] = useState<string | null>(null);
  const [isShareContactDialogOpen, setIsShareContactDialogOpen] = useState(false);
  const [shareContactQuery, setShareContactQuery] = useState("");
  const [isSharingContact, setIsSharingContact] = useState(false);
  const [messageViewsDialog, setMessageViewsDialog] = useState<{
    count: number;
    labels: string[];
  } | null>(null);
  const [forwardMessageDraft, setForwardMessageDraft] = useState<ForwardMessageDraft | null>(
    null
  );
  const [forwardQuery, setForwardQuery] = useState("");
  const [forwardTargetChatIds, setForwardTargetChatIds] = useState<string[]>([]);
  const [isForwardingMessage, setIsForwardingMessage] = useState(false);
  const [clearedChatAtById, setClearedChatAtById] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(
        `${CHAT_CLEAR_HISTORY_STORAGE_PREFIX}${currentUser.id}`
      );
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return Object.entries(parsed as Record<string, unknown>).reduce<
        Record<string, number>
      >((acc, [chatId, value]) => {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
          acc[chatId] = value;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  });
  const [threads, setThreads] = useState<StoredChatThread[]>([]);
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [serverTimeMs, setServerTimeMs] = useState(() => Date.now());
  const [animatingMessageIds, setAnimatingMessageIds] = useState<Set<string>>(
    () => new Set()
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [knownUsers, setKnownUsers] = useState<AuthUser[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatPreviewUserId, setActiveChatPreviewUserId] = useState<string | null>(
    null
  );
  const [activePublicGroupPreview, setActivePublicGroupPreview] =
    useState<PublicGroupSearchResult | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<SidebarItem["id"]>("home");
  const [aiDraft, setAiDraft] = useState("");
  const [aiMessages, setAiMessages] = useState<AiAssistantMessage[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(
        `${AI_ASSISTANT_HISTORY_STORAGE_KEY_PREFIX}${currentUser.id}`
      );
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return normalizeAiAssistantMessages(parsed);
    } catch {
      return [];
    }
  });
  const [aiSearchEnabled, setAiSearchEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return (
        window.localStorage.getItem(
          `${AI_ASSISTANT_SEARCH_MODE_STORAGE_KEY_PREFIX}${currentUser.id}`
        ) === "1"
      );
    } catch {
      return false;
    }
  });
  const [aiAgentEnabled, setAiAgentEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const stored = window.localStorage.getItem(
        `${AI_ASSISTANT_AGENT_MODE_STORAGE_KEY_PREFIX}${currentUser.id}`
      );
      if (stored === null) {
        return true;
      }
      return stored === "1";
    } catch {
      return true;
    }
  });
  const [isAiAgentWarningOpen, setIsAiAgentWarningOpen] = useState(false);
  const [isAiSubmitting, setIsAiSubmitting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPendingSyncVersion, setAiPendingSyncVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [publicGroupSearchResults, setPublicGroupSearchResults] = useState<
    PublicGroupSearchResult[]
  >([]);
  const [isLoadingPublicGroupSearch, setIsLoadingPublicGroupSearch] =
    useState(false);
  const [isJoiningPreviewGroup, setIsJoiningPreviewGroup] = useState(false);
  const [groupCreationStep, setGroupCreationStep] = useState<"members" | "details">(
    "members"
  );
  const [groupMemberQueryDraft, setGroupMemberQueryDraft] = useState("");
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupMemberIdsDraft, setGroupMemberIdsDraft] = useState<string[]>([]);
  const [groupRenameDraft, setGroupRenameDraft] = useState("");
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState("");
  const [groupAccessTypeDraft, setGroupAccessTypeDraft] = useState<GroupAccessType>("private");
  const [groupPublicUsernameDraft, setGroupPublicUsernameDraft] = useState("");
  const [groupInviteUsageLimitDraft, setGroupInviteUsageLimitDraft] = useState("0");
  const [groupMemberSearchDraft, setGroupMemberSearchDraft] = useState("");
  const [isSavingGroupType, setIsSavingGroupType] = useState(false);
  const [isSavingGroupInviteUsageLimit, setIsSavingGroupInviteUsageLimit] = useState(false);
  const [isSavingGroupContentProtection, setIsSavingGroupContentProtection] =
    useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isGroupTypeDialogOpen, setIsGroupTypeDialogOpen] = useState(false);
  const [isGroupPermissionsDialogOpen, setIsGroupPermissionsDialogOpen] = useState(false);
  const [isGroupInvitationsDialogOpen, setIsGroupInvitationsDialogOpen] = useState(false);
  const [isGroupProfileParticipantsCollapsed, setIsGroupProfileParticipantsCollapsed] =
    useState(false);
  const [isGroupPermissionsParticipantsCollapsed, setIsGroupPermissionsParticipantsCollapsed] =
    useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupCreationKind, setGroupCreationKind] = useState<"group" | "channel">(
    "group"
  );
  const [groupCreationUsernameDraft, setGroupCreationUsernameDraft] = useState("");
  const [isCreateThreadTypeMenuOpen, setIsCreateThreadTypeMenuOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftsByChatId, setDraftsByChatId] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(`${CHAT_DRAFTS_STORAGE_PREFIX}${currentUser.id}`);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>(
        (acc, [chatId, value]) => {
          if (typeof value === "string") {
            acc[chatId] = value;
          }
          return acc;
        },
        {}
      );
    } catch {
      return {};
    }
  });
  const [isFavoritesChatVisible, setIsFavoritesChatVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      return (
        window.localStorage.getItem(
          `${FAVORITES_CHAT_VISIBILITY_STORAGE_KEY_PREFIX}${currentUser.id}`
        ) !== "0"
      );
    } catch {
      return true;
    }
  });
  const [isFavoritesChatPinned, setIsFavoritesChatPinned] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      return (
        window.localStorage.getItem(
          `${FAVORITES_CHAT_PINNED_STORAGE_KEY_PREFIX}${currentUser.id}`
        ) !== "0"
      );
    } catch {
      return true;
    }
  });
  const [unreadBaselineByChatId, setUnreadBaselineByChatId] = useState<Record<string, number>>(
    {}
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [scheduledSendAt, setScheduledSendAt] = useState<number | null>(null);
  const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);
  const [schedulePickerDate, setSchedulePickerDate] = useState<Date | undefined>(
    undefined
  );
  const [schedulePickerHour, setSchedulePickerHour] = useState("00");
  const [schedulePickerMinute, setSchedulePickerMinute] = useState("00");
  const [formattingMenuPosition, setFormattingMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const [isEmojiSidebarOpen, setIsEmojiSidebarOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<EmojiCategoryId>(
    CHAT_EMOJI_CATEGORIES[0].id
  );
  const [emojiUsageCounts, setEmojiUsageCounts] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    return parseEmojiUsageCounts(
      window.localStorage.getItem(`${EMOJI_USAGE_STORAGE_KEY_PREFIX}${currentUser.id}`)
    );
  });
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [viewerImageId, setViewerImageId] = useState<string | null>(null);
  const [viewerSource, setViewerSource] = useState<"chat" | "profile" | "profile-avatar">(
    "chat"
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
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
  const [sendMessageSoundEnabled, setSendMessageSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem(SEND_MESSAGE_SOUND_STORAGE_KEY) !== "0";
  });
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const stored = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });
  const [uiFontFamily, setUiFontFamily] = useState<UiFontFamily>(() => {
    if (typeof window === "undefined") {
      return "default";
    }
    const stored = window.localStorage.getItem(UI_FONT_FAMILY_STORAGE_KEY);
    return stored === "modern" || stored === "readable" || stored === "comfortaa"
      ? stored
      : "default";
  });
  const [uiDensity, setUiDensity] = useState<UiDensity>(() => {
    if (typeof window === "undefined") {
      return "comfortable";
    }
    const stored = window.localStorage.getItem(UI_DENSITY_STORAGE_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  });
  const [uiFontSize, setUiFontSize] = useState<UiFontSize>(() => {
    if (typeof window === "undefined") {
      return "default";
    }
    const stored = window.localStorage.getItem(UI_FONT_SIZE_STORAGE_KEY);
    return stored === "small" || stored === "large" ? stored : "default";
  });
  const [uiRadius, setUiRadius] = useState<UiRadius>(() => {
    if (typeof window === "undefined") {
      return "normal";
    }
    const stored = window.localStorage.getItem(UI_RADIUS_STORAGE_KEY);
    return stored === "sharp" || stored === "rounded" ? stored : "normal";
  });
  const [globalChatWallpaper, setGlobalChatWallpaper] = useState<ChatWallpaper>(() => {
    if (typeof window === "undefined") {
      return "none";
    }
    const stored = window.localStorage.getItem(GLOBAL_CHAT_WALLPAPER_STORAGE_KEY);
    return CHAT_WALLPAPER_OPTIONS.includes(stored as ChatWallpaper)
      ? (stored as ChatWallpaper)
      : "none";
  });
  const [chatPersonalizationById, setChatPersonalizationById] = useState<
    Record<string, ChatPersonalization>
  >(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(
        `${CHAT_PERSONALIZATION_STORAGE_KEY_PREFIX}${currentUser.id}`
      );
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return Object.entries(parsed as Record<string, unknown>).reduce<
        Record<string, ChatPersonalization>
      >((acc, [chatId, value]) => {
        if (!value || typeof value !== "object") {
          return acc;
        }
        const candidate = value as Record<string, unknown>;
        const wallpaper = candidate.wallpaper;
        const fontSize = candidate.fontSize;
        const autoLoadMedia = candidate.autoLoadMedia;
        const normalizedWallpaper =
          wallpaper === "inherit" || CHAT_WALLPAPER_OPTIONS.includes(wallpaper as ChatWallpaper)
            ? (wallpaper as ChatWallpaperSetting)
            : DEFAULT_CHAT_PERSONALIZATION.wallpaper;
        const normalizedFontSize =
          fontSize === "inherit" || fontSize === "small" || fontSize === "default" || fontSize === "large"
            ? (fontSize as ChatFontSizeSetting)
            : DEFAULT_CHAT_PERSONALIZATION.fontSize;
        acc[chatId] = {
          wallpaper: normalizedWallpaper,
          fontSize: normalizedFontSize,
          autoLoadMedia:
            typeof autoLoadMedia === "boolean"
              ? autoLoadMedia
              : DEFAULT_CHAT_PERSONALIZATION.autoLoadMedia,
        };
        return acc;
      }, {});
    } catch {
      return {};
    }
  });
  const [manuallyLoadedMediaIds, setManuallyLoadedMediaIds] = useState<Set<string>>(
    () => new Set()
  );
  const [sidebarItemOrder] = useState<SidebarItem["id"][]>(() => {
    if (typeof window === "undefined") {
      return [...SIDEBAR_ITEM_IDS];
    }
    try {
      const raw = window.localStorage.getItem(
        `${SIDEBAR_LAYOUT_STORAGE_KEY_PREFIX}${currentUser.id}`
      );
      if (!raw) {
        return [...SIDEBAR_ITEM_IDS];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return [...SIDEBAR_ITEM_IDS];
      }
      const orderRaw = (parsed as { order?: unknown }).order;
      if (!Array.isArray(orderRaw)) {
        return [...SIDEBAR_ITEM_IDS];
      }
      const unique = orderRaw.filter(
        (id, index, arr): id is SidebarItem["id"] =>
          SIDEBAR_ITEM_IDS.includes(id as SidebarItem["id"]) && arr.indexOf(id) === index
      );
      for (const id of SIDEBAR_ITEM_IDS) {
        if (!unique.includes(id)) {
          unique.push(id);
        }
      }
      return unique;
    } catch {
      return [...SIDEBAR_ITEM_IDS];
    }
  });
  const [sidebarItemVisibility] = useState<
    Record<SidebarItem["id"], boolean>
  >(() => {
    if (typeof window === "undefined") {
      return { ...DEFAULT_SIDEBAR_VISIBILITY };
    }
    try {
      const raw = window.localStorage.getItem(
        `${SIDEBAR_LAYOUT_STORAGE_KEY_PREFIX}${currentUser.id}`
      );
      if (!raw) {
        return { ...DEFAULT_SIDEBAR_VISIBILITY };
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return { ...DEFAULT_SIDEBAR_VISIBILITY };
      }
      const visibilityRaw = (parsed as { visibility?: unknown }).visibility;
      if (!visibilityRaw || typeof visibilityRaw !== "object") {
        return { ...DEFAULT_SIDEBAR_VISIBILITY };
      }
      const visibilityRecord = visibilityRaw as Record<string, unknown>;
      return SIDEBAR_ITEM_IDS.reduce<Record<SidebarItem["id"], boolean>>((acc, id) => {
        if (id === "assistant" && AI_FEATURE_ENABLED) {
          acc[id] = true;
          return acc;
        }
        acc[id] =
          typeof visibilityRecord[id] === "boolean"
            ? (visibilityRecord[id] as boolean)
            : DEFAULT_SIDEBAR_VISIBILITY[id];
        return acc;
      }, { ...DEFAULT_SIDEBAR_VISIBILITY });
    } catch {
      return { ...DEFAULT_SIDEBAR_VISIBILITY };
    }
  });
  const [isPersonalizationOnboardingOpen, setIsPersonalizationOnboardingOpen] =
    useState(() => {
      if (typeof window === "undefined") {
        return false;
      }
      return (
        window.localStorage.getItem(PERSONALIZATION_ONBOARDING_DONE_STORAGE_KEY) !== "1"
      );
    });
  const [hiddenNotificationCount, setHiddenNotificationCount] = useState(0);
  const [callSession, setCallSession] = useState<CallSessionState | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [callNotice, setCallNotice] = useState("");
  const [callRemoteUserIds, setCallRemoteUserIds] = useState<string[]>([]);
  const [isCallMicMuted, setIsCallMicMuted] = useState(false);
  const [isCallSoundMuted, setIsCallSoundMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCallFullscreen, setIsCallFullscreen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSectionId>("privacy");
  const [isChatPersonalizationOpen, setIsChatPersonalizationOpen] = useState(false);
  const [privacyPickerField, setPrivacyPickerField] = useState<
    "lastSeen" | "avatar" | "bio" | "birthday" | "call" | "forward" | "groupAdd" | null
  >(null);
  const [privacyPickerQuery, setPrivacyPickerQuery] = useState("");
  const orderedSidebarItems = useMemo(() => {
    const itemById = new Map(sidebarItems.map((item) => [item.id, item]));
    const normalizedOrder: SidebarItem["id"][] = [];
    for (const id of sidebarItemOrder) {
      if (!SIDEBAR_ITEM_IDS.includes(id) || normalizedOrder.includes(id)) {
        continue;
      }
      normalizedOrder.push(id);
    }
    for (const id of SIDEBAR_ITEM_IDS) {
      if (!normalizedOrder.includes(id)) {
        normalizedOrder.push(id);
      }
    }
    return normalizedOrder
      .map((id) => itemById.get(id))
      .filter((item): item is SidebarItem => Boolean(item));
  }, [sidebarItemOrder]);
  const visibleSidebarItems = useMemo(
    () =>
      orderedSidebarItems.filter((item) => sidebarItemVisibility[item.id] !== false),
    [orderedSidebarItems, sidebarItemVisibility]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setEmojiUsageCounts(
      parseEmojiUsageCounts(
        window.localStorage.getItem(`${EMOJI_USAGE_STORAGE_KEY_PREFIX}${currentUser.id}`)
      )
    );
  }, [currentUser.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${CHAT_CLEAR_HISTORY_STORAGE_PREFIX}${currentUser.id}`,
      JSON.stringify(clearedChatAtById)
    );
  }, [clearedChatAtById, currentUser.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${CHAT_DRAFTS_STORAGE_PREFIX}${currentUser.id}`,
      JSON.stringify(draftsByChatId)
    );
  }, [draftsByChatId, currentUser.id]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${EMOJI_USAGE_STORAGE_KEY_PREFIX}${currentUser.id}`,
      JSON.stringify(emojiUsageCounts)
    );
  }, [emojiUsageCounts, currentUser.id]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${FAVORITES_CHAT_VISIBILITY_STORAGE_KEY_PREFIX}${currentUser.id}`,
      isFavoritesChatVisible ? "1" : "0"
    );
  }, [isFavoritesChatVisible, currentUser.id]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${FAVORITES_CHAT_PINNED_STORAGE_KEY_PREFIX}${currentUser.id}`,
      isFavoritesChatPinned ? "1" : "0"
    );
  }, [isFavoritesChatPinned, currentUser.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const normalizedHistory = aiMessages
      .filter((message) => !message.pending)
      .slice(-MAX_AI_ASSISTANT_HISTORY_MESSAGES)
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      }));
    window.localStorage.setItem(
      `${AI_ASSISTANT_HISTORY_STORAGE_KEY_PREFIX}${currentUser.id}`,
      JSON.stringify(normalizedHistory)
    );
  }, [aiMessages, currentUser.id]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${AI_ASSISTANT_SEARCH_MODE_STORAGE_KEY_PREFIX}${currentUser.id}`,
      aiSearchEnabled ? "1" : "0"
    );
  }, [aiSearchEnabled, currentUser.id]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      `${AI_ASSISTANT_AGENT_MODE_STORAGE_KEY_PREFIX}${currentUser.id}`,
      aiAgentEnabled ? "1" : "0"
    );
  }, [aiAgentEnabled, currentUser.id]);
  useEffect(() => {
    if (activeSidebar !== "assistant") {
      return;
    }
    const node = aiMessagesScrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [activeSidebar, aiMessages]);

  useEffect(() => {
    if (!activeChatId) {
      lastOpenedChatIdRef.current = null;
      shouldScrollActiveChatToBottomRef.current = false;
      return;
    }
    if (lastOpenedChatIdRef.current === activeChatId) {
      return;
    }
    lastOpenedChatIdRef.current = activeChatId;
    shouldScrollActiveChatToBottomRef.current = true;
  }, [activeChatId]);

  useEffect(() => {
    if (!shouldScrollActiveChatToBottomRef.current) {
      return;
    }
    if (!activeChatId || activeSidebar !== "home") {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop && mobileView !== "chat") {
      return;
    }

    const node = activeMessagesScrollRef.current;
    if (!node) {
      return;
    }

    const scrollToBottom = () => {
      node.scrollTop = node.scrollHeight;
    };

    scrollToBottom();
    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom();
      shouldScrollActiveChatToBottomRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeChatId, activeSidebar, messages, mobileView]);

  useEffect(() => {
    setActiveChatSearchQuery("");
    setActiveChatJumpDate("");
    setIsActiveChatSearchOpen(false);

    skipNextDraftPersistRef.current = true;
    if (!activeChatId) {
      setDraft("");
      return;
    }
    setDraft(draftsByChatId[activeChatId] ?? "");
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || activeChatId in unreadBaselineByChatId) {
      return;
    }
    const thread = threads.find((candidate) => candidate.id === activeChatId);
    if (!thread) {
      return;
    }
    setUnreadBaselineByChatId((prev) => ({
      ...prev,
      [activeChatId]: thread.readBy?.[currentUser.id] ?? 0,
    }));
  }, [activeChatId, currentUser.id, threads, unreadBaselineByChatId]);

  useEffect(() => {
    if (!hasInitializedMessageAnimationsRef.current) {
      animatedMessageIdsRef.current = new Set(messages.map((message) => message.id));
      hasInitializedMessageAnimationsRef.current = true;
      return;
    }

    const newlyAppearedIds: string[] = [];
    for (const message of messages) {
      if (animatedMessageIdsRef.current.has(message.id)) {
        continue;
      }
      animatedMessageIdsRef.current.add(message.id);
      newlyAppearedIds.push(message.id);
    }

    if (newlyAppearedIds.length === 0) {
      return;
    }

    setAnimatingMessageIds((prev) => {
      const next = new Set(prev);
      for (const messageId of newlyAppearedIds) {
        next.add(messageId);
      }
      return next;
    });

    for (const messageId of newlyAppearedIds) {
      const existingTimer = messageAnimationTimersRef.current.get(messageId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      const timerId = window.setTimeout(() => {
        setAnimatingMessageIds((prev) => {
          if (!prev.has(messageId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        messageAnimationTimersRef.current.delete(messageId);
      }, MESSAGE_APPEAR_ANIMATION_MS);
      messageAnimationTimersRef.current.set(messageId, timerId);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      for (const timerId of messageAnimationTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      messageAnimationTimersRef.current.clear();
      if (highlightMessageTimerRef.current) {
        window.clearTimeout(highlightMessageTimerRef.current);
        highlightMessageTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!activeChatId || editingMessageId) {
      return;
    }
    if (skipNextDraftPersistRef.current) {
      skipNextDraftPersistRef.current = false;
      return;
    }

    setDraftsByChatId((prev) => {
      const current = prev[activeChatId] ?? "";
      if (current === draft) {
        return prev;
      }
      const next = { ...prev };
      if (draft.length > 0) {
        next[activeChatId] = draft;
      } else {
        delete next[activeChatId];
      }
      return next;
    });
  }, [activeChatId, draft, editingMessageId]);

  useEffect(() => {
    if (draft.trim().length > 0) {
      return;
    }
    setFormattingMenuPosition(null);
  }, [draft]);

  useEffect(() => {
    if (!formattingMenuPosition) {
      return;
    }

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && composerRef.current?.contains(target)) {
        return;
      }
      setFormattingMenuPosition(null);
    };

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormattingMenuPosition(null);
      }
    };

    const closeMenu = () => setFormattingMenuPosition(null);

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [formattingMenuPosition]);
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
  const isAdminAccount = useMemo(
    () =>
      currentUser.username.trim().replace(/^@+/, "").toLowerCase() ===
      ADMIN_PANEL_USERNAME,
    [currentUser.username]
  );
  const openAdminDashboard = useCallback(() => {
    if (!isAdminAccount || typeof window === "undefined") {
      return;
    }
    window.location.href = "/admin";
  }, [isAdminAccount]);
  useEffect(() => {
    if (!isAdminAccount) {
      adminJoinRequestRef.current = null;
      hasHandledAdminJoinRequestRef.current = false;
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const chatId = params.get("adminThreadId")?.trim() ?? "";
    if (!chatId) {
      adminJoinRequestRef.current = null;
      hasHandledAdminJoinRequestRef.current = false;
      return;
    }

    const joinCall = params.get("adminJoinCall") === "1";
    const targetUserIds = [
      ...new Set(
        (params.get("adminCallTargets") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0 && value !== currentUser.id)
      ),
    ];

    adminJoinRequestRef.current = {
      chatId,
      joinCall,
      targetUserIds,
    };
    hasHandledAdminJoinRequestRef.current = false;
  }, [currentUser.id, isAdminAccount]);
  useEffect(() => {
    hasHandledGroupJoinRequestRef.current = false;
  }, [currentUser.id]);
  const getRequestErrorMessage = useCallback(
    (error: unknown) =>
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : t("actionFailed"),
    [t]
  );
  const createAiMessageId = useCallback(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);
  const clearAiConversation = useCallback(() => {
    setAiMessages([]);
    setAiError("");
  }, []);
  const handleAiAgentToggle = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setAiAgentEnabled(false);
        return;
      }
      if (aiAgentEnabled) {
        return;
      }
      setIsAiAgentWarningOpen(true);
    },
    [aiAgentEnabled]
  );
  const confirmEnableAiAgent = useCallback(() => {
    setAiAgentEnabled(true);
    setIsAiAgentWarningOpen(false);
  }, []);
  const sendAiPrompt = useCallback(async () => {
    if (!AI_FEATURE_ENABLED) {
      return;
    }
    const prompt = aiDraft.trim();
    if (!prompt || isAiSubmitting) {
      return;
    }

    const userMessage: AiAssistantMessage = {
      id: createAiMessageId(),
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };
    const pendingAssistantId = createAiMessageId();
    const pendingAssistantMessage: AiAssistantMessage = {
      id: pendingAssistantId,
      role: "assistant",
      content: t("aiAssistantThinking"),
      createdAt: Date.now(),
      pending: true,
    };
    const conversation: AiAssistantRequestMessage[] = [
      ...aiMessages
        .filter((message) => !message.pending && message.content.trim().length > 0)
        .slice(-20)
        .map((message) => ({
          role: message.role,
          content: message.content.trim(),
        })),
      {
        role: "user",
        content: prompt,
      },
    ];

    setAiDraft("");
    setAiError("");
    setIsAiSubmitting(true);
    setAiMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);

    try {
      const response = await requestJson<AiAssistantChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          language,
          searchEnabled: aiSearchEnabled,
          agentEnabled: aiAgentEnabled,
          messages: conversation,
        }),
      });
      const reply = response.message.trim() || t("actionFailed");
      setAiMessages((prev) =>
        prev.map((message) =>
          message.id === pendingAssistantId
            ? {
                ...message,
                content: reply,
                pending: false,
                error: false,
              }
            : message
        )
      );
      if (
        (response.sentMessages ?? 0) > 0 ||
        (response.deletedChats ?? 0) > 0 ||
        (response.createdGroups ?? 0) > 0 ||
        (response.invitedMembers ?? 0) > 0 ||
        (response.removedMembers ?? 0) > 0 ||
        (response.updatedGroups ?? 0) > 0 ||
        (response.updatedMemberRoles ?? 0) > 0
      ) {
        setAiPendingSyncVersion((prev) => prev + 1);
      }
    } catch (error) {
      const message = getRequestErrorMessage(error);
      setAiError(message);
      setAiMessages((prev) =>
        prev.map((item) =>
          item.id === pendingAssistantId
            ? {
                ...item,
                content: message,
                pending: false,
                error: true,
              }
            : item
        )
      );
    } finally {
      setIsAiSubmitting(false);
    }
  }, [
    aiAgentEnabled,
    aiSearchEnabled,
    aiDraft,
    aiMessages,
    createAiMessageId,
    currentUser.id,
    getRequestErrorMessage,
    isAiSubmitting,
    language,
    t,
  ]);
  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (toastProgressAnimationRef.current) {
      window.cancelAnimationFrame(toastProgressAnimationRef.current);
      toastProgressAnimationRef.current = null;
    }
    setToastProgress(0);
    setToast(null);
  }, []);
  const showToast = useCallback(
    (message: string, action?: ToastAction) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (toastProgressAnimationRef.current) {
        window.cancelAnimationFrame(toastProgressAnimationRef.current);
      }
      toastCounterRef.current += 1;
      setToast({
        id: toastCounterRef.current,
        message,
        action,
      });
      setToastProgress(100);
      toastProgressAnimationRef.current = window.requestAnimationFrame(() => {
        setToastProgress(0);
        toastProgressAnimationRef.current = null;
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToastProgress(0);
        setToast(null);
        toastTimerRef.current = null;
      }, UNDO_WINDOW_MS);
    },
    []
  );
  const applyModerationSnapshot = useCallback((snapshot: ModerationPanelSnapshot) => {
    setAdminReports(snapshot.reports);
    setAdminSanctions(snapshot.sanctions);
    setAdminAuditLogs(snapshot.auditLogs);
  }, []);
  const loadModerationPanelData = useCallback(async () => {
    if (!isAdminAccount) {
      return;
    }
    setIsAdminPanelLoading(true);
    try {
      const payload = await requestJson<{ snapshot: ModerationPanelSnapshot }>(
        `/api/admin/moderation?userId=${encodeURIComponent(currentUser.id)}`
      );
      applyModerationSnapshot(payload.snapshot);
    } catch (error) {
      showToast(getRequestErrorMessage(error));
    } finally {
      setIsAdminPanelLoading(false);
    }
  }, [
    applyModerationSnapshot,
    currentUser.id,
    getRequestErrorMessage,
    isAdminAccount,
    showToast,
  ]);
  const closeModerationPanel = useCallback(() => {
    if (isAdminActionPending) {
      return;
    }
    setIsAdminPanelOpen(false);
  }, [isAdminActionPending]);
  const runModerationAction = useCallback(
    async (payload: ModerationActionPayload) => {
      if (!isAdminAccount || isAdminActionPending) {
        return;
      }
      setIsAdminActionPending(true);
      try {
        const response = await requestJson<{ ok: boolean; snapshot: ModerationPanelSnapshot }>(
          "/api/admin/moderation",
          {
            method: "POST",
            body: JSON.stringify({
              userId: currentUser.id,
              ...payload,
            }),
          }
        );
        applyModerationSnapshot(response.snapshot);
        showToast(language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°." : "Moderation updated.");
      } catch (error) {
        showToast(getRequestErrorMessage(error));
      } finally {
        setIsAdminActionPending(false);
      }
    },
    [
      applyModerationSnapshot,
      currentUser.id,
      getRequestErrorMessage,
      isAdminAccount,
      isAdminActionPending,
      language,
      showToast,
    ]
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
  const privacyVisibilityOptions = PRIVACY_VISIBILITY_OPTIONS;
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
  const currentBirthdayVisibility = normalizePrivacyVisibility(
    currentUser.birthdayVisibility,
    "everyone"
  );
  const currentCallVisibility = normalizePrivacyVisibility(
    currentUser.callVisibility,
    "everyone"
  );
  const currentForwardVisibility = normalizePrivacyVisibility(
    currentUser.forwardVisibility,
    "everyone"
  );
  const currentGroupAddVisibility = normalizePrivacyVisibility(
    currentUser.groupAddVisibility,
    "everyone"
  );
  const currentLastSeenAllowedUserIds =
    currentUser.lastSeenAllowedUserIds ?? EMPTY_USER_IDS;
  const currentAvatarAllowedUserIds =
    currentUser.avatarAllowedUserIds ?? EMPTY_USER_IDS;
  const currentBioAllowedUserIds = currentUser.bioAllowedUserIds ?? EMPTY_USER_IDS;
  const currentBirthdayAllowedUserIds =
    currentUser.birthdayAllowedUserIds ?? EMPTY_USER_IDS;
  const currentCallAllowedUserIds = currentUser.callAllowedUserIds ?? EMPTY_USER_IDS;
  const currentForwardAllowedUserIds =
    currentUser.forwardAllowedUserIds ?? EMPTY_USER_IDS;
  const currentGroupAddAllowedUserIds =
    currentUser.groupAddAllowedUserIds ?? EMPTY_USER_IDS;
  const availablePrivacyUsers = useMemo(
    () =>
      knownUsers.filter(
        (user) =>
          user.id !== currentUser.id && user.id !== BUILT_IN_ASSISTANT_USER_ID
      ),
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
    (
      field:
        | "lastSeenVisibility"
        | "avatarVisibility"
        | "bioVisibility"
        | "birthdayVisibility"
        | "callVisibility"
        | "forwardVisibility"
        | "groupAddVisibility",
      value: PrivacyVisibility
    ) => {
      const next = {
        lastSeenVisibility: currentLastSeenVisibility,
        avatarVisibility: currentAvatarVisibility,
        bioVisibility: currentBioVisibility,
        birthdayVisibility: currentBirthdayVisibility,
        callVisibility: currentCallVisibility,
        forwardVisibility: currentForwardVisibility,
        groupAddVisibility: currentGroupAddVisibility,
        lastSeenAllowedUserIds: currentLastSeenAllowedUserIds,
        avatarAllowedUserIds: currentAvatarAllowedUserIds,
        bioAllowedUserIds: currentBioAllowedUserIds,
        birthdayAllowedUserIds: currentBirthdayAllowedUserIds,
        callAllowedUserIds: currentCallAllowedUserIds,
        forwardAllowedUserIds: currentForwardAllowedUserIds,
        groupAddAllowedUserIds: currentGroupAddAllowedUserIds,
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
        if (field === "birthdayVisibility") {
          next.birthdayAllowedUserIds = [];
        }
        if (field === "callVisibility") {
          next.callAllowedUserIds = [];
        }
        if (field === "forwardVisibility") {
          next.forwardAllowedUserIds = [];
        }
        if (field === "groupAddVisibility") {
          next.groupAddAllowedUserIds = [];
        }
      }
      void onPrivacyUpdate?.(next);
    },
    [
      currentAvatarVisibility,
      currentAvatarAllowedUserIds,
      currentBirthdayVisibility,
      currentBirthdayAllowedUserIds,
      currentCallVisibility,
      currentCallAllowedUserIds,
      currentForwardVisibility,
      currentForwardAllowedUserIds,
      currentGroupAddVisibility,
      currentGroupAddAllowedUserIds,
      currentBioVisibility,
      currentBioAllowedUserIds,
      currentLastSeenVisibility,
      currentLastSeenAllowedUserIds,
      onPrivacyUpdate,
    ]
  );

  const toggleAllowedPrivacyUser = useCallback(
    (
      field:
        | "lastSeenAllowedUserIds"
        | "avatarAllowedUserIds"
        | "bioAllowedUserIds"
        | "birthdayAllowedUserIds"
        | "callAllowedUserIds"
        | "forwardAllowedUserIds"
        | "groupAddAllowedUserIds",
      visibilityField:
        | "lastSeenVisibility"
        | "avatarVisibility"
        | "bioVisibility"
        | "birthdayVisibility"
        | "callVisibility"
        | "forwardVisibility"
        | "groupAddVisibility",
      targetUserId: string
    ) => {
      const next = {
        lastSeenVisibility: currentLastSeenVisibility,
        avatarVisibility: currentAvatarVisibility,
        bioVisibility: currentBioVisibility,
        birthdayVisibility: currentBirthdayVisibility,
        callVisibility: currentCallVisibility,
        forwardVisibility: currentForwardVisibility,
        groupAddVisibility: currentGroupAddVisibility,
        lastSeenAllowedUserIds: currentLastSeenAllowedUserIds,
        avatarAllowedUserIds: currentAvatarAllowedUserIds,
        bioAllowedUserIds: currentBioAllowedUserIds,
        birthdayAllowedUserIds: currentBirthdayAllowedUserIds,
        callAllowedUserIds: currentCallAllowedUserIds,
        forwardAllowedUserIds: currentForwardAllowedUserIds,
        groupAddAllowedUserIds: currentGroupAddAllowedUserIds,
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
      currentBirthdayVisibility,
      currentBirthdayAllowedUserIds,
      currentCallVisibility,
      currentCallAllowedUserIds,
      currentForwardVisibility,
      currentForwardAllowedUserIds,
      currentGroupAddVisibility,
      currentGroupAddAllowedUserIds,
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
      : privacyPickerField === "birthday"
          ? "birthdayAllowedUserIds"
      : privacyPickerField === "call"
          ? "callAllowedUserIds"
      : privacyPickerField === "forward"
          ? "forwardAllowedUserIds"
      : privacyPickerField === "groupAdd"
          ? "groupAddAllowedUserIds"
          : null;
  const pickerVisibilityField =
    privacyPickerField === "lastSeen"
      ? "lastSeenVisibility"
      : privacyPickerField === "avatar"
        ? "avatarVisibility"
      : privacyPickerField === "bio"
          ? "bioVisibility"
      : privacyPickerField === "birthday"
          ? "birthdayVisibility"
      : privacyPickerField === "call"
          ? "callVisibility"
      : privacyPickerField === "forward"
          ? "forwardVisibility"
      : privacyPickerField === "groupAdd"
          ? "groupAddVisibility"
          : null;
  const pickerSelectedUserIds =
    privacyPickerField === "lastSeen"
      ? currentLastSeenAllowedUserIds
      : privacyPickerField === "avatar"
        ? currentAvatarAllowedUserIds
      : privacyPickerField === "bio"
          ? currentBioAllowedUserIds
      : privacyPickerField === "birthday"
          ? currentBirthdayAllowedUserIds
      : privacyPickerField === "call"
          ? currentCallAllowedUserIds
      : privacyPickerField === "forward"
          ? currentForwardAllowedUserIds
      : privacyPickerField === "groupAdd"
          ? currentGroupAddAllowedUserIds
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
    setIsEmojiSidebarOpen(false);
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

  const toggleEmojiSidebar = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setIsEmojiMenuOpen((prev) => !prev);
      return;
    }

    setIsEmojiMenuOpen(false);
    setIsActiveChatProfileSidebarOpen(false);
    setIsEmojiSidebarOpen((prev) => !prev);
  }, []);

  const syncActiveEmojiCategoryWithScroll = useCallback(() => {
    const container = emojiScrollContainerRef.current;
    if (!container) {
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    let closestCategoryId = CHAT_EMOJI_CATEGORIES[0].id;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const category of CHAT_EMOJI_CATEGORIES) {
      const section = emojiCategorySectionRefs.current.get(category.id);
      if (!section) {
        continue;
      }

      const distance = Math.abs(section.getBoundingClientRect().top - containerTop);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCategoryId = category.id;
      }
    }

    setActiveEmojiCategory((prev) => (prev === closestCategoryId ? prev : closestCategoryId));
  }, []);

  const scrollToEmojiCategory = useCallback((categoryId: EmojiCategoryId) => {
    setActiveEmojiCategory(categoryId);
    const section = emojiCategorySectionRefs.current.get(categoryId);
    if (!section) {
      return;
    }
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, []);

  useEffect(() => {
    if (!isEmojiSidebarOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncActiveEmojiCategoryWithScroll();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isEmojiSidebarOpen, syncActiveEmojiCategoryWithScroll]);

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
    const incomingAudio = new Audio(INCOMING_MESSAGE_SOUND_PATH);
    incomingAudio.preload = "auto";
    messageSoundRef.current = incomingAudio;
    const incomingCallRingtone = new Audio(INCOMING_CALL_RINGTONE_PATH);
    incomingCallRingtone.preload = "auto";
    incomingCallRingtone.loop = true;
    incomingCallRingtoneRef.current = incomingCallRingtone;
    const outgoingAudio = new Audio(OUTGOING_MESSAGE_SOUND_PATH);
    outgoingAudio.preload = "auto";
    sendMessageSoundRef.current = outgoingAudio;
    return () => {
      if (incomingCallRingtoneRef.current) {
        incomingCallRingtoneRef.current.pause();
        incomingCallRingtoneRef.current.currentTime = 0;
      }
      messageSoundRef.current = null;
      incomingCallRingtoneRef.current = null;
      sendMessageSoundRef.current = null;
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
    window.localStorage.setItem(
      SEND_MESSAGE_SOUND_STORAGE_KEY,
      sendMessageSoundEnabled ? "1" : "0"
    );
  }, [sendMessageSoundEnabled]);
  useEffect(() => {
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, uiTheme);
  }, [uiTheme]);
  useEffect(() => {
    window.localStorage.setItem(UI_FONT_FAMILY_STORAGE_KEY, uiFontFamily);
  }, [uiFontFamily]);

  useEffect(() => {
    window.localStorage.setItem(UI_DENSITY_STORAGE_KEY, uiDensity);
  }, [uiDensity]);
  useEffect(() => {
    window.localStorage.setItem(UI_FONT_SIZE_STORAGE_KEY, uiFontSize);
  }, [uiFontSize]);
  useEffect(() => {
    window.localStorage.setItem(UI_RADIUS_STORAGE_KEY, uiRadius);
  }, [uiRadius]);
  useEffect(() => {
    window.localStorage.setItem(GLOBAL_CHAT_WALLPAPER_STORAGE_KEY, globalChatWallpaper);
  }, [globalChatWallpaper]);
  useEffect(() => {
    window.localStorage.setItem(
      `${CHAT_PERSONALIZATION_STORAGE_KEY_PREFIX}${currentUser.id}`,
      JSON.stringify(chatPersonalizationById)
    );
  }, [chatPersonalizationById, currentUser.id]);
  useEffect(() => {
    window.localStorage.setItem(
      `${SIDEBAR_LAYOUT_STORAGE_KEY_PREFIX}${currentUser.id}`,
      JSON.stringify({
        order: sidebarItemOrder,
        visibility: sidebarItemVisibility,
      })
    );
  }, [sidebarItemOrder, sidebarItemVisibility, currentUser.id]);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-clore-font-size", uiFontSize);
  }, [uiFontSize]);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-clore-radius", uiRadius);
  }, [uiRadius]);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-clore-font-family", uiFontFamily);
  }, [uiFontFamily]);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-clore-theme", uiTheme);
    root.classList.toggle("dark", uiTheme === "dark");
  }, [uiTheme]);
  useEffect(() => {
    setManuallyLoadedMediaIds(new Set());
  }, [activeChatId]);

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
      const label = language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ" : "New messages";
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

  const loadChatData = useCallback(async (options?: { forceFullSync?: boolean }) => {
    try {
      const now = Date.now();
      const shouldRunFullSync =
        options?.forceFullSync === true ||
        !hasLoadedInitialChatDataRef.current ||
        now - lastFullSyncAtRef.current >= INCREMENTAL_FULL_SYNC_INTERVAL_MS;
      const sinceQuery =
        !shouldRunFullSync && lastDataSyncTimestampRef.current > 0
          ? `&since=${Math.max(0, lastDataSyncTimestampRef.current - 1)}`
          : "";
      const data = await requestJson<MessengerDataResponse>(
        `/api/messenger/data?userId=${encodeURIComponent(currentUser.id)}${sinceQuery}`,
        {
          method: "GET",
        }
      );

      setKnownUsers(data.users);

      if (data.fullSync) {
        setThreads(data.threads);
        setMessages(data.messages);
      } else {
        if (data.threads.length > 0) {
          setThreads((prev) => {
            const byId = new Map(prev.map((thread) => [thread.id, thread]));
            for (const thread of data.threads) {
              byId.set(thread.id, thread);
            }
            return [...byId.values()];
          });
        }

        if (data.messages.length > 0) {
          setMessages((prev) => {
            const byId = new Map(prev.map((message) => [message.id, message]));
            for (const message of data.messages) {
              byId.set(message.id, message);
            }
            return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
          });
        }
      }

      if (data.fullSync) {
        lastFullSyncAtRef.current = now;
      }
      const nextServerTimeMs =
        typeof data.serverTime === "number" && Number.isFinite(data.serverTime)
          ? data.serverTime
          : now;
      lastDataSyncTimestampRef.current = nextServerTimeMs;
      setServerTimeMs(nextServerTimeMs);

      hasLoadedInitialChatDataRef.current = true;
      if (!hasNotificationBaselineRef.current) {
        const baselineMessages = data.fullSync ? data.messages : messagesRef.current;
        seenMessageIdsRef.current = new Set(
          baselineMessages.map((message) => message.id)
        );
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
    if (aiPendingSyncVersion === 0) {
      return;
    }
    void loadChatData({ forceFullSync: true });
  }, [aiPendingSyncVersion, loadChatData]);

  useEffect(() => {
    if (hasHandledGroupJoinRequestRef.current || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const groupUsernameFromUrl = normalizeGroupUsername(params.get("group") ?? "");
    const inviteTokenFromUrl = (params.get("invite") ?? "").trim();
    if (!groupUsernameFromUrl && !inviteTokenFromUrl) {
      hasHandledGroupJoinRequestRef.current = true;
      return;
    }

    const clearJoinParams = () => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("group");
      nextUrl.searchParams.delete("invite");
      const nextQuery = nextUrl.searchParams.toString();
      window.history.replaceState(
        {},
        "",
        `${nextUrl.pathname}${nextQuery ? `?${nextQuery}` : ""}${nextUrl.hash}`
      );
    };

    hasHandledGroupJoinRequestRef.current = true;

    const hasValidPublicUsername =
      groupUsernameFromUrl.length > 0 && isValidGroupUsername(groupUsernameFromUrl);
    if (groupUsernameFromUrl && !hasValidPublicUsername && !inviteTokenFromUrl) {
      clearJoinParams();
      showToast(t("invalidGroupUsername"));
      return;
    }

    void (async () => {
      try {
        const result = await requestJson<JoinGroupResponse>("/api/messenger/join-group", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            username: hasValidPublicUsername ? groupUsernameFromUrl : "",
            inviteToken: hasValidPublicUsername ? "" : inviteTokenFromUrl,
          }),
        });
        await loadChatData({ forceFullSync: true });
        setActiveSidebar("home");
        setIsActiveChatProfileSidebarOpen(false);
        setActiveChatPreviewUserId(null);
        setActivePublicGroupPreview(null);
        setActiveChatId(result.chatId);
        setMobileView("chat");
        showToast(result.joined ? t("joinGroupSuccess") : t("joinGroupAlreadyMember"));
      } catch (error) {
        showToast(getRequestErrorMessage(error));
      } finally {
        clearJoinParams();
      }
    })();
  }, [currentUser.id, getRequestErrorMessage, loadChatData, showToast, t]);

  const chatItems = useMemo<ChatListItem[]>(() => {
    const isDesktopViewport =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    const isActiveChatVisible =
      activeSidebar === "home" && (isDesktopViewport || mobileView === "chat");
    const now = serverTimeMs > 0 ? serverTimeMs : Date.now();
    const isPendingScheduledForCurrentUser = (message: StoredChatMessage) =>
      message.authorId === currentUser.id && message.createdAt > now;
    const usersById = new Map(knownUsers.map((user) => [user.id, user]));
    const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
    const messagesByChat = new Map<string, StoredChatMessage[]>();

    for (const message of messages) {
      const existing = messagesByChat.get(message.chatId);
      if (existing) {
        existing.push(message);
      } else {
        messagesByChat.set(message.chatId, [message]);
      }
    }

    const regularChatItems = [...threads]
      .map((thread) => {
        const isGroup = thread.threadType === "group";
        const groupKind: GroupKind | null = isGroup
          ? thread.groupKind === "channel"
            ? "channel"
            : "group"
          : null;
        const normalizedGroupUsername = normalizeGroupUsername(thread.groupUsername ?? "");
        const groupAccess: GroupAccessType | null =
          isGroup && thread.groupAccess === "public" && isValidGroupUsername(normalizedGroupUsername)
            ? "public"
            : isGroup
              ? "private"
              : null;
        const groupUsername = groupAccess === "public" ? normalizedGroupUsername : "";
        const groupInviteToken = isGroup ? (thread.groupInviteToken?.trim() || thread.id) : "";
        const groupInviteUsageLimit = isGroup
          ? normalizeGroupInviteUsageLimit(thread.groupInviteUsageLimit)
          : 0;
        const groupInviteUsedCount = isGroup
          ? normalizeGroupInviteUsedCount(thread.groupInviteUsedCount, groupInviteUsageLimit)
          : 0;
        const contentProtectionEnabled =
          isGroup && thread.contentProtectionEnabled === true;
        const directMemberId = isGroup
          ? null
          : (thread.memberIds.find((userId) => userId !== currentUser.id) ??
            currentUser.id);
        const isBuiltInAssistantThread =
          !isGroup && directMemberId === BUILT_IN_ASSISTANT_USER_ID;
        if (isBuiltInAssistantThread) {
          return null;
        }
        const directMember = directMemberId ? usersById.get(directMemberId) : null;
        const groupMembers = thread.memberIds
          .filter((userId) => userId !== currentUser.id)
          .map((memberId) => usersById.get(memberId))
          .filter((member): member is AuthUser => member !== undefined);
        const threadMessages = (messagesByChat.get(thread.id) ?? []).filter(
          (message) => !isPendingScheduledForCurrentUser(message)
        );
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
          ? groupAccess === "public" && groupUsername
            ? `@${groupUsername}`
            : `${groupMembers.length + 1} ${
                groupKind === "channel" ? t("subscribers") : t("members")
              }`
          : (directMember?.username ?? "deleted");
        const displayAvatarUrl = isGroup
          ? thread.avatarUrl
          : (directMember?.avatarUrl ?? "");
        const displayBannerUrl = isGroup ? thread.bannerUrl : "";
        const accentId = isGroup ? thread.id : directMemberId ?? thread.id;
        const normalizedGroupRoles = Object.entries(thread.groupRoles ?? {}).reduce<
          Record<string, GroupRole>
        >((acc, [memberId, role]) => {
          acc[memberId] = normalizeGroupRole(
            role,
            thread.createdById === memberId ? "owner" : "member"
          );
          return acc;
        }, {});
        const myGroupRole = isGroup ? getThreadRoleForUser(thread, currentUser.id) : null;

        return {
          id: thread.id,
          memberId: directMemberId,
          memberIds: thread.memberIds,
          memberCount: thread.memberIds.length,
          groupRoles: normalizedGroupRoles,
          isGroup,
          groupKind,
          groupAccess,
          groupUsername,
          groupInviteToken,
          groupInviteUsageLimit,
          groupInviteUsedCount,
          contentProtectionEnabled,
          isFavorites: false,
          isPreview: false,
          createdById: thread.createdById,
          isGroupCreator: isGroup && myGroupRole === "owner",
          myGroupRole,
          name: displayName,
          description: isGroup ? thread.description : "",
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
          updatedAt: Math.max(thread.updatedAt, lastMessage?.createdAt ?? 0),
          isPinned: thread.pinnedBy?.[currentUser.id] === true,
          isMuted: thread.mutedBy?.[currentUser.id] === true,
        };
      })
      .filter((item): item is ChatListItem => item !== null);

    const favoriteMessages = messages
      .map((message) => ({
        message,
        savedAt: message.savedBy?.[currentUser.id] ?? 0,
      }))
      .filter(
        (item) => item.savedAt > 0 && !isPendingScheduledForCurrentUser(item.message)
      )
      .sort((a, b) => a.savedAt - b.savedAt);
    const latestFavorite = favoriteMessages[favoriteMessages.length - 1] ?? null;
    const favoriteThread = latestFavorite
      ? threadsById.get(latestFavorite.message.chatId) ?? null
      : null;
    const favoriteLastMessagePreview = latestFavorite
      ? latestFavorite.message.text.trim() ||
        (latestFavorite.message.attachments.length > 0
          ? t("attachment")
          : t("noMessagesYet"))
      : t("noMessagesYet");

    const sortedRegularChatItems = [...regularChatItems].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });
    const shouldShowFavoritesChat =
      isFavoritesChatVisible || favoriteMessages.length > 0;

    if (!shouldShowFavoritesChat) {
      return sortedRegularChatItems;
    }

    const favoriteChatItem: ChatListItem = {
      id: FAVORITES_CHAT_ID,
      memberId: null,
      memberIds: [currentUser.id],
      memberCount: 1,
      groupRoles: {},
      isGroup: false,
      groupKind: null,
      groupAccess: null,
      groupUsername: "",
      groupInviteToken: "",
      groupInviteUsageLimit: 0,
      groupInviteUsedCount: 0,
      contentProtectionEnabled: false,
      isFavorites: true,
      isPreview: false,
      createdById: currentUser.id,
      isGroupCreator: false,
      myGroupRole: null,
      name: t("favorites"),
      description: "",
      username:
        latestFavorite && favoriteThread
          ? favoriteThread.threadType === "group"
            ? favoriteThread.title || t("groupChat")
            : (() => {
                const peerId =
                  favoriteThread.memberIds.find((memberId) => memberId !== currentUser.id) ??
                  "";
                return usersById.get(peerId)?.name ?? t("unknownUser");
              })()
          : t("savedMessages"),
      avatarUrl: "",
      bannerUrl: "",
      accent: pickAccent(FAVORITES_CHAT_ID),
      lastMessage: favoriteLastMessagePreview,
      lastTime: latestFavorite ? formatChatTime(latestFavorite.savedAt, language) : "",
      unread: 0,
      updatedAt: latestFavorite?.savedAt ?? 0,
      isPinned: isFavoritesChatPinned,
      isMuted: false,
    };

    return [favoriteChatItem, ...sortedRegularChatItems].sort((a, b) => {
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
    isFavoritesChatVisible,
    isFavoritesChatPinned,
    language,
    t,
    activeSidebar,
    mobileView,
    activeChatId,
    serverTimeMs,
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

  const activePreviewChat = useMemo<ChatListItem | null>(() => {
    if (activePublicGroupPreview) {
      const previewGroupName =
        activePublicGroupPreview.title.trim() || `@${activePublicGroupPreview.username}`;
      return {
        id: `${PREVIEW_CHAT_ID_PREFIX}group:${activePublicGroupPreview.username}`,
        memberId: null,
        memberIds: [],
        memberCount: Math.max(1, activePublicGroupPreview.memberCount),
        groupRoles: {},
        isGroup: true,
        groupKind: activePublicGroupPreview.groupKind,
        groupAccess: "public",
        groupUsername: activePublicGroupPreview.username,
        groupInviteToken: "",
        groupInviteUsageLimit: 0,
        groupInviteUsedCount: 0,
        contentProtectionEnabled: false,
        isFavorites: false,
        isPreview: true,
        createdById: "",
        isGroupCreator: false,
        myGroupRole: null,
        name: previewGroupName,
        description: activePublicGroupPreview.description,
        username: `@${activePublicGroupPreview.username}`,
        avatarUrl: activePublicGroupPreview.avatarUrl,
        bannerUrl: activePublicGroupPreview.bannerUrl,
        accent: pickAccent(`public-group:${activePublicGroupPreview.chatId}`),
        lastMessage:
          activePublicGroupPreview.description.trim() || `@${activePublicGroupPreview.username}`,
        lastTime: formatChatTime(activePublicGroupPreview.updatedAt, language),
        unread: 0,
        updatedAt: activePublicGroupPreview.updatedAt,
        isPinned: false,
        isMuted: false,
      };
    }
    if (!activeChatPreviewUserId) {
      return null;
    }
    const previewUser =
      knownUsers.find((candidate) => candidate.id === activeChatPreviewUserId) ?? null;
    if (!previewUser) {
      return null;
    }
    return {
      id: `${PREVIEW_CHAT_ID_PREFIX}${previewUser.id}`,
      memberId: previewUser.id,
      memberIds: [currentUser.id, previewUser.id],
      memberCount: 2,
      groupRoles: {},
      isGroup: false,
      groupKind: null,
      groupAccess: null,
      groupUsername: "",
      groupInviteToken: "",
      groupInviteUsageLimit: 0,
      groupInviteUsedCount: 0,
      contentProtectionEnabled: false,
      isFavorites: false,
      isPreview: true,
      createdById: currentUser.id,
      isGroupCreator: false,
      myGroupRole: null,
      name: previewUser.name || t("unknownUser"),
      description: "",
      username: previewUser.username || "unknown",
      avatarUrl: previewUser.avatarUrl ?? "",
      bannerUrl: previewUser.bannerUrl ?? "",
      accent: pickAccent(previewUser.id),
      lastMessage: t("noMessagesYet"),
      lastTime: "",
      unread: 0,
      updatedAt: 0,
      isPinned: false,
      isMuted: false,
    };
  }, [activeChatPreviewUserId, activePublicGroupPreview, currentUser.id, knownUsers, t, language]);

  const pinnedChatsCount = useMemo(
    () => chatItems.filter((chat) => !chat.isFavorites && chat.isPinned).length,
    [chatItems]
  );

  useEffect(() => {
    if (activeChatPreviewUserId || activePublicGroupPreview) {
      return;
    }
    if (activeChatId && chatItems.some((chat) => chat.id === activeChatId)) {
      return;
    }
    setActiveChatId(
      chatItems.find((chat) => !chat.isFavorites)?.id ?? chatItems[0]?.id ?? null
    );
  }, [activeChatPreviewUserId, activePublicGroupPreview, chatItems, activeChatId]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }
    if (activeChatPreviewUserId) {
      setActiveChatPreviewUserId(null);
    }
    if (activePublicGroupPreview) {
      setActivePublicGroupPreview(null);
    }
  }, [activeChatId, activeChatPreviewUserId, activePublicGroupPreview]);

  const activeChat =
    activePreviewChat ??
    chatItems.find((chat) => chat.id === activeChatId) ??
    filteredChats[0] ??
    null;
  const isActivePublicGroupPreview = Boolean(
    activeChat &&
      activeChat.isPreview &&
      activeChat.isGroup &&
      activeChat.groupAccess === "public" &&
      isValidGroupUsername(activeChat.groupUsername)
  );
  const isActiveChannelReadOnly = Boolean(
    activeChat &&
      !activeChat.isFavorites &&
      !activeChat.isPreview &&
      activeChat.isGroup &&
      activeChat.groupKind === "channel" &&
      !canRolePostInChannel(activeChat.myGroupRole)
  );
  const activeChatAudienceLabel =
    activeChat?.isGroup && activeChat.groupKind === "channel"
      ? t("subscribers")
      : t("members");
  const activeChatPersonalization = useMemo<ChatPersonalization>(() => {
    if (!activeChat) {
      return { ...DEFAULT_CHAT_PERSONALIZATION };
    }
    const stored = chatPersonalizationById[activeChat.id];
    if (!stored) {
      return { ...DEFAULT_CHAT_PERSONALIZATION };
    }
    return {
      wallpaper: stored.wallpaper ?? DEFAULT_CHAT_PERSONALIZATION.wallpaper,
      fontSize: stored.fontSize ?? DEFAULT_CHAT_PERSONALIZATION.fontSize,
      autoLoadMedia:
        typeof stored.autoLoadMedia === "boolean"
          ? stored.autoLoadMedia
          : DEFAULT_CHAT_PERSONALIZATION.autoLoadMedia,
    };
  }, [activeChat, chatPersonalizationById]);
  const activeChatEffectiveWallpaper: ChatWallpaper =
    activeChatPersonalization.wallpaper === "inherit"
      ? globalChatWallpaper
      : activeChatPersonalization.wallpaper;
  const activeChatEffectiveFontSize: UiFontSize =
    activeChatPersonalization.fontSize === "inherit"
      ? uiFontSize
      : activeChatPersonalization.fontSize;
  const activeChatAutoLoadMediaEnabled = activeChatPersonalization.autoLoadMedia;
  const activeChatFontClassName =
    activeChatEffectiveFontSize === "small"
      ? "clore-chat-font-small"
      : activeChatEffectiveFontSize === "large"
        ? "clore-chat-font-large"
        : "clore-chat-font-default";
  const activeChatBackgroundStyle = useMemo(
    () => ({
      backgroundImage: CHAT_WALLPAPER_BACKGROUNDS[activeChatEffectiveWallpaper],
    }),
    [activeChatEffectiveWallpaper]
  );

  useEffect(() => {
    if (activeChat) {
      return;
    }
    setIsChatPersonalizationOpen(false);
  }, [activeChat]);

  const activeChatUser = useMemo(
    () =>
      activeChat &&
      !activeChat.isGroup &&
      !activeChat.isFavorites &&
      activeChat.memberId
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
  const activeChatTypingText = useMemo(() => {
    if (!activeChat || activeChat.isFavorites || activeChat.isPreview) {
      return "";
    }

    const activeThread = threads.find((thread) => thread.id === activeChat.id);
    if (!activeThread) {
      return "";
    }
    if (activeChat.isGroup && activeChat.groupKind === "channel") {
      return "";
    }

    const typingUserIds = Object.entries(activeThread.typingBy ?? {})
      .filter(([userId, typingAt]) => {
        if (userId === currentUser.id) {
          return false;
        }
        return Date.now() - typingAt <= TYPING_ACTIVE_WINDOW_MS;
      })
      .map(([userId]) => userId);

    if (typingUserIds.length === 0) {
      return "";
    }

    if (!activeChat.isGroup) {
      return t("typingNow");
    }

    const typingUsers = typingUserIds
      .map((userId) => knownUsers.find((user) => user.id === userId)?.name)
      .filter((name): name is string => Boolean(name));

    if (typingUsers.length === 0) {
      return language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›..." : "Typing...";
    }
    if (typingUsers.length === 1) {
      return language === "ru"
        ? `${typingUsers[0]} Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›...`
        : `${typingUsers[0]} is typing...`;
    }

    return language === "ru"
      ? `${typingUsers.length} Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р Р†РІР‚С›РЎС›...`
      : `${typingUsers.length} typing...`;
  }, [activeChat, currentUser.id, knownUsers, language, t, threads]);
  const resolveCallPeerName = useCallback(
    (userId: string) => {
      return knownUsers.find((user) => user.id === userId)?.name ?? t("unknownUser");
    },
    [knownUsers, t]
  );
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
    const participantsCount = Math.max(1, callRemoteUserIds.length + 1);
    const participantsLabel =
      callSession.isGroup && participantsCount > 1
        ? ` Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В· ${participantsCount} ${t("participants").toLowerCase()}`
        : "";
    return `${t("inCall")} Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В· ${formatCallDuration(callDurationSeconds)}${participantsLabel}`;
  }, [callDurationSeconds, callRemoteUserIds.length, callSession, t]);
  const callTitle = useMemo(() => {
    if (!callSession) {
      return "";
    }
    if (callSession.isGroup) {
      return (
        chatItems.find((chat) => chat.id === callSession.chatId)?.name ??
        t("groupChat")
      );
    }
    const firstPeerId = callSession.participantUserIds[0];
    if (firstPeerId) {
      return resolveCallPeerName(firstPeerId);
    }
    return callSession.initiatorName || t("unknownUser");
  }, [callSession, chatItems, resolveCallPeerName, t]);
  const callParticipantsSummary = useMemo(() => {
    if (!callSession || !callSession.isGroup) {
      return "";
    }
    const names = callSession.participantUserIds
      .map((userId) => resolveCallPeerName(userId))
      .filter((name, index, source) => source.indexOf(name) === index)
      .slice(0, 4);
    if (names.length === 0) {
      return "";
    }
    const extraCount = Math.max(0, callSession.participantUserIds.length - names.length);
    return extraCount > 0 ? `${names.join(", ")} +${extraCount}` : names.join(", ");
  }, [callSession, resolveCallPeerName]);
  const callChatMatchesActive =
    callSession !== null &&
    activeChat !== null &&
    callSession.chatId === activeChat.id;
  const shouldDisableCallButton =
    !activeChat ||
    activeChat.isFavorites ||
    activeChat.isPreview ||
    (callSession !== null && !callChatMatchesActive);

  useEffect(() => {
    callSessionRef.current = callSession;
  }, [callSession]);

  useEffect(() => {
    const ringtone = incomingCallRingtoneRef.current;
    if (!ringtone) {
      return;
    }
    if (callSession?.phase === "incoming") {
      ringtone.currentTime = 0;
      void ringtone.play().catch(() => undefined);
      return;
    }
    ringtone.pause();
    ringtone.currentTime = 0;
  }, [callSession?.phase]);

  const registerRemoteMediaElement = useCallback(
    (userId: string, element: HTMLMediaElement | null) => {
      if (!element) {
        const previous = callRemoteMediaElementsRef.current.get(userId);
        if (previous) {
          previous.pause();
          previous.srcObject = null;
        }
        callRemoteMediaElementsRef.current.delete(userId);
        return;
      }

      callRemoteMediaElementsRef.current.set(userId, element);
      const stream = callRemoteStreamsRef.current.get(userId) ?? null;
      element.srcObject = stream;
      element.muted = isCallSoundMuted;
      if (stream) {
        void element.play().catch(() => undefined);
      }
    },
    [isCallSoundMuted]
  );

  const closeCallResources = useCallback(() => {
    for (const connection of callPeerConnectionsRef.current.values()) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
    }
    callPeerConnectionsRef.current.clear();

    for (const mediaElement of callRemoteMediaElementsRef.current.values()) {
      mediaElement.pause();
      mediaElement.srcObject = null;
    }
    callRemoteMediaElementsRef.current.clear();
    callRemoteStreamsRef.current.clear();
    setCallRemoteUserIds([]);

    const screenShareStream = screenShareStreamRef.current;
    if (screenShareStream) {
      for (const track of screenShareStream.getTracks()) {
        track.stop();
      }
      screenShareStreamRef.current = null;
    }

    const localStream = localCallStreamRef.current;
    if (localStream) {
      for (const track of localStream.getTracks()) {
        track.stop();
      }
      localCallStreamRef.current = null;
    }
    const localInputStream = localCallInputStreamRef.current;
    if (localInputStream && localInputStream !== localStream) {
      for (const track of localInputStream.getTracks()) {
        track.stop();
      }
    }
    localCallInputStreamRef.current = null;

    const callAudioCleanup = localCallAudioCleanupRef.current;
    if (callAudioCleanup) {
      callAudioCleanup();
      localCallAudioCleanupRef.current = null;
    }

    pendingRemoteIceCandidatesRef.current.clear();
    incomingOffersRef.current.clear();
    callChatMemberIdsRef.current = [];
    setIsScreenSharing(false);
    setIsCallMicMuted(false);
    setIsCallSoundMuted(false);

    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    setIsCallFullscreen(false);
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

  const isCallSupported = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
  }, []);

  const ensurePendingIceQueue = useCallback((peerUserId: string) => {
    const queue = pendingRemoteIceCandidatesRef.current.get(peerUserId);
    if (queue) {
      return queue;
    }
    const nextQueue: RTCIceCandidateInit[] = [];
    pendingRemoteIceCandidatesRef.current.set(peerUserId, nextQueue);
    return nextQueue;
  }, []);

  const removePeerConnection = useCallback((peerUserId: string) => {
    const connection = callPeerConnectionsRef.current.get(peerUserId);
    if (connection) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
      callPeerConnectionsRef.current.delete(peerUserId);
    }

    const remoteStream = callRemoteStreamsRef.current.get(peerUserId);
    if (remoteStream) {
      for (const track of remoteStream.getTracks()) {
        track.stop();
      }
      callRemoteStreamsRef.current.delete(peerUserId);
    }

    const remoteElement = callRemoteMediaElementsRef.current.get(peerUserId);
    if (remoteElement) {
      remoteElement.pause();
      remoteElement.srcObject = null;
      callRemoteMediaElementsRef.current.delete(peerUserId);
    }

    pendingRemoteIceCandidatesRef.current.delete(peerUserId);
    incomingOffersRef.current.delete(peerUserId);
    setCallRemoteUserIds([...callRemoteStreamsRef.current.keys()].sort());
  }, []);

  const flushPendingRemoteIceCandidates = useCallback(
    async (peerUserId: string) => {
      const connection = callPeerConnectionsRef.current.get(peerUserId);
      if (!connection || !connection.remoteDescription) {
        return;
      }

      const queuedCandidates = [...ensurePendingIceQueue(peerUserId)];
      pendingRemoteIceCandidatesRef.current.set(peerUserId, []);

      for (const candidate of queuedCandidates) {
        try {
          await connection.addIceCandidate(candidate);
        } catch {
          // Ignore malformed or stale ICE candidates.
        }
      }
    },
    [ensurePendingIceQueue]
  );

  const ensureCallPeerConnection = useCallback(
    (chatId: string, peerUserId: string) => {
      const existingConnection = callPeerConnectionsRef.current.get(peerUserId);
      if (existingConnection) {
        return existingConnection;
      }

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
        const remoteStream = event.streams[0];
        if (!remoteStream) {
          return;
        }
        callRemoteStreamsRef.current.set(peerUserId, remoteStream);
        setCallRemoteUserIds([...callRemoteStreamsRef.current.keys()].sort());

        const mediaElement = callRemoteMediaElementsRef.current.get(peerUserId);
        if (!mediaElement) {
          return;
        }
        mediaElement.srcObject = remoteStream;
        mediaElement.muted = isCallSoundMuted;
        void mediaElement.play().catch(() => undefined);
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
          removePeerConnection(peerUserId);
          setCallSession((prev) =>
            prev
              ? {
                  ...prev,
                  participantUserIds: prev.participantUserIds.filter((id) => id !== peerUserId),
                }
              : prev
          );
          const currentSession = callSessionRef.current;
          if (!currentSession) {
            return;
          }
          if (!currentSession.isGroup) {
            closeCallSession(t("callEnded"));
            return;
          }
          if (
            callPeerConnectionsRef.current.size === 0 &&
            currentSession.phase !== "incoming"
          ) {
            closeCallSession(t("callEnded"));
          }
        }
      };

      callPeerConnectionsRef.current.set(peerUserId, connection);
      return connection;
    },
    [closeCallSession, isCallSoundMuted, removePeerConnection, sendCallSignal, t]
  );

  const attachLocalStreamToConnection = useCallback(
    (connection: RTCPeerConnection, stream: MediaStream) => {
      for (const track of stream.getTracks()) {
        const hasTrack = connection.getSenders().some((sender) => sender.track === track);
        if (!hasTrack) {
          connection.addTrack(track, stream);
        }
      }
    },
    []
  );

  const ensureLocalCallStream = useCallback(async () => {
    const existingStream = localCallStreamRef.current;
    if (existingStream) {
      return existingStream;
    }

    let inputStream: MediaStream | null = null;
    try {
      const callAudioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints?.() ?? {};
      const extendedSupportedConstraints = supportedConstraints as MediaTrackSupportedConstraints & {
        voiceIsolation?: boolean;
      };
      const supportsVoiceIsolation = Boolean(extendedSupportedConstraints.voiceIsolation);
      if (supportedConstraints?.channelCount) {
        callAudioConstraints.channelCount = { ideal: 1, max: 1 };
      }
      if (supportedConstraints?.sampleRate) {
        callAudioConstraints.sampleRate = { ideal: 48000 };
      }
      if (supportedConstraints?.sampleSize) {
        callAudioConstraints.sampleSize = { ideal: 16 };
      }
      const advancedConstraints: MediaTrackConstraintSet[] = [
        {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        {
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
        } as MediaTrackConstraintSet,
      ];
      if (supportsVoiceIsolation) {
        advancedConstraints.unshift({ voiceIsolation: true } as MediaTrackConstraintSet);
      }
      callAudioConstraints.advanced = advancedConstraints;

      inputStream = await navigator.mediaDevices.getUserMedia({
        audio: callAudioConstraints,
        video: false,
      });
      const preparedStream = prepareCallAudioStream(inputStream);
      const stream = preparedStream.stream;

      const trackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } as MediaTrackConstraints & { voiceIsolation?: boolean };
      if (supportsVoiceIsolation) {
        trackConstraints.voiceIsolation = true;
      }
      for (const track of stream.getAudioTracks()) {
        track.enabled = !isCallMicMuted;
        track.contentHint = "speech";
        void track.applyConstraints(trackConstraints).catch(() => undefined);
      }
      for (const track of inputStream.getAudioTracks()) {
        track.enabled = !isCallMicMuted;
      }

      localCallInputStreamRef.current = inputStream;
      localCallAudioCleanupRef.current = preparedStream.cleanup;
      localCallStreamRef.current = stream;
      return stream;
    } catch {
      if (inputStream) {
        for (const track of inputStream.getTracks()) {
          track.stop();
        }
      }
      throw new Error("MIC_ACCESS_DENIED");
    }
  }, [isCallMicMuted]);

  const createOfferToPeer = useCallback(
    async (chatId: string, peerUserId: string) => {
      const localStream = localCallStreamRef.current;
      if (!localStream) {
        return false;
      }

      const connection = ensureCallPeerConnection(chatId, peerUserId);
      attachLocalStreamToConnection(connection, localStream);

      if (connection.signalingState !== "stable") {
        return true;
      }

      try {
        const offer = await connection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await connection.setLocalDescription(offer);
        const delivered = await sendCallSignal(chatId, peerUserId, "offer", {
          sdp: offer,
        });
        if (!delivered) {
          removePeerConnection(peerUserId);
        }
        return delivered;
      } catch {
        removePeerConnection(peerUserId);
        return false;
      }
    },
    [attachLocalStreamToConnection, ensureCallPeerConnection, removePeerConnection, sendCallSignal]
  );

  const syncScreenShareTrack = useCallback(
    async (videoTrack: MediaStreamTrack | null) => {
      const localStream = localCallStreamRef.current;
      const currentSession = callSessionRef.current;
      if (!localStream || !currentSession) {
        return;
      }

      for (const track of localStream.getVideoTracks()) {
        localStream.removeTrack(track);
        if (videoTrack !== track) {
          track.stop();
        }
      }
      if (videoTrack) {
        localStream.addTrack(videoTrack);
      }

      for (const [peerUserId, connection] of callPeerConnectionsRef.current.entries()) {
        const videoSender = connection
          .getSenders()
          .find((sender) => sender.track?.kind === "video");
        try {
          if (videoTrack) {
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            } else {
              connection.addTrack(videoTrack, localStream);
            }
          } else if (videoSender) {
            await videoSender.replaceTrack(null);
            connection.removeTrack(videoSender);
          }
        } catch {
          // Ignore per-peer replace/remove failures and continue syncing.
        }

        void createOfferToPeer(currentSession.chatId, peerUserId);
      }
    },
    [createOfferToPeer]
  );

  const stopScreenShare = useCallback(async () => {
    const screenShareStream = screenShareStreamRef.current;
    if (screenShareStream) {
      for (const track of screenShareStream.getTracks()) {
        track.stop();
      }
      screenShareStreamRef.current = null;
    }

    await syncScreenShareTrack(null);
    setIsScreenSharing(false);
  }, [syncScreenShareTrack]);

  const startScreenShare = useCallback(async () => {
    if (!callSessionRef.current) {
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setCallNotice(t("screenShareNotSupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        setCallNotice(t("screenShareFailed"));
        return;
      }

      screenTrack.addEventListener(
        "ended",
        () => {
          void stopScreenShare();
        },
        { once: true }
      );

      screenShareStreamRef.current = stream;
      await syncScreenShareTrack(screenTrack);
      setIsScreenSharing(true);
    } catch {
      setCallNotice(t("screenShareFailed"));
    }
  }, [stopScreenShare, syncScreenShareTrack, t]);

  const toggleCallMicMute = useCallback(() => {
    setIsCallMicMuted((previousValue) => {
      const nextValue = !previousValue;
      const localStream = localCallStreamRef.current;
      if (localStream) {
        for (const track of localStream.getAudioTracks()) {
          track.enabled = !nextValue;
        }
      }
      const localInputStream = localCallInputStreamRef.current;
      if (localInputStream) {
        for (const track of localInputStream.getAudioTracks()) {
          track.enabled = !nextValue;
        }
      }
      return nextValue;
    });
  }, []);

  const toggleCallSoundMute = useCallback(() => {
    setIsCallSoundMuted((previousValue) => !previousValue);
  }, []);

  const toggleCallFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      setIsCallFullscreen(false);
      return;
    }

    const overlay = callOverlayRef.current;
    if (overlay && overlay.requestFullscreen) {
      await overlay.requestFullscreen().catch(() => undefined);
    }
    setIsCallFullscreen(true);
  }, []);

  const hangupCurrentCall = useCallback(async () => {
    const currentSession = callSessionRef.current;
    if (!currentSession) {
      return;
    }

    const peerUserIds = new Set<string>([
      ...callChatMemberIdsRef.current,
      ...currentSession.participantUserIds,
      ...callPeerConnectionsRef.current.keys(),
    ]);

    closeCallSession();

    await Promise.all(
      [...peerUserIds]
        .filter((peerUserId) => peerUserId !== currentUser.id)
        .map((peerUserId) =>
          sendCallSignal(currentSession.chatId, peerUserId, "hangup", {
            reason: "hangup",
          })
        )
    );
  }, [closeCallSession, currentUser.id, sendCallSignal]);

  const startCallToTargets = useCallback(
    async (target: { chatId: string; chatName: string; isGroup: boolean; memberIds: string[] }) => {
      if (callSessionRef.current) {
        setCallNotice(t("callBusy"));
        return;
      }
      if (!isCallSupported()) {
        setCallNotice(t("callBrowserNotSupported"));
        return;
      }

      const peerUserIds = [...new Set(target.memberIds.filter((id) => id !== currentUser.id))];
      if (peerUserIds.length === 0) {
        setCallNotice(t("callFailed"));
        return;
      }

      callChatMemberIdsRef.current = peerUserIds;
      incomingOffersRef.current.clear();
      pendingRemoteIceCandidatesRef.current.clear();

      setCallSession({
        phase: "outgoing",
        chatId: target.chatId,
        isGroup: target.isGroup,
        initiatorUserId: currentUser.id,
        initiatorName: currentUser.name.trim() || target.chatName,
        participantUserIds: peerUserIds,
        startedAt: null,
      });

      try {
        await ensureLocalCallStream();

        let deliveredCount = 0;
        for (const peerUserId of peerUserIds) {
          if (await createOfferToPeer(target.chatId, peerUserId)) {
            deliveredCount += 1;
          }
        }

        if (deliveredCount === 0) {
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
      } catch (error) {
        if (error instanceof Error && error.message === "MIC_ACCESS_DENIED") {
          closeCallSession(t("micAccessDenied"));
          return;
        }
        closeCallSession(t("callFailed"));
      }
    },
    [
      closeCallSession,
      createOfferToPeer,
      currentUser.id,
      currentUser.name,
      ensureLocalCallStream,
      isCallSupported,
      t,
    ]
  );

  const startAudioCallToTarget = useCallback(
    async (target: { chatId: string; peerUserId: string; peerName: string }) => {
      await startCallToTargets({
        chatId: target.chatId,
        chatName: target.peerName,
        isGroup: false,
        memberIds: [target.peerUserId],
      });
    },
    [startCallToTargets]
  );

  const startAudioCall = useCallback(async () => {
    if (!activeChat || activeChat.isFavorites || activeChat.isPreview) {
      return;
    }

    const memberIds =
      activeChat.isGroup
        ? activeChat.memberIds.filter((memberId) => memberId !== currentUser.id)
        : activeChat.memberId
          ? [activeChat.memberId]
          : [];

    await startCallToTargets({
      chatId: activeChat.id,
      chatName: activeChat.name,
      isGroup: activeChat.isGroup,
      memberIds,
    });
  }, [activeChat, currentUser.id, startCallToTargets]);
  useEffect(() => {
    if (!isAdminAccount || hasHandledAdminJoinRequestRef.current) {
      return;
    }

    const request = adminJoinRequestRef.current;
    if (!request) {
      return;
    }

    const targetChat = chatItems.find(
      (chat) => chat.id === request.chatId && !chat.isFavorites && !chat.isPreview
    );
    if (!targetChat) {
      return;
    }

    hasHandledAdminJoinRequestRef.current = true;
    setIsActiveChatProfileSidebarOpen(false);
    setActiveSidebar("home");
    setActiveChatPreviewUserId(null);
    setActiveChatId(targetChat.id);
    setMobileView("chat");

    if (request.joinCall) {
      const callTargetUserIds =
        request.targetUserIds.length > 0
          ? request.targetUserIds
          : targetChat.isGroup
            ? targetChat.memberIds.filter((memberId) => memberId !== currentUser.id)
            : targetChat.memberId
              ? [targetChat.memberId]
              : [];
      if (callTargetUserIds.length > 0) {
        void startCallToTargets({
          chatId: targetChat.id,
          chatName: targetChat.name,
          isGroup: targetChat.isGroup,
          memberIds: callTargetUserIds,
        });
      }
    }

    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("adminThreadId");
      nextUrl.searchParams.delete("adminJoinCall");
      nextUrl.searchParams.delete("adminCallTargets");
      const nextQuery = nextUrl.searchParams.toString();
      window.history.replaceState(
        {},
        "",
        `${nextUrl.pathname}${nextQuery ? `?${nextQuery}` : ""}${nextUrl.hash}`
      );
    }
  }, [chatItems, currentUser.id, isAdminAccount, startCallToTargets]);

  const declineIncomingCall = useCallback(async () => {
    const currentSession = callSessionRef.current;
    if (!currentSession || currentSession.phase !== "incoming") {
      return;
    }

    const peerUserIds = new Set<string>([
      ...incomingOffersRef.current.keys(),
      ...currentSession.participantUserIds,
    ]);
    closeCallSession();

    await Promise.all(
      [...peerUserIds]
        .filter((peerUserId) => peerUserId !== currentUser.id)
        .map((peerUserId) =>
          sendCallSignal(currentSession.chatId, peerUserId, "reject", {
            reason: "declined",
          })
        )
    );
  }, [closeCallSession, currentUser.id, sendCallSignal]);

  const acceptIncomingCall = useCallback(async () => {
    const currentSession = callSessionRef.current;
    if (!currentSession || currentSession.phase !== "incoming") {
      return;
    }
    if (!isCallSupported()) {
      closeCallSession(t("callBrowserNotSupported"));
      return;
    }

    const pendingOffers = [...incomingOffersRef.current.entries()];
    if (pendingOffers.length === 0) {
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
      const localStream = await ensureLocalCallStream();
      const answeredPeerIds = new Set<string>();

      for (const [peerUserId, offer] of pendingOffers) {
        const connection = ensureCallPeerConnection(currentSession.chatId, peerUserId);
        attachLocalStreamToConnection(connection, localStream);
        await connection.setRemoteDescription(offer);
        await flushPendingRemoteIceCandidates(peerUserId);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        const delivered = await sendCallSignal(currentSession.chatId, peerUserId, "answer", {
          sdp: answer,
        });
        if (delivered) {
          answeredPeerIds.add(peerUserId);
        }
        incomingOffersRef.current.delete(peerUserId);
      }

      const additionalPeerIds = callChatMemberIdsRef.current.filter(
        (peerUserId) => peerUserId !== currentUser.id && !answeredPeerIds.has(peerUserId)
      );
      for (const peerUserId of additionalPeerIds) {
        await createOfferToPeer(currentSession.chatId, peerUserId);
      }

      setCallSession((prev) =>
        prev
          ? {
              ...prev,
              phase: "active",
              startedAt: Date.now(),
              participantUserIds: [...new Set([...prev.participantUserIds, ...answeredPeerIds])],
            }
          : prev
      );
    } catch (error) {
      if (error instanceof Error && error.message === "MIC_ACCESS_DENIED") {
        closeCallSession(t("micAccessDenied"));
      } else {
        closeCallSession(t("callFailed"));
      }
    }
  }, [
    attachLocalStreamToConnection,
    closeCallSession,
    createOfferToPeer,
    currentUser.id,
    ensureCallPeerConnection,
    ensureLocalCallStream,
    flushPendingRemoteIceCandidates,
    isCallSupported,
    sendCallSignal,
    t,
  ]);

  const handleCallSignal = useCallback(
    async (signal: CallSignal) => {
      if (signal.toUserId !== currentUser.id) {
        return;
      }

      const fromUserId = signal.fromUserId;
      const currentSession = callSessionRef.current;
      const thread = threads.find((candidate) => candidate.id === signal.chatId);
      const threadMemberIds =
        thread?.memberIds.filter((memberId) => memberId !== currentUser.id) ?? [];
      const isGroupChat = thread?.threadType === "group" || threadMemberIds.length > 1;
      const fromUserName = resolveCallPeerName(fromUserId);

      if (signal.type === "offer") {
        const sdp = parseSignalSdp(signal.data);
        if (!sdp) {
          return;
        }

        ensurePendingIceQueue(fromUserId);
        incomingOffersRef.current.set(fromUserId, sdp);
        if (threadMemberIds.length > 0) {
          callChatMemberIdsRef.current = threadMemberIds;
        } else if (!callChatMemberIdsRef.current.includes(fromUserId)) {
          callChatMemberIdsRef.current = [...callChatMemberIdsRef.current, fromUserId];
        }

        if (!currentSession) {
          setCallSession({
            phase: "incoming",
            chatId: signal.chatId,
            isGroup: isGroupChat,
            initiatorUserId: fromUserId,
            initiatorName: fromUserName,
            participantUserIds: [...new Set([...callChatMemberIdsRef.current, fromUserId])],
            startedAt: null,
          });
          return;
        }

        if (currentSession.chatId !== signal.chatId) {
          await sendCallSignal(signal.chatId, fromUserId, "reject", {
            reason: "busy",
          });
          return;
        }

        setCallSession((previous) =>
          previous
            ? {
                ...previous,
                participantUserIds: [
                  ...new Set([...previous.participantUserIds, fromUserId]),
                ],
              }
            : previous
        );

        if (currentSession.phase === "incoming") {
          return;
        }

        const localStream = localCallStreamRef.current;
        if (!localStream) {
          return;
        }

        try {
          const connection = ensureCallPeerConnection(signal.chatId, fromUserId);
          attachLocalStreamToConnection(connection, localStream);

          if (connection.signalingState !== "stable") {
            await connection
              .setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit)
              .catch(() => undefined);
          }

          await connection.setRemoteDescription(sdp);
          await flushPendingRemoteIceCandidates(fromUserId);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          await sendCallSignal(signal.chatId, fromUserId, "answer", {
            sdp: answer,
          });

          setCallSession((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "active",
                  startedAt: prev.startedAt ?? Date.now(),
                }
              : prev
          );
        } catch {
          await sendCallSignal(signal.chatId, fromUserId, "reject", {
            reason: "accept-failed",
          });
        }
        return;
      }

      if (!currentSession || currentSession.chatId !== signal.chatId) {
        return;
      }

      if (signal.type === "answer") {
        const sdp = parseSignalSdp(signal.data);
        const connection = callPeerConnectionsRef.current.get(fromUserId);
        if (!sdp || !connection) {
          return;
        }
        try {
          await connection.setRemoteDescription(sdp);
          await flushPendingRemoteIceCandidates(fromUserId);
          setCallSession((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "active",
                  startedAt: prev.startedAt ?? Date.now(),
                }
              : prev
          );
        } catch {
          removePeerConnection(fromUserId);
          if (!currentSession.isGroup) {
            closeCallSession(t("callFailed"));
          }
        }
        return;
      }

      if (signal.type === "ice") {
        const candidate = parseSignalIceCandidate(signal.data);
        if (!candidate) {
          return;
        }
        const connection = callPeerConnectionsRef.current.get(fromUserId);
        if (!connection || !connection.remoteDescription) {
          ensurePendingIceQueue(fromUserId).push(candidate);
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
        removePeerConnection(fromUserId);
        setCallSession((prev) =>
          prev
            ? {
                ...prev,
                participantUserIds: prev.participantUserIds.filter((id) => id !== fromUserId),
              }
            : prev
        );
        if (!currentSession.isGroup) {
          closeCallSession(t("callEnded"));
          return;
        }
        if (callPeerConnectionsRef.current.size === 0 && incomingOffersRef.current.size === 0) {
          closeCallSession(t("callEnded"));
        }
        return;
      }

      if (signal.type === "reject") {
        const reason = parseSignalReason(signal.data);
        removePeerConnection(fromUserId);
        setCallSession((prev) =>
          prev
            ? {
                ...prev,
                participantUserIds: prev.participantUserIds.filter((id) => id !== fromUserId),
              }
            : prev
        );

        if (!currentSession.isGroup) {
          closeCallSession(reason === "busy" ? t("callBusy") : t("callDeclined"));
          return;
        }

        if (reason === "busy") {
          setCallNotice(`${fromUserName}: ${t("callBusy")}`);
        }
        if (callPeerConnectionsRef.current.size === 0 && incomingOffersRef.current.size === 0) {
          closeCallSession(t("callEnded"));
        }
      }
    },
    [
      attachLocalStreamToConnection,
      closeCallSession,
      currentUser.id,
      ensureCallPeerConnection,
      ensurePendingIceQueue,
      flushPendingRemoteIceCandidates,
      removePeerConnection,
      resolveCallPeerName,
      sendCallSignal,
      t,
      threads,
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

      if (response.status === 404 || response.status === 400) {
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

  useEffect(() => {
    for (const mediaElement of callRemoteMediaElementsRef.current.values()) {
      mediaElement.muted = isCallSoundMuted;
      if (!isCallSoundMuted) {
        void mediaElement.play().catch(() => undefined);
      }
    }
  }, [isCallSoundMuted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsCallFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useRealtimeSync({
    userId: currentUser.id,
    onSync: () => {
      void loadChatData();
      void pollCallSignals();
    },
  });

  const activeMessages = useMemo<RenderMessage[]>(() => {
    if (!activeChat) {
      return [];
    }
    const now = serverTimeMs > 0 ? serverTimeMs : Date.now();
    const isScheduledPendingForCurrentUser = (message: StoredChatMessage) =>
      message.authorId === currentUser.id && message.createdAt > now;
    const usersById = new Map(knownUsers.map((user) => [user.id, user]));
    const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
    const resolveSourceChatName = (chatId: string) => {
      if (chatId === FAVORITES_CHAT_ID) {
        return t("savedMessages");
      }
      const sourceThread = threadsById.get(chatId);
      if (!sourceThread) {
        return t("unknownUser");
      }
      if (sourceThread.threadType === "group") {
        return sourceThread.title || t("groupChat");
      }
      const peerId =
        sourceThread.memberIds.find((memberId) => memberId !== currentUser.id) ?? "";
      return usersById.get(peerId)?.name ?? t("unknownUser");
    };

    if (activeChat.isFavorites) {
      const clearedAt = clearedChatAtById[FAVORITES_CHAT_ID] ?? 0;
      const favoriteMessages = messages
        .map((message) => ({
          message,
          savedAt: message.savedBy?.[currentUser.id] ?? 0,
        }))
        .filter((item) => item.savedAt > 0 && item.savedAt > clearedAt)
        .sort(
          (a, b) =>
            a.savedAt - b.savedAt || a.message.createdAt - b.message.createdAt
        );
      const favoriteMessagesById = new Map(
        favoriteMessages.map((item) => [item.message.id, item.message])
      );

      return favoriteMessages.map<RenderMessage>(({ message, savedAt }) => {
        const isScheduledPending = isScheduledPendingForCurrentUser(message);
        const replyTarget = message.replyToMessageId
          ? favoriteMessagesById.get(message.replyToMessageId) ?? null
          : null;
        const replyAuthorName = replyTarget
          ? replyTarget.authorId === currentUser.id
            ? t("you")
            : (usersById.get(replyTarget.authorId)?.name ?? t("unknownUser"))
          : "";
        const replyPreviewText = replyTarget
          ? replyTarget.text.trim() ||
            (replyTarget.attachments.length > 0
              ? t("attachment")
              : t("noMessagesYet"))
          : t("originalMessageUnavailable");

        return {
          id: message.id,
          chatId: message.chatId,
          authorId: message.authorId,
          author: message.authorId === currentUser.id ? "me" : "them",
          authorLabel:
            message.authorId === currentUser.id
              ? t("you")
              : (usersById.get(message.authorId)?.name ?? t("unknownUser")),
          authorUsername:
            message.authorId === currentUser.id
              ? currentUser.username
              : (usersById.get(message.authorId)?.username ?? ""),
          authorAvatarUrl:
            message.authorId === currentUser.id
              ? currentUser.avatarUrl
              : (usersById.get(message.authorId)?.avatarUrl ?? ""),
          text: message.text,
          createdAt: savedAt,
          attachments: message.attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            size: attachment.size,
            url: attachment.url,
            kind: getAttachmentKind(attachment.type),
          })),
          time: formatMessageTime(savedAt, language),
          isReadByPeer: false,
          groupReadByCount: 0,
          groupReadByLabels: [],
          isEdited: message.editedAt > 0,
          reply: message.replyToMessageId
            ? {
                targetMessageId: message.replyToMessageId,
                authorLabel: replyAuthorName,
                previewText: replyPreviewText,
                missing: replyTarget === null,
              }
            : null,
          isFavorite: true,
          sourceChatId:
            message.chatId === FAVORITES_CHAT_ID ? null : message.chatId,
          sourceChatName: resolveSourceChatName(message.chatId),
          isScheduledPending,
        };
      });
    }

    const clearedAt = clearedChatAtById[activeChat.id] ?? 0;
    const activeThread = threadsById.get(activeChat.id);
    const peerReadAt =
      !activeChat.isGroup && activeChat.memberId
        ? activeThread?.readBy?.[activeChat.memberId] ?? 0
        : 0;
    const groupMemberIds = activeThread?.memberIds ?? activeChat.memberIds;
    const chatMessages = messages
      .filter(
        (message) => message.chatId === activeChat.id && message.createdAt > clearedAt
      )
      .sort((a, b) => a.createdAt - b.createdAt);
    const messagesById = new Map(chatMessages.map((message) => [message.id, message]));

    return chatMessages.map<RenderMessage>((message) => {
      const isScheduledPending = isScheduledPendingForCurrentUser(message);
      const replyTarget = message.replyToMessageId
        ? messagesById.get(message.replyToMessageId) ?? null
        : null;
      const isChannelThread = activeChat.groupKind === "channel";
      const isOwnMessage = message.authorId === currentUser.id;
      const replyAuthorName = replyTarget
        ? isChannelThread
          ? activeChat.name
          : replyTarget.authorId === currentUser.id
            ? t("you")
            : (usersById.get(replyTarget.authorId)?.name ?? t("unknownUser"))
        : "";
      const replyPreviewText = replyTarget
        ? replyTarget.text.trim() ||
          (replyTarget.attachments.length > 0 ? t("attachment") : t("noMessagesYet"))
        : t("originalMessageUnavailable");
      const groupReadByLabels =
        activeChat.isGroup && message.authorId === currentUser.id
          ? groupMemberIds
              .filter((memberId) => memberId !== currentUser.id)
              .filter(
                (memberId) =>
                  (activeThread?.readBy?.[memberId] ?? 0) >= message.createdAt
              )
              .map((memberId) => usersById.get(memberId)?.name ?? t("unknownUser"))
          : [];

      return {
        id: message.id,
        chatId: message.chatId,
        authorId: message.authorId,
        author: isOwnMessage ? "me" : "them",
        authorLabel: isChannelThread
          ? activeChat.name
          : isOwnMessage
            ? t("you")
            : (usersById.get(message.authorId)?.name ?? t("unknownUser")),
        authorUsername: isChannelThread
          ? ""
          : isOwnMessage
            ? currentUser.username
            : (usersById.get(message.authorId)?.username ?? ""),
        authorAvatarUrl: isChannelThread
          ? ""
          : isOwnMessage
            ? currentUser.avatarUrl
            : (usersById.get(message.authorId)?.avatarUrl ?? ""),
        text: message.text,
        createdAt: message.createdAt,
        attachments: message.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          url: attachment.url,
          kind: getAttachmentKind(attachment.type),
        })),
        time: formatMessageTime(message.createdAt, language),
        isReadByPeer:
          !activeChat.isGroup &&
          message.authorId === currentUser.id &&
          message.createdAt <= peerReadAt,
        groupReadByCount: groupReadByLabels.length,
        groupReadByLabels,
        isEdited: message.editedAt > 0,
        reply: message.replyToMessageId
          ? {
              targetMessageId: message.replyToMessageId,
              authorLabel: replyAuthorName,
              previewText: replyPreviewText,
              missing: replyTarget === null,
            }
          : null,
        isFavorite: (message.savedBy?.[currentUser.id] ?? 0) > 0,
        sourceChatId: null,
        sourceChatName: "",
        isScheduledPending,
      };
    });
  }, [
    activeChat,
    clearedChatAtById,
    messages,
    currentUser.id,
    currentUser.username,
    currentUser.avatarUrl,
    knownUsers,
    language,
    t,
    threads,
    serverTimeMs,
  ]);

  const protectedGroupChatIds = useMemo(() => {
    const ids = new Set<string>();
    for (const thread of threads) {
      if (isThreadContentProtectionEnabled(thread)) {
        ids.add(thread.id);
      }
    }
    return ids;
  }, [threads]);

  const isGroupContentProtectionEnabledByChatId = useCallback(
    (chatId: string) => protectedGroupChatIds.has(chatId),
    [protectedGroupChatIds]
  );

  const getMessageSourceChatId = useCallback(
    (message: Pick<RenderMessage, "chatId" | "sourceChatId">) =>
      message.sourceChatId?.trim() || message.chatId,
    []
  );

  const isMessageContentProtectionEnabled = useCallback(
    (message: Pick<RenderMessage, "chatId" | "sourceChatId">) =>
      isGroupContentProtectionEnabledByChatId(getMessageSourceChatId(message)),
    [getMessageSourceChatId, isGroupContentProtectionEnabledByChatId]
  );

  const showGroupContentProtectionBlockedToast = useCallback(() => {
    showToast(t("groupContentProtectionBlockedToast"));
  }, [showToast, t]);

  const filteredActiveMessages = useMemo(() => {
    const filters = parseActiveChatSearchQuery(activeChatSearchQuery);
    if (
      filters.textTerms.length === 0 &&
      !filters.authorTerm &&
      !filters.requireAttachment &&
      filters.hasKinds.size === 0 &&
      !filters.onDayRange &&
      filters.beforeTs === null &&
      filters.afterTs === null
    ) {
      return activeMessages;
    }

    return activeMessages.filter((message) => {
      if (filters.authorTerm) {
        const labelMatches = message.authorLabel.toLowerCase().includes(filters.authorTerm);
        const usernameMatches = message.authorUsername
          .toLowerCase()
          .includes(filters.authorTerm);
        if (!labelMatches && !usernameMatches) {
          return false;
        }
      }

      if (filters.requireAttachment && message.attachments.length === 0) {
        return false;
      }

      if (filters.hasKinds.size > 0) {
        const hasMatchKind = message.attachments.some((attachment) =>
          filters.hasKinds.has(attachment.kind)
        );
        if (!hasMatchKind) {
          return false;
        }
      }

      if (filters.onDayRange) {
        if (
          message.createdAt < filters.onDayRange.start ||
          message.createdAt >= filters.onDayRange.end
        ) {
          return false;
        }
      }

      if (filters.beforeTs !== null && message.createdAt >= filters.beforeTs) {
        return false;
      }

      if (filters.afterTs !== null && message.createdAt < filters.afterTs) {
        return false;
      }

      if (filters.textTerms.length === 0) {
        return true;
      }

      const text = message.text.toLowerCase();
      const authorLabel = message.authorLabel.toLowerCase();
      const attachmentNames = message.attachments.map((attachment) =>
        attachment.name.toLowerCase()
      );
      return filters.textTerms.every((term) => {
        if (text.includes(term) || authorLabel.includes(term)) {
          return true;
        }
        return attachmentNames.some((name) => name.includes(term));
      });
    });
  }, [activeChatSearchQuery, activeMessages]);

  const unreadDividerMessageId = useMemo(() => {
    if (!activeChat || activeMessages.length === 0) {
      return null;
    }
    const baseline = unreadBaselineByChatId[activeChat.id];
    if (!baseline || baseline <= 0) {
      return null;
    }
    const firstUnread = activeMessages.find(
      (message) => message.author !== "me" && message.createdAt > baseline
    );
    return firstUnread?.id ?? null;
  }, [activeChat, activeMessages, unreadBaselineByChatId]);

  const activeChatImages = useMemo<ViewerImage[]>(
    () =>
      activeMessages.flatMap((message) => {
        const downloadBlocked = isMessageContentProtectionEnabled(message);
        return message.attachments
          .filter((attachment) => attachment.kind === "image")
          .map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            url: attachment.url,
            downloadBlocked,
          }));
      }),
    [activeMessages, isMessageContentProtectionEnabled]
  );
  const replyTargetMessage = useMemo(
    () =>
      replyToMessageId
        ? activeMessages.find((message) => message.id === replyToMessageId) ?? null
        : null,
    [activeMessages, replyToMessageId]
  );
  const editingTargetMessage = useMemo(
    () =>
      editingMessageId
        ? activeMessages.find((message) => message.id === editingMessageId) ?? null
        : null,
    [activeMessages, editingMessageId]
  );

  useEffect(() => {
    setReplyToMessageId(null);
    setEditingMessageId(null);
    setScheduledSendAt(null);
    setIsSchedulePickerOpen(false);
    setSchedulePickerDate(undefined);
    setSchedulePickerHour("00");
    setSchedulePickerMinute("00");
  }, [activeChat?.id]);

  useEffect(() => {
    if (!replyToMessageId) {
      return;
    }
    if (!replyTargetMessage) {
      setReplyToMessageId(null);
    }
  }, [replyTargetMessage, replyToMessageId]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }
    if (!editingTargetMessage) {
      setEditingMessageId(null);
    }
  }, [editingMessageId, editingTargetMessage]);

  const availableUsers = useMemo(() => {
    const normalized = normalizeSearchQuery(query);
    return knownUsers.filter((user) => {
      if (
        user.id === currentUser.id ||
        user.id === BUILT_IN_ASSISTANT_USER_ID
      ) {
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
  useEffect(() => {
    const normalized = normalizeSearchQuery(query);
    if (!normalized.raw) {
      publicGroupSearchRequestIdRef.current += 1;
      setPublicGroupSearchResults([]);
      setIsLoadingPublicGroupSearch(false);
      return;
    }

    const requestId = publicGroupSearchRequestIdRef.current + 1;
    publicGroupSearchRequestIdRef.current = requestId;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoadingPublicGroupSearch(true);
        try {
          const response = await requestJson<SearchPublicGroupsResponse>(
            `/api/messenger/search-public-groups?userId=${encodeURIComponent(
              currentUser.id
            )}&q=${encodeURIComponent(query.trim())}`,
            {
              method: "GET",
              signal: controller.signal,
            }
          );
          if (publicGroupSearchRequestIdRef.current !== requestId) {
            return;
          }
          setPublicGroupSearchResults(response.groups);
        } catch {
          if (controller.signal.aborted) {
            return;
          }
          if (publicGroupSearchRequestIdRef.current !== requestId) {
            return;
          }
          setPublicGroupSearchResults([]);
        } finally {
          if (publicGroupSearchRequestIdRef.current === requestId) {
            setIsLoadingPublicGroupSearch(false);
          }
        }
      })();
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentUser.id, query]);
  const groupCandidates = useMemo(
    () =>
      knownUsers.filter(
        (user) =>
          user.id !== currentUser.id && user.id !== BUILT_IN_ASSISTANT_USER_ID
      ),
    [knownUsers, currentUser.id]
  );
  const normalizedGroupMemberDraftQuery = useMemo(
    () => normalizeSearchQuery(groupMemberQueryDraft),
    [groupMemberQueryDraft]
  );
  const groupCandidateById = useMemo(
    () => new Map(groupCandidates.map((candidate) => [candidate.id, candidate])),
    [groupCandidates]
  );
  const selectedGroupDraftMembers = useMemo(
    () =>
      groupMemberIdsDraft
        .map((memberId) => groupCandidateById.get(memberId))
        .filter((candidate): candidate is AuthUser => Boolean(candidate)),
    [groupCandidateById, groupMemberIdsDraft]
  );
  const filteredGroupCandidates = useMemo(() => {
    const normalized = normalizedGroupMemberDraftQuery;
    return groupCandidates.filter((candidate) => {
      if (!normalized.raw) {
        return true;
      }
      return (
        candidate.name.toLowerCase().includes(normalized.raw) ||
        candidate.username.toLowerCase().includes(normalized.username) ||
        candidate.email.toLowerCase().includes(normalized.raw)
      );
    });
  }, [groupCandidates, normalizedGroupMemberDraftQuery]);
  const resetGroupCreationDraft = useCallback(() => {
    setGroupCreationStep("members");
    setGroupMemberQueryDraft("");
    setGroupNameDraft("");
    setGroupMemberIdsDraft([]);
    setGroupCreationUsernameDraft("");
  }, []);
  const openGroupCreationDialog = useCallback(() => {
    setIsCreateThreadTypeMenuOpen(true);
  }, []);
  const startThreadCreation = useCallback(
    (kind: "group" | "channel") => {
      setGroupCreationKind(kind);
      resetGroupCreationDraft();
      if (kind === "channel") {
        setGroupCreationStep("details");
      }
      setIsCreateThreadTypeMenuOpen(false);
      setIsGroupMenuOpen(true);
    },
    [resetGroupCreationDraft]
  );
  const handleGroupMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsGroupMenuOpen(open);
      if (!open && !isCreatingGroup) {
        resetGroupCreationDraft();
      }
    },
    [isCreatingGroup, resetGroupCreationDraft]
  );
  const goToGroupDetailsStep = useCallback(() => {
    setGroupCreationStep("details");
  }, []);

  const markChatAsRead = useCallback(
    async (chatId: string) => {
      const hasThread = threads.some(
        (thread) => thread.id === chatId && thread.memberIds.includes(currentUser.id)
      );
      if (!hasThread) {
        return;
      }

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
    [currentUser.id, threads]
  );

  const openChat = useCallback(
    (chatId: string) => {
      const existingThread = threads.find((thread) => thread.id === chatId);
      if (existingThread) {
        setUnreadBaselineByChatId((prev) => ({
          ...prev,
          [chatId]: existingThread.readBy?.[currentUser.id] ?? 0,
        }));
      }
      setActiveChatPreviewUserId(null);
      setActivePublicGroupPreview(null);
      setIsPinnedUserProfileFromMessage(false);
      setActiveChatId(chatId);
      setMobileView("chat");
      setIsChatPersonalizationOpen(false);
      setPendingAttachments([]);
      setViewerImageId(null);
      setManuallyLoadedMediaIds(new Set());
      if (chatId !== FAVORITES_CHAT_ID) {
        void markChatAsRead(chatId);
      }
    },
    [currentUser.id, markChatAsRead, threads]
  );

  const openPublicGroupPreview = useCallback(
    (group: PublicGroupSearchResult) => {
      const normalizedUsername = normalizeGroupUsername(group.username);
      if (!isValidGroupUsername(normalizedUsername)) {
        showToast(t("invalidGroupUsername"));
        return;
      }

      setIsActiveChatProfileSidebarOpen(false);
      setIsPinnedUserProfileFromMessage(false);
      setActiveChatPreviewUserId(null);
      setActivePublicGroupPreview({
        ...group,
        username: normalizedUsername,
      });
      setActiveChatId(null);
      setActiveSidebar("home");
      setMobileView("chat");
      setQuery("");
      setIsChatPersonalizationOpen(false);
      setPendingAttachments([]);
      setViewerImageId(null);
      setManuallyLoadedMediaIds(new Set());
    },
    [showToast, t]
  );

  const openUserPreview = useCallback(
    (targetUserId: string) => {
      if (
        !targetUserId ||
        targetUserId === currentUser.id ||
        targetUserId === BUILT_IN_ASSISTANT_USER_ID
      ) {
        return;
      }

      const existingDirectChat = chatItems.find(
        (chat) =>
          !chat.isGroup &&
          !chat.isFavorites &&
          !chat.isPreview &&
          chat.memberId === targetUserId
      );
      if (existingDirectChat) {
        openChat(existingDirectChat.id);
        setActiveSidebar("home");
        setQuery("");
        return;
      }

      setIsActiveChatProfileSidebarOpen(false);
      setIsPinnedUserProfileFromMessage(false);
      setActivePublicGroupPreview(null);
      setActiveChatPreviewUserId(targetUserId);
      setActiveChatId(null);
      setActiveSidebar("home");
      setMobileView("chat");
      setQuery("");
      setIsChatPersonalizationOpen(false);
      setPendingAttachments([]);
      setViewerImageId(null);
      setManuallyLoadedMediaIds(new Set());
    },
    [chatItems, currentUser.id, openChat]
  );

  const joinPublicGroupByUsername = useCallback(
    async (username: string) => {
      const normalizedUsername = normalizeGroupUsername(username);
      if (!isValidGroupUsername(normalizedUsername)) {
        showToast(t("invalidGroupUsername"));
        return;
      }
      if (isJoiningPreviewGroup) {
        return;
      }

      setIsJoiningPreviewGroup(true);
      try {
        const result = await requestJson<JoinGroupResponse>("/api/messenger/join-group", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            username: normalizedUsername,
            inviteToken: "",
          }),
        });
        await loadChatData({ forceFullSync: true });
        setActiveSidebar("home");
        setIsActiveChatProfileSidebarOpen(false);
        setActiveChatPreviewUserId(null);
        setActivePublicGroupPreview(null);
        setActiveChatId(result.chatId);
        setMobileView("chat");
        setQuery("");
        setPendingAttachments([]);
        setViewerImageId(null);
        showToast(result.joined ? t("joinGroupSuccess") : t("joinGroupAlreadyMember"));
      } catch (error) {
        showToast(getRequestErrorMessage(error));
      } finally {
        setIsJoiningPreviewGroup(false);
      }
    },
    [
      currentUser.id,
      getRequestErrorMessage,
      isJoiningPreviewGroup,
      loadChatData,
      showToast,
      t,
    ]
  );

  const openFavoritesChat = useCallback(() => {
    setIsFavoritesChatVisible(true);
    openChat(FAVORITES_CHAT_ID);
    setActiveSidebar("home");
  }, [openChat]);

  const deleteFavoritesChat = useCallback(async () => {
    const wasVisible = isFavoritesChatVisible;
    const wasActive = activeChatId === FAVORITES_CHAT_ID;

    setIsFavoritesChatVisible(false);
    setDraftsByChatId((prev) => {
      if (!(FAVORITES_CHAT_ID in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[FAVORITES_CHAT_ID];
      return next;
    });

    if (wasActive) {
      setActiveChatId(null);
      setMobileView("list");
      setPendingAttachments([]);
      setViewerImageId(null);
      setReplyToMessageId(null);
      setEditingMessageId(null);
      setDraft("");
    }

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/favorites-chat", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });
      await loadChatData({ forceFullSync: true });
      showToast(t("favoritesDeleted"));
    } catch (error) {
      setIsFavoritesChatVisible(wasVisible);
      if (wasActive) {
        setActiveChatId(FAVORITES_CHAT_ID);
        setMobileView("chat");
      }
      showToast(getRequestErrorMessage(error));
    }
  }, [
    activeChatId,
    currentUser.id,
    getRequestErrorMessage,
    isFavoritesChatVisible,
    loadChatData,
    showToast,
    t,
  ]);

  const updateActiveChatPersonalization = useCallback(
    (partial: Partial<ChatPersonalization>) => {
      if (!activeChat) {
        return;
      }
      setChatPersonalizationById((prev) => {
        const current = prev[activeChat.id] ?? DEFAULT_CHAT_PERSONALIZATION;
        const next: ChatPersonalization = {
          wallpaper: partial.wallpaper ?? current.wallpaper,
          fontSize: partial.fontSize ?? current.fontSize,
          autoLoadMedia:
            typeof partial.autoLoadMedia === "boolean"
              ? partial.autoLoadMedia
              : current.autoLoadMedia,
        };
        return {
          ...prev,
          [activeChat.id]: next,
        };
      });
    },
    [activeChat]
  );

  const startReplyToMessage = useCallback(
    (messageId: string) => {
      if (activeChat?.isFavorites || activeChat?.isPreview) {
        return;
      }
      setEditingMessageId(null);
      setReplyToMessageId(messageId);
      messageInputRef.current?.focus();
    },
    [activeChat]
  );

  const startEditingMessage = useCallback(
    (messageId: string) => {
      if (activeChat?.isFavorites || activeChat?.isPreview) {
        return;
      }
      const target = activeMessages.find((message) => message.id === messageId);
      if (!target) {
        return;
      }
      setReplyToMessageId(null);
      setEditingMessageId(messageId);
      setScheduledSendAt(null);
      setIsSchedulePickerOpen(false);
      setSchedulePickerDate(undefined);
      setSchedulePickerHour("00");
      setSchedulePickerMinute("00");
      setPendingAttachments([]);
      setDraft(target.text);
      setIsEmojiMenuOpen(false);
      messageInputRef.current?.focus();
    },
    [activeChat, activeMessages]
  );

  const focusReplyTargetMessage = useCallback((messageId: string) => {
    const node = messageNodeRefs.current.get(messageId);
    if (!node) {
      return;
    }

    node.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setHighlightedMessageId(messageId);

    if (highlightMessageTimerRef.current) {
      window.clearTimeout(highlightMessageTimerRef.current);
    }
    highlightMessageTimerRef.current = window.setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
      highlightMessageTimerRef.current = null;
    }, MESSAGE_TARGET_HIGHLIGHT_MS);
  }, []);

  const sendTypingState = useCallback(
    async (chatId: string, isTyping: boolean) => {
      try {
        await requestJson<{ ok: boolean }>("/api/messenger/typing", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId,
            isTyping,
          }),
        });
      } catch {
        // Ignore transient typing status failures.
      }
    },
    [currentUser.id]
  );

  useEffect(() => {
    const chatId =
      activeChat &&
      !activeChat.isFavorites &&
      !activeChat.isPreview &&
      !isActiveChannelReadOnly &&
      !(activeChat.isGroup && activeChat.groupKind === "channel")
        ? activeChat.id
        : null;
    const previousChatId = lastTypingChatIdRef.current;

    if (previousChatId && previousChatId !== chatId && isTypingStateSentRef.current) {
      void sendTypingState(previousChatId, false);
      isTypingStateSentRef.current = false;
    }

    lastTypingChatIdRef.current = chatId;

    if (!chatId) {
      return;
    }

    const isTyping = draft.trim().length > 0;
    if (isTyping && !isTypingStateSentRef.current) {
      void sendTypingState(chatId, true);
      isTypingStateSentRef.current = true;
      return;
    }

    if (!isTyping && isTypingStateSentRef.current) {
      void sendTypingState(chatId, false);
      isTypingStateSentRef.current = false;
    }
  }, [activeChat, draft, isActiveChannelReadOnly, sendTypingState]);

  useEffect(() => {
    const chatId =
      activeChat &&
      !activeChat.isFavorites &&
      !activeChat.isPreview &&
      !isActiveChannelReadOnly
        ? activeChat.id
        : null;
    if (!chatId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!isTypingStateSentRef.current) {
        return;
      }
      if (lastTypingChatIdRef.current !== chatId) {
        return;
      }
      if (draftRef.current.trim().length === 0) {
        return;
      }
      void sendTypingState(chatId, true);
    }, TYPING_PING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeChat, isActiveChannelReadOnly, sendTypingState]);

  useEffect(() => {
    return () => {
      const chatId = lastTypingChatIdRef.current;
      if (!chatId || !isTypingStateSentRef.current) {
        return;
      }
      void sendTypingState(chatId, false);
    };
  }, [sendTypingState]);

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

  const toggleMessageFavorite = useCallback(
    async (messageId: string, saved: boolean) => {
      const targetMessage =
        messagesRef.current.find((message) => message.id === messageId) ?? null;
      if (!targetMessage) {
        return;
      }

      if (saved) {
        setIsFavoritesChatVisible(true);
      }

      const now = Date.now();
      const nextSavedAt = saved ? now : -now;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                savedBy: {
                  ...message.savedBy,
                  [currentUser.id]: nextSavedAt,
                },
              }
            : message
        )
      );

      try {
        await requestJson<{ ok: boolean }>("/api/messenger/favorite", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            messageId,
            saved,
          }),
        });
      } catch {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  savedBy: { ...targetMessage.savedBy },
                }
              : message
          )
        );
        showToast(t("actionFailed"));
      }
    },
    [currentUser.id, showToast, t]
  );
  const reportMessage = useCallback(
    async (message: RenderMessage) => {
      if (
        !activeChat ||
        activeChat.isFavorites ||
        activeChat.isPreview ||
        message.author === "me"
      ) {
        return;
      }

      const reasonPrompt =
        language === "ru"
          ? "Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†РІР‚С™Р’В¬Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ:"
          : "Enter a reason for reporting this message:";
      const reasonInput = window.prompt(reasonPrompt, "");
      const reason = reasonInput?.trim() ?? "";
      if (!reason) {
        return;
      }
      if (reason.length < 3) {
        showToast(
          language === "ru"
            ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В 3 Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°."
            : "Reason must be at least 3 characters."
        );
        return;
      }

      try {
        await requestJson<{ ok: boolean; reportId: string }>("/api/messenger/report", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: activeChat.id,
            messageId: message.id,
            reason,
          }),
        });
        showToast(
          language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™." : "Report sent to moderation."
        );
      } catch (error) {
        showToast(getRequestErrorMessage(error));
      }
    },
    [activeChat, currentUser.id, getRequestErrorMessage, language, showToast]
  );

  const openForwardMessageDialog = useCallback(
    (message: RenderMessage) => {
      const sourceChatId = getMessageSourceChatId(message);
      if (isGroupContentProtectionEnabledByChatId(sourceChatId)) {
        showGroupContentProtectionBlockedToast();
        return;
      }
      const text = message.text.trim();
      if (!text && message.attachments.length === 0) {
        return;
      }
      setForwardMessageDraft({
        id: message.id,
        sourceChatId,
        text,
        attachments: message.attachments.map((attachment) => ({ ...attachment })),
      });
      setForwardQuery("");
      setForwardTargetChatIds([]);
    },
    [
      getMessageSourceChatId,
      isGroupContentProtectionEnabledByChatId,
      showGroupContentProtectionBlockedToast,
    ]
  );

  const toggleForwardTargetChatSelection = useCallback((chatId: string) => {
    if (!chatId) {
      return;
    }
    setForwardTargetChatIds((prev) =>
      prev.includes(chatId)
        ? prev.filter((candidateId) => candidateId !== chatId)
        : [...prev, chatId]
    );
  }, []);

  const closeForwardMessageDialog = useCallback(() => {
    if (isForwardingMessage) {
      return;
    }
    setForwardMessageDraft(null);
    setForwardQuery("");
    setForwardTargetChatIds([]);
  }, [isForwardingMessage]);

  const forwardMessageToSelectedChats = useCallback(async () => {
    if (!forwardMessageDraft || forwardTargetChatIds.length === 0 || isForwardingMessage) {
      return;
    }
    if (isGroupContentProtectionEnabledByChatId(forwardMessageDraft.sourceChatId)) {
      closeForwardMessageDialog();
      showGroupContentProtectionBlockedToast();
      return;
    }

    const targetChatIds = [...new Set(forwardTargetChatIds)];
    const text = forwardMessageDraft.text.trim();
    const attachments = forwardMessageDraft.attachments.map(
      (attachment): SendAttachmentPayload => ({
        name: attachment.name,
        type:
          attachment.kind === "image"
            ? "image/*"
            : attachment.kind === "video"
              ? "video/*"
              : attachment.kind === "audio"
                ? "audio/*"
                : "application/octet-stream",
        size: attachment.size,
        url: attachment.url,
      })
    );

    if (!text && attachments.length === 0) {
      return;
    }

    setIsForwardingMessage(true);
    try {
      const settledResults = await Promise.allSettled(
        targetChatIds.map((targetChatId) =>
          requestJson<{ messageId: string; createdAt: number }>("/api/messenger/send", {
            method: "POST",
              body: JSON.stringify({
                userId: currentUser.id,
                chatId: targetChatId,
                text,
                attachments,
                isForwarded: true,
                forwardedMessageId: forwardMessageDraft.id,
              }),
            })
        )
      );

      const successfulTargetChatIds = targetChatIds.filter(
        (_, index) => settledResults[index]?.status === "fulfilled"
      );
      const failedResults = settledResults.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (successfulTargetChatIds.length === 0) {
        showToast(
          failedResults.length > 0
            ? getRequestErrorMessage(failedResults[0].reason)
            : t("actionFailed")
        );
        return;
      }

      await loadChatData({ forceFullSync: true });
      const targetChatToOpen =
        [...successfulTargetChatIds]
          .reverse()
          .find((targetChatId) => targetChatId !== FAVORITES_CHAT_ID) ?? FAVORITES_CHAT_ID;
      if (targetChatToOpen === FAVORITES_CHAT_ID) {
        setIsFavoritesChatVisible(true);
      }
      openChat(targetChatToOpen);
      setActiveSidebar("home");
      setForwardMessageDraft(null);
      setForwardQuery("");
      setForwardTargetChatIds([]);

      if (failedResults.length > 0) {
        showToast(t("messagesForwardedPartially"));
      } else {
        showToast(
          successfulTargetChatIds.length > 1 ? t("messagesForwarded") : t("messageForwarded")
        );
      }
    } finally {
      setIsForwardingMessage(false);
    }
  }, [
    currentUser.id,
    forwardMessageDraft,
    forwardTargetChatIds,
    getRequestErrorMessage,
    isGroupContentProtectionEnabledByChatId,
    isForwardingMessage,
    loadChatData,
    closeForwardMessageDialog,
    openChat,
    showGroupContentProtectionBlockedToast,
    showToast,
    t,
  ]);

  const openFavoriteSourceMessage = useCallback(
    (sourceChatId: string, messageId: string) => {
      const sourceExists = chatItems.some(
        (chat) => chat.id === sourceChatId && !chat.isFavorites
      );
      if (!sourceExists) {
        return;
      }
      openChat(sourceChatId);
      window.setTimeout(() => {
        focusReplyTargetMessage(messageId);
      }, 120);
    },
    [chatItems, focusReplyTargetMessage, openChat]
  );

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
  const playOutgoingMessageSound = useCallback(() => {
    if (!sendMessageSoundEnabled) {
      return;
    }
    const audio = sendMessageSoundRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [sendMessageSoundEnabled]);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeChat || activeChat.isFavorites || activeChat.isPreview) {
        return;
      }

      const chatId = activeChat.id;
      const messageToDelete =
        messagesRef.current.find((message) => message.id === messageId) ?? null;
      if (!messageToDelete) {
        return;
      }
      if (pendingMessageDeletionRef.current.has(messageId)) {
        return;
      }

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setDraft("");
      }
      if (replyToMessageId === messageId) {
        setReplyToMessageId(null);
      }
      setMessages((prev) => prev.filter((message) => message.id !== messageId));

      const timeoutId = window.setTimeout(() => {
        pendingMessageDeletionRef.current.delete(messageId);
        void (async () => {
          try {
            await requestJson<{ ok: boolean }>("/api/messenger/delete-message", {
              method: "POST",
              body: JSON.stringify({
                userId: currentUser.id,
                chatId,
                messageId,
              }),
            });
            await loadChatData();
          } catch {
            setMessages((prev) => {
              const alreadyRestored = prev.some((message) => message.id === messageId);
              if (alreadyRestored) {
                return prev;
              }
              return [...prev, messageToDelete].sort((a, b) => a.createdAt - b.createdAt);
            });
            showToast(t("actionFailed"));
          }
        })();
      }, UNDO_WINDOW_MS);

      pendingMessageDeletionRef.current.set(messageId, {
        timeoutId,
        message: messageToDelete,
        chatId,
      });

      showToast(t("messageDeleted"), {
        label: t("undo"),
        onClick: () => {
          const pending = pendingMessageDeletionRef.current.get(messageId);
          if (!pending) {
            return;
          }
          window.clearTimeout(pending.timeoutId);
          pendingMessageDeletionRef.current.delete(messageId);
          setMessages((prev) => {
            const exists = prev.some((message) => message.id === messageId);
            if (exists) {
              return prev;
            }
            return [...prev, pending.message].sort((a, b) => a.createdAt - b.createdAt);
          });
          dismissToast();
        },
      });
    },
    [
      activeChat,
      currentUser.id,
      dismissToast,
      editingMessageId,
      loadChatData,
      replyToMessageId,
      showToast,
      t,
    ]
  );

  useEffect(() => {
    if (
      !activeChat ||
      activeSidebar !== "home" ||
      activeChat.isFavorites ||
      activeChat.isPreview
    ) {
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
    const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
    const incomingForAlert = incomingUnseen.filter((message) => {
      const thread = threadsById.get(message.chatId);
      if (thread?.mutedBy?.[currentUser.id] === true) {
        return false;
      }
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
    const latestMessage = incomingForAlert[incomingForAlert.length - 1];
    const sender = usersById.get(latestMessage.authorId);
    const thread = threadsById.get(latestMessage.chatId);
    const isGroup = thread?.threadType === "group";
    const senderName = sender?.name ?? t("unknownUser");
    const chatName = isGroup
      ? thread?.title?.trim() || t("groupChat")
      : senderName;
    const title = isGroup ? `${senderName} - ${chatName}` : senderName;
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
      // Ignore browser notification failures and keep syncing.
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (toastProgressAnimationRef.current) {
        window.cancelAnimationFrame(toastProgressAnimationRef.current);
      }
      for (const pending of pendingMessageDeletionRef.current.values()) {
        window.clearTimeout(pending.timeoutId);
      }
      for (const pending of pendingChatDeletionRef.current.values()) {
        window.clearTimeout(pending.timeoutId);
      }
      pendingMessageDeletionRef.current.clear();
      pendingChatDeletionRef.current.clear();
    };
  }, []);

  const createOrOpenChat = useCallback(
    async (targetUserId: string): Promise<string | null> => {
      if (targetUserId === currentUser.id) {
        return null;
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
        setActiveSidebar("home");
        setIsActiveChatProfileSidebarOpen(false);
        setActiveChatPreviewUserId(null);
        setActiveChatId(result.chatId);
        setMobileView("chat");
        setQuery("");
        setPendingAttachments([]);
        setViewerImageId(null);
        await loadChatData();
        return result.chatId;
      } catch (error) {
        showToast(getRequestErrorMessage(error));
        return null;
      }
    },
    [currentUser.id, getRequestErrorMessage, loadChatData, showToast]
  );

  const toggleGroupMember = useCallback(
    (userId: string) => {
      let hitLimit = false;
      setGroupMemberIdsDraft((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((candidate) => candidate !== userId);
        }
        if (prev.length + 1 >= GROUP_MAX_MEMBERS) {
          hitLimit = true;
          return prev;
        }
        return [...prev, userId];
      });
      if (hitLimit) {
        showToast(t("groupMembersLimitHint"));
      }
    },
    [showToast, t]
  );

  const createGroupChat = async () => {
    const kind: GroupKind = groupCreationKind === "channel" ? "channel" : "group";
    const accessType: GroupAccessType = kind === "channel" ? "public" : "private";
    const username =
      kind === "channel" ? normalizeGroupUsername(groupCreationUsernameDraft) : "";
    const memberIds = kind === "channel" ? [] : groupMemberIdsDraft;
    const title = groupNameDraft.trim().replace(/\s+/g, " ");
    if (title.length < GROUP_TITLE_MIN_LENGTH) {
      showToast(
        kind === "channel"
          ? `Channel name must be at least ${GROUP_TITLE_MIN_LENGTH} characters`
          : t("groupNameMinError")
      );
      return;
    }
    if (title.length > GROUP_TITLE_MAX_LENGTH) {
      showToast(
        kind === "channel"
          ? `Channel name must be at most ${GROUP_TITLE_MAX_LENGTH} characters`
          : t("groupNameMaxError")
      );
      return;
    }
    if (kind === "channel" && !isValidGroupUsername(username)) {
      showToast(t("invalidGroupUsername"));
      return;
    }
    if (memberIds.length + 1 > GROUP_MAX_MEMBERS) {
      showToast(t("groupMembersLimitHint"));
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
            memberIds,
            kind,
            accessType,
            username,
          }),
        }
      );
      resetGroupCreationDraft();
      setIsGroupMenuOpen(false);
      setActiveChatId(result.chatId);
      setMobileView("chat");
      setQuery("");
      await loadChatData();
    } catch (error) {
      showToast(getRequestErrorMessage(error));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const openActiveChatSearch = useCallback(() => {
    setIsActiveChatSearchOpen(true);
    window.requestAnimationFrame(() => {
      activeChatSearchInputRef.current?.focus();
    });
  }, []);

  const jumpToDate = useCallback(() => {
    if (!activeChatJumpDate || activeMessages.length === 0) {
      return;
    }
    const range = getLocalDayRangeFromIsoDate(activeChatJumpDate);
    if (!range) {
      return;
    }

    const onDateMessage = activeMessages.find(
      (message) => message.createdAt >= range.start && message.createdAt < range.end
    );
    const afterDateMessage = activeMessages.find((message) => message.createdAt >= range.start);
    const beforeDateMessage = [...activeMessages]
      .reverse()
      .find((message) => message.createdAt < range.start);
    const target = onDateMessage ?? afterDateMessage ?? beforeDateMessage;

    if (!target) {
      showToast(t("noMessagesFound"));
      return;
    }

    focusReplyTargetMessage(target.id);
  }, [activeChatJumpDate, activeMessages, focusReplyTargetMessage, showToast, t]);

  const clearHistoryForMe = useCallback(() => {
    if (!activeChat || activeChat.isFavorites || activeChat.isPreview) {
      return;
    }
    setClearedChatAtById((prev) => ({
      ...prev,
      [activeChat.id]: Date.now(),
    }));
    setReplyToMessageId(null);
    setEditingMessageId(null);
    setDraft("");
    setDraftsByChatId((prev) => {
      if (!(activeChat.id in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[activeChat.id];
      return next;
    });
    showToast(t("historyClearedForMe"));
  }, [activeChat, showToast, t]);

  const setChatPinned = async (chatId: string, pinned: boolean) => {
    if (chatId === FAVORITES_CHAT_ID) {
      setIsFavoritesChatPinned(pinned);
      return;
    }
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

  const setChatMuted = useCallback(
    async (chatId: string, muted: boolean, options?: { silentToast?: boolean }) => {
      if (chatId === FAVORITES_CHAT_ID) {
        return;
      }
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== chatId) {
            return thread;
          }
          return {
            ...thread,
            mutedBy: {
              ...thread.mutedBy,
              [currentUser.id]: muted,
            },
          };
        })
      );

      try {
        await requestJson<{ ok: boolean }>("/api/messenger/mute", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId,
            muted,
          }),
        });
        if (!options?.silentToast) {
          showToast(muted ? t("chatMutedToast") : t("chatUnmutedToast"), {
            label: t("undo"),
            onClick: () => {
              void setChatMuted(chatId, !muted, { silentToast: true });
              dismissToast();
            },
          });
        }
      } catch {
        await loadChatData({ forceFullSync: true });
        showToast(t("actionFailed"));
      }
    },
    [currentUser.id, dismissToast, loadChatData, showToast, t]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      const threadToDelete = threads.find((thread) => thread.id === chatId) ?? null;
      if (!threadToDelete || pendingChatDeletionRef.current.has(chatId)) {
        return;
      }

      const messagesToDelete = messagesRef.current.filter(
        (message) => message.chatId === chatId
      );
      const wasActive = activeChatId === chatId;
      const clearedAtBeforeDelete = clearedChatAtById[chatId] ?? 0;

      setThreads((prev) => prev.filter((thread) => thread.id !== chatId));
      setMessages((prev) => prev.filter((message) => message.chatId !== chatId));
      setClearedChatAtById((prev) => {
        if (!(chatId in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
      if (wasActive) {
        setActiveChatId(null);
        setMobileView("list");
        setPendingAttachments([]);
        setViewerImageId(null);
      }

      const timeoutId = window.setTimeout(() => {
        pendingChatDeletionRef.current.delete(chatId);
        void (async () => {
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
            setThreads((prev) => {
              if (prev.some((thread) => thread.id === chatId)) {
                return prev;
              }
              return [...prev, threadToDelete].sort((a, b) => b.updatedAt - a.updatedAt);
            });
            setMessages((prev) => {
              const existing = new Set(prev.map((message) => message.id));
              const restored = messagesToDelete.filter(
                (message) => !existing.has(message.id)
              );
              if (restored.length === 0) {
                return prev;
              }
              return [...prev, ...restored].sort((a, b) => a.createdAt - b.createdAt);
            });
            showToast(t("actionFailed"));
          }
        })();
      }, UNDO_WINDOW_MS);

      pendingChatDeletionRef.current.set(chatId, {
        timeoutId,
        thread: threadToDelete,
        messages: messagesToDelete,
        wasActive,
      });

      showToast(t("chatDeleted"), {
        label: t("undo"),
        onClick: () => {
          const pending = pendingChatDeletionRef.current.get(chatId);
          if (!pending) {
            return;
          }
          window.clearTimeout(pending.timeoutId);
          pendingChatDeletionRef.current.delete(chatId);
          setThreads((prev) => {
            if (prev.some((thread) => thread.id === chatId)) {
              return prev;
            }
            return [...prev, pending.thread].sort((a, b) => b.updatedAt - a.updatedAt);
          });
          setMessages((prev) => {
            const existing = new Set(prev.map((message) => message.id));
            const restored = pending.messages.filter(
              (message) => !existing.has(message.id)
            );
            if (restored.length === 0) {
              return prev;
            }
            return [...prev, ...restored].sort((a, b) => a.createdAt - b.createdAt);
          });
          if (pending.wasActive) {
            setActiveChatId(chatId);
            setMobileView("chat");
          }
          if (clearedAtBeforeDelete > 0) {
            setClearedChatAtById((prev) => ({
              ...prev,
              [chatId]: clearedAtBeforeDelete,
            }));
          }
          dismissToast();
        },
      });
    },
    [
      activeChatId,
      clearedChatAtById,
      currentUser.id,
      dismissToast,
      loadChatData,
      showToast,
      t,
      threads,
    ]
  );

  const leaveGroup = async (chatId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== chatId));
    setMessages((prev) => prev.filter((message) => message.chatId !== chatId));

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
      await loadChatData({ forceFullSync: true });
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
  };

  const addChatAttachments = async (fileList: FileList | null) => {
    const files = fileList ? [...fileList] : [];
    if (files.length === 0) {
      return;
    }

    try {
      const loaded = await Promise.all(
        files.map(async (file, index) => {
          const url = await readBlobAsDataUrl(file);
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

  const clearVoiceRecordingTimer = useCallback(() => {
    if (voiceRecordingTimerRef.current !== null) {
      window.clearInterval(voiceRecordingTimerRef.current);
      voiceRecordingTimerRef.current = null;
    }
  }, []);

  const releaseVoiceRecorderStream = useCallback(() => {
    if (!voiceRecorderStreamRef.current) {
      return;
    }
    for (const track of voiceRecorderStreamRef.current.getTracks()) {
      track.stop();
    }
    voiceRecorderStreamRef.current = null;
  }, []);

  const stopVoiceRecording = useCallback(
    (options?: { discard?: boolean }) => {
      const recorder = voiceRecorderRef.current;
      if (!recorder) {
        clearVoiceRecordingTimer();
        releaseVoiceRecorderStream();
        setIsVoiceRecording(false);
        setVoiceRecordingSeconds(0);
        voiceRecorderDiscardRef.current = false;
        return;
      }

      if (options?.discard) {
        voiceRecorderDiscardRef.current = true;
      }

      if (recorder.state === "inactive") {
        clearVoiceRecordingTimer();
        releaseVoiceRecorderStream();
        setIsVoiceRecording(false);
        setVoiceRecordingSeconds(0);
        voiceRecorderRef.current = null;
        voiceRecorderChunksRef.current = [];
        voiceRecorderDiscardRef.current = false;
        return;
      }

      recorder.stop();
    },
    [clearVoiceRecordingTimer, releaseVoiceRecorderStream]
  );

  const startVoiceRecording = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      showToast(t("voiceBrowserNotSupported"));
      return;
    }

    if (isVoiceRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickVoiceMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      voiceRecorderRef.current = recorder;
      voiceRecorderStreamRef.current = stream;
      voiceRecorderChunksRef.current = [];
      voiceRecorderDiscardRef.current = false;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          voiceRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        voiceRecorderDiscardRef.current = true;
        showToast(t("actionFailed"));
        stopVoiceRecording({ discard: true });
      };

      recorder.onstop = async () => {
        clearVoiceRecordingTimer();
        setIsVoiceRecording(false);
        setVoiceRecordingSeconds(0);

        const shouldDiscard = voiceRecorderDiscardRef.current;
        voiceRecorderDiscardRef.current = false;
        const chunks = voiceRecorderChunksRef.current;
        voiceRecorderChunksRef.current = [];
        voiceRecorderRef.current = null;
        releaseVoiceRecorderStream();

        if (shouldDiscard || chunks.length === 0) {
          return;
        }

        try {
          const chunkMimeType =
            chunks.find((chunk) => chunk.type.trim().length > 0)?.type ?? "";
          const resolvedMimeType =
            chunkMimeType ||
            recorder.mimeType ||
            mimeType ||
            resolvePlayableAudioMimeTypeFallback();
          const blob = new Blob(chunks, {
            type: resolvedMimeType,
          });
          const url = await readBlobAsDataUrl(blob);
          const createdAt = Date.now();
          setPendingAttachments((prev) =>
            [
              ...prev,
              {
                id: `${createdAt}-voice`,
                name: buildVoiceAttachmentName(createdAt, resolvedMimeType),
                type: blob.type || resolvedMimeType,
                size: blob.size,
                url,
                kind: "audio",
              } satisfies PendingAttachment,
            ].slice(0, 10)
          );
        } catch {
          showToast(t("actionFailed"));
        }
      };

      recorder.start();
      setIsVoiceRecording(true);
      setVoiceRecordingSeconds(0);
      clearVoiceRecordingTimer();
      voiceRecordingTimerRef.current = window.setInterval(() => {
        setVoiceRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      showToast(t("micAccessDenied"));
    }
  }, [
    clearVoiceRecordingTimer,
    isVoiceRecording,
    releaseVoiceRecorderStream,
    showToast,
    stopVoiceRecording,
    t,
  ]);

  const toggleVoiceRecording = useCallback(() => {
    if (isVoiceRecording) {
      stopVoiceRecording();
      return;
    }
    void startVoiceRecording();
  }, [isVoiceRecording, startVoiceRecording, stopVoiceRecording]);

  useEffect(() => {
    return () => {
      stopVoiceRecording({ discard: true });
    };
  }, [stopVoiceRecording]);

  useEffect(() => {
    if (!isVoiceRecording) {
      return;
    }
    return () => {
      stopVoiceRecording({ discard: true });
    };
  }, [activeChatId, isVoiceRecording, stopVoiceRecording]);

  useEffect(() => {
    if (!isVoiceRecording || activeSidebar === "home") {
      return;
    }
    stopVoiceRecording({ discard: true });
  }, [activeSidebar, isVoiceRecording, stopVoiceRecording]);

  const insertEmojiToDraft = (emoji: string) => {
    setEmojiUsageCounts((prev) => {
      const next = {
        ...prev,
        [emoji]: (prev[emoji] ?? 0) + 1,
      };
      const entries = Object.entries(next).sort((left, right) => right[1] - left[1]);
      if (entries.length <= MAX_TRACKED_EMOJI_USAGE_ITEMS) {
        return next;
      }
      return Object.fromEntries(entries.slice(0, MAX_TRACKED_EMOJI_USAGE_ITEMS));
    });

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

  const applyFormattingToDraft = useCallback(
    (action: TextFormattingAction) => {
      const input = messageInputRef.current;
      if (!input) {
        return;
      }

      const selectionStart = input.selectionStart ?? draft.length;
      const selectionEnd = input.selectionEnd ?? draft.length;
      const selected = draft.slice(selectionStart, selectionEnd);

      if (action === "quote" || action === "list") {
        const lineStart = draft.lastIndexOf("\n", Math.max(selectionStart - 1, 0)) + 1;
        const nextLineBreak = draft.indexOf("\n", selectionEnd);
        const lineEnd = nextLineBreak === -1 ? draft.length : nextLineBreak;
        const targetBlock = draft.slice(lineStart, lineEnd);
        const prefix = action === "quote" ? "> " : "- ";
        const lines = targetBlock.split("\n");
        const hasPrefixOnEveryLine = lines.every(
          (line) => line.length === 0 || line.startsWith(prefix)
        );
        const transformed = lines
          .map((line) => {
            if (!line) {
              return line;
            }
            return hasPrefixOnEveryLine
              ? line.startsWith(prefix)
                ? line.slice(prefix.length)
                : line
              : `${prefix}${line}`;
          })
          .join("\n");

        const nextValue = `${draft.slice(0, lineStart)}${transformed}${draft.slice(lineEnd)}`;
        setDraft(nextValue);
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(lineStart, lineStart + transformed.length);
        });
        return;
      }

      const wrappers: Record<
        Exclude<TextFormattingAction, "quote" | "list">,
        { before: string; after: string; placeholder: string }
      > = {
        bold: { before: "**", after: "**", placeholder: "text" },
        italic: { before: "*", after: "*", placeholder: "text" },
        strike: { before: "~~", after: "~~", placeholder: "text" },
        code: { before: "`", after: "`", placeholder: "code" },
      };

      const wrapper = wrappers[action];
      const content = selected.length > 0 ? selected : wrapper.placeholder;
      const nextValue = `${draft.slice(0, selectionStart)}${wrapper.before}${content}${wrapper.after}${draft.slice(selectionEnd)}`;
      const selectionAnchor = selectionStart + wrapper.before.length;
      const selectionFocus = selectionAnchor + content.length;

      setDraft(nextValue);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(selectionAnchor, selectionFocus);
      });
    },
    [draft]
  );

  const openFormattingMenuFromContext = useCallback(
    (event: ReactMouseEvent<HTMLTextAreaElement>) => {
      if (draft.trim().length === 0) {
        return;
      }

      const container = composerRef.current;
      if (!container) {
        return;
      }

      event.preventDefault();
      const rect = container.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 12), rect.width - 12);
      const y = Math.min(Math.max(event.clientY - rect.top, 12), rect.height - 12);
      setFormattingMenuPosition({ x, y });
    },
    [draft]
  );

  const formattingControls = useMemo(
    () =>
      ({
        bold: { icon: Bold, label: t("formatBold") },
        italic: { icon: Italic, label: t("formatItalic") },
        strike: { icon: Strikethrough, label: t("formatStrike") },
        code: { icon: Code2, label: t("formatCode") },
        quote: { icon: Quote, label: t("formatQuote") },
        list: { icon: List, label: t("formatList") },
      }) satisfies Record<
        TextFormattingAction,
        { icon: React.ComponentType<{ className?: string }>; label: string }
      >,
    [t]
  );

  const openSchedulePicker = useCallback(() => {
    const baselineNow = serverTimeMs > 0 ? serverTimeMs : Date.now();
    const baseTimestamp =
      scheduledSendAt && scheduledSendAt > baselineNow
        ? scheduledSendAt
        : baselineNow + SCHEDULE_DEFAULT_LEAD_MS;
    const nextParts = toSchedulePickerParts(baseTimestamp);
    setSchedulePickerDate(nextParts.date);
    setSchedulePickerHour(nextParts.hour);
    setSchedulePickerMinute(nextParts.minute);
    setIsSchedulePickerOpen(true);
  }, [scheduledSendAt, serverTimeMs]);

  const clearScheduledSend = useCallback(() => {
    setScheduledSendAt(null);
    setIsSchedulePickerOpen(false);
    setSchedulePickerDate(undefined);
    setSchedulePickerHour("00");
    setSchedulePickerMinute("00");
  }, []);

  const applySchedulePickerValue = () => {
    const baselineNow = serverTimeMs > 0 ? serverTimeMs : Date.now();
    const parsedScheduleTimestamp = buildScheduledTimestamp(
      schedulePickerDate,
      schedulePickerHour,
      schedulePickerMinute
    );
    if (parsedScheduleTimestamp <= baselineNow + SCHEDULE_MIN_LEAD_MS) {
      showToast(
        language === "ru"
          ? "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· 1 Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™."
          : "Pick a time at least 1 minute in the future."
      );
      return;
    }
    if (draft.trim().length === 0 && pendingAttachments.length === 0) {
      showToast(
        language === "ru"
          ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ."
          : "Cannot schedule an empty message."
      );
      return;
    }
    setScheduledSendAt(parsedScheduleTimestamp);
    setIsSchedulePickerOpen(false);
    void sendMessage(parsedScheduleTimestamp);
  };

  const sendMessage = async (scheduledForOverride?: number | null) => {
    const text = draft.trim();
    const attachments = pendingAttachments;
    const replyToId = replyToMessageId;
    const scheduledForTimestamp =
      typeof scheduledForOverride === "undefined"
        ? scheduledSendAt
        : scheduledForOverride;
    const editingId = editingMessageId;
    const editingTarget = editingId
      ? activeMessages.find((message) => message.id === editingId) ?? null
      : null;

    if (!activeChat) {
      return;
    }

    if (isVoiceRecording) {
      return;
    }
    if (isActiveChannelReadOnly) {
      showToast(t("channelPostingRestricted"));
      return;
    }

    if (editingTarget) {
      const hasContentAfterEdit = text.length > 0 || editingTarget.attachments.length > 0;
      const hasChanges = text !== editingTarget.text.trim();
      if (!hasContentAfterEdit || !hasChanges) {
        return;
      }

      setDraft("");
      setEditingMessageId(null);
      setIsEmojiMenuOpen(false);

      try {
        await requestJson<{ ok: boolean }>("/api/messenger/edit-message", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: activeChat.id,
            messageId: editingTarget.id,
            text,
          }),
        });
        await loadChatData({ forceFullSync: true });
      } catch (error) {
        setDraft(editingTarget.text);
        setEditingMessageId(editingTarget.id);
        showToast(getRequestErrorMessage(error));
      }
      return;
    }

    if (!text && attachments.length === 0) {
      if (scheduledForTimestamp !== null) {
        showToast(
          language === "ru"
            ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ."
            : "Cannot schedule an empty message."
        );
      }
      return;
    }

    const isScheduling = !editingTarget && scheduledForTimestamp !== null;
    const baselineNow = serverTimeMs > 0 ? serverTimeMs : Date.now();
    if (
      isScheduling &&
      (scheduledForTimestamp ?? 0) <= baselineNow + SCHEDULE_MIN_LEAD_MS
    ) {
      showToast(
        language === "ru"
          ? "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В· 1 Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™."
          : "Pick a time at least 1 minute in the future."
      );
      return;
    }

    let chatIdForSend = activeChat.id;
    if (activeChat.isPreview) {
      if (
        activeChat.isGroup &&
        activeChat.groupAccess === "public" &&
        isValidGroupUsername(activeChat.groupUsername)
      ) {
        showToast(
          activeChat.groupKind === "channel"
            ? "Join this channel to send messages."
            : t("joinGroupToWrite")
        );
        return;
      }
      if (!activeChat.memberId) {
        return;
      }
      const resolvedChatId = await createOrOpenChat(activeChat.memberId);
      if (!resolvedChatId) {
        return;
      }
      chatIdForSend = resolvedChatId;
    }

    setDraft("");
    setPendingAttachments([]);
    setReplyToMessageId(null);
    setIsEmojiMenuOpen(false);
    if (!editingTarget) {
      setIsSchedulePickerOpen(false);
    }

    try {
      await requestJson<{ messageId: string; createdAt: number }>(
        "/api/messenger/send",
        {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: chatIdForSend,
            text,
            attachments: attachments.map(
              (attachment): SendAttachmentPayload => ({
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                url: attachment.url,
              })
            ),
            replyToMessageId: replyToId ?? undefined,
            scheduledFor: isScheduling ? scheduledForTimestamp ?? undefined : undefined,
          }),
        }
      );
      playOutgoingMessageSound();
      await loadChatData({ forceFullSync: true });
      if (isScheduling) {
        const formatted = formatAbsoluteDateTime(
          scheduledForTimestamp ?? 0,
          language
        );
        showToast(
          language === "ru"
            ? `Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В° ${formatted}`
            : `Message scheduled for ${formatted}`
        );
        setScheduledSendAt(null);
      }
    } catch (error) {
      setDraft(text);
      setPendingAttachments(attachments);
      setReplyToMessageId(replyToId);
      setScheduledSendAt(scheduledForTimestamp);
      showToast(getRequestErrorMessage(error));
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
  const selectedGroupMyRole = useMemo<GroupRole | null>(() => {
    if (!selectedGroupChat) {
      return null;
    }
    return normalizeGroupRole(
      selectedGroupChat.groupRoles[currentUser.id],
      selectedGroupChat.createdById === currentUser.id ? "owner" : "member"
    );
  }, [selectedGroupChat, currentUser.id]);
  const canManageSelectedGroup =
    selectedGroupMyRole === "owner" || selectedGroupMyRole === "admin";
  const isSelectedChannel = selectedGroupChat?.groupKind === "channel";
  const isSelectedGroupOwner = selectedGroupMyRole === "owner";
  const normalizedGroupPublicUsernameDraft = normalizeGroupUsername(groupPublicUsernameDraft);
  const selectedGroupCurrentAccessType: GroupAccessType =
    selectedGroupChat?.groupAccess === "public" ? "public" : "private";
  const isGroupTypeDraftUnchanged =
    selectedGroupCurrentAccessType === groupAccessTypeDraft &&
    (groupAccessTypeDraft !== "public" ||
      normalizeGroupUsername(selectedGroupChat?.groupUsername ?? "") ===
        normalizedGroupPublicUsernameDraft);
  const groupPublicDraftLink = useMemo(() => {
    if (groupAccessTypeDraft !== "public") {
      return "";
    }
    if (!isValidGroupUsername(normalizedGroupPublicUsernameDraft)) {
      return "";
    }
    return buildMessengerGroupJoinLink({ username: normalizedGroupPublicUsernameDraft });
  }, [groupAccessTypeDraft, normalizedGroupPublicUsernameDraft]);
  const selectedGroupInviteLink = useMemo(() => {
    if (!selectedGroupChat) {
      return "";
    }
    const inviteToken = selectedGroupChat.groupInviteToken.trim() || selectedGroupChat.id;
    return buildMessengerGroupJoinLink({ inviteToken });
  }, [selectedGroupChat?.id, selectedGroupChat?.groupInviteToken]);
  const selectedGroupInviteUsageLimit = selectedGroupChat
    ? normalizeGroupInviteUsageLimit(selectedGroupChat.groupInviteUsageLimit)
    : 0;
  const selectedGroupInviteUsedCount = selectedGroupChat
    ? normalizeGroupInviteUsedCount(
        selectedGroupChat.groupInviteUsedCount,
        selectedGroupInviteUsageLimit
      )
    : 0;
  const selectedGroupContentProtectionEnabled =
    selectedGroupChat?.contentProtectionEnabled === true;
  const selectedGroupInviteRemainingUses =
    selectedGroupInviteUsageLimit > 0
      ? Math.max(selectedGroupInviteUsageLimit - selectedGroupInviteUsedCount, 0)
      : null;
  const parsedGroupInviteUsageLimitDraft = parseGroupInviteUsageLimitDraft(
    groupInviteUsageLimitDraft
  );
  const isGroupInviteUsageLimitDraftValid = parsedGroupInviteUsageLimitDraft !== null;
  const isCustomGroupInviteUsagePresetSelected =
    parsedGroupInviteUsageLimitDraft !== null &&
    !GROUP_INVITE_USAGE_PRESET_VALUES.some(
      (presetValue) => presetValue === parsedGroupInviteUsageLimitDraft
    );
  const normalizedGroupInviteUsageLimitDraft =
    parsedGroupInviteUsageLimitDraft ?? selectedGroupInviteUsageLimit;
  const isGroupInviteUsageLimitDraftUnchanged =
    normalizedGroupInviteUsageLimitDraft === selectedGroupInviteUsageLimit;
  const isOwnProfile =
    !profileUserId ||
    profileUserId.trim() === "" ||
    (!isGroupProfile && profileUserId === currentUser.id);
  const canEditViewedProfileImages =
    isOwnProfile || (isGroupProfile && canManageSelectedGroup);
  const currentKnownUser = useMemo(
    () => knownUsers.find((candidate) => candidate.id === currentUser.id) ?? null,
    [knownUsers, currentUser.id]
  );
  const viewedProfile = useMemo<ProfileData>(() => {
    if (isOwnProfile) {
      return profile;
    }
    if (selectedGroupChat) {
      const groupBio =
        selectedGroupChat.description.trim().length > 0
          ? selectedGroupChat.description
          : `${selectedGroupChat.memberIds.length} ${
              selectedGroupChat.groupKind === "channel"
                ? t("subscribers")
                : t("members")
            }`;
      return {
        name: selectedGroupChat.name,
        username: "",
        bio: groupBio,
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
  const viewedUserId =
    !isGroupProfile && !isOwnProfile && profileUserId ? profileUserId : null;
  const blockedUserIds = currentKnownUser?.blockedUserIds ?? currentUser.blockedUserIds ?? [];
  const isViewedUserBlocked =
    viewedUserId !== null && blockedUserIds.includes(viewedUserId);
  const isProfileCallActiveWithViewedUser =
    viewedUserId !== null &&
    callSession !== null &&
    !callSession.isGroup &&
    callSession.participantUserIds.includes(viewedUserId);
  const isProfileCallButtonDisabled =
    !viewedUserId ||
    isViewedUserBlocked ||
    (callSession !== null && !isProfileCallActiveWithViewedUser);
  const startAudioCallFromProfile = useCallback(async () => {
    if (!viewedUserId) {
      setCallNotice(t("callDirectOnly"));
      return;
    }

    const chatId = await createOrOpenChat(viewedUserId);
    if (!chatId) {
      return;
    }

    await startAudioCallToTarget({
      chatId,
      peerUserId: viewedUserId,
      peerName: viewedProfile.name.trim() || t("unknownUser"),
    });
  }, [
    createOrOpenChat,
    setCallNotice,
    startAudioCallToTarget,
    t,
    viewedProfile.name,
    viewedUserId,
  ]);
  const shareableContactText = useMemo(() => {
    if (isGroupProfile) {
      return "";
    }

    const name = viewedProfile.name.trim();
    const username = viewedProfile.username.trim().replace(/^@+/, "");
    const contactSummary = username
      ? `${name || username} (@${username})`
      : name;

    return contactSummary;
  }, [isGroupProfile, viewedProfile.name, viewedProfile.username]);
  const shareContactTargetChats = useMemo(() => {
    const normalized = normalizeSearchQuery(shareContactQuery);
    if (normalized.raw.length === 0) {
      return chatItems;
    }

    return chatItems.filter(
      (chat) =>
        chat.name.toLowerCase().includes(normalized.raw) ||
        chat.username.toLowerCase().includes(normalized.username)
    );
  }, [chatItems, shareContactQuery]);
  const forwardMessagePreview = useMemo(() => {
    if (!forwardMessageDraft) {
      return "";
    }
    if (forwardMessageDraft.text) {
      return forwardMessageDraft.text;
    }
    if (forwardMessageDraft.attachments.length === 0) {
      return t("noMessagesYet");
    }
    if (forwardMessageDraft.attachments.length === 1) {
      return forwardMessageDraft.attachments[0]?.name || t("attachment");
    }
    return `${t("attachment")} x${forwardMessageDraft.attachments.length}`;
  }, [forwardMessageDraft, t]);
  const forwardTargetChats = useMemo(() => {
    const normalized = normalizeSearchQuery(forwardQuery);
    const regularChats = chatItems
      .filter((chat) => !chat.isPreview && !chat.isFavorites)
      .map((chat) => ({
        id: chat.id,
        name: chat.name,
        username: chat.username,
        avatarUrl: chat.avatarUrl,
        accent: chat.accent,
        isGroup: chat.isGroup,
        isFavorites: false,
      }))
      .filter(
        (chat) =>
          normalized.raw.length === 0 ||
          chat.name.toLowerCase().includes(normalized.raw) ||
          chat.username.toLowerCase().includes(normalized.username)
      );

    const favoritesTarget = {
      id: FAVORITES_CHAT_ID,
      name: t("favorites"),
      username: "",
      avatarUrl: "",
      accent: pickAccent(FAVORITES_CHAT_ID),
      isGroup: false,
      isFavorites: true,
    };
    const showFavoritesTarget =
      normalized.raw.length === 0 ||
      favoritesTarget.name.toLowerCase().includes(normalized.raw) ||
      t("savedMessages").toLowerCase().includes(normalized.raw);

    return showFavoritesTarget
      ? [favoritesTarget, ...regularChats]
      : regularChats;
  }, [chatItems, forwardQuery, t]);
  const selectedForwardTargetIds = useMemo(
    () => new Set(forwardTargetChatIds),
    [forwardTargetChatIds]
  );
  const openShareContactDialog = useCallback(() => {
    if (!shareableContactText) {
      showToast(t("actionFailed"));
      return;
    }
    setShareContactQuery("");
    setIsShareContactDialogOpen(true);
  }, [shareableContactText, showToast, t]);
  const toggleViewedUserBlock = useCallback(async () => {
    if (!viewedUserId) {
      return;
    }

    const nextBlocked = !isViewedUserBlocked;
    try {
      await requestJson<BlockUserResponse>("/api/auth/block", {
        method: "PATCH",
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId: viewedUserId,
          blocked: nextBlocked,
        }),
      });
      await loadChatData({ forceFullSync: true });
      showToast(nextBlocked ? t("userBlockedToast") : t("userUnblockedToast"));
    } catch (error) {
      showToast(getRequestErrorMessage(error));
    }
  }, [
    viewedUserId,
    isViewedUserBlocked,
    currentUser.id,
    loadChatData,
    showToast,
    t,
    getRequestErrorMessage,
  ]);
  const sendSharedContactToChat = useCallback(
    async (chatId: string) => {
      if (!chatId || !shareableContactText || isSharingContact) {
        return;
      }

      setIsSharingContact(true);
      try {
        await requestJson<{ messageId: string; createdAt: number }>(
          "/api/messenger/send",
          {
            method: "POST",
            body: JSON.stringify({
              userId: currentUser.id,
              chatId,
              text: shareableContactText,
            }),
          }
        );
        await loadChatData({ forceFullSync: true });
        setIsShareContactDialogOpen(false);
        setShareContactQuery("");
        setActiveSidebar("home");
        setActiveChatId(chatId);
        setMobileView("chat");
        showToast(t("contactSharedToast"));
      } catch {
        showToast(t("actionFailed"));
      } finally {
        setIsSharingContact(false);
      }
    },
    [
      currentUser.id,
      isSharingContact,
      loadChatData,
      shareableContactText,
      showToast,
      t,
    ]
  );
  const groupParticipants = useMemo(() => {
    if (!selectedGroupChat) {
      return [];
    }

    const roleOrder: Record<GroupRole, number> = {
      owner: 0,
      admin: 1,
      member: 2,
    };

    return selectedGroupChat.memberIds
      .map((memberId) => {
        const user = knownUsers.find((candidate) => candidate.id === memberId);
        const role = normalizeGroupRole(
          selectedGroupChat.groupRoles[memberId],
          selectedGroupChat.createdById === memberId ? "owner" : "member"
        );
        const isCurrentUser = memberId === currentUser.id;
        const canRemove =
          !isCurrentUser &&
          (selectedGroupMyRole === "owner"
            ? role !== "owner"
            : selectedGroupMyRole === "admin"
              ? role === "member"
              : false);
        const canPromote = isSelectedGroupOwner && !isCurrentUser && role === "member";
        const canDemote = isSelectedGroupOwner && !isCurrentUser && role === "admin";
        const canTransferOwnership =
          isSelectedGroupOwner && !isCurrentUser && role !== "owner";
        return {
          id: memberId,
          name: user?.name ?? t("unknownUser"),
          username: user?.username ?? "unknown",
          avatarUrl: user?.avatarUrl ?? "",
          role,
          isCurrentUser,
          canRemove,
          canPromote,
          canDemote,
          canTransferOwnership,
        };
      })
      .sort((a, b) => {
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.name.localeCompare(b.name);
      });
  }, [
    selectedGroupChat,
    knownUsers,
    t,
    currentUser.id,
    isSelectedGroupOwner,
    selectedGroupMyRole,
  ]);
  const groupAddCandidates = useMemo(() => {
    if (!selectedGroupChat || !canManageSelectedGroup || isSelectedChannel) {
      return [];
    }
    const normalized = normalizeSearchQuery(groupMemberSearchDraft);
    return knownUsers
      .filter((user) => user.id !== currentUser.id)
      .filter((user) => !selectedGroupChat.memberIds.includes(user.id))
      .filter((user) => {
        if (!normalized.raw) {
          return true;
        }
        return (
          user.name.toLowerCase().includes(normalized.raw) ||
          user.username.toLowerCase().includes(normalized.username) ||
          user.email.toLowerCase().includes(normalized.raw)
        );
      })
      .slice(0, 6);
  }, [
    selectedGroupChat,
    canManageSelectedGroup,
    isSelectedChannel,
    groupMemberSearchDraft,
    knownUsers,
    currentUser.id,
  ]);
  useEffect(() => {
    if (!selectedGroupChat) {
      setGroupRenameDraft("");
      setGroupDescriptionDraft("");
      setGroupAccessTypeDraft("private");
      setGroupPublicUsernameDraft("");
      setGroupInviteUsageLimitDraft("0");
      setGroupMemberSearchDraft("");
      setIsGroupSettingsOpen(false);
      setIsGroupTypeDialogOpen(false);
      setIsGroupPermissionsDialogOpen(false);
      setIsGroupInvitationsDialogOpen(false);
      return;
    }
    setGroupRenameDraft(selectedGroupChat.name);
    setGroupDescriptionDraft(selectedGroupChat.description);
    setGroupAccessTypeDraft(selectedGroupChat.groupAccess === "public" ? "public" : "private");
    setGroupPublicUsernameDraft(selectedGroupChat.groupUsername);
    setGroupInviteUsageLimitDraft(String(selectedGroupChat.groupInviteUsageLimit));
    setGroupMemberSearchDraft("");
    setIsGroupSettingsOpen(false);
    setIsGroupTypeDialogOpen(false);
    setIsGroupPermissionsDialogOpen(false);
    setIsGroupInvitationsDialogOpen(false);
  }, [
    selectedGroupChat?.id,
    selectedGroupChat?.name,
    selectedGroupChat?.description,
    selectedGroupChat?.groupAccess,
    selectedGroupChat?.groupUsername,
    selectedGroupChat?.groupInviteUsageLimit,
  ]);

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
  const isViewedChatContentProtectionEnabled = useMemo(
    () => (viewedChatId ? isGroupContentProtectionEnabledByChatId(viewedChatId) : false),
    [viewedChatId, isGroupContentProtectionEnabledByChatId]
  );

  const profileHistoryMessages = useMemo(() => {
    if (!viewedChatId) {
      return [];
    }
    return messages
      .filter((message) => message.chatId === viewedChatId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [messages, viewedChatId]);

  const profileMediaItems = useMemo<ProfileMediaItem[]>(() => {
    return profileHistoryMessages.flatMap((message) => {
      const textMediaItems = extractMediaUrls(message.text).map((url, index) => ({
        id: `${message.id}-text-media-${index}`,
        url,
        name: getMediaNameFromUrl(url),
        kind: getMediaKindFromUrl(url),
        time: formatChatTime(message.createdAt, language),
      }));
      const attachmentMediaItems = message.attachments
        .map((attachment, index) => {
          const kind = getAttachmentKind(attachment.type);
          if (kind !== "image" && kind !== "video") {
            return null;
          }
          return {
            id: `${message.id}-attachment-media-${attachment.id || index}`,
            url: attachment.url,
            name: attachment.name || getMediaNameFromUrl(attachment.url),
            kind,
            time: formatChatTime(message.createdAt, language),
          };
        })
        .filter((item): item is ProfileMediaItem => item !== null);
      const allMediaItems = [...textMediaItems, ...attachmentMediaItems];
      const seenUrls = new Set<string>();
      return allMediaItems.filter((item) => {
        if (seenUrls.has(item.url)) {
          return false;
        }
        seenUrls.add(item.url);
        return true;
      });
    });
  }, [profileHistoryMessages, language]);
  const profileAudioItems = useMemo<ProfileAudioItem[]>(() => {
    return profileHistoryMessages.flatMap((message) => {
      const audioItems = message.attachments
        .map((attachment, index) => {
          const kind = getAttachmentKind(attachment.type);
          if (kind !== "audio") {
            return null;
          }
          return {
            id: `${message.id}-attachment-audio-${attachment.id || index}`,
            url: attachment.url,
            time: formatChatTime(message.createdAt, language),
          };
        })
        .filter((item): item is ProfileAudioItem => item !== null);
      const seenUrls = new Set<string>();
      return audioItems.filter((item) => {
        if (seenUrls.has(item.url)) {
          return false;
        }
        seenUrls.add(item.url);
        return true;
      });
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
          downloadBlocked: isViewedChatContentProtectionEnabled,
        })),
    [profileMediaItems, isViewedChatContentProtectionEnabled]
  );
  const profileAvatarViewerImage = useMemo(
    () =>
      viewedProfile.avatarUrl
        ? {
            id: PROFILE_AVATAR_VIEWER_IMAGE_ID,
            name: getMediaNameFromUrl(viewedProfile.avatarUrl),
            url: viewedProfile.avatarUrl,
            downloadBlocked: false,
          }
        : null,
    [viewedProfile.avatarUrl]
  );
  const viewerImages = useMemo<ViewerImage[]>(() => {
    if (viewerSource === "profile-avatar") {
      return profileAvatarViewerImage ? [profileAvatarViewerImage] : [];
    }
    return viewerSource === "profile" ? profileMediaImages : activeChatImages;
  }, [activeChatImages, profileAvatarViewerImage, profileMediaImages, viewerSource]);
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
    (imageId: string, source: "chat" | "profile" | "profile-avatar" = "chat") => {
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
        .filter((attachment) => {
          const kind = getAttachmentKind(attachment.type);
          return kind === "file";
        })
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
    if (profileAudioItems.length > 0) {
      tabs.push({
        id: "audio",
        label: t("audio"),
        count: profileAudioItems.length,
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
    profileAudioItems.length,
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

  const openOwnProfile = useCallback(() => {
    setProfileUserId(null);
    setProfileTab("media");
    setIsEditingProfile(false);
    setIsActiveChatProfileSidebarOpen(false);
    setIsPinnedUserProfileFromMessage(false);
    setActiveSidebar("profile");
  }, []);

  useEffect(() => {
    if (visibleSidebarItems.length === 0) {
      return;
    }
    if (visibleSidebarItems.some((item) => item.id === activeSidebar)) {
      return;
    }
    const fallbackId = visibleSidebarItems[0]?.id ?? "home";
    if (fallbackId === "profile") {
      openOwnProfile();
      return;
    }
    setIsActiveChatProfileSidebarOpen(false);
    setActiveSidebar(fallbackId);
  }, [activeSidebar, openOwnProfile, visibleSidebarItems]);

  const prepareActiveChatProfileTarget = useCallback(() => {
    if (!activeChat) {
      return false;
    }
    if (activeChat.isPreview && activeChat.isGroup) {
      return false;
    }
    setIsPinnedUserProfileFromMessage(false);
    if (activeChat.isFavorites) {
      setProfileUserId(currentUser.id);
      setProfileTab("media");
      setIsEditingProfile(false);
      return true;
    }
    if (activeChat.isGroup) {
      setProfileUserId(activeChat.id);
    } else if (activeChat.memberId) {
      setProfileUserId(activeChat.memberId);
    } else {
      return false;
    }
    setProfileTab("media");
    setIsEditingProfile(false);
    return true;
  }, [activeChat, currentUser.id]);

  const openActiveChatProfile = useCallback(() => {
    if (!prepareActiveChatProfileTarget()) {
      return;
    }
    setIsEmojiSidebarOpen(false);
    setIsActiveChatProfileSidebarOpen(false);
    setActiveSidebar("profile");
  }, [prepareActiveChatProfileTarget]);

  const toggleActiveChatProfileSidebar = useCallback(() => {
    setIsEmojiSidebarOpen(false);
    if (isActiveChatProfileSidebarOpen) {
      setIsActiveChatProfileSidebarOpen(false);
      return;
    }
    if (!prepareActiveChatProfileTarget()) {
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setActiveSidebar("profile");
      return;
    }
    setActiveSidebar("home");
    setIsActiveChatProfileSidebarOpen(true);
  }, [isActiveChatProfileSidebarOpen, prepareActiveChatProfileTarget]);

  const openUserProfileFromChat = useCallback(
    (targetUserId: string) => {
      if (!targetUserId || targetUserId === BUILT_IN_ASSISTANT_USER_ID) {
        return;
      }
      if (targetUserId === currentUser.id) {
        openOwnProfile();
        return;
      }

      setIsPinnedUserProfileFromMessage(true);
      setProfileUserId(targetUserId);
      setProfileTab("media");
      setIsEditingProfile(false);

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches
      ) {
        setIsActiveChatProfileSidebarOpen(false);
        setActiveSidebar("profile");
        return;
      }

      setActiveSidebar("home");
      setIsActiveChatProfileSidebarOpen(true);
    },
    [currentUser.id, openOwnProfile]
  );

  const resetMobileBackSwipeGesture = useCallback(() => {
    mobileBackSwipeGestureRef.current = createIdleMobileBackSwipeGestureState();
  }, []);

  const handleMobileBackSwipeStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch) {
        resetMobileBackSwipeGesture();
        return;
      }

      if (
        typeof window === "undefined" ||
        !window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY).matches ||
        activeSidebar !== "home" ||
        mobileView !== "chat" ||
        touch.clientX > MOBILE_BACK_SWIPE_EDGE_WIDTH
      ) {
        resetMobileBackSwipeGesture();
        return;
      }

      mobileBackSwipeGestureRef.current = {
        tracking: true,
        activated: false,
        axisLock: null,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    [activeSidebar, mobileView, resetMobileBackSwipeGesture]
  );

  const handleMobileBackSwipeMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const gesture = mobileBackSwipeGestureRef.current;
      if (!gesture.tracking || gesture.activated) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (gesture.axisLock === null) {
        if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
          gesture.axisLock = "vertical";
          return;
        }
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) >= Math.abs(deltaY) * 1.2) {
          gesture.axisLock = "horizontal";
        } else {
          return;
        }
      }

      if (gesture.axisLock !== "horizontal") {
        return;
      }

      if (deltaX > 10) {
        event.preventDefault();
      }

      if (deltaX >= MOBILE_BACK_SWIPE_TRIGGER_DISTANCE && Math.abs(deltaY) < 120) {
        gesture.activated = true;
        setIsActiveChatSearchOpen(false);
        setIsActiveChatProfileSidebarOpen(false);
        setMobileView("list");
        resetMobileBackSwipeGesture();
      }
    },
    [resetMobileBackSwipeGesture]
  );

  const handleMobileBackSwipeEnd = useCallback(() => {
    resetMobileBackSwipeGesture();
  }, [resetMobileBackSwipeGesture]);

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
      } else if (key === "r" && AI_FEATURE_ENABLED) {
        setActiveSidebar("assistant");
      } else {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [openOwnProfile]);

  useEffect(() => {
    if (activeSidebar !== "home") {
      setIsActiveChatProfileSidebarOpen(false);
    }
  }, [activeSidebar]);

  useEffect(() => {
    if (!isActiveChatProfileSidebarOpen) {
      return;
    }
    if (isPinnedUserProfileFromMessage) {
      return;
    }
    if (!activeChat) {
      setIsActiveChatProfileSidebarOpen(false);
      return;
    }
    if (activeChat.isFavorites) {
      setProfileUserId((prev) => (prev === currentUser.id ? prev : currentUser.id));
      return;
    }
    if (activeChat.isGroup) {
      setProfileUserId((prev) => (prev === activeChat.id ? prev : activeChat.id));
    } else if (activeChat.memberId) {
      setProfileUserId((prev) =>
        prev === activeChat.memberId ? prev : activeChat.memberId
      );
    } else {
      setIsActiveChatProfileSidebarOpen(false);
      return;
    }
  }, [
    activeChat,
    currentUser.id,
    isActiveChatProfileSidebarOpen,
    isPinnedUserProfileFromMessage,
  ]);

  useEffect(() => {
    if (isActiveChatProfileSidebarOpen || !isPinnedUserProfileFromMessage) {
      return;
    }
    setIsPinnedUserProfileFromMessage(false);
  }, [isActiveChatProfileSidebarOpen, isPinnedUserProfileFromMessage]);

  const renameSelectedGroup = async () => {
    const selectedGroup = selectedGroupChat;
    const groupChatId = selectedGroup?.id ?? "";
    const nextTitle = groupRenameDraft.trim().replace(/\s+/g, " ");
    const nextDescription = groupDescriptionDraft.trim();
    if (!groupChatId || !selectedGroup || !canManageSelectedGroup) {
      return;
    }
    if (nextTitle.length < GROUP_TITLE_MIN_LENGTH) {
      showToast(t("groupNameMinError"));
      return;
    }
    if (nextTitle.length > GROUP_TITLE_MAX_LENGTH) {
      showToast(t("groupNameMaxError"));
      return;
    }
    if (nextDescription.length > GROUP_DESCRIPTION_MAX_LENGTH) {
      showToast(
        language === "ru"
          ? `Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’В ${GROUP_DESCRIPTION_MAX_LENGTH} Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В `
          : `Group description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }
    if (nextTitle === selectedGroup.name && nextDescription === selectedGroup.description) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              title: nextTitle,
              description: nextDescription,
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/rename-group", {
        method: "PATCH",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          title: nextTitle,
          description: nextDescription,
        }),
      });
      showToast(isSelectedChannel ? "Channel updated" : t("groupRenamedToast"));
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
  };

  const updateSelectedGroupAccess = async () => {
    const selectedGroup = selectedGroupChat;
    const groupChatId = selectedGroup?.id ?? "";
    if (!groupChatId || !selectedGroup || !canManageSelectedGroup || isSavingGroupType) {
      return;
    }

    const nextAccessType: GroupAccessType =
      groupAccessTypeDraft === "public" ? "public" : "private";
    const nextPublicUsername = normalizedGroupPublicUsernameDraft;

    if (nextAccessType === "public" && !isValidGroupUsername(nextPublicUsername)) {
      showToast(t("invalidGroupUsername"));
      return;
    }

    const currentAccessType: GroupAccessType =
      selectedGroup.groupAccess === "public" ? "public" : "private";
    const currentPublicUsername = normalizeGroupUsername(selectedGroup.groupUsername);
    const hasNoChanges =
      currentAccessType === nextAccessType &&
      (nextAccessType !== "public" || currentPublicUsername === nextPublicUsername);
    if (hasNoChanges) {
      return;
    }

    setIsSavingGroupType(true);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              groupAccess: nextAccessType,
              groupUsername: nextAccessType === "public" ? nextPublicUsername : "",
              groupInviteToken: thread.groupInviteToken?.trim() || thread.id,
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      const response = await requestJson<UpdateGroupAccessResponse>(
        "/api/messenger/group-access",
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: groupChatId,
            accessType: nextAccessType,
            username: nextPublicUsername,
          }),
        }
      );
      setGroupAccessTypeDraft(response.accessType);
      setGroupPublicUsernameDraft(response.username);
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === groupChatId
            ? {
                ...thread,
                groupAccess: response.accessType,
                groupUsername: response.username,
                groupInviteToken: response.inviteToken,
                groupInviteUsageLimit: normalizeGroupInviteUsageLimit(
                  response.inviteUsageLimit
                ),
                groupInviteUsedCount: normalizeGroupInviteUsedCount(
                  response.inviteUsedCount,
                  normalizeGroupInviteUsageLimit(response.inviteUsageLimit)
                ),
              }
            : thread
        )
      );
      showToast(isSelectedChannel ? "Channel type updated" : t("groupTypeSavedToast"));
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    } finally {
      setIsSavingGroupType(false);
    }
  };

  const handleGroupInviteUsagePresetSelect = useCallback((value: number) => {
    setGroupInviteUsageLimitDraft(String(normalizeGroupInviteUsageLimit(value)));
  }, []);

  const handleGroupInviteUsageLimitDraftChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    setGroupInviteUsageLimitDraft(digitsOnly);
  }, []);

  const handleGroupInviteUsageLimitDraftBlur = useCallback(() => {
    setGroupInviteUsageLimitDraft((previous) => {
      const parsed = parseGroupInviteUsageLimitDraft(previous);
      if (parsed === null) {
        return "0";
      }
      return String(normalizeGroupInviteUsageLimit(parsed));
    });
  }, []);

  const adjustGroupInviteUsageLimitDraft = useCallback((delta: number) => {
    setGroupInviteUsageLimitDraft((previous) => {
      const baseValue = parseGroupInviteUsageLimitDraft(previous) ?? 0;
      const nextValue = normalizeGroupInviteUsageLimit(baseValue + delta);
      return String(nextValue);
    });
  }, []);

  const focusGroupInviteUsageInput = useCallback(() => {
    const input = groupInviteUsageInputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }, []);

  const updateSelectedGroupInviteUsageLimit = async () => {
    const selectedGroup = selectedGroupChat;
    const groupChatId = selectedGroup?.id ?? "";
    if (
      !groupChatId ||
      !selectedGroup ||
      !canManageSelectedGroup ||
      isSelectedChannel ||
      selectedGroupCurrentAccessType === "public" ||
      isSavingGroupInviteUsageLimit
    ) {
      return;
    }

    if (!isGroupInviteUsageLimitDraftValid) {
      showToast(t("invalidInviteUsageLimit"));
      return;
    }

    const nextUsageLimit = parsedGroupInviteUsageLimitDraft ?? 0;
    if (nextUsageLimit === selectedGroupInviteUsageLimit) {
      return;
    }

    setIsSavingGroupInviteUsageLimit(true);
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== groupChatId) {
          return thread;
        }
        const normalizedNextUsageLimit = normalizeGroupInviteUsageLimit(nextUsageLimit);
        return {
          ...thread,
          groupInviteUsageLimit: normalizedNextUsageLimit,
          groupInviteUsedCount: normalizeGroupInviteUsedCount(
            thread.groupInviteUsedCount,
            normalizedNextUsageLimit
          ),
          updatedAt: Date.now(),
        };
      })
    );

    try {
      const response = await requestJson<UpdateGroupInviteSettingsResponse>(
        "/api/messenger/group-invite-settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: groupChatId,
            usageLimit: nextUsageLimit,
          }),
        }
      );
      const normalizedUsageLimit = normalizeGroupInviteUsageLimit(response.usageLimit);
      const normalizedUsedCount = normalizeGroupInviteUsedCount(
        response.usedCount,
        normalizedUsageLimit
      );
      setGroupInviteUsageLimitDraft(String(normalizedUsageLimit));
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === groupChatId
            ? {
                ...thread,
                groupInviteToken: response.inviteToken,
                groupInviteUsageLimit: normalizedUsageLimit,
                groupInviteUsedCount: normalizedUsedCount,
                updatedAt: Date.now(),
              }
            : thread
        )
      );
      showToast(t("inviteUsageSavedToast"));
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    } finally {
      setIsSavingGroupInviteUsageLimit(false);
    }
  };

  const updateSelectedGroupContentProtection = async (enabled: boolean) => {
    const selectedGroup = selectedGroupChat;
    const groupChatId = selectedGroup?.id ?? "";
    if (
      !groupChatId ||
      !selectedGroup ||
      !canManageSelectedGroup ||
      isSavingGroupContentProtection
    ) {
      return;
    }
    if ((selectedGroup.contentProtectionEnabled === true) === enabled) {
      return;
    }

    setIsSavingGroupContentProtection(true);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              contentProtectionEnabled: enabled,
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      const response = await requestJson<UpdateGroupContentProtectionResponse>(
        "/api/messenger/group-content-protection",
        {
          method: "PATCH",
          body: JSON.stringify({
            userId: currentUser.id,
            chatId: groupChatId,
            enabled,
          }),
        }
      );
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === groupChatId
            ? {
                ...thread,
                contentProtectionEnabled: response.enabled,
              }
            : thread
        )
      );
      showToast(t("groupContentProtectionSavedToast"));
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    } finally {
      setIsSavingGroupContentProtection(false);
    }
  };

  const copyGroupLink = async (value: string) => {
    if (!value.trim()) {
      return;
    }
    try {
      await copyToClipboard(value);
      showToast(t("copyLink"));
    } catch {
      showToast(t("actionFailed"));
    }
  };

  const addMemberToSelectedGroup = async (memberId: string) => {
    const groupChatId = selectedGroupChat?.id ?? "";
    if (!groupChatId || !canManageSelectedGroup || isSelectedChannel) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId && !thread.memberIds.includes(memberId)
          ? {
              ...thread,
              memberIds: [...thread.memberIds, memberId],
              readBy: {
                ...thread.readBy,
                [memberId]: 0,
              },
              groupRoles: {
                ...thread.groupRoles,
                [memberId]: "member",
              },
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/add-member", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          memberId,
        }),
      });
      showToast(t("memberAddedToast"));
      await loadChatData({ forceFullSync: true });
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
  };

  const removeMemberFromSelectedGroup = async (memberId: string) => {
    const groupChatId = selectedGroupChat?.id ?? "";
    if (!groupChatId || !canManageSelectedGroup) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              memberIds: thread.memberIds.filter((candidateId) => candidateId !== memberId),
              readBy: Object.entries(thread.readBy).reduce<Record<string, number>>(
                (acc, [candidateId, readAt]) => {
                  if (candidateId !== memberId) {
                    acc[candidateId] = readAt;
                  }
                  return acc;
                },
                {}
              ),
              groupRoles: Object.entries(thread.groupRoles).reduce<Record<string, GroupRole>>(
                (acc, [candidateId, role]) => {
                  if (candidateId !== memberId) {
                    acc[candidateId] = role;
                  }
                  return acc;
                },
                {}
              ),
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/remove-member", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          memberId,
        }),
      });
      showToast(t("memberRemovedToast"));
      await loadChatData({ forceFullSync: true });
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
  };

  const updateSelectedGroupMemberRole = async (
    memberId: string,
    role: "admin" | "member"
  ) => {
    const groupChatId = selectedGroupChat?.id ?? "";
    if (!groupChatId || !isSelectedGroupOwner) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              groupRoles: {
                ...thread.groupRoles,
                [memberId]: role,
              },
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/set-member-role", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          memberId,
          role,
        }),
      });
      showToast(t("roleUpdatedToast"));
      await loadChatData({ forceFullSync: true });
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
  };

  const transferSelectedGroupOwnership = async (nextOwnerId: string) => {
    const groupChatId = selectedGroupChat?.id ?? "";
    if (!groupChatId || !isSelectedGroupOwner) {
      return;
    }

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === groupChatId
          ? {
              ...thread,
              createdById: nextOwnerId,
              groupRoles: {
                ...thread.groupRoles,
                [currentUser.id]: "admin",
                [nextOwnerId]: "owner",
              },
              updatedAt: Date.now(),
            }
          : thread
      )
    );

    try {
      await requestJson<{ ok: boolean }>("/api/messenger/transfer-owner", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUser.id,
          chatId: groupChatId,
          nextOwnerId,
        }),
      });
      showToast(t("ownershipTransferredToast"));
      await loadChatData({ forceFullSync: true });
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
    }
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
    } catch (error) {
      await loadChatData({ forceFullSync: true });
      showToast(getRequestErrorMessage(error));
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
        if (!canManageSelectedGroup) {
          return;
        }
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
    if (!canEditViewedProfileImages) {
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
      if (!canManageSelectedGroup) {
        setImagePickerTarget(null);
        return;
      }
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
  const isCompactActiveChatProfileSidebar =
    activeSidebar === "home" && isActiveChatProfileSidebarOpen;
  const isCompactEmojiSidebar = activeSidebar === "home" && isEmojiSidebarOpen;
  const shouldShowEmojiSidebar = isCompactEmojiSidebar;
  const hoverMenuEmojis = useMemo(() => {
    const frequent = Object.entries(emojiUsageCounts)
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1])
      .map(([emoji]) => emoji);

    const next: string[] = [];
    const seen = new Set<string>();
    for (const emoji of frequent) {
      if (!seen.has(emoji)) {
        seen.add(emoji);
        next.push(emoji);
      }
      if (next.length >= MAX_HOVER_MENU_EMOJIS) {
        return next;
      }
    }

    for (const emoji of CHAT_HOVER_EMOJIS) {
      if (!seen.has(emoji)) {
        seen.add(emoji);
        next.push(emoji);
      }
      if (next.length >= MAX_HOVER_MENU_EMOJIS) {
        break;
      }
    }

    return next;
  }, [emojiUsageCounts]);
  const shouldShowProfileSidebar =
    activeSidebar === "profile" || isCompactActiveChatProfileSidebar;
  const shouldShowMobileNavigation =
    activeSidebar !== "home" || mobileView === "list";
  const mobileMainPaddingClass = shouldShowMobileNavigation
    ? "pb-[calc(4rem+max(env(safe-area-inset-bottom),0.5rem))] md:pb-0"
    : "";
  const renderableSidebarItems =
    visibleSidebarItems.length > 0 ? visibleSidebarItems : orderedSidebarItems;
  const activateSidebarItem = useCallback(
    (itemId: SidebarItem["id"]) => {
      if (itemId === "profile") {
        openOwnProfile();
        return;
      }
      setActiveSidebar(itemId);
    },
    [openOwnProfile]
  );
  const chatActionMenuContentClassName = `${CHAT_ACTION_MENU_CONTENT_CLASS_NAME} ${
    uiDensity === "compact" ? "!w-48" : "!w-56"
  }`;
  const chatActionMenuItemClassName = `${CHAT_ACTION_MENU_ITEM_CLASS_NAME} ${
    uiDensity === "compact" ? "!px-2.5 !py-1.5 !text-xs" : "!px-3 !py-2 !text-sm"
  }`;
  const chatActionMenuDestructiveItemClassName = `${CHAT_ACTION_MENU_DESTRUCTIVE_ITEM_CLASS_NAME} ${
    uiDensity === "compact" ? "!px-2.5 !py-1.5 !text-xs" : "!px-3 !py-2 !text-sm"
  }`;
  const chatActionMenuSeparatorClassName = CHAT_ACTION_MENU_SEPARATOR_CLASS_NAME;
  const profileActionMenuContentClassName = `${PROFILE_ACTION_MENU_CONTENT_CLASS_NAME} ${
    uiDensity === "compact" ? "!w-44" : "!w-52"
  }`;
  const profileActionMenuItemClassName = `${PROFILE_ACTION_MENU_ITEM_CLASS_NAME} ${
    uiDensity === "compact" ? "!px-2.5 !py-1.5 !text-xs" : "!px-3 !py-2 !text-sm"
  }`;
  const profileActionMenuSeparatorClassName = PROFILE_ACTION_MENU_SEPARATOR_CLASS_NAME;
  const uiControlTextClass =
    uiFontSize === "small" ? "text-xs" : uiFontSize === "large" ? "text-sm" : "text-xs";
  const uiRadiusCardClass =
    uiRadius === "sharp" ? "rounded-md" : uiRadius === "rounded" ? "rounded-2xl" : "rounded-lg";
  const uiRadiusBubbleClass =
    uiRadius === "sharp" ? "rounded-md" : uiRadius === "rounded" ? "rounded-3xl" : "rounded-2xl";
  const unifiedSelectTriggerClassName =
    "rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 transition-colors hover:border-primary hover:bg-zinc-700 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary data-[state=open]:border-primary data-[state=open]:bg-zinc-700";
  const unifiedSelectContentClassName =
    "overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 p-1 text-zinc-100 shadow-xl";
  const unifiedSelectItemClassName =
    "rounded-md px-7 py-1.5 text-xs text-zinc-100 outline-none data-[highlighted]:bg-primary data-[highlighted]:text-zinc-50 data-[state=checked]:bg-primary data-[state=checked]:text-zinc-50";
  const getLanguageLabel = (value: string) => {
    if (value === "ru") {
      return t("russian");
    }
    if (value === "en") {
      return t("english");
    }
    return value;
  };
  const getThemeLabel = (value: string) => {
    if (value === "dark") {
      return t("themeDark");
    }
    if (value === "light") {
      return t("themeLight");
    }
    return value;
  };
  const getDensityLabel = (value: string) => {
    if (value === "comfortable") {
      return t("densityComfortable");
    }
    if (value === "compact") {
      return t("densityCompact");
    }
    return value;
  };
  const getFontSizeLabel = (value: string) => {
    if (value === "small") {
      return t("fontSizeSmall");
    }
    if (value === "default") {
      return t("fontSizeDefault");
    }
    if (value === "large") {
      return t("fontSizeLarge");
    }
    return value;
  };
  const getRadiusLabel = (value: string) => {
    if (value === "sharp") {
      return t("radiusSharp");
    }
    if (value === "normal") {
      return t("radiusNormal");
    }
    if (value === "rounded") {
      return t("radiusRounded");
    }
    return value;
  };
  const getFontFamilyLabel = (value: string) => {
    if (value === "default") {
      return t("fontFamilyDefault");
    }
    if (value === "modern") {
      return t("fontFamilyModern");
    }
    if (value === "readable") {
      return t("fontFamilyReadable");
    }
    if (value === "comfortaa") {
      return t("fontFamilyComfortaa");
    }
    return value;
  };
  const getChatWallpaperLabel = (value: string) => {
    if (value === "inherit") {
      return t("inheritGlobal");
    }
    if (value === "none") {
      return t("wallpaperNone");
    }
    if (value === "color-bends") {
      return t("wallpaperColorBends");
    }
    if (value === "pixel-blast") {
      return t("wallpaperPixelBlast");
    }
    if (value === "plasma") {
      return t("wallpaperPlasma");
    }
    if (value === "dither") {
      return t("wallpaperDither");
    }
    if (value === "gradient-blinds") {
      return t("wallpaperGradientBlinds");
    }
    return value;
  };
  const getChatFontSizeSettingLabel = (value: string) => {
    if (value === "inherit") {
      return t("inheritGlobal");
    }
    return getFontSizeLabel(value);
  };
  const adminDashboardLabel =
    language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦-Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°" : "Admin dashboard";

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
      <main
        className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${
          uiTheme === "light"
            ? "bg-[radial-gradient(circle_at_10%_8%,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_88%_0%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(160deg,#f8fbff_0%,#f2f6fd_56%,#eef3fb_100%)]"
            : "bg-[radial-gradient(circle_at_10%_8%,rgba(139,92,246,0.1),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(139,92,246,0.06),transparent_30%),linear-gradient(160deg,#0b0b0d_0%,#101014_55%,#141419_100%)]"
        } pt-[env(safe-area-inset-top)] text-zinc-100 ${mobileMainPaddingClass}`}
      >
      <section className="flex min-h-0 w-full flex-1">
        <div
          className={`relative flex h-full min-h-0 w-full overflow-hidden ${
            uiTheme === "light"
              ? "border-zinc-700/80 bg-zinc-900/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)] ring-1 ring-slate-300/70"
              : "border-zinc-800/90 bg-zinc-950/80 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.95)] ring-1 ring-black/40"
          } backdrop-blur-2xl`}
        >
          {isMainSidebarCollapsed ? null : (
            <aside className="hidden w-[82px] flex-col border-r border-zinc-800/90 bg-zinc-950/75 p-3 text-zinc-100 backdrop-blur-xl md:flex">
              <nav className="flex flex-1 flex-col gap-2">
                {renderableSidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeSidebar;

                  return (
                    <SidebarJellyButton
                      key={item.id}
                      active={active}
                      onActivate={() => activateSidebarItem(item.id)}
                      ariaLabel={t(item.id)}
                      title={t(item.id)}
                    >
                      <Icon className="size-4 shrink-0" />
                    </SidebarJellyButton>
                  );
                })}
              </nav>
              {isAdminAccount ? (
                <div className="pt-2">
                  <SidebarJellyButton
                    active={false}
                    onActivate={openAdminDashboard}
                    ariaLabel={adminDashboardLabel}
                    title={adminDashboardLabel}
                  >
                    <Shield className="size-4 shrink-0" />
                  </SidebarJellyButton>
                </div>
              ) : null}
            </aside>
          )}

          <div className="flex min-h-0 min-w-0 flex-1">
            {activeSidebar === "home" ? (
              <>
                <aside
              className={`${
                mobileView === "chat" ? "hidden" : "flex"
              } min-h-0 w-full flex-col border-r border-zinc-800/90 bg-zinc-950/75 backdrop-blur-xl md:flex md:w-[380px]`}
            >
              <div className="border-b border-zinc-700 px-5 py-5">
                <div className="mt-2 flex items-center justify-between gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                    {t("chats")}
                  </h1>
                  <Button
                    type="button"
                    onClick={openGroupCreationDialog}
                    aria-label={language === "ru" ? "Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В·Р В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ°" : "Create"}
                    title={language === "ru" ? "Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В·Р В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ°" : "Create"}
                    className="h-9 w-9 rounded-lg bg-primary p-0 text-zinc-50 hover:bg-primary/90 hover:text-zinc-50"
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
              <AlertDialog
                open={isCreateThreadTypeMenuOpen}
                onOpenChange={setIsCreateThreadTypeMenuOpen}
              >
                <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/95 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-zinc-100">
                      {language === "ru" ? "Р В Р’В Р вЂ™Р’В§Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р РЋРІР‚Сћ Р В Р Р‹Р В РЎвЂњР В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В·Р В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ°?" : "What do you want to create?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      {language === "ru"
                        ? "Р В Р’В Р Р†Р вЂљРІвЂћСћР В Р Р‹Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В±Р В Р’В Р вЂ™Р’ВµР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚ВР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’Вµ Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р РЋРІР‚ВР В Р’В Р РЋРІР‚вЂќ Р В Р Р‹Р Р†Р вЂљР Р‹Р В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В°"
                        : "Choose the chat type"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => startThreadCreation("channel")}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-left hover:border-zinc-600 hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2.5">
                        <MessageCircle className="size-4 text-primary" />
                        <span>
                          <span className="block text-sm font-medium text-zinc-100">
                            {language === "ru" ? "Р В Р’В Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В»" : "Channel"}
                          </span>
                          <span className="block text-xs text-zinc-500">
                            {language === "ru"
                              ? "Р В Р’В Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В»Р В Р Р‹Р В Р РЏ Р В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚СћР В Р’В Р В РІР‚В Р В Р’В Р РЋРІР‚СћР В Р Р‹Р В РЎвЂњР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’ВµР В Р’В Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р РЋРІР‚В Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В±Р В Р Р‹Р В РІР‚В°Р В Р Р‹Р В Р РЏР В Р’В Р В РІР‚В Р В Р’В Р вЂ™Р’В»Р В Р’В Р вЂ™Р’ВµР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р’В Р Р†РІР‚С›РІР‚вЂњ"
                              : "For updates and announcements"}
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-zinc-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startThreadCreation("group")}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-left hover:border-zinc-600 hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2.5">
                        <Users className="size-4 text-primary" />
                        <span>
                          <span className="block text-sm font-medium text-zinc-100">
                            {language === "ru" ? "Р В Р’В Р Р†Р вЂљРЎС™Р В Р Р‹Р В РІР‚С™Р В Р Р‹Р РЋРІР‚СљР В Р’В Р РЋРІР‚вЂќР В Р’В Р РЋРІР‚вЂќР В Р’В Р вЂ™Р’В°" : "Group"}
                          </span>
                          <span className="block text-xs text-zinc-500">
                            {language === "ru"
                              ? "Р В Р’В Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В»Р В Р Р‹Р В Р РЏ Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В±Р В Р Р‹Р Р†Р вЂљР’В°Р В Р’В Р вЂ™Р’ВµР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р Р‹Р В Р РЏ Р В Р Р‹Р РЋРІР‚СљР В Р Р‹Р Р†Р вЂљР Р‹Р В Р’В Р вЂ™Р’В°Р В Р Р‹Р В РЎвЂњР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚СћР В Р’В Р В РІР‚В "
                              : "For team conversations"}
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-zinc-500" />
                    </button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                      {t("cancel")}
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog open={isGroupMenuOpen} onOpenChange={handleGroupMenuOpenChange}>
                <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/95 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-xl">
                  <AlertDialogHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <AlertDialogTitle className="text-zinc-100">
                        {groupCreationKind === "channel"
                          ? language === "ru"
                            ? "Р В Р’В Р РЋРЎС™Р В Р’В Р РЋРІР‚СћР В Р’В Р В РІР‚В Р В Р Р‹Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р Р†РІР‚С›РІР‚вЂњ Р В Р’В Р РЋРІР‚СњР В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В»"
                            : "New channel"
                          : t("newGroup")}
                      </AlertDialogTitle>
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                        {groupCreationKind === "channel"
                          ? "1/1"
                          : groupCreationStep === "members"
                            ? "1/2"
                            : "2/2"}
                      </span>
                    </div>
                    <AlertDialogDescription className="text-zinc-400">
                      {groupCreationKind !== "channel" && groupCreationStep === "members"
                        ? `${t("groupMembers")}: ${groupMemberIdsDraft.length + 1}/${GROUP_MAX_MEMBERS}`
                        : `${
                            groupCreationKind === "channel" ? "Channel name" : t("groupName")
                          }: ${groupNameDraft.trim().replace(/\s+/g, " ").length}/${GROUP_TITLE_MAX_LENGTH}`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  {groupCreationKind !== "channel" && groupCreationStep === "members" ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                        {selectedGroupDraftMembers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedGroupDraftMembers.map((member) => (
                              <button
                                key={`group-picked-${member.id}`}
                                type="button"
                                onClick={() => toggleGroupMember(member.id)}
                                className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/15"
                              >
                                <span className="truncate">{member.name}</span>
                                <X className="size-3.5 shrink-0" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">{t("groupMembersOptionalHint")}</p>
                        )}
                      </div>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          value={groupMemberQueryDraft}
                          onChange={(event) => setGroupMemberQueryDraft(event.target.value)}
                          placeholder={t("searchChat")}
                          className="h-10 rounded-lg border-zinc-600 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="max-h-72 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                        {filteredGroupCandidates.length > 0 ? (
                          filteredGroupCandidates.map((user) => {
                            const selected = groupMemberIdsDraft.includes(user.id);
                            const initials = user.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() ?? "")
                              .join("");
                            return (
                              <button
                                key={`group-dialog-${user.id}`}
                                type="button"
                                onClick={() => toggleGroupMember(user.id)}
                                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left ${
                                  selected
                                    ? "border-primary/45 bg-zinc-700 text-zinc-100"
                                    : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  {user.avatarUrl ? (
                                    <span
                                      className="inline-flex size-8 shrink-0 rounded-full bg-zinc-700 bg-cover bg-center"
                                      style={{ backgroundImage: `url(${user.avatarUrl})` }}
                                      aria-label={`${user.name} avatar`}
                                    />
                                  ) : (
                                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold text-zinc-100">
                                      {initials || user.username.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm text-zinc-100">
                                      {user.name}
                                    </span>
                                    <span className="block truncate text-xs text-zinc-500">
                                      @{user.username}
                                    </span>
                                  </span>
                                </span>
                                {selected ? (
                                  <Check className="size-4 shrink-0 text-primary" />
                                ) : (
                                  <Plus className="size-4 shrink-0 text-zinc-500" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <p className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-500">
                            {t("noChatsOrUsersFound")}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        value={groupNameDraft}
                        maxLength={GROUP_TITLE_MAX_LENGTH}
                        onChange={(event) => setGroupNameDraft(event.target.value)}
                        placeholder={
                          groupCreationKind === "channel" ? "Channel name" : t("groupName")
                        }
                        className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-400"
                      />
                      {groupCreationKind === "channel" ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {t("groupUsernameLabel")}
                          </p>
                          <Input
                            value={groupCreationUsernameDraft}
                            onChange={(event) =>
                              setGroupCreationUsernameDraft(event.target.value)
                            }
                            className="mt-2 h-9 rounded-lg border-zinc-600 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500"
                            placeholder="my_channel"
                          />
                          <p className="mt-2 text-xs text-zinc-500">{t("groupUsernameHint")}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {`${t("groupMembers")} (${groupMemberIdsDraft.length + 1})`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200">
                              {currentUser.name} {t("youLabel")}
                            </span>
                            {selectedGroupDraftMembers.map((member) => (
                              <span
                                key={`group-member-preview-${member.id}`}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
                              >
                                {member.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <AlertDialogFooter className="gap-2">
                    {groupCreationKind !== "channel" && groupCreationStep === "members" ? (
                      <>
                        <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                          {t("cancel")}
                        </AlertDialogCancel>
                        <Button
                          type="button"
                          onClick={goToGroupDetailsStep}
                          className="h-10 rounded-lg bg-primary text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ" : "Next"}
                          <ArrowRight className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            if (groupCreationKind === "channel") {
                              setIsGroupMenuOpen(false);
                              resetGroupCreationDraft();
                              return;
                            }
                            setGroupCreationStep("members");
                          }}
                          className="h-10 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        >
                          {groupCreationKind === "channel" ? null : (
                            <ArrowLeft className="size-4" />
                          )}
                          {groupCreationKind === "channel" ? t("cancel") : "Back"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void createGroupChat()}
                          disabled={
                            isCreatingGroup ||
                            groupNameDraft.trim().replace(/\s+/g, " ").length <
                              GROUP_TITLE_MIN_LENGTH ||
                            groupNameDraft.trim().replace(/\s+/g, " ").length >
                              GROUP_TITLE_MAX_LENGTH ||
                            (groupCreationKind === "channel" &&
                              !isValidGroupUsername(
                                normalizeGroupUsername(groupCreationUsernameDraft)
                              )) ||
                            (groupCreationKind !== "channel" &&
                              groupMemberIdsDraft.length + 1 > GROUP_MAX_MEMBERS)
                          }
                          className="h-10 rounded-lg bg-primary text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {groupCreationKind === "channel"
                            ? language === "ru"
                              ? "Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В·Р В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ° Р В Р’В Р РЋРІР‚СњР В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В»"
                              : "Create channel"
                            : t("createGroup")}
                        </Button>
                      </>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div
                className={`flex-1 overflow-y-auto ${
                  uiDensity === "compact" ? "space-y-1 p-2" : "space-y-2 p-3"
                }`}
              >
                {filteredChats.map((chat) => {
                  const selected = chat.id === activeChat?.id;
                  const pinLimitReached =
                    !chat.isFavorites &&
                    !chat.isPinned &&
                    pinnedChatsCount >= MAX_PINNED_CHATS;
                  const chatDraftPreview = (draftsByChatId[chat.id] ?? "").trim();
                  return (
                    <ContextMenu key={chat.id}>
                      <ContextMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={() => openChat(chat.id)}
                          className={`w-full ${uiRadiusCardClass} border px-3 text-left ${
                            selected
                              ? "border-primary/35 bg-zinc-700 text-zinc-100"
                              : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700/90"
                          } ${uiDensity === "compact" ? "py-1.5" : "py-3"}`}
                        >
                          <div className={`flex items-center ${uiDensity === "compact" ? "gap-2" : "gap-3"}`}>
                            {chat.avatarUrl ? (
                              <span
                                className={`inline-flex shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center ${
                                  uiDensity === "compact" ? "size-8" : "size-10"
                                }`}
                                style={{ backgroundImage: `url(${chat.avatarUrl})` }}
                                aria-label={`${chat.name} avatar`}
                              />
                            ) : (
                              <span
                                className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white ${
                                  uiDensity === "compact" ? "size-8 text-xs" : "size-10 text-sm"
                                } ${chat.accent}`}
                              >
                                {chat.isGroup ? (
                                  chat.groupKind === "channel" ? (
                                    <MessageCircle className="size-4" />
                                  ) : (
                                    <Users className="size-4" />
                                  )
                                ) : chat.isFavorites ? (
                                  <Bookmark className="size-4" />
                                ) : (
                                  chat.name.slice(0, 2).toUpperCase()
                                )}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span
                                  className={`truncate font-medium ${
                                    uiFontSize === "small"
                                      ? "text-xs"
                                      : uiFontSize === "large"
                                        ? "text-base"
                                        : "text-sm"
                                  }`}
                                >
                                  {chat.name}
                                </span>
                                <span
                                  className={`text-xs ${
                                    selected ? "text-primary" : "text-zinc-500"
                                  }`}
                                >
                                  {chat.lastTime}
                                </span>
                              </span>
                              <span
                                className={`block truncate ${
                                  uiDensity === "compact" ? "mt-0.5" : "mt-1"
                                } ${
                                  uiFontSize === "small"
                                    ? "text-[11px]"
                                    : uiFontSize === "large"
                                      ? "text-sm"
                                      : "text-xs"
                                } ${
                                  selected ? "text-zinc-300" : "text-zinc-400"
                                }`}
                              >
                                {chatDraftPreview ? (
                                  <span className="text-amber-300">
                                    {`${t("draftLabel")}: ${chatDraftPreview}`}
                                  </span>
                                ) : (
                                  chat.lastMessage
                                )}
                              </span>
                            </span>
                            {chat.isPinned ? (
                              <PinFilledIcon className="size-4 shrink-0 text-primary" />
                            ) : null}
                            {chat.isMuted ? (
                              <BellOff className="size-4 shrink-0 text-zinc-400" />
                            ) : null}
                            {chat.unread > 0 ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-zinc-50">
                                {chat.unread}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent
                        className={chatActionMenuContentClassName}
                      >
                        {chat.isFavorites ? (
                          <>
                            <ContextMenuItem
                              className={chatActionMenuItemClassName}
                              onSelect={() => void setChatPinned(chat.id, !chat.isPinned)}
                            >
                              {chat.isPinned ? (
                                <PinOffIcon className="size-4" />
                              ) : (
                                <PinFilledIcon className="size-4" />
                              )}
                              {chat.isPinned ? t("unpinChat") : t("pinChat")}
                            </ContextMenuItem>
                            <ContextMenuSeparator
                              className={chatActionMenuSeparatorClassName}
                            />
                            <ContextMenuItem
                              className={chatActionMenuItemClassName}
                              onSelect={() => {
                                setChatIdToConfirmDelete(FAVORITES_CHAT_ID);
                                setIsDeleteChatDialogOpen(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                              {t("deleteFavoritesAction")}
                            </ContextMenuItem>
                          </>
                        ) : (
                          <>
                            <ContextMenuItem
                              className={chatActionMenuItemClassName}
                              onSelect={() => void setChatPinned(chat.id, !chat.isPinned)}
                              disabled={pinLimitReached}
                            >
                              {chat.isPinned ? (
                                <PinOffIcon className="size-4" />
                              ) : (
                                <PinFilledIcon className="size-4" />
                              )}
                              {chat.isPinned ? t("unpinChat") : t("pinChat")}
                            </ContextMenuItem>
                            <ContextMenuItem
                              className={chatActionMenuItemClassName}
                              onSelect={() => void setChatMuted(chat.id, !chat.isMuted)}
                            >
                              {chat.isMuted ? (
                                <Bell className="size-4" />
                              ) : (
                                <BellOff className="size-4" />
                              )}
                              {chat.isMuted ? t("unmuteChat") : t("muteChat")}
                            </ContextMenuItem>
                            <ContextMenuSeparator
                              className={chatActionMenuSeparatorClassName}
                            />
                            {chat.isGroup && !chat.isGroupCreator ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => void leaveGroup(chat.id)}
                              >
                                <LeaveGroupMenuIcon className="size-4" />
                                {t("leaveGroup")}
                              </ContextMenuItem>
                            ) : (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => {
                                  setChatIdToConfirmDelete(chat.id);
                                  setIsDeleteChatDialogOpen(true);
                                }}
                              >
                                <Trash2 className="size-4" />
                                {chat.isGroup ? t("deleteGroup") : t("deleteForBoth")}
                              </ContextMenuItem>
                            )}
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
                {query.trim().length > 0 &&
                (isLoadingPublicGroupSearch || publicGroupSearchResults.length > 0) ? (
                  <div className="pt-1">
                    <p className="px-1 pb-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
                      {t("publicGroups")}
                    </p>
                    {isLoadingPublicGroupSearch ? (
                      <p className="px-1 pb-2 text-xs text-zinc-500">...</p>
                    ) : null}
                    <div className="space-y-2">
                      {publicGroupSearchResults.map((group) => {
                        const isSelectedPreviewGroup =
                          activePublicGroupPreview?.username === group.username;
                        return (
                          <button
                            key={`public-group-search-${group.chatId}`}
                            type="button"
                            onClick={() => openPublicGroupPreview(group)}
                            className={`w-full ${uiRadiusCardClass} border px-3 text-left ${
                              isSelectedPreviewGroup
                                ? "border-primary/35 bg-zinc-700 text-zinc-100"
                                : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700/90"
                            } ${uiDensity === "compact" ? "py-2" : "py-3"}`}
                          >
                            <div
                              className={`flex items-center ${
                                uiDensity === "compact" ? "gap-2" : "gap-3"
                              }`}
                            >
                              {group.avatarUrl ? (
                                <span
                                  className={`inline-flex shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center ${
                                    uiDensity === "compact" ? "size-8" : "size-10"
                                  }`}
                                  style={{ backgroundImage: `url(${group.avatarUrl})` }}
                                  aria-label={`${group.title} avatar`}
                                />
                              ) : (
                                <span
                                  className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white ${
                                    uiDensity === "compact" ? "size-8 text-xs" : "size-10 text-sm"
                                  } ${pickAccent(`public-group-search:${group.chatId}`)}`}
                                >
                                  <Users className="size-4" />
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-zinc-100">
                                  {group.title}
                                </p>
                                <p className="truncate text-xs text-zinc-400">
                                  @{group.username} · {Math.max(1, group.memberCount)}{" "}
                                  {group.groupKind === "channel" ? t("subscribers") : t("members")}
                                </p>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
                          onClick={() => openUserPreview(user.id)}
                          className={`w-full ${uiRadiusCardClass} border border-zinc-700 bg-zinc-700 px-3 text-left hover:bg-zinc-600 ${
                            uiDensity === "compact" ? "py-2" : "py-3"
                          }`}
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
                {filteredChats.length === 0 &&
                availableUsers.length === 0 &&
                publicGroupSearchResults.length === 0 &&
                !isLoadingPublicGroupSearch ? (
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
                  } min-h-0 min-w-0 flex-1 flex-col bg-transparent md:flex ${activeChatFontClassName}`}
                  onTouchStart={handleMobileBackSwipeStart}
                  onTouchMove={handleMobileBackSwipeMove}
                  onTouchEnd={handleMobileBackSwipeEnd}
                  onTouchCancel={handleMobileBackSwipeEnd}
                >
              {activeChat ? (
                <>
                  <header
                    className={`flex cursor-pointer items-center border-b border-zinc-800/90 bg-zinc-950/70 backdrop-blur-xl ${
                      uiDensity === "compact"
                        ? "gap-2 px-3 py-2.5 sm:px-4"
                        : "gap-3 px-4 py-4 sm:px-6"
                    }`}
                    onClick={openActiveChatProfile}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 md:hidden ${
                        uiDensity === "compact" ? "h-8 w-8" : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setMobileView("list");
                      }}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div
                      className={`-ml-2 flex min-w-0 flex-1 items-center rounded-md text-left ${
                        uiDensity === "compact" ? "gap-2 p-0.5 pl-2" : "gap-3 p-1 pl-3"
                      }`}
                    >
                      {activeChat.avatarUrl ? (
                        <span
                          className={`inline-flex shrink-0 rounded-xl bg-zinc-700 bg-cover bg-center ${
                            uiDensity === "compact" ? "size-8" : "size-10"
                          }`}
                          style={{ backgroundImage: `url(${activeChat.avatarUrl})` }}
                          aria-label={`${activeChat.name} avatar`}
                        />
                      ) : (
                        <span
                          className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white ${
                            uiDensity === "compact" ? "size-8 text-xs" : "size-10 text-sm"
                          } ${activeChat.accent}`}
                        >
                          {activeChat.isGroup ? (
                            activeChat.groupKind === "channel" ? (
                              <MessageCircle className="size-4" />
                            ) : (
                              <Users className="size-4" />
                            )
                          ) : activeChat.isFavorites ? (
                            <Bookmark className="size-4" />
                          ) : (
                            activeChat.name.slice(0, 2).toUpperCase()
                          )}
                        </span>
                      )}
                      <span className="min-w-0">
                      <p
                        className={`truncate font-semibold text-zinc-100 ${
                          uiFontSize === "small"
                            ? "text-sm"
                            : uiFontSize === "large"
                              ? "text-lg"
                              : "text-base"
                        }`}
                      >
                        {activeChat.name}
                      </p>
                      <p
                        className={`${
                          uiFontSize === "small"
                            ? "text-[11px]"
                            : uiFontSize === "large"
                              ? "text-sm"
                              : "text-xs"
                        } ${
                          activeChat.isGroup
                            ? "text-zinc-500"
                            : "text-zinc-500"
                        }`}
                      >
                        {activeChatTypingText ||
                          (activeChat.isFavorites
                            ? t("savedMessages")
                            : activeChat.isGroup
                              ? `${Math.max(
                                  activeChat.groupKind === "channel" ? 1 : 2,
                                  activeChat.memberCount || activeChat.memberIds.length
                                )} ${activeChatAudienceLabel}`
                              : activeChatLastSeenText)}
                      </p>
                      </span>
                    </div>
                    <div
                      className={`flex items-center ${uiDensity === "compact" ? "gap-1.5" : "gap-2"}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("searchInChat")}
                        onClick={() => openActiveChatSearch()}
                        className={`border hover:text-zinc-100 ${uiDensity === "compact" ? "h-8 w-8" : ""} ${
                          isActiveChatSearchOpen
                            ? "border-primary/70 bg-primary/20 text-primary/80 hover:bg-primary/25"
                            : "border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                        }`}
                      >
                        <Search className="size-4" />
                      </Button>
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
                        className={`border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                          uiDensity === "compact" ? "h-8 w-8" : ""
                        }`}
                        title={t("call")}
                      >
                        {callChatMatchesActive ? (
                          <PhoneOff className="size-4" />
                        ) : (
                          <Phone className="size-4 fill-current" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("chatProfile")}
                        onClick={() => toggleActiveChatProfileSidebar()}
                        className={`hidden border hover:text-zinc-100 md:inline-flex ${uiDensity === "compact" ? "h-8 w-8" : ""} ${
                          isCompactActiveChatProfileSidebar
                            ? "border-primary/70 bg-primary/20 text-primary/80 hover:bg-primary/25"
                            : "border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                        }`}
                      >
                        <ChatProfileSidebarIcon className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("menu")}
                            className={`border border-zinc-700 bg-zinc-700 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 aria-expanded:border-zinc-600 aria-expanded:bg-zinc-600 aria-expanded:text-zinc-100 ${
                              uiDensity === "compact" ? "h-8 w-8" : ""
                            }`}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={chatActionMenuContentClassName}
                        >
                          <DropdownMenuItem
                            className={chatActionMenuItemClassName}
                            onSelect={() => setIsChatPersonalizationOpen(true)}
                            disabled={activeChat.isPreview}
                          >
                            <SettingsSidebarIcon className="size-4" />
                            {t("openChatPersonalization")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator
                            className={chatActionMenuSeparatorClassName}
                          />
                          <DropdownMenuItem
                            className={chatActionMenuItemClassName}
                            onSelect={() => clearHistoryForMe()}
                            disabled={activeChat.isPreview}
                          >
                            <Eraser className="size-4" />
                            {t("clearHistoryForMe")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={chatActionMenuItemClassName}
                            onSelect={() => {
                              if (!activeChat) {
                                return;
                              }
                              if (activeChat.isFavorites) {
                                setChatIdToConfirmDelete(FAVORITES_CHAT_ID);
                                setIsDeleteChatDialogOpen(true);
                                return;
                              }
                              if (activeChat.isPreview) {
                                return;
                              }
                              setChatIdToConfirmDelete(activeChat.id);
                              setIsDeleteChatDialogOpen(true);
                            }}
                            disabled={activeChat.isPreview}
                          >
                            <Trash2 className="size-4" />
                            {activeChat.isFavorites
                              ? t("deleteFavoritesAction")
                              : t("deleteChatAction")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>

                  {isActiveChatSearchOpen ? (
                    <div
                      className={`border-b border-zinc-800/90 bg-zinc-950/70 backdrop-blur-lg ${
                        uiDensity === "compact" ? "px-3 py-2 sm:px-4" : "px-4 py-3 sm:px-6"
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                          <Input
                            ref={activeChatSearchInputRef}
                            placeholder={t("searchInChat")}
                            className={`rounded-lg border-zinc-600 bg-zinc-700 pl-9 text-zinc-100 placeholder:text-zinc-400 ${
                              uiDensity === "compact" ? "h-9 text-sm" : "h-10"
                            }`}
                            value={activeChatSearchQuery}
                            onChange={(event) => setActiveChatSearchQuery(event.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            aria-label={t("date")}
                            className={`flex-1 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 sm:flex-none ${
                              uiDensity === "compact"
                                ? "h-9 text-sm sm:w-[150px]"
                                : "h-10 sm:w-[170px]"
                            }`}
                            value={activeChatJumpDate}
                            onChange={(event) => setActiveChatJumpDate(event.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={t("jumpToDate")}
                            className={`flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 sm:flex-none ${
                              uiDensity === "compact" ? "h-9" : "h-10"
                            }`}
                            onClick={() => jumpToDate()}
                          >
                            {t("jumpToDate")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("cancel")}
                            className={`shrink-0 rounded-lg border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 ${
                              uiDensity === "compact" ? "h-9 w-9" : "h-10 w-10"
                            }`}
                            onClick={() => {
                              setIsActiveChatSearchOpen(false);
                              setActiveChatSearchQuery("");
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-500">{t("searchAdvancedHint")}</p>
                    </div>
                  ) : null}

                  <div
                    className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
                    style={activeChatBackgroundStyle}
                  >
                    {activeChatEffectiveWallpaper === "color-bends" ? (
                      <div className="absolute inset-0 z-0">
                        <ColorBends className="h-full w-full" />
                      </div>
                    ) : null}
                    {activeChatEffectiveWallpaper === "pixel-blast" ? (
                      <div className="absolute inset-0 z-0">
                        <PixelBlast className="h-full w-full" />
                      </div>
                    ) : null}
                    {activeChatEffectiveWallpaper === "plasma" ? (
                      <div className="absolute inset-0 z-0">
                        <Plasma
                          className="h-full w-full"
                          color="#8e51ff"
                          speed={1}
                          scale={1}
                          opacity={1}
                          mouseInteractive={true}
                        />
                      </div>
                    ) : null}
                    {activeChatEffectiveWallpaper === "dither" ? (
                      <div className="absolute inset-0 z-0">
                        <Dither />
                      </div>
                    ) : null}
                    {activeChatEffectiveWallpaper === "gradient-blinds" ? (
                      <div className="absolute inset-0 z-0">
                        <GradientBlinds
                          className="h-full w-full"
                          gradientColors={["#09090b", "#1d4ed8", "#155e75"]}
                          angle={18}
                          noise={0.25}
                          blindMinWidth={34}
                          blindCount={20}
                        />
                      </div>
                    ) : null}
                    <div
                      ref={activeMessagesScrollRef}
                      className={`relative z-10 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500 sm:px-6 ${
                        uiDensity === "compact" ? "space-y-1.5 px-4 py-3" : "space-y-2 px-4 py-5"
                      }`}
                    >
                    {filteredActiveMessages.length === 0 ? (
                      <div className={`text-center text-sm text-zinc-500 ${uiDensity === "compact" ? "py-7" : "py-10"}`}>
                        {activeChatSearchQuery.trim().length > 0
                          ? t("noMessagesFound")
                          : t("noMessagesYet")}
                      </div>
                    ) : null}
                    {filteredActiveMessages.map((message, messageIndex) => {
                      const hasMessageText = message.text.trim().length > 0;
                      const firstAttachmentUrl = message.attachments[0]?.url ?? "";
                      const messageSourceChatId = getMessageSourceChatId(message);
                      const isMessageContentProtected =
                        isGroupContentProtectionEnabledByChatId(messageSourceChatId);
                      const previousVisibleMessage =
                        messageIndex > 0
                          ? filteredActiveMessages[messageIndex - 1]
                          : null;
                      const isFirstMessageInAuthorSequence =
                        previousVisibleMessage === null ||
                        previousVisibleMessage.authorId !== message.authorId;
                      const isGroupIncomingMessage =
                        activeChat.isGroup &&
                        !activeChat.isFavorites &&
                        message.author !== "me";
                      const isChannelMessage =
                        activeChat.isGroup && activeChat.groupKind === "channel";
                      const shouldShowIncomingAuthorIdentity =
                        isGroupIncomingMessage && !isChannelMessage;
                      const authorInitials = message.authorLabel
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("");
                      const authorFallbackInitials =
                        authorInitials ||
                        message.authorUsername.slice(0, 2).toUpperCase() ||
                        "?";
                      const canForwardMessage =
                        !isMessageContentProtected &&
                        (hasMessageText || message.attachments.length > 0);
                      const canCopyMessageText =
                        hasMessageText && !isMessageContentProtected;
                      const canCopyAttachmentLink =
                        Boolean(firstAttachmentUrl) && !isMessageContentProtected;
                      const canDeleteMessage =
                        message.author === "me" && !activeChat.isFavorites;
                      const canReplyToMessage = !activeChat.isFavorites;
                      const canReportMessage =
                        !activeChat.isFavorites &&
                        !activeChat.isPreview &&
                        message.author !== "me";
                      const canOpenMessageAuthorProfile =
                        shouldShowIncomingAuthorIdentity &&
                        isFirstMessageInAuthorSequence &&
                        Boolean(message.authorId) &&
                        message.authorId !== BUILT_IN_ASSISTANT_USER_ID;
                      const canOpenOriginalChat =
                        activeChat.isFavorites && Boolean(message.sourceChatId);
                      const canShowViewsMenu =
                        !activeChat.isFavorites &&
                        activeChat.isGroup &&
                        message.author === "me" &&
                        message.groupReadByCount > 0;
                      const hasPrimaryMessageContextActions =
                        canReplyToMessage || canOpenOriginalChat || canShowViewsMenu;
                      const hasForwardOrCopyMessageContextActions =
                        canForwardMessage ||
                        canCopyMessageText ||
                        canCopyAttachmentLink;
                      const hasActionsBeforeReportMessageContext =
                        hasPrimaryMessageContextActions ||
                        hasForwardOrCopyMessageContextActions;
                      const hasActionsBeforeDeleteMessageContext =
                        hasActionsBeforeReportMessageContext || canReportMessage;
                      const viewsMenuLabel =
                        language === "ru"
                          ? `${message.groupReadByCount} Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ`
                          : `${message.groupReadByCount} ${
                              message.groupReadByCount === 1 ? "view" : "views"
                            }`;
                      const reply = message.reply;
                      const shouldShowUnreadDivider =
                        unreadDividerMessageId === message.id &&
                        (activeChatSearchQuery.trim().length === 0 ||
                          filteredActiveMessages === activeMessages);

                      return (
                        <div key={message.id}>
                          {shouldShowUnreadDivider ? (
                            <div className="my-1 flex items-center gap-3 px-1">
                              <span className="h-px flex-1 bg-zinc-600/60" />
                              <span className="rounded-full border border-zinc-600 bg-zinc-900/85 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                                {t("unreadMessages")}
                              </span>
                              <span className="h-px flex-1 bg-zinc-600/60" />
                            </div>
                          ) : null}
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div
                                className={`flex ${
                                  message.author === "me" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`flex min-w-0 items-end ${
                                    shouldShowIncomingAuthorIdentity
                                      ? "max-w-[90%] gap-2 sm:max-w-[76%]"
                                      : "max-w-[85%] sm:max-w-[70%]"
                                  }`}
                                >
                                  {shouldShowIncomingAuthorIdentity ? (
                                    isFirstMessageInAuthorSequence ? (
                                      canOpenMessageAuthorProfile ? (
                                        <button
                                          type="button"
                                          onClick={() => openUserProfileFromChat(message.authorId)}
                                          className="mt-1 inline-flex shrink-0 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                                          aria-label={`${t("chatProfile")}: ${message.authorLabel}`}
                                          title={`${t("chatProfile")}: ${message.authorLabel}`}
                                        >
                                          {message.authorAvatarUrl ? (
                                            <span
                                              className={`inline-flex shrink-0 rounded-full bg-zinc-700 bg-cover bg-center ${
                                                uiDensity === "compact" ? "size-7" : "size-8"
                                              }`}
                                              style={{
                                                backgroundImage: `url(${message.authorAvatarUrl})`,
                                              }}
                                              aria-hidden="true"
                                            />
                                          ) : (
                                            <span
                                              className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-100 ${
                                                uiDensity === "compact"
                                                  ? "size-7 text-[10px]"
                                                  : "size-8 text-[11px]"
                                              }`}
                                            >
                                              {authorFallbackInitials}
                                            </span>
                                          )}
                                        </button>
                                      ) : message.authorAvatarUrl ? (
                                        <span
                                          className={`mt-1 inline-flex shrink-0 rounded-full bg-zinc-700 bg-cover bg-center ${
                                            uiDensity === "compact" ? "size-7" : "size-8"
                                          }`}
                                          style={{
                                            backgroundImage: `url(${message.authorAvatarUrl})`,
                                          }}
                                          aria-label={`${message.authorLabel} avatar`}
                                        />
                                      ) : (
                                        <span
                                          className={`mt-1 inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-100 ${
                                            uiDensity === "compact"
                                              ? "size-7 text-[10px]"
                                              : "size-8 text-[11px]"
                                          }`}
                                        >
                                          {authorFallbackInitials}
                                        </span>
                                      )
                                    ) : (
                                      <span
                                        className={`inline-flex shrink-0 ${
                                          uiDensity === "compact" ? "size-7" : "size-8"
                                        }`}
                                        aria-hidden="true"
                                      />
                                    )
                                  ) : null}
                                <div
                                  ref={(node) => {
                                    messageNodeRefs.current.set(message.id, node);
                                  }}
                                  onCopy={
                                    isMessageContentProtected
                                      ? (event) => {
                                          event.preventDefault();
                                          showGroupContentProtectionBlockedToast();
                                        }
                                      : undefined
                                  }
                                  onCut={
                                    isMessageContentProtected
                                      ? (event) => {
                                          event.preventDefault();
                                          showGroupContentProtectionBlockedToast();
                                        }
                                      : undefined
                                  }
                                  className={`${shouldShowIncomingAuthorIdentity ? "min-w-0 flex-1" : ""} ${uiRadiusBubbleClass} ring-1 ring-white/5 shadow-[0_8px_22px_-14px_rgba(0,0,0,0.7)] ${
                                    uiDensity === "compact" ? "px-3 py-1.5" : "px-4 py-2"
                                  } ${
                                    animatingMessageIds.has(message.id)
                                      ? "clore-message-appear-once"
                                    : ""
                                  } ${
                                    highlightedMessageId === message.id
                                      ? "clore-message-target-highlight"
                                      : ""
                                  } ${
                                    message.author === "me"
                                      ? "bg-primary text-zinc-50"
                                      : "border border-zinc-600 bg-zinc-700 text-zinc-100"
                                  } ${isMessageContentProtected ? "select-none" : ""}`}
                                >
                                {shouldShowIncomingAuthorIdentity &&
                                isFirstMessageInAuthorSequence ? (
                                  <p className="mb-1 truncate text-[11px] font-semibold leading-tight text-primary/90">
                                    {message.authorLabel}
                                  </p>
                                ) : null}
                                {activeChat.isFavorites && message.sourceChatId ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openFavoriteSourceMessage(message.sourceChatId ?? "", message.id)
                                    }
                                    className={`mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-left text-[11px] font-medium ${
                                      message.author === "me"
                                        ? "border-white/35 bg-white/10 text-white/90"
                                        : "border-zinc-500/40 bg-zinc-800/70 text-zinc-200"
                                    }`}
                                  >
                                    <Bookmark className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {`${t("fromChat")}: ${message.sourceChatName}`}
                                    </span>
                                  </button>
                                ) : null}
                                {reply ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (reply.missing) {
                                        return;
                                      }
                                      focusReplyTargetMessage(reply.targetMessageId);
                                    }}
                                    className={`mb-2 rounded-lg border-l-2 px-2 py-1 ${
                                      message.author === "me"
                                        ? "border-white/60 bg-white/10"
                                        : "border-primary/70 bg-zinc-800/70"
                                    } ${
                                      reply.missing
                                        ? "cursor-default opacity-80"
                                        : "cursor-pointer hover:bg-zinc-800/85"
                                    }`}
                                  >
                                    <p className="truncate text-[11px] font-medium">
                                      {reply.missing
                                        ? t("originalMessageUnavailable")
                                        : reply.authorLabel}
                                    </p>
                                    {!reply.missing ? (
                                      <p className="truncate text-xs opacity-85">
                                        {reply.previewText}
                                      </p>
                                    ) : null}
                                  </button>
                                ) : null}
                                {message.text ? <div>{renderFormattedMessageText(message.text)}</div> : null}
                                {message.attachments.length > 0 ? (
                                  <div className={`${message.text ? "mt-2" : ""} space-y-2`}>
                                    {message.attachments.map((attachment) => {
                                      if (attachment.kind === "image" || attachment.kind === "video") {
                                        const shouldLoadMedia =
                                          activeChatAutoLoadMediaEnabled ||
                                          message.author === "me" ||
                                          manuallyLoadedMediaIds.has(attachment.id);
                                        if (!shouldLoadMedia) {
                                          return (
                                            <button
                                              key={attachment.id}
                                              type="button"
                                              onClick={() =>
                                                setManuallyLoadedMediaIds((prev) => {
                                                  const next = new Set(prev);
                                                  next.add(attachment.id);
                                                  return next;
                                                })
                                              }
                                              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                                message.author === "me"
                                                  ? "border-white/35 bg-white/10"
                                                  : "border-zinc-500/40 bg-zinc-800/70"
                                              }`}
                                            >
                                              <span className="truncate">{attachment.name}</span>
                                              <span className="ml-3 shrink-0 text-xs text-zinc-300">
                                                {t("loadMedia")}
                                              </span>
                                            </button>
                                          );
                                        }
                                        if (attachment.kind === "image") {
                                          return (
                                            <button
                                              key={attachment.id}
                                              type="button"
                                              onClick={() => openImageViewer(attachment.id)}
                                              onContextMenu={
                                                isMessageContentProtected
                                                  ? (event) => {
                                                      event.preventDefault();
                                                      showGroupContentProtectionBlockedToast();
                                                    }
                                                  : undefined
                                              }
                                              className="block overflow-hidden rounded-lg border border-zinc-400/30 bg-black/10"
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="max-h-64 w-full cursor-zoom-in object-cover"
                                                draggable={!isMessageContentProtected}
                                              />
                                            </button>
                                          );
                                        }
                                        return (
                                          <video
                                            key={attachment.id}
                                            controls
                                            className="max-h-64 w-full rounded-lg border border-zinc-400/30 bg-black/30"
                                            src={attachment.url}
                                            controlsList={
                                              isMessageContentProtected ? "nodownload" : undefined
                                            }
                                            onContextMenu={
                                              isMessageContentProtected
                                                ? (event) => {
                                                    event.preventDefault();
                                                    showGroupContentProtectionBlockedToast();
                                                  }
                                                : undefined
                                            }
                                          />
                                        );
                                      }
                                      if (attachment.kind === "audio") {
                                        return (
                                          <AudioAttachmentPlayer
                                            key={attachment.id}
                                            src={attachment.url}
                                            disableDownload={isMessageContentProtected}
                                            onBlockedAction={showGroupContentProtectionBlockedToast}
                                          />
                                        );
                                      }
                                      if (isMessageContentProtected) {
                                        return (
                                          <button
                                            key={attachment.id}
                                            type="button"
                                            onClick={showGroupContentProtectionBlockedToast}
                                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                              message.author === "me"
                                                ? "border-white/35 bg-white/10"
                                                : "border-zinc-500/40 bg-zinc-800/70"
                                            }`}
                                          >
                                            <span className="truncate">{attachment.name}</span>
                                            <span
                                              className={`ml-3 shrink-0 text-xs ${
                                                message.author === "me"
                                                  ? "text-white/80"
                                                  : "text-zinc-400"
                                              }`}
                                            >
                                              {formatFileSize(attachment.size)}
                                            </span>
                                          </button>
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
                                              ? "border-white/35 bg-white/10"
                                              : "border-zinc-500/40 bg-zinc-800/70"
                                          }`}
                                        >
                                          <span className="truncate">{attachment.name}</span>
                                          <span
                                            className={`ml-3 shrink-0 text-xs ${
                                              message.author === "me"
                                                ? "text-white/80"
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
                                      ? "justify-end text-white/80"
                                      : "justify-end text-zinc-500"
                                  }`}
                                >
                                  {message.isEdited ? (
                                    <span className="opacity-80">{t("editedLabel")}</span>
                                  ) : null}
                                  {message.isScheduledPending ? (
                                    <span className="inline-flex items-center gap-1 opacity-85">
                                      <Clock3 className="size-3" />
                                      {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›" : "scheduled"}
                                    </span>
                                  ) : null}
                                  <span>{message.time}</span>
                                  {!activeChat.isFavorites &&
                                  message.author === "me" &&
                                  !message.isScheduledPending ? (
                                    activeChat.isGroup ? (
                                      message.groupReadByCount > 0 ? (
                                        <CheckCheck className="size-3 text-white/90" />
                                      ) : (
                                        <Check className="size-3" />
                                      )
                                    ) : message.isReadByPeer ? (
                                      <CheckCheck className="size-3 text-white/90" />
                                    ) : (
                                      <Check className="size-3" />
                                    )
                                  ) : null}
                                </div>
                                </div>
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent
                              className={chatActionMenuContentClassName}
                            >
                            {canReplyToMessage ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => startReplyToMessage(message.id)}
                              >
                                <CornerUpLeft className="size-4" />
                                {t("replyToMessage")}
                              </ContextMenuItem>
                            ) : null}
                            {canOpenOriginalChat ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => {
                                  if (!message.sourceChatId) {
                                    return;
                                  }
                                  openFavoriteSourceMessage(message.sourceChatId, message.id);
                                }}
                              >
                                <ArrowRight className="size-4" />
                                {t("openOriginalChat")}
                              </ContextMenuItem>
                            ) : null}
                            {canShowViewsMenu &&
                            (canReplyToMessage || canOpenOriginalChat) ? (
                              <ContextMenuSeparator
                                className={chatActionMenuSeparatorClassName}
                              />
                            ) : null}
                            {canShowViewsMenu ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() =>
                                  setMessageViewsDialog({
                                    count: message.groupReadByCount,
                                    labels: message.groupReadByLabels,
                                  })
                                }
                              >
                                <ViewsEyeIcon className="size-4" />
                                {viewsMenuLabel}
                              </ContextMenuItem>
                            ) : null}
                            {hasPrimaryMessageContextActions &&
                            hasForwardOrCopyMessageContextActions ? (
                              <ContextMenuSeparator
                                className={chatActionMenuSeparatorClassName}
                              />
                            ) : null}
                            {canForwardMessage ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => openForwardMessageDialog(message)}
                              >
                                <ForwardUpIcon className="size-4" />
                                {t("forwardMessageAction")}
                              </ContextMenuItem>
                            ) : null}
                            {canForwardMessage &&
                            (canCopyMessageText || canCopyAttachmentLink) ? (
                              <ContextMenuSeparator
                                className={chatActionMenuSeparatorClassName}
                              />
                            ) : null}
                            {canCopyMessageText ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => void copyToClipboard(message.text)}
                              >
                                <Copy className="size-4" />
                                {t("copyText")}
                              </ContextMenuItem>
                            ) : null}
                            {canCopyAttachmentLink ? (
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => void copyToClipboard(firstAttachmentUrl)}
                              >
                                <Copy className="size-4" />
                                {t("copyAttachmentLink")}
                              </ContextMenuItem>
                            ) : null}
                            {canReportMessage ? (
                              <>
                                {hasActionsBeforeReportMessageContext ? (
                                  <ContextMenuSeparator
                                    className={chatActionMenuSeparatorClassName}
                                  />
                                ) : null}
                                <ContextMenuItem
                                  className={chatActionMenuItemClassName}
                                  onSelect={() => void reportMessage(message)}
                                >
                                  <List className="size-4" />
                                  {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ" : "Report message"}
                                </ContextMenuItem>
                              </>
                            ) : null}
                            {canDeleteMessage ? (
                              <>
                                {hasActionsBeforeDeleteMessageContext ? (
                                  <ContextMenuSeparator
                                    className={chatActionMenuSeparatorClassName}
                                  />
                                ) : null}
                                <ContextMenuItem
                                  className={chatActionMenuItemClassName}
                                  onSelect={() => startEditingMessage(message.id)}
                                >
                                  <Pencil className="size-4" />
                                  {t("editMessage")}
                                </ContextMenuItem>
                                <ContextMenuSeparator
                                  className={chatActionMenuSeparatorClassName}
                                />
                                <ContextMenuItem
                                  className={chatActionMenuItemClassName}
                                  onSelect={() => void deleteMessage(message.id)}
                                >
                                  <Trash2 className="size-4" />
                                  {t("deleteMessage")}
                                </ContextMenuItem>
                              </>
                            ) : null}
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                      );
                    })}
                  </div>

                  <form
                    className={`relative z-10 bg-transparent ${
                      uiDensity === "compact" ? "p-2 sm:p-3" : "p-3 sm:p-4"
                    }`}
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    {editingTargetMessage ? (
                      <div
                        className={`mb-2 flex items-start justify-between gap-3 rounded-lg border border-zinc-600 bg-zinc-700/70 ${
                          uiDensity === "compact" ? "px-2.5 py-1.5" : "px-3 py-2"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-primary">
                            {t("editingMessage")}
                          </p>
                          <p className="truncate text-xs text-zinc-200">
                            {editingTargetMessage.text.trim() ||
                              (editingTargetMessage.attachments.length > 0
                                ? t("attachment")
                                : t("noMessagesYet"))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("cancelEdit")}
                          className="h-6 w-6 shrink-0 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                          onClick={() => {
                            setEditingMessageId(null);
                            setDraft("");
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                    {replyTargetMessage && !editingTargetMessage ? (
                      <div
                        className={`mb-2 flex items-start justify-between gap-3 rounded-lg border border-zinc-600 bg-zinc-700/70 ${
                          uiDensity === "compact" ? "px-2.5 py-1.5" : "px-3 py-2"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-primary">
                            {t("replyingTo")}{" "}
                            {replyTargetMessage.authorLabel}
                          </p>
                          <p className="truncate text-xs text-zinc-200">
                            {replyTargetMessage.text.trim() ||
                              (replyTargetMessage.attachments.length > 0
                                ? t("attachment")
                                : t("noMessagesYet"))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("cancelReply")}
                          className="h-6 w-6 shrink-0 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                          onClick={() => setReplyToMessageId(null)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                    {scheduledSendAt && !editingTargetMessage ? (
                      <div
                        className={`mb-2 flex items-start justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 ${
                          uiDensity === "compact" ? "px-2.5 py-1.5" : "px-3 py-2"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <Clock3 className="size-3.5" />
                            {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›" : "Scheduled"}
                          </p>
                          <p className="truncate text-xs text-zinc-200">
                            {formatAbsoluteDateTime(scheduledSendAt, language)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В° Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В¶Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРІвЂћвЂ“ Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™" : "Clear schedule"}
                          className="h-6 w-6 shrink-0 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                          onClick={clearScheduledSend}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                    <Drawer
                      open={isSchedulePickerOpen && !editingTargetMessage}
                      onOpenChange={(open) => {
                        setIsSchedulePickerOpen(open);
                      }}
                    >
                      <DrawerContent className="border-zinc-800/90 bg-zinc-950/95 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
                        <DrawerHeader className="text-left">
                          <DrawerTitle className="text-zinc-100">
                            {language === "ru" ? "Р В Р’В Р РЋРІР‚С”Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р РЋРІР‚вЂќР В Р Р‹Р В РІР‚С™Р В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В Р В Р’В Р РЋРІР‚ВР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ° Р В Р’В Р РЋРІР‚вЂќР В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В·Р В Р’В Р вЂ™Р’В¶Р В Р’В Р вЂ™Р’Вµ" : "Send later"}
                          </DrawerTitle>
                          <DrawerDescription className="text-zinc-400">
                            {language === "ru"
                              ? "Р В Р’В Р Р†Р вЂљРІвЂћСћР В Р Р‹Р Р†Р вЂљРІвЂћвЂ“Р В Р’В Р вЂ™Р’В±Р В Р’В Р вЂ™Р’ВµР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚ВР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’Вµ Р В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРІР‚Сљ Р В Р’В Р РЋРІР‚В Р В Р’В Р В РІР‚В Р В Р Р‹Р В РІР‚С™Р В Р’В Р вЂ™Р’ВµР В Р’В Р РЋР’ВР В Р Р‹Р В Р РЏ Р В Р’В Р РЋРІР‚СћР В Р Р‹Р Р†Р вЂљРЎв„ўР В Р’В Р РЋРІР‚вЂќР В Р Р‹Р В РІР‚С™Р В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В Р В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚В."
                              : "Choose a date and time to send."}
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-2">
                          <div className="mx-auto w-fit rounded-lg border border-zinc-600 bg-zinc-800/85 p-1">
                            <Calendar
                              mode="single"
                              selected={schedulePickerDate}
                              onSelect={(date) => setSchedulePickerDate(date ?? undefined)}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date.getTime() < today.getTime();
                              }}
                              className="rounded-md bg-transparent p-0 text-zinc-100 [--cell-size:--spacing(6)]"
                            />
                          </div>
                          <div className="mx-auto mt-3 flex w-full max-w-[300px] flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={schedulePickerHour}
                                onValueChange={(value) => {
                                  if (value !== null) {
                                    setSchedulePickerHour(value);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 w-full border-zinc-600 bg-zinc-800 text-zinc-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                  portalled={false}
                                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                                >
                                  {SCHEDULE_HOUR_OPTIONS.map((hour) => (
                                    <SelectItem key={`schedule-hour-${hour}`} value={hour}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={schedulePickerMinute}
                                onValueChange={(value) => {
                                  if (value !== null) {
                                    setSchedulePickerMinute(value);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 w-full border-zinc-600 bg-zinc-800 text-zinc-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                  portalled={false}
                                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                                >
                                  {SCHEDULE_MINUTE_OPTIONS.map((minute) => (
                                    <SelectItem key={`schedule-minute-${minute}`} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <DrawerFooter>
                          <Button
                            type="button"
                            className="h-9 rounded-md bg-primary px-3 text-zinc-50 hover:bg-primary/90"
                            onClick={applySchedulePickerValue}
                          >
                            {language === "ru" ? "Р В Р’В Р Р†Р вЂљРІР‚СњР В Р’В Р вЂ™Р’В°Р В Р’В Р РЋРІР‚вЂќР В Р’В Р вЂ™Р’В»Р В Р’В Р вЂ™Р’В°Р В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р В РІР‚В Р В Р’В Р вЂ™Р’В°Р В Р Р‹Р Р†Р вЂљРЎв„ўР В Р Р‹Р В Р вЂ°" : "Schedule"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-zinc-200 hover:bg-zinc-700"
                            onClick={() => setIsSchedulePickerOpen(false)}
                          >
                            {t("cancel")}
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                    {pendingAttachments.length > 0 && !editingTargetMessage ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {pendingAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-600 bg-zinc-700 px-3 py-1 text-xs text-zinc-100"
                          >
                            <span className="truncate">
                              {attachment.kind === "audio"
                                ? t("voiceMessage")
                                : attachment.size > 0
                                  ? `${attachment.name} - ${formatFileSize(attachment.size)}`
                                  : attachment.name}
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
                    <div
                      ref={emojiMenuRef}
                      className={`relative ${uiRadiusCardClass} bg-zinc-900/50 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.95)] ring-1 ring-zinc-700/60 backdrop-blur-md ${
                        uiDensity === "compact" ? "p-1.5" : "p-2"
                      }`}
                    >
                      {formattingMenuPosition ? (
                        <div
                          className="absolute z-50 w-fit -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-800/90 bg-zinc-950/85 p-1.5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl"
                          style={{
                            left: formattingMenuPosition.x,
                            top: formattingMenuPosition.y,
                          }}
                        >
                          <div className="mb-1 px-1 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                            {t("formattingHint")}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {ORDERED_FORMATTING_ACTIONS.map((action) => {
                              const control = formattingControls[action];
                              const Icon = control.icon;
                              return (
                                <Button
                                  key={action}
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={control.label}
                                  title={control.label}
                                  className="h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:border-primary hover:bg-zinc-700 hover:text-primary"
                                  onClick={() => {
                                    applyFormattingToDraft(action);
                                    setFormattingMenuPosition(null);
                                  }}
                                >
                                  <Icon className="size-3.5" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      {isActivePublicGroupPreview ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-2">
                          <p className="text-xs text-zinc-300">
                            {activeChat?.groupKind === "channel"
                              ? "Join this channel to send messages."
                              : t("joinGroupToWrite")}
                          </p>
                          <Button
                            type="button"
                            className="h-8 rounded-lg bg-primary px-3 text-xs text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() =>
                              void joinPublicGroupByUsername(activeChat?.groupUsername ?? "")
                            }
                            disabled={isJoiningPreviewGroup}
                          >
                            {isJoiningPreviewGroup
                              ? t("joiningGroup")
                              : t("joinGroupAction")}
                          </Button>
                        </div>
                      ) : isActiveChannelReadOnly ? (
                        <div className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-2">
                          <MessageCircle className="size-4 shrink-0 text-zinc-400" />
                          <p className="text-xs text-zinc-300">
                            {t("channelReadOnlyPlaceholder")}
                          </p>
                        </div>
                      ) : isVoiceRecording ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Mic className="size-4 shrink-0 text-red-300" />
                            <p className="truncate text-xs font-medium text-red-100">
                              {`${t("recordingVoice")} ${formatCallDuration(voiceRecordingSeconds)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("stopVoiceRecording")}
                              title={t("stopVoiceRecording")}
                              className="h-8 w-8 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                              onClick={() => stopVoiceRecording()}
                            >
                              <Square className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div ref={composerRef} className="relative flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("attachFiles")}
                            title={t("attachFiles")}
                            disabled={Boolean(editingTargetMessage)}
                            className={`shrink-0 border border-zinc-600 bg-zinc-700 text-zinc-200 hover:border-primary hover:bg-zinc-600 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                              uiDensity === "compact" ? "h-9 w-9" : "h-11 w-11"
                            }`}
                            onClick={openAttachmentPicker}
                          >
                            <Plus className="size-4" />
                          </Button>
                          <div className="relative flex-1">
                            <div
                              className={`absolute bottom-12 right-0 z-50 w-[min(360px,calc(100vw-3rem))] rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl transition-all duration-150 ${
                                isEmojiMenuOpen
                                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                                  : "pointer-events-none translate-y-2 scale-95 opacity-0"
                              }`}
                              onMouseEnter={openEmojiMenu}
                              onMouseLeave={scheduleCloseEmojiMenu}
                            >
                              <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500">
                                <div className="grid grid-cols-8 gap-1">
                                  {hoverMenuEmojis.map((emoji, index) => (
                                    <button
                                      key={`${emoji}-${index}`}
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
                            <Textarea
                              ref={messageInputRef}
                              placeholder={t("typeMessage")}
                              value={draft}
                              onChange={(event) => setDraft(event.target.value)}
                              onContextMenu={openFormattingMenuFromContext}
                              onKeyDown={(event) => {
                                setFormattingMenuPosition(null);
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  sendMessage();
                                }
                              }}
                              className={`max-h-36 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400 ${
                                uiDensity === "compact"
                                  ? "min-h-[38px] py-1.5 pr-10 text-sm"
                                  : "min-h-[44px] py-2 pr-12"
                              }`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Emoji"
                              title="Emoji"
                              aria-expanded={isEmojiSidebarOpen || isEmojiMenuOpen}
                              className={`absolute top-1/2 -translate-y-1/2 rounded-md border-0 bg-transparent p-0 text-zinc-300 shadow-none hover:bg-transparent hover:text-primary focus-visible:ring-0 ${
                                uiDensity === "compact" ? "right-1.5 h-6 w-6" : "right-2 h-7 w-7"
                              }`}
                              onClick={toggleEmojiSidebar}
                              onMouseEnter={openEmojiMenu}
                              onMouseLeave={scheduleCloseEmojiMenu}
                            >
                              <Smile className="size-4" />
                            </Button>
                          </div>
                          {!editingTargetMessage &&
                          draft.trim().length === 0 &&
                          pendingAttachments.length === 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("startVoiceRecording")}
                              title={t("startVoiceRecording")}
                              className={`shrink-0 border border-zinc-600 bg-zinc-700 text-zinc-200 hover:border-primary hover:bg-zinc-600 hover:text-primary ${
                                uiDensity === "compact" ? "h-9 w-9" : "h-11 w-11"
                              }`}
                              onClick={toggleVoiceRecording}
                            >
                              <Mic className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              aria-label={editingTargetMessage ? t("saveEdit") : t("send")}
                              title={editingTargetMessage ? t("saveEdit") : t("send")}
                              className={`shrink-0 rounded-lg bg-primary p-0 text-zinc-50 hover:bg-primary/90 ${
                                uiDensity === "compact" ? "h-9 w-9" : "h-11 w-11"
                              }`}
                              onContextMenu={(event) => {
                                if (editingTargetMessage) {
                                  return;
                                }
                                event.preventDefault();
                                if (isSchedulePickerOpen) {
                                  setIsSchedulePickerOpen(false);
                                  return;
                                }
                                openSchedulePicker();
                              }}
                              disabled={
                                editingTargetMessage
                                  ? (draft.trim().length === 0 &&
                                      editingTargetMessage.attachments.length === 0) ||
                                    draft.trim() === editingTargetMessage.text.trim()
                                  : draft.trim().length === 0 &&
                                    pendingAttachments.length === 0
                              }
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-zinc-500">{t("selectChat")}</p>
                </div>
              )}
                </div>
              </>
            ) : null}
            {shouldShowEmojiSidebar ? (
              <div
                className={`hidden w-[360px] max-w-[42vw] shrink-0 border-l border-zinc-800/90 lg:flex lg:flex-col ${
                  uiTheme === "light"
                    ? "bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_0%,rgba(241,245,249,0.88)_100%)]"
                    : "bg-[linear-gradient(180deg,rgba(39,39,42,0.62)_0%,rgba(24,24,27,0.5)_100%)]"
                } backdrop-blur-xl`}
              >
                <div className="flex items-center justify-between border-b border-zinc-800/90 px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-zinc-100">Emoji</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("closeViewer")}
                    onClick={() => setIsEmojiSidebarOpen(false)}
                    className="h-8 w-8 rounded-md border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="mb-2 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                    {CHAT_EMOJI_CATEGORIES.map((category) => (
                      <button
                        key={`emoji-category-tab-sidebar-${category.id}`}
                        type="button"
                        onClick={() => scrollToEmojiCategory(category.id)}
                        className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                          activeEmojiCategory === category.id
                            ? "border-primary/60 bg-primary/20 text-primary"
                            : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                  <div
                    ref={emojiScrollContainerRef}
                    onScroll={syncActiveEmojiCategoryWithScroll}
                    className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500"
                  >
                    <div className="space-y-2">
                      {CHAT_EMOJI_CATEGORIES.map((category) => (
                        <section
                          key={`emoji-category-section-sidebar-${category.id}`}
                          ref={(element) => {
                            emojiCategorySectionRefs.current.set(category.id, element);
                          }}
                          className="space-y-1"
                        >
                          <p className="sticky top-0 z-10 rounded bg-zinc-950/90 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 backdrop-blur">
                            {category.label}
                          </p>
                          <div className="grid grid-cols-8 gap-1 pb-1">
                            {category.emojis.map((emoji, index) => (
                              <button
                                key={`${category.id}-${emoji}-${index}`}
                                type="button"
                                onClick={() => insertEmojiToDraft(emoji)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-zinc-700"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {AI_FEATURE_ENABLED && activeSidebar === "assistant" ? (
              <div
                className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                  uiTheme === "light"
                    ? "bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,#f8fbff_0%,#eef4fc_100%)]"
                    : "bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,0.14),transparent_36%),linear-gradient(180deg,#09090b_0%,#101015_100%)]"
                }`}
              >
                <div
                  ref={aiMessagesScrollRef}
                  className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5"
                >
                  {aiMessages.length === 0 ? (
                    <div className="pb-6 pt-2 text-center">
                      <p className="text-xs text-zinc-500">{t("aiAssistantEmptyHint")}</p>
                    </div>
                  ) : (
                    <div className="flex w-full flex-col gap-2.5 pb-6">
                      {aiMessages.map((message) => (
                        <ContextMenu key={message.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[94%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-[0_14px_30px_-24px_rgba(0,0,0,0.9)] sm:max-w-[82%] ${
                                  message.role === "user"
                                    ? "border-primary/35 bg-primary/90 text-zinc-50"
                                    : message.error
                                      ? "border-red-500/35 bg-red-500/10 text-red-100"
                                      : "border-zinc-700/90 bg-zinc-900/90 text-zinc-100"
                                }`}
                              >
                                {renderFormattedMessageText(message.content)}
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          {!message.pending && message.content.trim().length > 0 ? (
                            <ContextMenuContent className={chatActionMenuContentClassName}>
                              <ContextMenuItem
                                className={chatActionMenuItemClassName}
                                onSelect={() => void copyToClipboard(message.content)}
                              >
                                <Copy className="size-4" />
                                {t("copyText")}
                              </ContextMenuItem>
                            </ContextMenuContent>
                          ) : null}
                        </ContextMenu>
                      ))}
                    </div>
                  )}
                </div>
                <form
                  className="px-3 py-3 sm:px-6 sm:py-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendAiPrompt();
                  }}
                >
                  <div className="w-full">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300">
                          <Search className="size-3.5 text-zinc-400" />
                          <span className="font-medium text-zinc-200">
                            {t("aiAssistantSearchMode")}
                          </span>
                          <Switch
                            checked={aiSearchEnabled}
                            onCheckedChange={setAiSearchEnabled}
                            aria-label={t("aiAssistantSearchHint")}
                            size="sm"
                          />
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300">
                          <Shield className="size-3.5 text-zinc-400" />
                          <span className="font-medium text-zinc-200">
                            {t("aiAssistantAgentMode")}
                          </span>
                          <Switch
                            checked={aiAgentEnabled}
                            onCheckedChange={handleAiAgentToggle}
                            aria-label={t("aiAssistantAgentModeHint")}
                            size="sm"
                          />
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAiConversation}
                        disabled={isAiSubmitting || (aiMessages.length === 0 && !aiError)}
                        className="h-8 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("aiAssistantClear")}
                      </Button>
                    </div>
                    {aiError ? (
                      <p className="mb-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                        {aiError}
                      </p>
                    ) : null}
                    <div className="flex items-end gap-2 rounded-2xl border border-zinc-700/90 bg-zinc-950/90 p-2 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.95)]">
                      <Textarea
                        value={aiDraft}
                        placeholder={t("aiAssistantPlaceholder")}
                        onChange={(event) => setAiDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void sendAiPrompt();
                          }
                        }}
                        className={`max-h-44 flex-1 border-0 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 ${
                          uiDensity === "compact"
                            ? "min-h-[58px] px-1 py-1.5 text-sm"
                            : "min-h-[72px] px-1 py-2"
                        }`}
                      />
                      <Button
                        type="submit"
                        disabled={isAiSubmitting || aiDraft.trim().length === 0}
                        className="h-10 rounded-xl bg-primary px-4 text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAiSubmitting ? t("aiAssistantThinking") : t("send")}
                      </Button>
                    </div>
                  </div>
                </form>
                <AlertDialog
                  open={isAiAgentWarningOpen}
                  onOpenChange={(open) => setIsAiAgentWarningOpen(open)}
                >
                  <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-zinc-100">
                        {t("aiAssistantAgentWarningTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        {t("aiAssistantAgentWarningDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:!text-zinc-100">
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="h-10 rounded-lg border border-amber-500/70 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 hover:!text-zinc-100"
                        onClick={confirmEnableAiAgent}
                      >
                        {t("aiAssistantAgentWarningConfirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
            {shouldShowProfileSidebar ? (
              <div
                className={`min-h-0 min-w-0 flex-col ${
                  uiTheme === "light"
                    ? "bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_0%,rgba(241,245,249,0.88)_100%)]"
                    : "bg-[linear-gradient(180deg,rgba(39,39,42,0.62)_0%,rgba(24,24,27,0.5)_100%)]"
                } backdrop-blur-xl ${
                  isCompactActiveChatProfileSidebar
                    ? "hidden w-[360px] max-w-[42vw] shrink-0 border-l border-zinc-800/90 lg:flex"
                    : "flex flex-1"
                }`}
              >
                <AlertDialog
                  open={imagePickerTarget !== null}
                  onOpenChange={(open) => {
                    if (!open) {
                      setImagePickerTarget(null);
                    }
                  }}
                >
                  <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
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
                        className="bg-primary text-zinc-50 hover:bg-primary/90"
                        onClick={triggerImagePick}
                      >
                        {t("changeFile")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {isCompactActiveChatProfileSidebar ? (
                  <div className="flex items-center justify-between border-b border-zinc-800/90 px-4 py-3 sm:px-5">
                    <p className="text-sm font-semibold text-zinc-100">
                      {t("chatProfile")}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("closeViewer")}
                      onClick={() => setIsActiveChatProfileSidebarOpen(false)}
                      className="h-8 w-8 rounded-md border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : null}
                <div
                  className={`h-36 w-full sm:h-44 ${
                    viewedProfile.bannerUrl
                      ? "bg-zinc-800 bg-cover bg-center"
                      : uiTheme === "light"
                        ? "bg-[linear-gradient(130deg,#93c5fd_0%,#60a5fa_48%,#cbd5e1_100%)]"
                        : "bg-[linear-gradient(130deg,#8b5cf6_0%,#6d28d9_45%,#27272a_100%)]"
                  } ${canEditViewedProfileImages ? "cursor-pointer" : ""}`}
                  style={
                    viewedProfile.bannerUrl
                      ? {
                          backgroundImage: `${
                            uiTheme === "light"
                              ? "linear-gradient(130deg,rgba(248,250,252,0.28),rgba(226,232,240,0.45))"
                              : "linear-gradient(130deg,rgba(39,39,42,0.45),rgba(24,24,27,0.55))"
                          },url(${viewedProfile.bannerUrl})`,
                        }
                      : undefined
                  }
                  onClick={() => openImagePickerDialog("banner")}
                />
                <div className="border-b border-zinc-700 px-4 pb-4 sm:px-6">
                  <div className="-mt-12 flex items-end sm:-mt-14">
                    {viewedProfile.avatarUrl ? (
                      <span
                        className={`inline-flex size-24 shrink-0 rounded-full border-4 border-zinc-900 bg-zinc-800 bg-cover bg-center sm:size-28 ${
                          canEditViewedProfileImages ||
                          (!isOwnProfile && Boolean(viewedProfile.avatarUrl))
                            ? "cursor-pointer"
                            : ""
                        }`}
                        style={{ backgroundImage: `url(${viewedProfile.avatarUrl})` }}
                        aria-label={`${viewedProfile.name} avatar`}
                        onClick={() => {
                          if (canEditViewedProfileImages) {
                            openImagePickerDialog("avatar");
                            return;
                          }
                          openImageViewer(PROFILE_AVATAR_VIEWER_IMAGE_ID, "profile-avatar");
                        }}
                      />
                    ) : (
                      <span
                        className={`inline-flex size-24 items-center justify-center rounded-full border-4 border-zinc-900 bg-primary text-2xl font-semibold text-zinc-50 sm:size-28 ${
                          canEditViewedProfileImages ? "cursor-pointer" : ""
                        }`}
                        onClick={() => {
                          if (canEditViewedProfileImages) {
                            openImagePickerDialog("avatar");
                          }
                        }}
                      >
                        {profileInitials || "LW"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    {isOwnProfile && isEditingProfile ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 ring-1 ring-white/5 backdrop-blur-lg">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => void saveProfileEdit()}
                              className="h-9 flex-1 rounded-lg bg-primary px-3 text-zinc-50 hover:bg-primary/90"
                            >
                              {t("save")}
                            </Button>
                            <Button
                              type="button"
                              onClick={cancelProfileEdit}
                              className="h-9 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-zinc-200 hover:bg-zinc-700"
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        </div>
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Select
                            value={birthdayDraft.day || undefined}
                            onValueChange={(value) =>
                              handleBirthdayPartChange("day", value)
                            }
                          >
                            <SelectTrigger
                              className={`h-10 w-full sm:flex-1 ${unifiedSelectTriggerClassName}`}
                            >
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {birthdayDayOptions.map((day) => (
                                <SelectItem
                                  key={day}
                                  value={day}
                                  className={unifiedSelectItemClassName}
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
                            <SelectTrigger
                              className={`h-10 w-full sm:flex-1 ${unifiedSelectTriggerClassName}`}
                            >
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {birthdayMonthOptions.map((month) => (
                                <SelectItem
                                  key={month.value}
                                  value={month.value}
                                  className={unifiedSelectItemClassName}
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
                            <SelectTrigger
                              className={`h-10 w-full sm:flex-1 ${unifiedSelectTriggerClassName}`}
                            >
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {birthdayYearOptions.map((year) => (
                                <SelectItem
                                  key={year}
                                  value={year}
                                  className={unifiedSelectItemClassName}
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
                              className="h-10 w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-600 sm:w-auto"
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
                        {!isGroupProfile && isOwnProfile ? (
                          <div className="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 ring-1 ring-white/5 backdrop-blur-lg">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                onClick={startProfileEdit}
                                className="h-9 flex-1 rounded-lg bg-primary px-3 text-zinc-50 hover:bg-primary/90"
                              >
                                <Pencil className="size-4" />
                                {t("editProfile")}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={openFavoritesChat}
                                className="h-9 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
                              >
                                <Bookmark className="size-4" />
                                {t("favorites")}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("menu")}
                                    className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 aria-expanded:bg-zinc-700 aria-expanded:text-zinc-100"
                                  >
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className={profileActionMenuContentClassName}
                                >
                                  <DropdownMenuItem
                                    className={profileActionMenuItemClassName}
                                    onSelect={openShareContactDialog}
                                  >
                                    <ShareContactIcon className="size-4" />
                                    {t("shareContact")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ) : !isGroupProfile && !isOwnProfile && viewedUserId ? (
                          <div className="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 ring-1 ring-white/5 backdrop-blur-lg">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => void createOrOpenChat(viewedUserId)}
                                className="h-9 flex-1 rounded-lg bg-primary px-3 text-zinc-50 hover:bg-primary/90"
                              >
                                <MessageCircle className="size-4" />
                                {t("openChat")}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={
                                  isProfileCallActiveWithViewedUser ? t("endCall") : t("call")
                                }
                                onClick={() => {
                                  if (isProfileCallActiveWithViewedUser) {
                                    void hangupCurrentCall();
                                    return;
                                  }
                                  void startAudioCallFromProfile();
                                }}
                                disabled={
                                  isProfileCallButtonDisabled &&
                                  !isProfileCallActiveWithViewedUser
                                }
                                className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                                title={t("call")}
                              >
                                {isProfileCallActiveWithViewedUser ? (
                                  <PhoneOff className="size-4" />
                                ) : (
                                  <Phone className="size-4 fill-current" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("menu")}
                                    className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 aria-expanded:bg-zinc-700 aria-expanded:text-zinc-100"
                                  >
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className={profileActionMenuContentClassName}
                                >
                                  <DropdownMenuItem
                                    className={profileActionMenuItemClassName}
                                    onSelect={openShareContactDialog}
                                  >
                                    <ShareContactIcon className="size-4" />
                                    {t("shareContact")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className={profileActionMenuSeparatorClassName} />
                                  <DropdownMenuItem
                                    className={profileActionMenuItemClassName}
                                    onSelect={() => void toggleViewedUserBlock()}
                                  >
                                    {isViewedUserBlocked ? (
                                      <Check className="size-4" />
                                    ) : (
                                      <X className="size-4" />
                                    )}
                                    {isViewedUserBlocked ? t("unblockUser") : t("blockUser")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
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
                          <div className="mt-4 space-y-3">
                            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 ring-1 ring-white/5 backdrop-blur-lg">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGroupChat) {
                                      openChat(selectedGroupChat.id);
                                    }
                                  }}
                                  className="h-9 flex-1 rounded-lg bg-primary px-3 text-zinc-50 hover:bg-primary/90"
                                >
                                  <MessageCircle className="size-4" />
                                  {t("openChat")}
                                </Button>
                                {canManageSelectedGroup ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={t("menu")}
                                        className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 aria-expanded:bg-zinc-700 aria-expanded:text-zinc-100"
                                      >
                                        <MoreVertical className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className={profileActionMenuContentClassName}
                                    >
                                      <DropdownMenuItem
                                        className={profileActionMenuItemClassName}
                                        onSelect={() => setIsGroupSettingsOpen(true)}
                                      >
                                        <Pencil className="size-4" />
                                        {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р В РІР‚В°" : "Edit"}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : null}
                              </div>
                            </div>
                            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 backdrop-blur-lg">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                                  {isSelectedChannel ? t("subscribers") : t("participants")} (
                                  {groupParticipants.length})
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setIsGroupProfileParticipantsCollapsed((previous) => !previous)
                                  }
                                  aria-label={
                                    isGroupProfileParticipantsCollapsed
                                      ? language === "ru"
                                        ? "Развернуть участников"
                                        : "Expand participants"
                                      : language === "ru"
                                        ? "Свернуть участников"
                                        : "Collapse participants"
                                  }
                                  className="h-7 w-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                                >
                                  {isGroupProfileParticipantsCollapsed ? (
                                    <Maximize2 className="size-3.5" />
                                  ) : (
                                    <Minimize2 className="size-3.5" />
                                  )}
                                </Button>
                              </div>
                              {!isGroupProfileParticipantsCollapsed ? (
                                <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                                  {groupParticipants.map((member) => {
                                    const initials = member.name
                                      .split(" ")
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((part) => part[0]?.toUpperCase() ?? "")
                                      .join("");
                                    const roleLabel =
                                      member.role === "owner"
                                        ? t("owner")
                                        : member.role === "admin"
                                          ? t("admin")
                                          : null;
                                    const roleClassName =
                                      member.role === "owner"
                                        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                                        : "border-primary/40 bg-primary/10 text-primary";

                                    return (
                                      <div
                                        key={`group-profile-member-${member.id}`}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2"
                                      >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                          {member.avatarUrl ? (
                                            <span
                                              className="inline-flex size-8 shrink-0 rounded-full bg-zinc-700 bg-cover bg-center"
                                              style={{ backgroundImage: `url(${member.avatarUrl})` }}
                                              aria-label={`${member.name} avatar`}
                                            />
                                          ) : (
                                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold text-zinc-100">
                                              {initials || member.username.slice(0, 2).toUpperCase()}
                                            </span>
                                          )}
                                          <div className="min-w-0">
                                            <p className="truncate text-sm text-zinc-100">
                                              {member.name}
                                              {member.isCurrentUser ? ` ${t("youLabel")}` : ""}
                                            </p>
                                            <p className="truncate text-xs text-zinc-500">
                                              @{member.username}
                                            </p>
                                          </div>
                                        </div>
                                        {roleLabel ? (
                                          <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleClassName}`}
                                          >
                                            {roleLabel}
                                          </span>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
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
                              ? "border-primary text-zinc-100"
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
                          className="relative aspect-square overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 hover:border-primary/50"
                        >
                          {item.kind === "video" ? (
                            <video
                              src={item.url}
                              className="h-full w-full bg-black object-cover"
                              muted
                              playsInline
                              controls
                              controlsList={
                                isViewedChatContentProtectionEnabled ? "nodownload" : undefined
                              }
                              onContextMenu={
                                isViewedChatContentProtectionEnabled
                                  ? (event) => {
                                      event.preventDefault();
                                      showGroupContentProtectionBlockedToast();
                                    }
                                  : undefined
                              }
                            />
                          ) : (
                            <button
                              type="button"
                              className="group h-full w-full"
                              onClick={() => openImageViewer(item.id, "profile")}
                              onContextMenu={
                                isViewedChatContentProtectionEnabled
                                  ? (event) => {
                                      event.preventDefault();
                                      showGroupContentProtectionBlockedToast();
                                    }
                                  : undefined
                              }
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                              />
                            </button>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                            <p className="truncate text-[11px] text-zinc-200">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!isOwnProfile &&
                  availableProfileTabs.length > 0 &&
                  profileTab === "audio" ? (
                    <div className="space-y-3 p-4 sm:p-6">
                      {profileAudioItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm text-zinc-200">
                              {t("voiceMessage")}
                            </p>
                            <p className="shrink-0 text-xs text-zinc-500">{item.time}</p>
                          </div>
                          <div className="mt-2">
                            <AudioAttachmentPlayer
                              src={item.url}
                              disableDownload={isViewedChatContentProtectionEnabled}
                              onBlockedAction={showGroupContentProtectionBlockedToast}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!isOwnProfile &&
                  availableProfileTabs.length > 0 &&
                  profileTab === "links" ? (
                    <div className="space-y-2 p-4 sm:p-6">
                      {profileLinkItems.map((item) =>
                        isViewedChatContentProtectionEnabled ? (
                          <button
                            key={item.id}
                            type="button"
                            onClick={showGroupContentProtectionBlockedToast}
                            className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-left hover:border-zinc-600"
                          >
                            <p className="truncate text-sm text-zinc-200">{item.url}</p>
                            <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
                          </button>
                        ) : (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 hover:border-primary/50"
                          >
                            <p className="truncate text-sm text-zinc-200">{item.url}</p>
                            <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
                          </a>
                        )
                      )}
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
              <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-900">
                <div className="sticky top-0 z-10 border-b border-zinc-700 bg-zinc-900 px-4 py-4 sm:px-6">
                  <div className="mx-auto w-full max-w-5xl">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-100">{t("settings")}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{t("onboardingDescription")}</p>
                    </div>
                    <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-1.5 sm:mt-4 sm:rounded-xl sm:p-2">
                      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-2 sm:overflow-visible sm:pb-0">
                        {(["privacy", "security", "appearance"] as const).map((section) => (
                          <button
                            key={section}
                            type="button"
                            onClick={() => setActiveSettingsSection(section)}
                            className={`h-8 shrink-0 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-colors sm:h-10 sm:rounded-lg sm:text-sm ${
                              activeSettingsSection === section
                                ? "border-primary bg-primary text-zinc-50"
                                : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
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
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                  <div className="mx-auto w-full max-w-5xl space-y-4 pb-8">
                  {activeSettingsSection === "privacy" ? (
                  <section className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 sm:px-5">
                    <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5">
                      <p className="text-sm font-semibold text-zinc-100">{t("privacy")}</p>
                      <p className="mt-1 text-xs text-zinc-400">{t("privacyScopeHint")}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">{t("lastSeenVisibility")}</p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
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
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`last-seen-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentLastSeenVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
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
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">{t("avatarVisibility")}</p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
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
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`avatar-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentAvatarVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
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
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">{t("bioVisibility")}</p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
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
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`bio-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentBioVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
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
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {t("birthdayVisibility")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
                          <Select
                            value={currentBirthdayVisibility}
                            onValueChange={(value) => {
                              if (
                                value === "everyone" ||
                                value === "selected" ||
                                value === "nobody"
                              ) {
                                updatePrivacyVisibility("birthdayVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("birthday");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`birthday-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentBirthdayVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentBirthdayAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("birthday");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {t("groupAddVisibility")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
                          <Select
                            value={currentGroupAddVisibility}
                            onValueChange={(value) => {
                              if (
                                value === "everyone" ||
                                value === "selected" ||
                                value === "nobody"
                              ) {
                                updatePrivacyVisibility("groupAddVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("groupAdd");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`group-add-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentGroupAddVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentGroupAddAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("groupAdd");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {t("callVisibility")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
                          <Select
                            value={currentCallVisibility}
                            onValueChange={(value) => {
                              if (
                                value === "everyone" ||
                                value === "selected" ||
                                value === "nobody"
                              ) {
                                updatePrivacyVisibility("callVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("call");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`call-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentCallVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentCallAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("call");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
                              >
                                {t("choosePeople")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {t("forwardVisibility")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{t("privacyScopeHint")}</p>
                        <div className="mt-3">
                          <Select
                            value={currentForwardVisibility}
                            onValueChange={(value) => {
                              if (
                                value === "everyone" ||
                                value === "selected" ||
                                value === "nobody"
                              ) {
                                updatePrivacyVisibility("forwardVisibility", value);
                                if (value === "selected") {
                                  setPrivacyPickerField("forward");
                                  setPrivacyPickerQuery("");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className={`h-10 w-full ${unifiedSelectTriggerClassName}`}>
                              <SelectValue className="text-zinc-100">
                                {(value) => getPrivacyVisibilityLabel(value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={unifiedSelectContentClassName}>
                              {privacyVisibilityOptions.map((scope) => (
                                <SelectItem
                                  key={`forward-${scope}`}
                                  value={scope}
                                  className={unifiedSelectItemClassName}
                                >
                                  {t(scope)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {currentForwardVisibility === "selected" ? (
                          <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-300">
                                {`${t("selectedPeople")}: ${currentForwardAllowedUserIds.length}`}
                              </p>
                              <Button
                                type="button"
                                onClick={() => {
                                  setPrivacyPickerField("forward");
                                  setPrivacyPickerQuery("");
                                }}
                                className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-xs text-zinc-100 hover:bg-zinc-700"
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
                  <section className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 sm:px-5">
                    <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5">
                      <p className="text-sm font-semibold text-zinc-100">{t("security")}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
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
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {currentUser.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {currentUser.email}
                            </p>
                          </div>
                          <div className="rounded-md border border-zinc-700/80 bg-zinc-950/60 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                              {language === "ru" ? "Р В Р’В Р Р†Р вЂљРІвЂћСћР В Р’В Р вЂ™Р’ВµР В Р Р‹Р В РІР‚С™Р В Р Р‹Р В РЎвЂњР В Р’В Р РЋРІР‚ВР В Р Р‹Р В Р РЏ Р В Р’В Р РЋРІР‚вЂќР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚ВР В Р’В Р вЂ™Р’В»Р В Р’В Р РЋРІР‚СћР В Р’В Р вЂ™Р’В¶Р В Р’В Р вЂ™Р’ВµР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р Р‹Р В Р РЏ" : "App version"}
                            </p>
                            <p className="mt-1 font-mono text-xs text-zinc-200">{APP_VERSION}</p>
                          </div>
                          <Button
                            type="button"
                            onClick={onLogout}
                            className="h-10 rounded-md border border-zinc-600 bg-zinc-800 px-4 text-zinc-100 hover:bg-zinc-700"
                          >
                            {t("logOut")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {activeSettingsSection === "appearance" ? (
                  <section className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 sm:px-5">
                    <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5">
                      <p className="text-sm font-semibold text-zinc-100">{t("appearance")}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-100">{t("interface")}</p>
                        <div className="mt-3 divide-y divide-zinc-800">
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("language")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("languageHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={language}
                                onValueChange={(value) => {
                                  if (value === "en" || value === "ru") {
                                    setLanguage(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className="text-zinc-100">
                                    {(value) => getLanguageLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="en" className={unifiedSelectItemClassName}>
                                    {t("english")}
                                  </SelectItem>
                                  <SelectItem value="ru" className={unifiedSelectItemClassName}>
                                    {t("russian")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("theme")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("themeHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={uiTheme}
                                onValueChange={(value) => {
                                  if (value === "dark" || value === "light") {
                                    setUiTheme(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className="text-zinc-100">
                                    {(value) => getThemeLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="dark" className={unifiedSelectItemClassName}>
                                    {t("themeDark")}
                                  </SelectItem>
                                  <SelectItem value="light" className={unifiedSelectItemClassName}>
                                    {t("themeLight")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("density")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("densityHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={uiDensity}
                                onValueChange={(value) => {
                                  if (value === "comfortable" || value === "compact") {
                                    setUiDensity(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className="text-zinc-100">
                                    {(value) => getDensityLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="comfortable" className={unifiedSelectItemClassName}>
                                    {t("densityComfortable")}
                                  </SelectItem>
                                  <SelectItem value="compact" className={unifiedSelectItemClassName}>
                                    {t("densityCompact")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("radius")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("radiusHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={uiRadius}
                                onValueChange={(value) => {
                                  if (value === "sharp" || value === "normal" || value === "rounded") {
                                    setUiRadius(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className={`text-zinc-100 ${uiControlTextClass}`}>
                                    {(value) => getRadiusLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="sharp" className={unifiedSelectItemClassName}>
                                    {t("radiusSharp")}
                                  </SelectItem>
                                  <SelectItem value="normal" className={unifiedSelectItemClassName}>
                                    {t("radiusNormal")}
                                  </SelectItem>
                                  <SelectItem value="rounded" className={unifiedSelectItemClassName}>
                                    {t("radiusRounded")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-100">{t("fontFamily")}</p>
                        <div className="mt-3 divide-y divide-zinc-800">
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("fontSize")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("fontSizeHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={uiFontSize}
                                onValueChange={(value) => {
                                  if (value === "small" || value === "default" || value === "large") {
                                    setUiFontSize(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className={`text-zinc-100 ${uiControlTextClass}`}>
                                    {(value) => getFontSizeLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="small" className={unifiedSelectItemClassName}>
                                    {t("fontSizeSmall")}
                                  </SelectItem>
                                  <SelectItem value="default" className={unifiedSelectItemClassName}>
                                    {t("fontSizeDefault")}
                                  </SelectItem>
                                  <SelectItem value="large" className={unifiedSelectItemClassName}>
                                    {t("fontSizeLarge")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("fontFamily")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("fontFamilyHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={uiFontFamily}
                                onValueChange={(value) => {
                                  if (
                                    value === "default" ||
                                    value === "modern" ||
                                    value === "readable" ||
                                    value === "comfortaa"
                                  ) {
                                    setUiFontFamily(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className="text-zinc-100">
                                    {(value) => getFontFamilyLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="default" className={unifiedSelectItemClassName}>
                                    {t("fontFamilyDefault")}
                                  </SelectItem>
                                  <SelectItem value="modern" className={unifiedSelectItemClassName}>
                                    {t("fontFamilyModern")}
                                  </SelectItem>
                                  <SelectItem value="readable" className={unifiedSelectItemClassName}>
                                    {t("fontFamilyReadable")}
                                  </SelectItem>
                                  <SelectItem value="comfortaa" className={unifiedSelectItemClassName}>
                                    {t("fontFamilyComfortaa")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-100">{t("chatWallpaper")}</p>
                        <div className="mt-3 divide-y divide-zinc-800">
                          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("chatWallpaper")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("chatWallpaperHint")}</p>
                            </div>
                            <div className="w-full sm:w-[220px]">
                              <Select
                                value={globalChatWallpaper}
                                onValueChange={(value) => {
                                  if (
                                    value === "none" ||
                                    value === "color-bends" ||
                                    value === "pixel-blast" ||
                                    value === "plasma" ||
                                    value === "dither" ||
                                    value === "gradient-blinds"
                                  ) {
                                    setGlobalChatWallpaper(value);
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                                  <SelectValue className="text-zinc-100">
                                    {(value) => getChatWallpaperLabel(value)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className={unifiedSelectContentClassName}>
                                  <SelectItem value="none" className={unifiedSelectItemClassName}>
                                    {t("wallpaperNone")}
                                  </SelectItem>
                                  <SelectItem value="color-bends" className={unifiedSelectItemClassName}>
                                    {t("wallpaperColorBends")}
                                  </SelectItem>
                                  <SelectItem value="pixel-blast" className={unifiedSelectItemClassName}>
                                    {t("wallpaperPixelBlast")}
                                  </SelectItem>
                                  <SelectItem value="plasma" className={unifiedSelectItemClassName}>
                                    {t("wallpaperPlasma")}
                                  </SelectItem>
                                  <SelectItem value="dither" className={unifiedSelectItemClassName}>
                                    {t("wallpaperDither")}
                                  </SelectItem>
                                  <SelectItem value="gradient-blinds" className={unifiedSelectItemClassName}>
                                    {t("wallpaperGradientBlinds")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("messageSound")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("messageSoundHint")}</p>
                            </div>
                            <Switch
                              checked={messageSoundEnabled}
                              onCheckedChange={setMessageSoundEnabled}
                              aria-label={t("messageSound")}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">
                                {t("sendMessageSound")}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {t("sendMessageSoundHint")}
                              </p>
                            </div>
                            <Switch
                              checked={sendMessageSoundEnabled}
                              onCheckedChange={setSendMessageSoundEnabled}
                              aria-label={t("sendMessageSound")}
                            />
                          </div>
                          <div className="hidden items-center justify-between gap-4 py-3 md:flex">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">{t("sidebarVisibility")}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">{t("sidebarVisibilityHint")}</p>
                            </div>
                            <Switch
                              checked={!isMainSidebarCollapsed}
                              onCheckedChange={(checked) =>
                                setIsMainSidebarCollapsed(!checked)
                              }
                              aria-label={t("sidebarVisibility")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  ) : null}

                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {shouldShowMobileNavigation ? (
        <nav
          aria-label={t("menu")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/90 bg-zinc-950/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl md:hidden"
        >
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, renderableSidebarItems.length)}, minmax(0, 1fr))`,
            }}
          >
            {renderableSidebarItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeSidebar;

              return (
                <button
                  key={`mobile-nav-${item.id}`}
                  type="button"
                  onClick={() => {
                    if (item.id === "profile") {
                      openOwnProfile();
                      return;
                    }
                    setIsActiveChatProfileSidebarOpen(false);
                    setActiveSidebar(item.id);
                  }}
                  className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-medium ${
                    active
                      ? "border-primary bg-primary text-zinc-50"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300"
                  }`}
                  aria-label={t(item.id)}
                >
                  <Icon className="size-4" />
                  <span className="leading-none">{t(item.id)}</span>
                </button>
              );
            })}
          </div>
          {isAdminAccount ? (
            <button
              type="button"
              onClick={openAdminDashboard}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-500/70 bg-amber-500/15 text-xs font-medium text-amber-100"
            >
              <Shield className="size-4" />
              <span>{adminDashboardLabel}</span>
            </button>
          ) : null}
        </nav>
      ) : null}
      <AlertDialog
        open={isChatPersonalizationOpen}
        onOpenChange={(open) => setIsChatPersonalizationOpen(open)}
      >
        <AlertDialogContent
          ref={chatPersonalizationDialogContentRef}
          className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {t("chatPersonalization")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {activeChat ? `${t("chatPersonalizationHint")} - ${activeChat.name}` : t("chatPersonalizationHint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-lg">
              <div>
                <p className="text-sm font-medium text-zinc-100">{t("muteThisChat")}</p>
              </div>
              <Switch
                checked={Boolean(activeChat?.isMuted)}
                onCheckedChange={(checked) => {
                  if (!activeChat) {
                    return;
                  }
                  void setChatMuted(activeChat.id, checked);
                }}
                aria-label={t("muteThisChat")}
                disabled={activeChat?.isFavorites || activeChat?.isPreview}
              />
            </div>
            <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-lg">
              <p className="text-sm font-medium text-zinc-100">{t("chatWallpaperPerChat")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("chatWallpaperPerChatHint")}</p>
              <div className="mt-2 max-w-[220px]">
                <Select
                  value={activeChatPersonalization.wallpaper}
                  onValueChange={(value) => {
                    if (
                      value === "inherit" ||
                      value === "none" ||
                      value === "color-bends" ||
                      value === "pixel-blast" ||
                      value === "plasma" ||
                      value === "dither" ||
                      value === "gradient-blinds"
                    ) {
                      updateActiveChatPersonalization({ wallpaper: value });
                    }
                  }}
                >
                  <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                    <SelectValue className="text-zinc-100">
                      {(value) => getChatWallpaperLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={unifiedSelectContentClassName}
                    container={chatPersonalizationDialogContentRef}
                    alignItemWithTrigger={false}
                  >
                    <SelectItem value="inherit" className={unifiedSelectItemClassName}>
                      {t("inheritGlobal")}
                    </SelectItem>
                    <SelectItem value="none" className={unifiedSelectItemClassName}>
                      {t("wallpaperNone")}
                    </SelectItem>
                    <SelectItem value="color-bends" className={unifiedSelectItemClassName}>
                      {t("wallpaperColorBends")}
                    </SelectItem>
                    <SelectItem value="pixel-blast" className={unifiedSelectItemClassName}>
                      {t("wallpaperPixelBlast")}
                    </SelectItem>
                    <SelectItem value="plasma" className={unifiedSelectItemClassName}>
                      {t("wallpaperPlasma")}
                    </SelectItem>
                    <SelectItem value="dither" className={unifiedSelectItemClassName}>
                      {t("wallpaperDither")}
                    </SelectItem>
                    <SelectItem value="gradient-blinds" className={unifiedSelectItemClassName}>
                      {t("wallpaperGradientBlinds")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-lg">
              <p className="text-sm font-medium text-zinc-100">{t("chatFontSize")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("chatFontSizeHint")}</p>
              <div className="mt-2 max-w-[220px]">
                <Select
                  value={activeChatPersonalization.fontSize}
                  onValueChange={(value) => {
                    if (
                      value === "inherit" ||
                      value === "small" ||
                      value === "default" ||
                      value === "large"
                    ) {
                      updateActiveChatPersonalization({ fontSize: value });
                    }
                  }}
                >
                  <SelectTrigger className={`h-9 w-full px-2.5 text-xs font-medium ${unifiedSelectTriggerClassName}`}>
                    <SelectValue className={`text-zinc-100 ${uiControlTextClass}`}>
                      {(value) => getChatFontSizeSettingLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={unifiedSelectContentClassName}
                    container={chatPersonalizationDialogContentRef}
                    alignItemWithTrigger={false}
                  >
                    <SelectItem value="inherit" className={unifiedSelectItemClassName}>
                      {t("inheritGlobal")}
                    </SelectItem>
                    <SelectItem value="small" className={unifiedSelectItemClassName}>
                      {t("fontSizeSmall")}
                    </SelectItem>
                    <SelectItem value="default" className={unifiedSelectItemClassName}>
                      {t("fontSizeDefault")}
                    </SelectItem>
                    <SelectItem value="large" className={unifiedSelectItemClassName}>
                      {t("fontSizeLarge")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-lg">
              <div>
                <p className="text-sm font-medium text-zinc-100">{t("autoLoadMedia")}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{t("autoLoadMediaHint")}</p>
              </div>
              <Switch
                checked={activeChatAutoLoadMediaEnabled}
                onCheckedChange={(checked) =>
                  updateActiveChatPersonalization({ autoLoadMedia: checked })
                }
                aria-label={t("autoLoadMedia")}
              />
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:!text-zinc-100">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isDeleteChatDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteChatDialogOpen(open);
          if (!open) {
            setChatIdToConfirmDelete(null);
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {t("deleteChatConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("deleteChatConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:!text-zinc-100">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={`h-10 rounded-lg ${
                chatIdToConfirmDelete === FAVORITES_CHAT_ID
                  ? "border border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:!text-zinc-100"
                  : "border border-red-500/70 bg-red-500/20 text-red-100 hover:bg-red-500/30 hover:!text-zinc-100"
              }`}
              onClick={() => {
                if (!chatIdToConfirmDelete) {
                  return;
                }
                const deletingFavorites = chatIdToConfirmDelete === FAVORITES_CHAT_ID;
                setIsDeleteChatDialogOpen(false);
                if (deletingFavorites) {
                  void deleteFavoritesChat();
                } else {
                  void deleteChat(chatIdToConfirmDelete);
                }
                setChatIdToConfirmDelete(null);
              }}
            >
              {chatIdToConfirmDelete === FAVORITES_CHAT_ID
                ? t("deleteFavoritesAction")
                : t("deleteChatAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={messageViewsDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMessageViewsDialog(null);
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {messageViewsDialog
                ? language === "ru"
                  ? `${messageViewsDialog.count} Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†РІР‚С›РІР‚вЂњ`
                  : `${messageViewsDialog.count} ${
                      messageViewsDialog.count === 1 ? "view" : "views"
                    }`
                : ""}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†РІР‚С›РЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРІР‚СњР В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В» Р В Р’В Р В Р вЂ№Р В Р’В Р В Р вЂ°Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС› Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В±Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’Вµ" : "Who read this message"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {messageViewsDialog?.labels.map((viewerName, viewerIndex) => (
              <div
                key={`message-viewer-dialog-${viewerIndex}`}
                className="rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
              >
                <span className="truncate">{viewerName}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:!text-zinc-100">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isPersonalizationOnboardingOpen}>
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {t("onboardingTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("onboardingDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">{t("language")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("languageHint")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`h-10 rounded-lg border ${
                    language === "en"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("english")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setLanguage("ru")}
                  className={`h-10 rounded-lg border ${
                    language === "ru"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("russian")}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{t("theme")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("themeHint")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setUiTheme("dark")}
                  className={`h-10 rounded-lg border ${
                    uiTheme === "dark"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("themeDark")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setUiTheme("light")}
                  className={`h-10 rounded-lg border ${
                    uiTheme === "light"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("themeLight")}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{t("density")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("densityHint")}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setUiDensity("comfortable")}
                  className={`h-10 rounded-lg border ${
                    uiDensity === "comfortable"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("densityComfortable")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setUiDensity("compact")}
                  className={`h-10 rounded-lg border ${
                    uiDensity === "compact"
                      ? "border-primary bg-primary text-zinc-50 hover:bg-primary/90"
                      : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {t("densityCompact")}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-lg">
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
          <AlertDialogFooter className="gap-2">
            <AlertDialogAction
              className="h-10 rounded-lg bg-primary text-zinc-50 hover:bg-primary/90"
              onClick={() => {
                window.localStorage.setItem(
                  PERSONALIZATION_ONBOARDING_DONE_STORAGE_KEY,
                  "1"
                );
                setIsPersonalizationOnboardingOpen(false);
              }}
            >
              {t("onboardingApply")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(isGroupProfile && canManageSelectedGroup && isGroupSettingsOpen)}
        onOpenChange={(open) => {
          if (!open) {
            setIsGroupSettingsOpen(false);
            setGroupMemberSearchDraft("");
            setIsGroupTypeDialogOpen(false);
            setIsGroupPermissionsDialogOpen(false);
            setIsGroupInvitationsDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 w-[min(94vw,760px)] max-w-none border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {isSelectedChannel ? "Channel settings" : "Group settings"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {selectedGroupChat?.name ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[min(70vh,560px)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
            <div className="overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/70 backdrop-blur-lg">
              <div
                className={`h-28 w-full ${
                  selectedGroupChat?.bannerUrl
                    ? "bg-zinc-800 bg-cover bg-center"
                    : "bg-[linear-gradient(130deg,#8b5cf6_0%,#6d28d9_45%,#27272a_100%)]"
                } ${canManageSelectedGroup ? "cursor-pointer" : ""}`}
                style={
                  selectedGroupChat?.bannerUrl
                    ? {
                        backgroundImage: `linear-gradient(130deg,rgba(39,39,42,0.45),rgba(24,24,27,0.55)),url(${selectedGroupChat.bannerUrl})`,
                      }
                    : undefined
                }
                onClick={() => openImagePickerDialog("banner")}
              />
              <div className="px-4 pb-4">
                <div className="-mt-10 flex items-end gap-3">
                  {selectedGroupChat?.avatarUrl ? (
                    <span
                      className={`inline-flex size-20 shrink-0 rounded-full border-4 border-zinc-900 bg-zinc-800 bg-cover bg-center ${
                        canManageSelectedGroup ? "cursor-pointer" : ""
                      }`}
                      style={{ backgroundImage: `url(${selectedGroupChat.avatarUrl})` }}
                      aria-label={`${selectedGroupChat.name} avatar`}
                      onClick={() => openImagePickerDialog("avatar")}
                    />
                  ) : (
                    <span
                      className={`inline-flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-zinc-900 bg-primary text-lg font-semibold text-zinc-50 ${
                        canManageSelectedGroup ? "cursor-pointer" : ""
                      }`}
                      onClick={() => openImagePickerDialog("avatar")}
                    >
                      {profileInitials || "GR"}
                    </span>
                  )}
                  <div className="min-w-0 pb-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {selectedGroupChat?.name ?? ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isSelectedChannel ? "Channel profile" : "Group profile"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Input
                    value={groupRenameDraft}
                    maxLength={GROUP_TITLE_MAX_LENGTH}
                    onChange={(event) => setGroupRenameDraft(event.target.value)}
                    className="h-9 border-zinc-600 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-400"
                    placeholder={isSelectedChannel ? "Channel name" : t("groupName")}
                  />
                  <Textarea
                    value={groupDescriptionDraft}
                    maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
                    onChange={(event) => setGroupDescriptionDraft(event.target.value)}
                    className="min-h-24 border-zinc-600 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-400"
                    placeholder={isSelectedChannel ? "Channel description" : "Group description"}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-500">
                      {`${groupDescriptionDraft.trim().length}/${GROUP_DESCRIPTION_MAX_LENGTH}`}
                    </p>
                    <Button
                      type="button"
                      onClick={() => void renameSelectedGroup()}
                      disabled={
                        groupRenameDraft.trim().replace(/\s+/g, " ").length <
                          GROUP_TITLE_MIN_LENGTH ||
                        groupRenameDraft.trim().replace(/\s+/g, " ").length >
                          GROUP_TITLE_MAX_LENGTH ||
                        groupDescriptionDraft.trim().length > GROUP_DESCRIPTION_MAX_LENGTH ||
                        (groupRenameDraft.trim().replace(/\s+/g, " ") ===
                          (selectedGroupChat?.name ?? "") &&
                          groupDescriptionDraft.trim() ===
                            (selectedGroupChat?.description ?? ""))
                      }
                      className="h-9 rounded-lg bg-primary px-3 text-xs text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t("save")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 backdrop-blur-lg">
              <button
                type="button"
                onClick={() => setIsGroupTypeDialogOpen(true)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-left hover:border-zinc-600 hover:bg-zinc-700"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Users className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      {isSelectedChannel ? "Channel type" : "Group type"}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {isSelectedChannel
                        ? "Private channel / Public channel"
                        : `${t("groupTypePrivate")} / ${t("groupTypePublic")}`}
                    </span>
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-500" />
              </button>
              <button
                type="button"
                onClick={() => setIsGroupPermissionsDialogOpen(true)}
                className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-left hover:border-zinc-600 hover:bg-zinc-700"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Shield className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р В Р вЂ№Р В Р’В Р Р†Р вЂљРЎв„ўР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р В Р вЂ№Р В Р вЂ Р Р†Р вЂљРЎв„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ" : "Permissions"}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В РЎС›Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р вЂ Р Р†Р вЂљРЎвЂєР Р†Р вЂљРІР‚СљР В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р В Р вЂ№Р В Р’В Р В Р РЏ Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎС™Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р В Р вЂ№Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р В Р вЂ№Р В Р’В Р РЋРІР‚СљР В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В¦Р В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљР’ВР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎСљР В Р’В Р вЂ™Р’В Р В Р Р‹Р Р†Р вЂљРЎС›Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В " : "Member roles and actions"}
                    </span>
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-500" />
              </button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              onClick={() => {
                setIsGroupSettingsOpen(false);
                setGroupMemberSearchDraft("");
                setIsGroupTypeDialogOpen(false);
                setIsGroupPermissionsDialogOpen(false);
                setIsGroupInvitationsDialogOpen(false);
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(
          isGroupProfile &&
            canManageSelectedGroup &&
            isGroupSettingsOpen &&
            isGroupTypeDialogOpen
        )}
        onOpenChange={(open) => {
          setIsGroupTypeDialogOpen(open);
          if (!open) {
            setGroupAccessTypeDraft(selectedGroupCurrentAccessType);
            setGroupPublicUsernameDraft(selectedGroupChat?.groupUsername ?? "");
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р Р†Р вЂљРЎвЂќР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљ" : "Type"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {selectedGroupChat?.name ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setGroupAccessTypeDraft("private")}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  groupAccessTypeDraft === "private"
                    ? "border-primary bg-primary/15"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700"
                }`}
              >
                <p className="text-sm font-medium text-zinc-100">
                  {isSelectedChannel ? "Private channel" : t("groupTypePrivate")}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {isSelectedChannel
                    ? "Join by invite link or when added by owner/admin."
                    : t("groupTypePrivateDescription")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setGroupAccessTypeDraft("public")}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  groupAccessTypeDraft === "public"
                    ? "border-primary bg-primary/15"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700"
                }`}
              >
                <p className="text-sm font-medium text-zinc-100">
                  {isSelectedChannel ? "Public channel" : t("groupTypePublic")}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {isSelectedChannel
                    ? "Anyone can join using the public @username link."
                    : t("groupTypePublicDescription")}
                </p>
              </button>
            </div>
            {groupAccessTypeDraft === "public" ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-400">
                  {t("groupUsernameLabel")}
                </p>
                <Input
                  value={groupPublicUsernameDraft}
                  onChange={(event) => setGroupPublicUsernameDraft(event.target.value)}
                  className="mt-2 h-9 border-zinc-600 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500"
                  placeholder="my_group"
                />
                <p className="mt-2 text-xs text-zinc-500">{t("groupUsernameHint")}</p>
                {groupPublicDraftLink ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={groupPublicDraftLink}
                      readOnly
                      className="h-9 border-zinc-700 bg-zinc-800 text-xs text-zinc-300"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-zinc-600 bg-zinc-800 px-3 text-zinc-200 hover:bg-zinc-700"
                      onClick={() => void copyGroupLink(groupPublicDraftLink)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-400">
                  {t("groupInviteLink")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {isSelectedChannel
                    ? "Join by invite link or when added by owner/admin."
                    : t("groupTypePrivateDescription")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={selectedGroupInviteLink}
                    readOnly
                    className="h-9 border-zinc-700 bg-zinc-800 text-xs text-zinc-300"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-zinc-600 bg-zinc-800 px-3 text-zinc-200 hover:bg-zinc-700"
                    onClick={() => void copyGroupLink(selectedGroupInviteLink)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void updateSelectedGroupAccess()}
              disabled={
                isSavingGroupType ||
                isGroupTypeDraftUnchanged ||
                (groupAccessTypeDraft === "public" &&
                  !isValidGroupUsername(normalizedGroupPublicUsernameDraft))
              }
              className="h-10 rounded-lg bg-primary px-3 text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("save")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(
          isGroupProfile &&
            canManageSelectedGroup &&
            isGroupSettingsOpen &&
            isGroupPermissionsDialogOpen
        )}
        onOpenChange={(open) => {
          setIsGroupPermissionsDialogOpen(open);
          if (!open) {
            setIsGroupPermissionsParticipantsCollapsed(false);
          }
        }}
      >
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 w-[min(94vw,760px)] max-w-none border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В·Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ" : "Permissions"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {selectedGroupChat?.name ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[min(70vh,560px)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 backdrop-blur-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200">
                  {`${t("yourRole")}: ${selectedGroupMyRole === "owner" ? t("owner") : selectedGroupMyRole === "admin" ? t("admin") : t("member")}`}
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                  {`${isSelectedChannel ? t("subscribers") : t("groupMembers")}: ${groupParticipants.length}`}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 backdrop-blur-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {t("groupContentProtection")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("groupContentProtectionHint")}
                  </p>
                </div>
                <Switch
                  checked={selectedGroupContentProtectionEnabled}
                  onCheckedChange={(checked) => {
                    void updateSelectedGroupContentProtection(checked);
                  }}
                  disabled={isSavingGroupContentProtection}
                  aria-label={t("groupContentProtection")}
                />
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 backdrop-blur-lg">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                  {isSelectedChannel ? t("subscribers") : t("participants")} (
                  {groupParticipants.length})
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setIsGroupPermissionsParticipantsCollapsed((previous) => !previous)
                  }
                  aria-label={
                    isGroupPermissionsParticipantsCollapsed
                      ? language === "ru"
                        ? "Развернуть участников"
                        : "Expand participants"
                      : language === "ru"
                        ? "Свернуть участников"
                        : "Collapse participants"
                  }
                  className="h-7 w-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                >
                  {isGroupPermissionsParticipantsCollapsed ? (
                    <Maximize2 className="size-3.5" />
                  ) : (
                    <Minimize2 className="size-3.5" />
                  )}
                </Button>
              </div>
              {!isGroupPermissionsParticipantsCollapsed ? (
                <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                  {groupParticipants.map((member) => {
                    const initials = member.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("");
                    const roleLabel =
                      member.role === "owner"
                        ? t("owner")
                        : member.role === "admin"
                          ? t("admin")
                          : null;
                    const roleClassName =
                      member.role === "owner"
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                        : "border-primary/40 bg-primary/10 text-primary";
                    const hasMemberActions =
                      member.canPromote ||
                      member.canDemote ||
                      member.canTransferOwnership ||
                      member.canRemove;

                    return (
                      <div
                        key={`group-member-dialog-${member.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          {member.avatarUrl ? (
                            <span
                              className="inline-flex size-8 shrink-0 rounded-full bg-zinc-700 bg-cover bg-center"
                              style={{ backgroundImage: `url(${member.avatarUrl})` }}
                              aria-label={`${member.name} avatar`}
                            />
                          ) : (
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold text-zinc-100">
                              {initials || member.username.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm text-zinc-100">
                              {member.name}
                              {member.isCurrentUser ? ` ${t("youLabel")}` : ""}
                            </p>
                            <p className="truncate text-xs text-zinc-500">@{member.username}</p>
                          </div>
                        </div>
                        {roleLabel || hasMemberActions ? (
                          <div className="flex items-center gap-1.5">
                            {roleLabel ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleClassName}`}
                              >
                                {roleLabel}
                              </span>
                            ) : null}
                            {hasMemberActions ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100"
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className={chatActionMenuContentClassName}
                                >
                                  {member.canPromote ? (
                                    <DropdownMenuItem
                                      className={chatActionMenuItemClassName}
                                      onSelect={() =>
                                        void updateSelectedGroupMemberRole(member.id, "admin")
                                      }
                                    >
                                      {t("promoteToAdmin")}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {member.canDemote ? (
                                    <DropdownMenuItem
                                      className={chatActionMenuItemClassName}
                                      onSelect={() =>
                                        void updateSelectedGroupMemberRole(member.id, "member")
                                      }
                                    >
                                      {t("demoteToMember")}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {member.canTransferOwnership ? (
                                    <>
                                      {member.canPromote || member.canDemote ? (
                                        <DropdownMenuSeparator
                                          className={chatActionMenuSeparatorClassName}
                                        />
                                      ) : null}
                                      <DropdownMenuItem
                                        className={chatActionMenuItemClassName}
                                        onSelect={() =>
                                          void transferSelectedGroupOwnership(member.id)
                                        }
                                      >
                                        {t("transferOwnership")}
                                      </DropdownMenuItem>
                                    </>
                                  ) : null}
                                  {member.canRemove ? (
                                    <>
                                      {member.canPromote ||
                                      member.canDemote ||
                                      member.canTransferOwnership ? (
                                        <DropdownMenuSeparator
                                          className={chatActionMenuSeparatorClassName}
                                        />
                                      ) : null}
                                      <DropdownMenuItem
                                        variant="destructive"
                                        className={chatActionMenuDestructiveItemClassName}
                                        onSelect={() =>
                                          void removeMemberFromSelectedGroup(member.id)
                                        }
                                      >
                                        {t("removeMember")}
                                      </DropdownMenuItem>
                                    </>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(
          isGroupProfile &&
            canManageSelectedGroup &&
            !isSelectedChannel &&
            isGroupSettingsOpen &&
            isGroupInvitationsDialogOpen
        )}
        onOpenChange={(open) => {
          setIsGroupInvitationsDialogOpen(open);
          if (open) {
            setGroupInviteUsageLimitDraft(String(selectedGroupInviteUsageLimit));
          }
          if (!open) {
            setGroupMemberSearchDraft("");
            setGroupInviteUsageLimitDraft(String(selectedGroupInviteUsageLimit));
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {language === "ru" ? "Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р Р‹Р РЋРЎСџР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎС™Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В»Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’В°Р В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р В РІР‚В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В РІР‚в„ўР вЂ™Р’В¬Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р Р†Р вЂљРІвЂћСћР В РІР‚в„ўР вЂ™Р’ВµР В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р вЂ™Р’В¦Р В Р’В Р вЂ™Р’В Р В РІР‚в„ўР вЂ™Р’В Р В Р’В Р В Р вЂ№Р В Р вЂ Р В РІР‚С™Р вЂ™Р’ВР В Р’В Р вЂ™Р’В Р В Р’В Р В РІР‚в„–Р В Р’В Р вЂ™Р’В Р В Р’В Р В Р РЏ" : "Invitations"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {selectedGroupChat?.name ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">{t("groupMembersLimitHint")}</p>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-2.5">
              <p className="text-xs font-medium text-zinc-300">
                {selectedGroupCurrentAccessType === "public"
                  ? t("publicGroupLink")
                  : t("groupInviteLink")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={
                    selectedGroupCurrentAccessType === "public" &&
                    selectedGroupChat?.groupUsername
                      ? buildMessengerGroupJoinLink({
                          username: selectedGroupChat.groupUsername,
                        })
                      : selectedGroupInviteLink
                  }
                  readOnly
                  className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 border-zinc-600 bg-zinc-800 px-2.5 text-zinc-200 hover:bg-zinc-700"
                  onClick={() =>
                    void copyGroupLink(
                      selectedGroupCurrentAccessType === "public" &&
                        selectedGroupChat?.groupUsername
                        ? buildMessengerGroupJoinLink({
                            username: selectedGroupChat.groupUsername,
                          })
                        : selectedGroupInviteLink
                    )
                  }
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
            {selectedGroupCurrentAccessType === "private" ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-300">{t("inviteUsageLimit")}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{t("inviteUsageLimitHint")}</p>
                  </div>
                  <span className="rounded-full border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                    {isGroupInviteUsageLimitDraftValid
                      ? normalizedGroupInviteUsageLimitDraft === 0
                        ? t("inviteUsageUnlimited")
                        : normalizedGroupInviteUsageLimitDraft
                      : "—"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GROUP_INVITE_USAGE_PRESET_VALUES.map((presetValue) => (
                    <Button
                      key={`invite-usage-preset-${presetValue}`}
                      type="button"
                      variant="outline"
                      className={`h-8 border px-2 text-[11px] ${
                        parsedGroupInviteUsageLimitDraft === presetValue
                          ? "border-primary/70 bg-primary/20 text-primary"
                          : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      }`}
                      onClick={() => handleGroupInviteUsagePresetSelect(presetValue)}
                    >
                      {presetValue === 0
                        ? t("inviteUsageUnlimited")
                        : presetValue === 1
                          ? t("inviteUsageOne")
                          : t("inviteUsageFive")}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 border px-2 text-[11px] ${
                      isCustomGroupInviteUsagePresetSelected
                        ? "border-primary/70 bg-primary/20 text-primary"
                        : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    }`}
                    onClick={focusGroupInviteUsageInput}
                  >
                    {t("inviteUsageCustom")}
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-[2.25rem,1fr,2.25rem] items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-9 border-zinc-600 bg-zinc-800 px-0 text-lg text-zinc-200 hover:bg-zinc-700"
                    onClick={() => adjustGroupInviteUsageLimitDraft(-1)}
                    disabled={
                      isSavingGroupInviteUsageLimit || normalizedGroupInviteUsageLimitDraft <= 0
                    }
                  >
                    -
                  </Button>
                  <Input
                    ref={groupInviteUsageInputRef}
                    value={groupInviteUsageLimitDraft}
                    onChange={(event) =>
                      handleGroupInviteUsageLimitDraftChange(event.target.value)
                    }
                    onBlur={handleGroupInviteUsageLimitDraftBlur}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-9 border-zinc-700 bg-zinc-800 text-center text-sm font-medium text-zinc-100"
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-9 border-zinc-600 bg-zinc-800 px-0 text-lg text-zinc-200 hover:bg-zinc-700"
                    onClick={() => adjustGroupInviteUsageLimitDraft(1)}
                    disabled={isSavingGroupInviteUsageLimit}
                  >
                    +
                  </Button>
                </div>
                <Button
                  type="button"
                  className="mt-2 h-9 w-full rounded-lg bg-primary px-3 text-xs text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void updateSelectedGroupInviteUsageLimit()}
                  disabled={
                    isSavingGroupInviteUsageLimit ||
                    !isGroupInviteUsageLimitDraftValid ||
                    isGroupInviteUsageLimitDraftUnchanged
                  }
                >
                  {t("inviteUsageSet")}
                </Button>
                {!isGroupInviteUsageLimitDraftValid ? (
                  <p className="mt-1 text-[11px] text-amber-300">{t("invalidInviteUsageLimit")}</p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-2">
                    <p className="text-zinc-500">{t("inviteUsageUsed")}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">
                      {selectedGroupInviteUsedCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-2">
                    <p className="text-zinc-500">{t("inviteUsageRemaining")}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">
                      {selectedGroupInviteRemainingUses === null
                        ? t("inviteUsageUnlimited")
                        : selectedGroupInviteRemainingUses}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={groupMemberSearchDraft}
                onChange={(event) => setGroupMemberSearchDraft(event.target.value)}
                className="h-9 border-zinc-600 bg-zinc-800 pl-8 text-sm text-zinc-100 placeholder:text-zinc-400"
                placeholder={t("addMembers")}
              />
            </div>
            {groupAddCandidates.length > 0 ? (
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                {groupAddCandidates.map((candidate) => (
                  <button
                    key={`group-add-dialog-${candidate.id}`}
                    type="button"
                    onClick={() => void addMemberToSelectedGroup(candidate.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-left text-xs text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                  >
                    <span className="truncate">{`${candidate.name} (@${candidate.username})`}</span>
                    <Plus className="size-3.5 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            ) : groupMemberSearchDraft.trim().length > 0 ? (
              <p className="text-xs text-zinc-500">{t("noChatsOrUsersFound")}</p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isShareContactDialogOpen}
        onOpenChange={(open) => {
          setIsShareContactDialogOpen(open);
          if (!open) {
            setShareContactQuery("");
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {t("shareContact")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("selectChatToShareContact")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t("searchChat")}
                className="h-10 rounded-lg border-zinc-700 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-400"
                value={shareContactQuery}
                onChange={(event) => setShareContactQuery(event.target.value)}
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
              {shareContactTargetChats.length > 0 ? (
                shareContactTargetChats.map((chat) => (
                  <button
                    key={`share-contact-chat-${chat.id}`}
                    type="button"
                    onClick={() => void sendSharedContactToChat(chat.id)}
                    disabled={isSharingContact}
                    className="flex w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-left text-sm text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{chat.name}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {chat.username}
                      </span>
                    </span>
                    <ShareContactIcon className="size-4 shrink-0 text-zinc-300" />
                  </button>
                ))
              ) : (
                <p className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  {t("noChatsOrUsersFound")}
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isSharingContact}
              className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <div className="flex h-10 items-center px-2 text-xs text-zinc-400">
              {isSharingContact ? t("sharingContact") : ""}
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={forwardMessageDraft !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeForwardMessageDialog();
          }
        }}
      >
        <AlertDialogContent className="border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {t("forwardMessageTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("selectChatsToForward")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t("searchChat")}
                className="h-10 rounded-lg border-zinc-700 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-400"
                value={forwardQuery}
                onChange={(event) => setForwardQuery(event.target.value)}
                disabled={isForwardingMessage}
              />
            </div>
            <div className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {t("forwardingMessage")}
              </p>
              <p className="mt-1 truncate text-sm text-zinc-100">
                {forwardMessagePreview}
              </p>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
              {forwardTargetChats.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {forwardTargetChats.map((chat) => {
                    const selected = selectedForwardTargetIds.has(chat.id);
                    return (
                      <button
                        key={`forward-message-chat-${chat.id}`}
                        type="button"
                        onClick={() => toggleForwardTargetChatSelection(chat.id)}
                        disabled={isForwardingMessage}
                        className={`relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected
                            ? "border-primary/70 bg-zinc-700 text-zinc-100"
                            : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                        }`}
                      >
                        {chat.avatarUrl ? (
                          <span
                            className="inline-flex size-11 shrink-0 rounded-full bg-zinc-700 bg-cover bg-center"
                            style={{ backgroundImage: `url(${chat.avatarUrl})` }}
                            aria-label={`${chat.name} avatar`}
                          />
                        ) : (
                          <span
                            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${chat.accent}`}
                          >
                            {chat.isGroup ? (
                              <Users className="size-4" />
                            ) : chat.isFavorites ? (
                              <Bookmark className="size-4" />
                            ) : (
                              chat.name.slice(0, 2).toUpperCase()
                            )}
                          </span>
                        )}
                        <span className="w-full truncate text-[11px] font-medium leading-tight">
                          {chat.name}
                        </span>
                        {selected ? (
                          <span className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-zinc-50">
                            <Check className="size-3.5" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  {t("noChatsOrUsersFound")}
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isForwardingMessage}
              className="h-10 rounded-lg border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={
                isForwardingMessage ||
                forwardMessageDraft === null ||
                forwardTargetChatIds.length === 0
              }
              className="h-10 gap-2 rounded-lg bg-primary px-4 text-zinc-50 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void forwardMessageToSelectedChats()}
            >
              {isForwardingMessage ? (
                t("forwarding")
              ) : (
                <>
                  <ForwardUpIcon className="size-4" />
                  {t("forwardMessageAction")}
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={privacyPickerField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPrivacyPickerField(null);
            setPrivacyPickerQuery("");
          }
        }}
      >
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 relative grid h-[min(70vh,560px)] w-[min(92vw,520px)] max-w-none grid-rows-[auto_auto_1fr] border border-zinc-800/90 bg-zinc-950/90 text-zinc-100 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              setPrivacyPickerField(null);
              setPrivacyPickerQuery("");
            }}
            aria-label={t("closeViewer")}
            className="absolute right-4 top-4 rounded-md border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-300 hover:border-primary hover:text-primary"
          >
            <X className="size-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {privacyPickerField === "lastSeen"
                ? t("lastSeenVisibility")
                : privacyPickerField === "avatar"
                  ? t("avatarVisibility")
                : privacyPickerField === "birthday"
                  ? t("birthdayVisibility")
                : privacyPickerField === "call"
                  ? t("callVisibility")
                : privacyPickerField === "forward"
                  ? t("forwardVisibility")
                : privacyPickerField === "groupAdd"
                  ? t("groupAddVisibility")
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
                          ? "border-primary/70 bg-zinc-700 text-zinc-100"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                      }`}
                    >
                      <span className="truncate">
                        {user.name} (@{user.username})
                      </span>
                      {selected ? <Check className="size-4 text-primary" /> : null}
                    </button>
                  );
                })
              ) : null}
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </main>
      {callNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[120] -translate-x-1/2 rounded-lg border border-zinc-800/90 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-100 shadow-xl ring-1 ring-white/5 backdrop-blur-xl">
          {callNotice}
        </div>
      ) : null}
      <ModerationPanel
        isOpen={isAdminPanelOpen && isAdminAccount}
        language={language}
        isLoading={isAdminPanelLoading}
        isActionPending={isAdminActionPending}
        reports={adminReports}
        sanctions={adminSanctions}
        auditLogs={adminAuditLogs}
        onClose={closeModerationPanel}
        onRefresh={() => {
          void loadModerationPanelData();
        }}
        onAction={(payload) => {
          void runModerationAction(payload);
        }}
        formatDateTime={formatAbsoluteDateTime}
      />
      {toast ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-[125] flex w-[min(92vw,560px)] -translate-x-1/2 items-center justify-between gap-3 overflow-hidden rounded-xl border border-zinc-600 bg-zinc-900/95 px-4 py-3 text-sm text-zinc-100 shadow-2xl backdrop-blur">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary/80"
            style={{
              width: `${toastProgress}%`,
              transition: `width ${UNDO_WINDOW_MS}ms linear`,
            }}
          />
          <p className="min-w-0 flex-1 truncate">{toast.message}</p>
          <div className="flex items-center gap-2">
            {toast.action ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-md border border-zinc-500 !bg-zinc-800 px-3 text-xs font-medium text-zinc-100 hover:!border-primary hover:!bg-zinc-700 hover:!text-primary"
                onClick={toast.action.onClick}
              >
                {toast.action.label}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("cancel")}
              className="h-8 w-8 rounded-md border border-zinc-600 !bg-zinc-800 text-zinc-300 hover:!border-zinc-500 hover:!bg-zinc-700 hover:!text-zinc-100"
              onClick={dismissToast}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
      {callSession ? (
        <div
          ref={callOverlayRef}
          className={
            isCallFullscreen
              ? uiTheme === "light"
                ? "fixed inset-0 z-[130] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),rgba(241,245,249,0.95)_60%)] p-3 sm:p-5"
                : "fixed inset-0 z-[130] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(63,63,70,0.35),rgba(9,9,11,0.98)_55%)] p-3 sm:p-5"
              : "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[120] w-[min(96vw,460px)] rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 text-zinc-100 shadow-2xl backdrop-blur"
          }
        >
          <div
            className={
              isCallFullscreen
                ? "mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4"
                : ""
            }
          >
            <div
              className={
                isCallFullscreen
                  ? "flex items-start justify-between gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-3 backdrop-blur-xl"
                  : "flex items-start justify-between gap-3"
              }
            >
              <div className="min-w-0">
                <p
                  className={`truncate font-semibold ${
                    isCallFullscreen ? "text-base sm:text-lg text-zinc-50" : "text-sm"
                  }`}
                >
                  {callTitle}
                </p>
                <p className={`mt-1 ${isCallFullscreen ? "text-sm text-zinc-300" : "text-xs text-zinc-400"}`}>
                  {callStatusText}
                </p>
                {callParticipantsSummary ? (
                  <p
                    className={`mt-1 truncate ${
                      isCallFullscreen ? "text-xs text-zinc-400" : "text-[11px] text-zinc-500"
                    }`}
                  >
                    {callParticipantsSummary}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void toggleCallFullscreen()}
                aria-label={isCallFullscreen ? t("closeFullscreenCall") : t("openFullscreenCall")}
                className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                {isCallFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
            </div>

            {isCallFullscreen ? (
              <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/65">
                  {isScreenSharing ? (
                    <>
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(element) => {
                          if (!element) {
                            return;
                          }
                          const stream = localCallStreamRef.current;
                          if (!stream || stream.getVideoTracks().length === 0) {
                            element.srcObject = null;
                            return;
                          }
                          element.srcObject = stream;
                          void element.play().catch(() => undefined);
                        }}
                        className="h-full w-full object-cover"
                      />
                      <p className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white">
                        {t("you")}
                      </p>
                    </>
                  ) : callRemoteUserIds.length > 0 ? (
                    (() => {
                      const primaryPeerId = callRemoteUserIds[0];
                      if (!primaryPeerId) {
                        return null;
                      }
                      const primaryStream = callRemoteStreamsRef.current.get(primaryPeerId) ?? null;
                      const hasPrimaryVideo = Boolean(
                        primaryStream && primaryStream.getVideoTracks().length > 0
                      );
                      return (
                        <>
                          <video
                            autoPlay
                            playsInline
                            ref={(element) => registerRemoteMediaElement(primaryPeerId, element)}
                            className={hasPrimaryVideo ? "h-full w-full object-cover" : "hidden"}
                          />
                          {!hasPrimaryVideo ? (
                            <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center text-sm text-zinc-300">
                              {resolveCallPeerName(primaryPeerId)}
                            </div>
                          ) : null}
                          <p className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white">
                            {resolveCallPeerName(primaryPeerId)}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-200">
                        <Phone className="size-6" />
                      </div>
                      <p className="text-lg font-semibold text-zinc-100">{callTitle}</p>
                      <p className="text-sm text-zinc-400">{callStatusText}</p>
                    </div>
                  )}
                </div>

                <div className="min-h-0 rounded-2xl border border-zinc-700/80 bg-zinc-900/55 p-3 backdrop-blur-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-zinc-400">
                    {t("participants")}
                  </p>
                  <div className="mt-2 grid max-h-full gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                    {(() => {
                      const sidebarPeerIds = isScreenSharing
                        ? callRemoteUserIds
                        : callRemoteUserIds.slice(1);
                      if (sidebarPeerIds.length === 0) {
                        return (
                          <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-zinc-700/70 bg-zinc-950/50 px-3 text-center text-xs text-zinc-400">
                            {callParticipantsSummary || t("inCall")}
                          </div>
                        );
                      }
                      return sidebarPeerIds.map((peerUserId) => {
                        const remoteStream = callRemoteStreamsRef.current.get(peerUserId) ?? null;
                        const hasVideo = Boolean(
                          remoteStream && remoteStream.getVideoTracks().length > 0
                        );
                        return (
                          <div
                            key={`call-fullscreen-peer-${peerUserId}`}
                            className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/70"
                          >
                            <video
                              autoPlay
                              playsInline
                              ref={(element) => registerRemoteMediaElement(peerUserId, element)}
                              className={hasVideo ? "h-28 w-full object-cover" : "hidden"}
                            />
                            {!hasVideo ? (
                              <div className="flex h-24 items-center justify-center px-3 text-center text-xs text-zinc-400">
                                {resolveCallPeerName(peerUserId)}
                              </div>
                            ) : null}
                            <p className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                              {resolveCallPeerName(peerUserId)}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : callSession.isGroup || isScreenSharing || callRemoteUserIds.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {isScreenSharing ? (
                  <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/70">
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(element) => {
                        if (!element) {
                          return;
                        }
                        const stream = localCallStreamRef.current;
                        if (!stream || stream.getVideoTracks().length === 0) {
                          element.srcObject = null;
                          return;
                        }
                        element.srcObject = stream;
                        void element.play().catch(() => undefined);
                      }}
                      className="h-full min-h-[110px] w-full object-cover"
                    />
                    <p className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[11px] text-white">
                      {t("you")}
                    </p>
                  </div>
                ) : null}
                {callRemoteUserIds.map((peerUserId) => {
                  const remoteStream = callRemoteStreamsRef.current.get(peerUserId) ?? null;
                  const hasVideo = Boolean(remoteStream && remoteStream.getVideoTracks().length > 0);
                  return (
                    <div
                      key={`call-peer-${peerUserId}`}
                      className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/70"
                    >
                      <video
                        autoPlay
                        playsInline
                        ref={(element) => registerRemoteMediaElement(peerUserId, element)}
                        className={hasVideo ? "h-full min-h-[110px] w-full object-cover" : "hidden"}
                      />
                      {!hasVideo ? (
                        <div className="flex min-h-[110px] items-center justify-center px-3 text-center text-xs text-zinc-400">
                          {resolveCallPeerName(peerUserId)}
                        </div>
                      ) : null}
                      <p className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[11px] text-white">
                        {resolveCallPeerName(peerUserId)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div
              className={
                isCallFullscreen
                  ? "mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-3 backdrop-blur-xl"
                  : "mt-3 flex flex-wrap items-center gap-2"
              }
            >
              {callSession.phase === "incoming" ? (
                <>
                  <Button
                    type="button"
                    onClick={() => void declineIncomingCall()}
                    className={`flex-1 border border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 ${
                      isCallFullscreen ? "h-11 rounded-xl" : "h-10 rounded-lg"
                    }`}
                  >
                    {t("declineCall")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void acceptIncomingCall()}
                    className={`flex-1 bg-primary text-zinc-50 hover:bg-primary/90 ${
                      isCallFullscreen ? "h-11 rounded-xl" : "h-10 rounded-lg"
                    }`}
                  >
                    {t("acceptCall")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={isCallSoundMuted ? t("unmuteSound") : t("muteSound")}
                    onClick={toggleCallSoundMute}
                    className={`border ${
                      isCallFullscreen ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-lg"
                    } ${
                      isCallSoundMuted
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                        : "border-zinc-600 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {isCallSoundMuted ? (
                      <VolumeX className="size-4" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={isCallMicMuted ? t("unmuteMic") : t("muteMic")}
                    onClick={toggleCallMicMute}
                    className={`border ${
                      isCallFullscreen ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-lg"
                    } ${
                      isCallMicMuted
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                        : "border-zinc-600 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {isCallMicMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={isScreenSharing ? t("stopShareScreen") : t("shareScreen")}
                    onClick={() => {
                      if (isScreenSharing) {
                        void stopScreenShare();
                        return;
                      }
                      void startScreenShare();
                    }}
                    className={`border ${
                      isCallFullscreen ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-lg"
                    } ${
                      isScreenSharing
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                        : "border-zinc-600 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {isScreenSharing ? (
                      <ScreenShareOff className="size-4" />
                    ) : (
                      <ScreenShare className="size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void hangupCurrentCall()}
                    className={`border border-red-500/70 bg-red-500/20 text-red-100 hover:bg-red-500/30 ${
                      isCallFullscreen ? "h-11 min-w-[148px] rounded-xl" : "h-10 min-w-[132px] rounded-lg"
                    }`}
                  >
                    <PhoneOff className="size-4" />
                    {t("endCall")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {viewerImage ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            type="button"
            aria-label={t("closeViewer")}
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] rounded-full border border-zinc-600 bg-zinc-950/85 p-2 text-zinc-200 hover:border-primary hover:text-primary"
            onClick={closeImageViewer}
          >
            <X className="size-5" />
          </button>
          {viewerImage.downloadBlocked ? (
            <button
              type="button"
              aria-label={t("download")}
              onClick={showGroupContentProtectionBlockedToast}
              className="absolute right-16 top-[calc(env(safe-area-inset-top)+1rem)] rounded-full border border-zinc-600 bg-zinc-950/85 p-2 text-zinc-200 hover:border-zinc-500"
            >
              <Download className="size-5" />
            </button>
          ) : (
            <a
              href={viewerImage.url}
              download={viewerImage.name}
              aria-label={t("download")}
              className="absolute right-16 top-[calc(env(safe-area-inset-top)+1rem)] rounded-full border border-zinc-600 bg-zinc-950/85 p-2 text-zinc-200 hover:border-primary hover:text-primary"
            >
              <Download className="size-5" />
            </a>
          )}
          {viewerImages.length > 1 ? (
            <>
              <button
                type="button"
                aria-label={t("previousImage")}
                className="absolute left-3 rounded-full border border-zinc-600 bg-zinc-950/85 p-2 text-zinc-200 hover:border-primary hover:text-primary sm:left-6"
                onClick={showPreviousImage}
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label={t("nextImage")}
                className="absolute right-3 rounded-full border border-zinc-600 bg-zinc-950/85 p-2 text-zinc-200 hover:border-primary hover:text-primary sm:right-6"
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
              onContextMenu={
                viewerImage.downloadBlocked
                  ? (event) => {
                      event.preventDefault();
                      showGroupContentProtectionBlockedToast();
                    }
                  : undefined
              }
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
      <style jsx global>{`
        html[data-clore-font-family="default"] body {
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }
        html[data-clore-font-family="modern"] body {
          font-family: "Avenir Next", "Futura", "Trebuchet MS", "Segoe UI", sans-serif;
        }
        html[data-clore-font-family="readable"] body {
          font-family: "Verdana", "Tahoma", "Segoe UI", sans-serif;
        }
        html[data-clore-font-family="comfortaa"] body {
          font-family: var(--font-comfortaa), "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }

        html[data-clore-font-size="small"] body {
          font-size: 12px;
        }
        html[data-clore-font-size="default"] body {
          font-size: 14px;
        }
        html[data-clore-font-size="large"] body {
          font-size: 16px;
        }
        html[data-clore-font-size="small"] .text-xs { font-size: 0.65rem !important; line-height: 1rem !important; }
        html[data-clore-font-size="small"] .text-sm { font-size: 0.75rem !important; line-height: 1.1rem !important; }
        html[data-clore-font-size="small"] .text-base { font-size: 0.85rem !important; line-height: 1.2rem !important; }
        html[data-clore-font-size="small"] .text-lg { font-size: 0.95rem !important; line-height: 1.3rem !important; }
        html[data-clore-font-size="small"] .text-\[11px\] { font-size: 0.65rem !important; }
        html[data-clore-font-size="small"] .text-\[12px\] { font-size: 0.7rem !important; }
        html[data-clore-font-size="small"] .text-\[13px\] { font-size: 0.75rem !important; }
        html[data-clore-font-size="small"] .text-\[15px\] { font-size: 0.85rem !important; }
        html[data-clore-font-size="small"] .text-\[16px\] { font-size: 0.9rem !important; }
        html[data-clore-font-size="small"] .text-\[17px\] { font-size: 0.95rem !important; }

        html[data-clore-font-size="large"] .text-xs { font-size: 0.9rem !important; line-height: 1.35rem !important; }
        html[data-clore-font-size="large"] .text-sm { font-size: 1rem !important; line-height: 1.5rem !important; }
        html[data-clore-font-size="large"] .text-base { font-size: 1.1rem !important; line-height: 1.6rem !important; }
        html[data-clore-font-size="large"] .text-lg { font-size: 1.2rem !important; line-height: 1.7rem !important; }
        html[data-clore-font-size="large"] .text-\[11px\] { font-size: 0.9rem !important; }
        html[data-clore-font-size="large"] .text-\[12px\] { font-size: 0.95rem !important; }
        html[data-clore-font-size="large"] .text-\[13px\] { font-size: 1rem !important; }
        html[data-clore-font-size="large"] .text-\[15px\] { font-size: 1.1rem !important; }
        html[data-clore-font-size="large"] .text-\[16px\] { font-size: 1.15rem !important; }
        html[data-clore-font-size="large"] .text-\[17px\] { font-size: 1.2rem !important; }

        .clore-chat-font-small .text-xs { font-size: 0.65rem !important; line-height: 1rem !important; }
        .clore-chat-font-small .text-sm { font-size: 0.75rem !important; line-height: 1.1rem !important; }
        .clore-chat-font-small .text-base { font-size: 0.85rem !important; line-height: 1.2rem !important; }
        .clore-chat-font-small .text-lg { font-size: 0.95rem !important; line-height: 1.3rem !important; }
        .clore-chat-font-small .text-\[11px\] { font-size: 0.65rem !important; }
        .clore-chat-font-small .text-\[12px\] { font-size: 0.7rem !important; }
        .clore-chat-font-small .text-\[13px\] { font-size: 0.75rem !important; }
        .clore-chat-font-small .text-\[15px\] { font-size: 0.85rem !important; }
        .clore-chat-font-small .text-\[16px\] { font-size: 0.9rem !important; }
        .clore-chat-font-small .text-\[17px\] { font-size: 0.95rem !important; }

        .clore-chat-font-large .text-xs { font-size: 0.9rem !important; line-height: 1.35rem !important; }
        .clore-chat-font-large .text-sm { font-size: 1rem !important; line-height: 1.5rem !important; }
        .clore-chat-font-large .text-base { font-size: 1.1rem !important; line-height: 1.6rem !important; }
        .clore-chat-font-large .text-lg { font-size: 1.2rem !important; line-height: 1.7rem !important; }
        .clore-chat-font-large .text-\[11px\] { font-size: 0.9rem !important; }
        .clore-chat-font-large .text-\[12px\] { font-size: 0.95rem !important; }
        .clore-chat-font-large .text-\[13px\] { font-size: 1rem !important; }
        .clore-chat-font-large .text-\[15px\] { font-size: 1.1rem !important; }
        .clore-chat-font-large .text-\[16px\] { font-size: 1.15rem !important; }
        .clore-chat-font-large .text-\[17px\] { font-size: 1.2rem !important; }

        html[data-clore-radius="sharp"] .rounded-sm { border-radius: 0.2rem !important; }
        html[data-clore-radius="sharp"] .rounded-md { border-radius: 0.25rem !important; }
        html[data-clore-radius="sharp"] .rounded-lg { border-radius: 0.35rem !important; }
        html[data-clore-radius="sharp"] .rounded-xl { border-radius: 0.45rem !important; }
        html[data-clore-radius="sharp"] .rounded-2xl { border-radius: 0.55rem !important; }
        html[data-clore-radius="sharp"] .rounded-3xl { border-radius: 0.7rem !important; }

        html[data-clore-radius="normal"] .rounded-sm { border-radius: 0.25rem !important; }
        html[data-clore-radius="normal"] .rounded-md { border-radius: 0.375rem !important; }
        html[data-clore-radius="normal"] .rounded-lg { border-radius: 0.5rem !important; }
        html[data-clore-radius="normal"] .rounded-xl { border-radius: 0.75rem !important; }
        html[data-clore-radius="normal"] .rounded-2xl { border-radius: 1rem !important; }
        html[data-clore-radius="normal"] .rounded-3xl { border-radius: 1.5rem !important; }

        html[data-clore-radius="rounded"] .rounded-sm { border-radius: 0.45rem !important; }
        html[data-clore-radius="rounded"] .rounded-md { border-radius: 0.65rem !important; }
        html[data-clore-radius="rounded"] .rounded-lg { border-radius: 0.85rem !important; }
        html[data-clore-radius="rounded"] .rounded-xl { border-radius: 1.1rem !important; }
        html[data-clore-radius="rounded"] .rounded-2xl { border-radius: 1.4rem !important; }
        html[data-clore-radius="rounded"] .rounded-3xl { border-radius: 2rem !important; }
      `}</style>
    </>
  );
}





