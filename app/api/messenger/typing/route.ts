import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";

import { canUserPostInThread, updateStore } from "@/lib/server/store";

type TypingPayload = {
  userId?: string;
  chatId?: string;
  isTyping?: boolean;
};

const TYPING_UPDATE_THROTTLE_MS = 1_200;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TypingPayload | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const chatId = body?.chatId?.trim() ?? "";
  const isTyping = body?.isTyping === true;

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing typing fields." }, { status: 400 });
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
        if (!(userId in thread.typingBy)) {
          return;
        }
        const { [userId]: _removed, ...restTypingBy } = thread.typingBy;
        thread.typingBy = restTypingBy;
        return;
      }

      const now = Date.now();
      const currentTypingAt = thread.typingBy?.[userId] ?? 0;

      if (isTyping) {
        if (now - currentTypingAt < TYPING_UPDATE_THROTTLE_MS) {
          return;
        }
        thread.typingBy = {
          ...thread.typingBy,
          [userId]: now,
        };
        return;
      }

      if (!(userId in thread.typingBy)) {
        return;
      }

      const { [userId]: _removed, ...restTypingBy } = thread.typingBy;
      thread.typingBy = restTypingBy;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update typing state.";
    const status = message === "Chat not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
