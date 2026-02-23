import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type MutePayload = {
  userId?: string;
  chatId?: string;
  muted?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MutePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const muted = body?.muted === true;

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing mute fields." }, { status: 400 });
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

      thread.mutedBy = {
        ...thread.mutedBy,
        [userId]: muted,
      };
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mute chat.";
    const status = message === "Chat not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
