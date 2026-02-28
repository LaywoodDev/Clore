import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type ArchivePayload = {
  userId?: string;
  chatId?: string;
  archived?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ArchivePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const archived = body?.archived === true;

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing archive fields." }, { status: 400 });
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

      thread.archivedBy = {
        ...thread.archivedBy,
        [userId]: archived,
      };
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive chat.";
    const status = message === "Chat not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
