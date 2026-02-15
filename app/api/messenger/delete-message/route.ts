import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type DeleteMessagePayload = {
  userId?: string;
  chatId?: string;
  messageId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DeleteMessagePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";

  if (!userId || !chatId || !messageId) {
    return NextResponse.json(
      { error: "Missing delete message fields." },
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

      const targetMessage = store.messages.find(
        (message) => message.id === messageId && message.chatId === chatId
      );
      if (!targetMessage) {
        throw new Error("Message not found.");
      }
      if (targetMessage.authorId !== userId) {
        throw new Error("Only message author can delete this message.");
      }

      store.messages = store.messages.filter((message) => message.id !== messageId);

      const lastChatMessage = store.messages
        .filter((message) => message.chatId === chatId)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      thread.updatedAt = lastChatMessage?.createdAt ?? thread.createdAt;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete message.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Message not found."
          ? 404
          : message === "Only message author can delete this message."
            ? 403
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
