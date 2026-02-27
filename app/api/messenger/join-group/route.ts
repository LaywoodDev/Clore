import { NextResponse } from "next/server";

import {
  getThreadInviteToken,
  isValidGroupUsername,
  normalizeGroupInviteUsageLimit,
  normalizeGroupInviteUsedCount,
  normalizeGroupUsername,
  updateStore,
} from "@/lib/server/store";

type JoinGroupPayload = {
  userId?: string;
  username?: string;
  inviteToken?: string;
};

const GROUP_MAX_MEMBERS = 50;
const GROUP_USERNAME_VALIDATION_MESSAGE =
  "Group username must use 3-32 characters: lowercase letters, numbers, underscore.";
const INVITE_LINK_LIMIT_REACHED_MESSAGE = "Invite link has reached its usage limit.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as JoinGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const username = normalizeGroupUsername(body?.username ?? "");
  const inviteToken = body?.inviteToken?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (!username && !inviteToken) {
    return NextResponse.json(
      { error: "Provide group username or invite token." },
      { status: 400 }
    );
  }
  if (username && !isValidGroupUsername(username)) {
    return NextResponse.json(
      { error: GROUP_USERNAME_VALIDATION_MESSAGE },
      { status: 422 }
    );
  }

  try {
    const result = await updateStore<{
      chatId: string;
      joined: boolean;
      groupKind: "group" | "channel";
    }>((store) => {
      const userExists = store.users.some((candidate) => candidate.id === userId);
      if (!userExists) {
        throw new Error("User not found.");
      }

      const thread = username
        ? store.threads.find(
            (candidate) =>
              candidate.threadType === "group" &&
              candidate.groupAccess === "public" &&
              normalizeGroupUsername(candidate.groupUsername ?? "") === username
          )
        : store.threads.find(
            (candidate) =>
              candidate.threadType === "group" &&
              candidate.groupAccess !== "public" &&
              getThreadInviteToken(candidate) === inviteToken
          );

      if (!thread) {
        throw new Error(username ? "Group not found." : "Invite link is invalid.");
      }

      if (thread.memberIds.includes(userId)) {
        return {
          chatId: thread.id,
          joined: false,
          groupKind: thread.groupKind === "channel" ? "channel" : "group",
        };
      }

      if (thread.memberIds.length + 1 > GROUP_MAX_MEMBERS) {
        throw new Error(`Group cannot have more than ${GROUP_MAX_MEMBERS} members.`);
      }

      if (!username) {
        const inviteUsageLimit = normalizeGroupInviteUsageLimit(thread.groupInviteUsageLimit);
        const inviteUsedCount = normalizeGroupInviteUsedCount(
          thread.groupInviteUsedCount,
          inviteUsageLimit
        );
        if (inviteUsageLimit > 0 && inviteUsedCount >= inviteUsageLimit) {
          throw new Error(INVITE_LINK_LIMIT_REACHED_MESSAGE);
        }
        thread.groupInviteUsageLimit = inviteUsageLimit;
        thread.groupInviteUsedCount = inviteUsedCount + 1;
      }

      thread.memberIds = [...thread.memberIds, userId];
      thread.readBy = {
        ...thread.readBy,
        [userId]: 0,
      };
      thread.groupRoles = {
        ...thread.groupRoles,
        [userId]: "member",
      };
      thread.updatedAt = Date.now();

      return {
        chatId: thread.id,
        joined: true,
        groupKind: thread.groupKind === "channel" ? "channel" : "group",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join group.";
    const status =
      message === "User not found." ||
      message === "Group not found." ||
      message === "Invite link is invalid."
        ? 404
        : message === INVITE_LINK_LIMIT_REACHED_MESSAGE
          ? 410
        : message === GROUP_USERNAME_VALIDATION_MESSAGE ||
            message.includes("Group cannot have more than")
          ? 422
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
