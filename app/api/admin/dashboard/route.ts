import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/server/admin";
import {
  getStore,
  type StoredCallSignal,
  type StoredChatMessage,
  type StoredChatThread,
  type StoredUser,
  type StoreData,
} from "@/lib/server/store";

const DEFAULT_THREAD_MESSAGE_LIMIT = 250;
const MAX_THREAD_MESSAGE_LIMIT = 1200;
const ACTIVE_CALL_SIGNAL_WINDOW_MS = 2 * 60 * 1000;

type DashboardUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  lastSeenAt: number;
  threadsCount: number;
  messagesCount: number;
  mutedUntil: number;
  bannedUntil: number;
  sanctionReason: string;
};

type DashboardThreadMember = {
  id: string;
  name: string;
  username: string;
};

type DashboardThread = {
  id: string;
  threadType: "direct" | "group";
  title: string;
  memberIds: string[];
  members: DashboardThreadMember[];
  updatedAt: number;
  createdAt: number;
  messageCount: number;
  lastMessageAt: number;
  lastMessagePreview: string;
  likelyActiveCall: boolean;
  likelyActiveCallParticipantUserIds: string[];
};

type DashboardThreadMessage = {
  id: string;
  chatId: string;
  authorUserId: string;
  authorName: string;
  authorUsername: string;
  text: string;
  attachmentsCount: number;
  createdAt: number;
};

type DashboardSelectedThread = {
  id: string;
  threadType: "direct" | "group";
  title: string;
  members: DashboardThreadMember[];
  messages: DashboardThreadMessage[];
};

type DashboardActiveCall = {
  chatId: string;
  threadTitle: string;
  threadType: "direct" | "group";
  participantUserIds: string[];
  participants: DashboardThreadMember[];
  startedAt: number;
  lastSignalAt: number;
  signalsCount: number;
};

type DashboardSnapshot = {
  generatedAt: number;
  users: DashboardUser[];
  threads: DashboardThread[];
  activeCalls: DashboardActiveCall[];
  selectedThread: DashboardSelectedThread | null;
};

function parseMessageLimit(rawValue: string | null): number {
  if (!rawValue) {
    return DEFAULT_THREAD_MESSAGE_LIMIT;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_THREAD_MESSAGE_LIMIT;
  }
  return Math.max(50, Math.min(MAX_THREAD_MESSAGE_LIMIT, parsed));
}

function toThreadMember(user: StoredUser | undefined, userId: string): DashboardThreadMember {
  return {
    id: userId,
    name: user?.name ?? "Unknown user",
    username: user?.username ?? "unknown",
  };
}

function resolveThreadTitle(
  thread: StoredChatThread,
  usersById: Map<string, StoredUser>
): string {
  if (thread.threadType === "group") {
    const fromName = thread.title.trim();
    return fromName.length > 0 ? fromName : "Group chat";
  }

  const memberNames = thread.memberIds
    .map((memberId) => usersById.get(memberId)?.name.trim() ?? "")
    .filter((value) => value.length > 0);
  if (memberNames.length >= 2) {
    return `${memberNames[0]} / ${memberNames[1]}`;
  }
  return memberNames[0] ?? "Direct chat";
}

function formatMessagePreview(message: StoredChatMessage | null): string {
  if (!message) {
    return "";
  }
  const text = message.text.trim();
  if (text.length > 0) {
    return text.slice(0, 200);
  }
  if (message.attachments.length > 0) {
    return "[Attachment]";
  }
  return "[Empty message]";
}

function buildLikelyActiveCalls(
  store: StoreData,
  usersById: Map<string, StoredUser>,
  threadsById: Map<string, StoredChatThread>,
  now: number
): {
  activeCalls: DashboardActiveCall[];
  participantsByChatId: Map<string, string[]>;
} {
  const minTimestamp = now - ACTIVE_CALL_SIGNAL_WINDOW_MS;
  const recentSignals = store.callSignals
    .filter((signal) => signal.createdAt >= minTimestamp)
    .sort((a, b) => a.createdAt - b.createdAt);
  const signalsByChatId = new Map<string, StoredCallSignal[]>();

  for (const signal of recentSignals) {
    const bucket = signalsByChatId.get(signal.chatId);
    if (bucket) {
      bucket.push(signal);
    } else {
      signalsByChatId.set(signal.chatId, [signal]);
    }
  }

  const activeCalls: DashboardActiveCall[] = [];
  const participantsByChatId = new Map<string, string[]>();

  for (const [chatId, signals] of signalsByChatId.entries()) {
    const terminalSignals = signals.filter(
      (signal) => signal.type === "hangup" || signal.type === "reject"
    );
    const nonTerminalSignals = signals.filter(
      (signal) =>
        signal.type === "offer" || signal.type === "answer" || signal.type === "ice"
    );
    if (nonTerminalSignals.length === 0) {
      continue;
    }

    const lastTerminalAt = terminalSignals.reduce(
      (max, signal) => Math.max(max, signal.createdAt),
      0
    );
    const inProgressSignals = nonTerminalSignals.filter(
      (signal) => signal.createdAt > lastTerminalAt
    );
    if (inProgressSignals.length === 0) {
      continue;
    }

    const participantUserIds = [
      ...new Set(
        inProgressSignals.flatMap((signal) => [signal.fromUserId, signal.toUserId])
      ),
    ];
    const thread = threadsById.get(chatId);
    if (!thread) {
      continue;
    }

    participantsByChatId.set(chatId, participantUserIds);
    activeCalls.push({
      chatId,
      threadTitle: resolveThreadTitle(thread, usersById),
      threadType: thread.threadType,
      participantUserIds,
      participants: participantUserIds.map((userId) =>
        toThreadMember(usersById.get(userId), userId)
      ),
      startedAt: inProgressSignals[0]?.createdAt ?? 0,
      lastSignalAt:
        inProgressSignals[inProgressSignals.length - 1]?.createdAt ??
        inProgressSignals[0]?.createdAt ??
        0,
      signalsCount: inProgressSignals.length,
    });
  }

  activeCalls.sort((a, b) => b.lastSignalAt - a.lastSignalAt);
  return {
    activeCalls,
    participantsByChatId,
  };
}

function getErrorStatus(message: string): number {
  if (message === "Missing userId.") {
    return 400;
  }
  if (message === "Forbidden.") {
    return 403;
  }
  if (message === "User not found.") {
    return 404;
  }
  return 400;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";
  const selectedThreadId = searchParams.get("threadId")?.trim() ?? "";
  const messageLimit = parseMessageLimit(searchParams.get("messageLimit"));

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const store = await getStore();
    requireAdminUser(store, userId);
    const now = Date.now();

    const usersById = new Map(store.users.map((user) => [user.id, user]));
    const threadsById = new Map(store.threads.map((thread) => [thread.id, thread]));

    const threadsCountByUserId = new Map<string, number>();
    for (const thread of store.threads) {
      for (const memberId of thread.memberIds) {
        threadsCountByUserId.set(
          memberId,
          (threadsCountByUserId.get(memberId) ?? 0) + 1
        );
      }
    }

    const messagesCountByAuthorId = new Map<string, number>();
    const messagesCountByChatId = new Map<string, number>();
    const lastMessageByChatId = new Map<string, StoredChatMessage>();
    for (const message of store.messages) {
      messagesCountByAuthorId.set(
        message.authorId,
        (messagesCountByAuthorId.get(message.authorId) ?? 0) + 1
      );
      messagesCountByChatId.set(
        message.chatId,
        (messagesCountByChatId.get(message.chatId) ?? 0) + 1
      );
      const currentLast = lastMessageByChatId.get(message.chatId);
      if (!currentLast || message.createdAt >= currentLast.createdAt) {
        lastMessageByChatId.set(message.chatId, message);
      }
    }

    const users: DashboardUser[] = store.users
      .map((user) => {
        const sanction = store.userSanctions[user.id];
        const mutedUntil = sanction?.mutedUntil ?? 0;
        const bannedUntil = sanction?.bannedUntil ?? 0;
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          lastSeenAt: user.lastSeenAt,
          threadsCount: threadsCountByUserId.get(user.id) ?? 0,
          messagesCount: messagesCountByAuthorId.get(user.id) ?? 0,
          mutedUntil: mutedUntil > now ? mutedUntil : 0,
          bannedUntil: bannedUntil > now ? bannedUntil : 0,
          sanctionReason: sanction?.reason ?? "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const { activeCalls, participantsByChatId } = buildLikelyActiveCalls(
      store,
      usersById,
      threadsById,
      now
    );

    const threads: DashboardThread[] = [...store.threads]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((thread) => {
        const lastMessage = lastMessageByChatId.get(thread.id) ?? null;
        const likelyActiveCallParticipantUserIds =
          participantsByChatId.get(thread.id) ?? [];
        return {
          id: thread.id,
          threadType: thread.threadType,
          title: resolveThreadTitle(thread, usersById),
          memberIds: [...thread.memberIds],
          members: thread.memberIds.map((memberId) =>
            toThreadMember(usersById.get(memberId), memberId)
          ),
          updatedAt: thread.updatedAt,
          createdAt: thread.createdAt,
          messageCount: messagesCountByChatId.get(thread.id) ?? 0,
          lastMessageAt: lastMessage?.createdAt ?? 0,
          lastMessagePreview: formatMessagePreview(lastMessage),
          likelyActiveCall: likelyActiveCallParticipantUserIds.length > 0,
          likelyActiveCallParticipantUserIds,
        };
      });

    let selectedThread: DashboardSelectedThread | null = null;
    if (selectedThreadId) {
      const thread = threadsById.get(selectedThreadId);
      if (thread) {
        const threadMessages = store.messages
          .filter((message) => message.chatId === selectedThreadId)
          .sort((a, b) => a.createdAt - b.createdAt)
          .slice(-messageLimit)
          .map((message) => {
            const author = usersById.get(message.authorId);
            return {
              id: message.id,
              chatId: message.chatId,
              authorUserId: message.authorId,
              authorName: author?.name ?? "Unknown user",
              authorUsername: author?.username ?? "unknown",
              text: message.text.trim(),
              attachmentsCount: message.attachments.length,
              createdAt: message.createdAt,
            };
          });
        selectedThread = {
          id: thread.id,
          threadType: thread.threadType,
          title: resolveThreadTitle(thread, usersById),
          members: thread.memberIds.map((memberId) =>
            toThreadMember(usersById.get(memberId), memberId)
          ),
          messages: threadMessages,
        };
      }
    }

    const snapshot: DashboardSnapshot = {
      generatedAt: now,
      users,
      threads,
      activeCalls,
      selectedThread,
    };

    return NextResponse.json({ snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load admin dashboard.";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
