import { NextResponse } from "next/server";

import {
  canModerateGroup,
  canUserBeAddedToGroupBy,
  updateStore,
} from "@/lib/server/store";

type AddMemberPayload = {
  userId?: string;
  chatId?: string;
  memberId?: string;
};

const GROUP_MAX_MEMBERS = 50;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AddMemberPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const memberId = body?.memberId?.trim() ?? "";

  if (!userId || !chatId || !memberId) {
    return NextResponse.json({ error: "Missing add member fields." }, { status: 400 });
  }
  if (userId === memberId) {
    return NextResponse.json({ error: "Cannot add yourself." }, { status: 400 });
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
        throw new Error("Only group owner or admin can add members.");
      }
      if (thread.memberIds.includes(memberId)) {
        throw new Error("User is already in the group.");
      }
      const member = store.users.find((user) => user.id === memberId);
      if (!member) {
        throw new Error("User not found.");
      }
      if (!canUserBeAddedToGroupBy(member, userId)) {
        throw new Error("User does not allow adding to groups.");
      }
      if (thread.memberIds.length + 1 > GROUP_MAX_MEMBERS) {
        throw new Error(`Group cannot have more than ${GROUP_MAX_MEMBERS} members.`);
      }

      const now = Date.now();
      thread.memberIds = [...thread.memberIds, memberId];
      thread.readBy = {
        ...thread.readBy,
        [memberId]: 0,
      };
      thread.groupRoles = {
        ...thread.groupRoles,
        [memberId]: "member",
      };
      thread.updatedAt = now;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add member.";
    const status =
      message === "Group not found." || message === "User not found."
        ? 404
        : message === "Only group owner or admin can add members."
          ? 403
          : message === "User does not allow adding to groups."
            ? 403
          : message === "User is already in the group."
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
