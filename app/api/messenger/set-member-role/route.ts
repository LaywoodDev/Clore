import { NextResponse } from "next/server";

import { isGroupOwner, type GroupRole, updateStore } from "@/lib/server/store";

type SetMemberRolePayload = {
  userId?: string;
  chatId?: string;
  memberId?: string;
  role?: GroupRole;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SetMemberRolePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const memberId = body?.memberId?.trim() ?? "";
  const role = body?.role;

  if (!userId || !chatId || !memberId || (role !== "admin" && role !== "member")) {
    return NextResponse.json(
      { error: "Missing member role fields." },
      { status: 400 }
    );
  }
  if (userId === memberId) {
    return NextResponse.json(
      { error: "Owner role cannot be changed via this action." },
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
        throw new Error("Only group owner can change member roles.");
      }
      if (!thread.memberIds.includes(memberId)) {
        throw new Error("User is not in the group.");
      }
      if (thread.groupRoles[memberId] === "owner") {
        throw new Error("Cannot change owner role.");
      }

      thread.groupRoles = {
        ...thread.groupRoles,
        [memberId]: role,
      };
      thread.updatedAt = Date.now();
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update member role.";
    const status =
      message === "Group not found." || message === "User is not in the group."
        ? 404
        : message === "Only group owner can change member roles." ||
            message === "Cannot change owner role."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
