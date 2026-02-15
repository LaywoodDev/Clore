import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type DeletePayload = {
  userId?: string;
  chatId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DeletePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json(
      { error: "Missing delete fields." },
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
      if (thread.threadType === "group" && thread.createdById !== userId) {
        throw new Error("Only group creator can delete the group.");
      }

      store.threads = store.threads.filter((candidate) => candidate.id !== chatId);
      store.messages = store.messages.filter((message) => message.chatId !== chatId);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete chat.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Only group creator can delete the group."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
