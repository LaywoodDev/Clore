import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type PinPayload = {
  userId?: string;
  chatId?: string;
  pinned?: boolean;
};

const MAX_PINNED_CHATS = 5;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PinPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const pinned = body?.pinned === true;

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing pin fields." }, { status: 400 });
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

      if (pinned) {
        const pinnedCount = store.threads.filter(
          (candidate) =>
            candidate.id !== chatId &&
            candidate.memberIds.includes(userId) &&
            candidate.pinnedBy?.[userId] === true
        ).length;
        if (pinnedCount >= MAX_PINNED_CHATS) {
          throw new Error("Pin limit reached.");
        }
      }

      thread.pinnedBy = {
        ...thread.pinnedBy,
        [userId]: pinned,
      };
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to pin chat.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Pin limit reached."
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
