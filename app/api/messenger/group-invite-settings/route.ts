import { NextResponse } from "next/server";

import {
  canModerateGroup,
  getThreadInviteToken,
  normalizeGroupInviteUsageLimit,
  normalizeGroupInviteUsedCount,
  updateStore,
} from "@/lib/server/store";

type GroupInviteSettingsPayload = {
  userId?: string;
  chatId?: string;
  usageLimit?: number;
};

const GROUP_INVITE_USAGE_LIMIT_MAX = Number.MAX_SAFE_INTEGER;
const GROUP_INVITE_USAGE_LIMIT_VALIDATION_MESSAGE =
  "Invite usage limit must be a non-negative integer.";

function parseInviteUsageLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(GROUP_INVITE_USAGE_LIMIT_VALIDATION_MESSAGE);
  }
  if (value < 0 || value > GROUP_INVITE_USAGE_LIMIT_MAX) {
    throw new Error(GROUP_INVITE_USAGE_LIMIT_VALIDATION_MESSAGE);
  }
  return value;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as GroupInviteSettingsPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing invite settings fields." }, { status: 400 });
  }

  let usageLimit = 0;
  try {
    usageLimit = parseInviteUsageLimit(body?.usageLimit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : GROUP_INVITE_USAGE_LIMIT_VALIDATION_MESSAGE;
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const result = await updateStore<{
      inviteToken: string;
      usageLimit: number;
      usedCount: number;
      remainingUses: number | null;
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
        throw new Error("Only group owner or admin can update invite settings.");
      }
      if (thread.groupAccess === "public") {
        throw new Error("Invite link settings are available only for private groups.");
      }

      const normalizedUsageLimit = normalizeGroupInviteUsageLimit(usageLimit);
      const normalizedUsedCount = normalizeGroupInviteUsedCount(
        thread.groupInviteUsedCount,
        normalizedUsageLimit
      );
      const inviteToken = getThreadInviteToken(thread);
      thread.groupInviteToken = inviteToken;
      thread.groupInviteUsageLimit = normalizedUsageLimit;
      thread.groupInviteUsedCount = normalizedUsedCount;
      thread.updatedAt = Date.now();

      return {
        inviteToken,
        usageLimit: normalizedUsageLimit,
        usedCount: normalizedUsedCount,
        remainingUses:
          normalizedUsageLimit > 0
            ? Math.max(normalizedUsageLimit - normalizedUsedCount, 0)
            : null,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update invite settings.";
    const status =
      message === "Group not found."
        ? 404
        : message === "Only group owner or admin can update invite settings."
          ? 403
          : message === GROUP_INVITE_USAGE_LIMIT_VALIDATION_MESSAGE ||
              message === "Invite link settings are available only for private groups."
            ? 422
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
