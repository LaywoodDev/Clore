import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";

import { canModerateGroup, updateStore } from "@/lib/server/store";

type GroupContentProtectionPayload = {
  userId?: string;
  chatId?: string;
  enabled?: boolean;
};

type GroupContentProtectionResult = {
  enabled: boolean;
};

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as GroupContentProtectionPayload | null;
  const claimedUserId = body?.userId?.trim() ?? "";
  const userId = await requireAuth(request, claimedUserId || undefined);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const chatId = body?.chatId?.trim() ?? "";
  const enabled = body?.enabled === true;

  if (!userId || !chatId) {
    return NextResponse.json(
      { error: "Missing group content protection fields." },
      { status: 400 }
    );
  }

  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json(
      { error: "Content protection flag must be boolean." },
      { status: 400 }
    );
  }

  try {
    const result = await updateStore<GroupContentProtectionResult>((store) => {
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
        throw new Error("Only group owner or admin can update content protection.");
      }

      thread.contentProtectionEnabled = enabled;
      thread.updatedAt = Date.now();

      return {
        enabled: thread.contentProtectionEnabled === true,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update content protection.";
    const status =
      message === "Group not found."
        ? 404
        : message === "Only group owner or admin can update content protection."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
