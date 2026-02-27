import { NextResponse } from "next/server";

import { canUserPostInThread, updateStore } from "@/lib/server/store";

type EditMessagePayload = {
  userId?: string;
  chatId?: string;
  messageId?: string;
  text?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as EditMessagePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";
  const text = body?.text?.trim() ?? "";

  if (!userId || !chatId || !messageId) {
    return NextResponse.json(
      { error: "Missing edit message fields." },
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
      if (!canUserPostInThread(thread, userId)) {
        throw new Error("Only channel owner or admins can edit messages.");
      }

      const targetMessage = store.messages.find(
        (message) => message.id === messageId && message.chatId === chatId
      );
      if (!targetMessage) {
        throw new Error("Message not found.");
      }
      if (targetMessage.authorId !== userId) {
        throw new Error("Only message author can edit this message.");
      }
      if (!text && targetMessage.attachments.length === 0) {
        throw new Error("Message text cannot be empty.");
      }

      const now = Date.now();
      targetMessage.text = text;
      targetMessage.editedAt = now;
      thread.updatedAt = now;
      thread.readBy = {
        ...thread.readBy,
        [userId]: now,
      };
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to edit message.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Message not found."
          ? 404
        : message === "Only message author can edit this message."
          || message === "Only channel owner or admins can edit messages."
            ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
