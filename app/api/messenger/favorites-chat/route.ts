import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type FavoritesChatPayload = {
  userId?: string;
};

const FAVORITES_CHAT_ID = "__favorites__";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FavoritesChatPayload | null;
  const userId = body?.userId?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const hasUser = store.users.some((candidate) => candidate.id === userId);
      if (!hasUser) {
        throw new Error("User not found.");
      }

      const now = Date.now();
      store.messages = store.messages.filter((message) => {
        const savedAt = message.savedBy?.[userId] ?? 0;
        if (savedAt > 0) {
          message.savedBy = {
            ...message.savedBy,
            [userId]: -now,
          };
        }

        const isOwnFavoritesMessage =
          message.chatId === FAVORITES_CHAT_ID && message.authorId === userId;
        if (!isOwnFavoritesMessage) {
          return true;
        }

        const hasAnyPositiveSave = Object.values(message.savedBy ?? {}).some(
          (candidate) => typeof candidate === "number" && candidate > 0
        );
        return hasAnyPositiveSave;
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete favorites.";
    const status = message === "User not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
