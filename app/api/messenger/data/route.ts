import { NextResponse } from "next/server";

import { assertUserCanReadMessenger } from "@/lib/server/admin";
import {
  BOT_USER_ID,
  getBotPublicUser,
  getStore,
  type StoredChatMessage,
  toPublicUser,
  updateStore,
} from "@/lib/server/store";
import { AI_FEATURE_ENABLED } from "@/lib/shared/ai-feature";

type VisibilityScope = "everyone" | "contacts" | "nobody";
type NextVisibilityScope = "everyone" | "selected" | "nobody";
const LAST_SEEN_HEARTBEAT_MS = 15_000;
const ONLINE_STATUS_WINDOW_MS = 20_000;
const FAVORITES_CHAT_ID = "__favorites__";

function isPendingScheduledMessageForAuthor(
  message: StoredChatMessage,
  userId: string,
  now: number
): boolean {
  return message.authorId === userId && message.createdAt > now;
}

function getPendingScheduledMessageMarker(message: StoredChatMessage): number {
  return message.scheduledAt > 0 ? message.scheduledAt : message.createdAt;
}

function canViewByVisibility(
  visibility: VisibilityScope | NextVisibilityScope,
  allowedUserIds: string[],
  isSelf: boolean,
  viewerId: string,
  isContact: boolean
) {
  if (isSelf) {
    return true;
  }
  if (visibility === "everyone") {
    return true;
  }
  if (visibility === "selected") {
    return allowedUserIds.includes(viewerId);
  }
  if (visibility === "contacts") {
    return isContact;
  }
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";
  const sinceRaw = searchParams.get("since")?.trim() ?? "";
  const since = Number.parseInt(sinceRaw, 10);
  const hasSince = Number.isFinite(since) && since > 0;
  const now = Date.now();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const store = await getStore();
  const requester = store.users.find((candidate) => candidate.id === userId);
  if (!requester) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  try {
    assertUserCanReadMessenger(store, userId, now);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Your account is suspended.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  // Heartbeat writes are throttled to avoid a DB write on every poll.
  if (now - requester.lastSeenAt >= LAST_SEEN_HEARTBEAT_MS) {
    await updateStore<void>((mutableStore) => {
      const mutableRequester = mutableStore.users.find(
        (candidate) => candidate.id === userId
      );
      if (!mutableRequester) {
        return;
      }
      if (now - mutableRequester.lastSeenAt >= LAST_SEEN_HEARTBEAT_MS) {
        mutableRequester.lastSeenAt = now;
      }
    }).catch(() => undefined);
    requester.lastSeenAt = now;
  }

  const allThreads = store.threads
    .filter((thread) => thread.memberIds.includes(userId))
    .filter((thread) =>
      AI_FEATURE_ENABLED
        ? true
        : thread.threadType === "group" || !thread.memberIds.includes(BOT_USER_ID)
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const contactIds = new Set<string>();
  for (const thread of allThreads) {
    for (const memberId of thread.memberIds) {
      if (memberId !== userId) {
        contactIds.add(memberId);
      }
    }
  }

  const users = store.users
    .filter((user) => AI_FEATURE_ENABLED || user.id !== BOT_USER_ID)
    .map((user) => {
      const publicUser = toPublicUser(user);
      const isSelf = user.id === userId;
      const isContact = contactIds.has(user.id);
      const canViewLastSeen = canViewByVisibility(
        publicUser.lastSeenVisibility,
        publicUser.lastSeenAllowedUserIds,
        isSelf,
        userId,
        isContact
      );
      const isOnline =
        publicUser.lastSeenAt > 0 &&
        now - publicUser.lastSeenAt <= ONLINE_STATUS_WINDOW_MS;
      const canViewAvatar = canViewByVisibility(
        publicUser.avatarVisibility,
        publicUser.avatarAllowedUserIds,
        isSelf,
        userId,
        isContact
      );
      const canViewBio = canViewByVisibility(
        publicUser.bioVisibility,
        publicUser.bioAllowedUserIds,
        isSelf,
        userId,
        isContact
      );
      const canViewBirthday = canViewByVisibility(
        publicUser.birthdayVisibility,
        publicUser.birthdayAllowedUserIds,
        isSelf,
        userId,
        isContact
      );

      return {
        ...publicUser,
        blockedUserIds: isSelf ? publicUser.blockedUserIds : [],
        lastSeenAllowedUserIds: isSelf ? publicUser.lastSeenAllowedUserIds : [],
        avatarAllowedUserIds: isSelf ? publicUser.avatarAllowedUserIds : [],
        bioAllowedUserIds: isSelf ? publicUser.bioAllowedUserIds : [],
        birthdayAllowedUserIds: isSelf ? publicUser.birthdayAllowedUserIds : [],
        callAllowedUserIds: isSelf ? publicUser.callAllowedUserIds : [],
        forwardAllowedUserIds: isSelf ? publicUser.forwardAllowedUserIds : [],
        groupAddAllowedUserIds: isSelf ? publicUser.groupAddAllowedUserIds : [],
        showLastSeen: isOnline || (canViewLastSeen && publicUser.showLastSeen),
        lastSeenAt: canViewLastSeen || isOnline ? publicUser.lastSeenAt : 0,
        avatarUrl: canViewAvatar ? publicUser.avatarUrl : "",
        bio: canViewBio ? publicUser.bio : "",
        birthday: canViewBirthday ? publicUser.birthday : "",
        archiveLockEnabled: isSelf ? publicUser.archiveLockEnabled === true : false,
      };
    });

  if (AI_FEATURE_ENABLED && !users.some((user) => user.id === BOT_USER_ID)) {
    users.push(getBotPublicUser());
  }

  const threads = hasSince
    ? allThreads.filter((thread) => {
        if (thread.updatedAt >= since) {
          return true;
        }
        return Object.values(thread.typingBy).some((typingAt) => typingAt >= since);
      })
    : allThreads;
  const threadIds = new Set(allThreads.map((thread) => thread.id));
  const messages = store.messages
    .filter((message) => {
      const isAccessibleThreadMessage = threadIds.has(message.chatId);
      const isSelfFavoriteMessage =
        message.chatId === FAVORITES_CHAT_ID && message.authorId === userId;
      if (!isAccessibleThreadMessage && !isSelfFavoriteMessage) {
        return false;
      }
      const isPendingForAuthor = isPendingScheduledMessageForAuthor(
        message,
        userId,
        now
      );
      if (message.createdAt > now && !isPendingForAuthor) {
        return false;
      }
      const hiddenChangedAt = Math.max(0, message.hiddenFor?.[userId] ?? 0);
      if (hiddenChangedAt > 0) {
        if (!hasSince) {
          return false;
        }
        return hiddenChangedAt >= since;
      }
      if (!hasSince) {
        return true;
      }
      if (message.createdAt <= now && message.createdAt >= since) {
        return true;
      }
      if (
        isPendingForAuthor &&
        getPendingScheduledMessageMarker(message) >= since
      ) {
        return true;
      }
      const favoriteChangedAt = Math.abs(message.savedBy?.[userId] ?? 0);
      return favoriteChangedAt >= since;
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  return NextResponse.json({
    users,
    threads,
    messages,
    fullSync: !hasSince,
    serverTime: now,
  });
}
