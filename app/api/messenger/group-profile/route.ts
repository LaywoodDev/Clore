import { NextResponse } from "next/server";

import { canModerateGroup, updateStore } from "@/lib/server/store";

type GroupProfilePayload = {
  userId?: string;
  chatId?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as GroupProfilePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const avatarUrl = body?.avatarUrl?.trim() ?? "";
  const bannerUrl = body?.bannerUrl?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing profile fields." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const thread = store.threads.find(
        (candidate) =>
          candidate.id === chatId &&
          candidate.threadType === "group" &&
          candidate.memberIds.includes(userId)
      );
      if (!thread) {
        throw new Error("Group not found.");
      }
      if (!canModerateGroup(thread, userId)) {
        throw new Error("Only group owner or admin can update group profile.");
      }

      thread.avatarUrl = avatarUrl;
      thread.bannerUrl = bannerUrl;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update group profile.";
    const status =
      message === "Group not found."
        ? 404
        : message === "Only group owner or admin can update group profile."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
