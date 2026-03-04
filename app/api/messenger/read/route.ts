import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";

import { updateStore } from "@/lib/server/store";

type ReadPayload = {
  userId?: string;
  chatId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReadPayload | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const chatId = body?.chatId?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing read fields." }, { status: 400 });
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

      const now = Date.now();
      const currentReadAt = thread.readBy[userId] ?? 0;
      if (currentReadAt < now) {
        thread.readBy = {
          ...thread.readBy,
          [userId]: now,
        };
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark chat as read.";
    const status = message === "Chat not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
