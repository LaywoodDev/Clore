import { NextResponse } from "next/server";

import { toPublicUser, updateStore } from "@/lib/server/store";

type VisibilityScope = "everyone" | "contacts" | "nobody";
type NextVisibilityScope = "everyone" | "selected" | "nobody";

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

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const data = await updateStore((store) => {
    const requester = store.users.find((candidate) => candidate.id === userId);
    if (requester) {
      requester.lastSeenAt = Date.now();
    }

    const threads = store.threads
      .filter((thread) => thread.memberIds.includes(userId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const contactIds = new Set<string>();
    for (const thread of threads) {
      for (const memberId of thread.memberIds) {
        if (memberId !== userId) {
          contactIds.add(memberId);
        }
      }
    }
    const users = store.users.map((user) => {
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

      return {
        ...publicUser,
        lastSeenAllowedUserIds: isSelf ? publicUser.lastSeenAllowedUserIds : [],
        avatarAllowedUserIds: isSelf ? publicUser.avatarAllowedUserIds : [],
        bioAllowedUserIds: isSelf ? publicUser.bioAllowedUserIds : [],
        showLastSeen: canViewLastSeen && publicUser.showLastSeen,
        lastSeenAt: canViewLastSeen ? publicUser.lastSeenAt : 0,
        avatarUrl: canViewAvatar ? publicUser.avatarUrl : "",
        bio: canViewBio ? publicUser.bio : "",
      };
    });

    const threadIds = new Set(threads.map((thread) => thread.id));
    const messages = store.messages
      .filter((message) => threadIds.has(message.chatId))
      .sort((a, b) => a.createdAt - b.createdAt);

    return {
      users,
      threads,
      messages,
    };
  });

  return NextResponse.json(data);
}
