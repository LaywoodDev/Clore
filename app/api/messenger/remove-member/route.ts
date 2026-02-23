import { NextResponse } from "next/server";

import { canRemoveGroupMember, updateStore } from "@/lib/server/store";

type RemoveMemberPayload = {
  userId?: string;
  chatId?: string;
  memberId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RemoveMemberPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const memberId = body?.memberId?.trim() ?? "";

  if (!userId || !chatId || !memberId) {
    return NextResponse.json(
      { error: "Missing remove member fields." },
      { status: 400 }
    );
  }
  if (userId === memberId) {
    return NextResponse.json(
      { error: "Use leave group to remove yourself." },
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
      if (!thread.memberIds.includes(memberId)) {
        throw new Error("User is not in the group.");
      }
      if (!canRemoveGroupMember(thread, userId, memberId)) {
        throw new Error("Insufficient permissions to remove this member.");
      }

      thread.memberIds = thread.memberIds.filter((candidateId) => candidateId !== memberId);
      const { [memberId]: _removedRead, ...restReadBy } = thread.readBy;
      thread.readBy = restReadBy;
      const { [memberId]: _removedPin, ...restPinnedBy } = thread.pinnedBy;
      thread.pinnedBy = restPinnedBy;
      const { [memberId]: _removedMuted, ...restMutedBy } = thread.mutedBy;
      thread.mutedBy = restMutedBy;
      const { [memberId]: _removedTyping, ...restTypingBy } = thread.typingBy;
      thread.typingBy = restTypingBy;
      const { [memberId]: _removedRole, ...restRoles } = thread.groupRoles;
      thread.groupRoles = restRoles;
      thread.updatedAt = Date.now();
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove member.";
    const status =
      message === "Group not found." || message === "User is not in the group."
        ? 404
        : message === "Insufficient permissions to remove this member."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
