import { NextResponse } from "next/server";

import { isGroupOwner, updateStore } from "@/lib/server/store";

type LeaveGroupPayload = {
  userId?: string;
  chatId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LeaveGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing leave fields." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const thread = store.threads.find(
        (candidate) =>
          candidate.id === chatId && candidate.memberIds.includes(userId)
      );
      if (!thread) {
        throw new Error("Chat not found.");
      }
      if (thread.threadType !== "group") {
        throw new Error("Only groups can be left.");
      }
      if (isGroupOwner(thread, userId)) {
        throw new Error("Group owner cannot leave. Transfer ownership or delete group.");
      }

      thread.memberIds = thread.memberIds.filter((memberId) => memberId !== userId);
      const { [userId]: _removedRead, ...restReadBy } = thread.readBy;
      thread.readBy = restReadBy;
      const { [userId]: _removedPin, ...restPinnedBy } = thread.pinnedBy;
      thread.pinnedBy = restPinnedBy;
      const { [userId]: _removedMuted, ...restMutedBy } = thread.mutedBy;
      thread.mutedBy = restMutedBy;
      const { [userId]: _removedTyping, ...restTypingBy } = thread.typingBy;
      thread.typingBy = restTypingBy;
      const { [userId]: _removedRole, ...restGroupRoles } = thread.groupRoles;
      thread.groupRoles = restGroupRoles;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to leave group.";
    const status =
      message === "Chat not found."
        ? 404
        : message === "Group owner cannot leave. Transfer ownership or delete group."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
