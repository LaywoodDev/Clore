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
      const hasUser = store.users.some((user) => user.id === userId);
      const hasTarget = store.users.some((user) => user.id === targetUserId);
      if (!hasUser || !hasTarget) {
        throw new Error("User not found.");
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
    const status = message === "User not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
