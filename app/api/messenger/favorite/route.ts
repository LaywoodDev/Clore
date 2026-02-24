import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type FavoritePayload = {
  userId?: string;
  messageId?: string;
  saved?: boolean;
};

const FAVORITES_CHAT_ID = "__favorites__";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FavoritePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";
  const saved = body?.saved === true;

  if (!userId || !messageId) {
    return NextResponse.json(
      { error: "Missing favorite message fields." },
      { status: 400 }
    );
  }

  try {
    await updateStore<void>((store) => {
      const hasUser = store.users.some((candidate) => candidate.id === userId);
      if (!hasUser) {
        throw new Error("User not found.");
      }

      const targetMessage = store.messages.find(
        (candidate) => candidate.id === messageId
      );
      if (!targetMessage) {
        throw new Error("Message not found.");
      }

      const belongsToAccessibleChat = store.threads.some(
        (candidate) =>
          candidate.id === targetMessage.chatId &&
          candidate.memberIds.includes(userId)
      );
      const isOwnFavoriteMessage =
        targetMessage.chatId === FAVORITES_CHAT_ID && targetMessage.authorId === userId;
      if (!belongsToAccessibleChat && !isOwnFavoriteMessage) {
        throw new Error("Message not found.");
      }

      const now = Date.now();
      targetMessage.savedBy = {
        ...targetMessage.savedBy,
        [userId]: saved ? now : -now,
      };

      if (!saved && isOwnFavoriteMessage) {
        const hasAnyPositiveSave = Object.values(targetMessage.savedBy).some(
          (savedAt) => typeof savedAt === "number" && savedAt > 0
        );
        if (!hasAnyPositiveSave) {
          store.messages = store.messages.filter(
            (candidate) => candidate.id !== targetMessage.id
          );
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update favorites.";
    const status =
      message === "User not found." || message === "Message not found."
        ? 404
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
