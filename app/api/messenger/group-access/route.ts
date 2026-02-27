import { NextResponse } from "next/server";

import {
  canModerateGroup,
  getThreadInviteToken,
  normalizeGroupInviteUsageLimit,
  normalizeGroupInviteUsedCount,
  isValidGroupUsername,
  normalizeGroupUsername,
  updateStore,
} from "@/lib/server/store";

type GroupAccessPayload = {
  userId?: string;
  chatId?: string;
  accessType?: "private" | "public";
  username?: string;
};

const GROUP_USERNAME_VALIDATION_MESSAGE =
  "Group username must use 3-32 characters: lowercase letters, numbers, underscore.";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as GroupAccessPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const accessType = body?.accessType === "public" ? "public" : "private";
  const username = normalizeGroupUsername(body?.username ?? "");

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing group access fields." }, { status: 400 });
  }

  if (accessType === "public" && !isValidGroupUsername(username)) {
    return NextResponse.json(
      { error: GROUP_USERNAME_VALIDATION_MESSAGE },
      { status: 422 }
    );
  }

  try {
    const result = await updateStore<{
      accessType: "private" | "public";
      username: string;
      inviteToken: string;
      inviteUsageLimit: number;
      inviteUsedCount: number;
    }>((store) => {
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
        throw new Error("Only group owner or admin can update group type.");
      }

      if (accessType === "public") {
        const duplicateThread = store.threads.find(
          (candidate) =>
            candidate.id !== thread.id &&
            candidate.threadType === "group" &&
            candidate.groupAccess === "public" &&
            normalizeGroupUsername(candidate.groupUsername ?? "") === username
        );
        if (duplicateThread) {
          throw new Error("Group username is already taken.");
        }
        thread.groupAccess = "public";
        thread.groupUsername = username;
      } else {
        thread.groupAccess = "private";
        thread.groupUsername = "";
      }

      const inviteToken = getThreadInviteToken(thread);
      thread.groupInviteToken = inviteToken;
      const inviteUsageLimit = normalizeGroupInviteUsageLimit(thread.groupInviteUsageLimit);
      const inviteUsedCount = normalizeGroupInviteUsedCount(
        thread.groupInviteUsedCount,
        inviteUsageLimit
      );
      thread.groupInviteUsageLimit = inviteUsageLimit;
      thread.groupInviteUsedCount = inviteUsedCount;
      thread.updatedAt = Date.now();

      return {
        accessType: thread.groupAccess === "public" ? "public" : "private",
        username: thread.groupUsername ?? "",
        inviteToken,
        inviteUsageLimit,
        inviteUsedCount,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update group type.";
    const status =
      message === "Group not found."
        ? 404
        : message === "Only group owner or admin can update group type."
          ? 403
          : message === "Group username is already taken."
            ? 409
            : message === GROUP_USERNAME_VALIDATION_MESSAGE
              ? 422
              : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
