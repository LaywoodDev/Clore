import { NextResponse } from "next/server";

import {
  canUserPinMessagesInThread,
  getPinnedMessageLimitForThread,
  updateStore,
} from "@/lib/server/store";

type PinMessagePayload = {
  userId?: string;
  chatId?: string;
  messageId?: string;
  pinned?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PinMessagePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";
  const pinned = body?.pinned === true;

  if (!userId || !chatId || !messageId) {
    return NextResponse.json(
      { error: "Missing pin message fields." },
      { status: 400 }
    );
  }

  try {
    await updateStore<void>((store) => {
      const thread = store.threads.find(
        (candidate) =>
          candidate.id === chatId && candidate.memberIds.includes(userId)
      );
      if (!thread) {
        throw new Error("Chat not found.");
      }
      if (!canUserPinMessagesInThread(thread, userId)) {
        throw new Error("You cannot pin messages in this chat.");
      }

      const targetMessage = store.messages.find(
        (message) => message.id === messageId && message.chatId === chatId
      );
      if (!targetMessage) {
        throw new Error("Message not found.");
      }

      if (pinned) {
        const limit = getPinnedMessageLimitForThread(thread);
        const pinnedCount = store.messages.filter(
          (message) =>
            message.chatId === chatId &&
            message.pinnedAt > 0 &&
            message.id !== messageId
        ).length;
        if (limit !== null && pinnedCount >= limit) {
          throw new Error("Pinned messages limit reached.");
        }
      }

      const now = Date.now();
      targetMessage.pinnedAt = pinned ? now : 0;
      targetMessage.pinnedByUserId = pinned ? userId : "";
      thread.updatedAt = Math.max(thread.updatedAt, now);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update pinned message.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Message not found."
          ? 404
          : message === "You cannot pin messages in this chat."
            ? 403
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
