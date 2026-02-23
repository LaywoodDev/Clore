import { NextResponse } from "next/server";

import {
  createEntityId,
  type StoredChatThread,
  updateStore,
} from "@/lib/server/store";

type OpenOrCreatePayload = {
  userId?: string;
  targetUserId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OpenOrCreatePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const targetUserId = body?.targetUserId?.trim() ?? "";

  if (!userId || !targetUserId) {
    return NextResponse.json({ error: "Missing user IDs." }, { status: 400 });
  }
  if (userId === targetUserId) {
    return NextResponse.json(
      { error: "Cannot create chat with yourself." },
      { status: 400 }
    );
  }

  try {
    const result = await updateStore<{ chatId: string; created: boolean }>((store) => {
      const user = store.users.find((candidate) => candidate.id === userId);
      const targetUser = store.users.find((candidate) => candidate.id === targetUserId);
      if (!user || !targetUser) {
        throw new Error("User not found.");
      }
      const userBlockedTarget = user.blockedUserIds.includes(targetUserId);
      const targetBlockedUser = targetUser.blockedUserIds.includes(userId);
      if (userBlockedTarget || targetBlockedUser) {
        throw new Error("Cannot open chat because one of users is blocked.");
      }

      const existing = store.threads.find(
        (thread) =>
          thread.threadType !== "group" &&
          thread.memberIds.length === 2 &&
          thread.memberIds.includes(userId) &&
          thread.memberIds.includes(targetUserId)
      );

      if (existing) {
        return {
          chatId: existing.id,
          created: false,
        };
      }

      const now = Date.now();
      const nextThread: StoredChatThread = {
        id: createEntityId("chat"),
        memberIds: [userId, targetUserId],
        threadType: "direct",
        title: "",
        avatarUrl: "",
        bannerUrl: "",
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        readBy: {
          [userId]: now,
          [targetUserId]: 0,
        },
        pinnedBy: {},
        mutedBy: {},
        typingBy: {},
        groupRoles: {},
      };
      store.threads.push(nextThread);

      return {
        chatId: nextThread.id,
        created: true,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create chat.";
    const status =
      message === "User not found."
        ? 404
        : message === "Cannot open chat because one of users is blocked."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
