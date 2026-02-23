import { NextResponse } from "next/server";

import { isGroupOwner, updateStore } from "@/lib/server/store";

type TransferOwnerPayload = {
  userId?: string;
  chatId?: string;
  nextOwnerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TransferOwnerPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const nextOwnerId = body?.nextOwnerId?.trim() ?? "";

  if (!userId || !chatId || !nextOwnerId) {
    return NextResponse.json(
      { error: "Missing transfer owner fields." },
      { status: 400 }
    );
  }
  if (userId === nextOwnerId) {
    return NextResponse.json(
      { error: "New owner must be another member." },
      { status: 400 }
    );
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
      if (!isGroupOwner(thread, userId)) {
        throw new Error("Only group owner can transfer ownership.");
      }
      if (!thread.memberIds.includes(nextOwnerId)) {
        throw new Error("New owner must be a group member.");
      }

      thread.groupRoles = {
        ...thread.groupRoles,
        [userId]: "admin",
        [nextOwnerId]: "owner",
      };
      thread.createdById = nextOwnerId;
      thread.updatedAt = Date.now();
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to transfer ownership.";
    const status =
      message === "Group not found." || message === "New owner must be a group member."
        ? 404
        : message === "Only group owner can transfer ownership."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
