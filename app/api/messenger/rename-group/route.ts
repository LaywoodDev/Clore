import { NextResponse } from "next/server";

import { canModerateGroup, updateStore } from "@/lib/server/store";

type RenameGroupPayload = {
  userId?: string;
  chatId?: string;
  title?: string;
  description?: string;
};

const GROUP_TITLE_MIN_LENGTH = 1;
const GROUP_TITLE_MAX_LENGTH = 64;
const GROUP_DESCRIPTION_MAX_LENGTH = 280;

function normalizeGroupTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as RenameGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const title = normalizeGroupTitle(body?.title ?? "");
  const description = body?.description?.trim() ?? "";

  if (!userId || !chatId) {
    return NextResponse.json({ error: "Missing rename fields." }, { status: 400 });
  }
  if (title.length < GROUP_TITLE_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Group title must be at least ${GROUP_TITLE_MIN_LENGTH} characters.` },
      { status: 422 }
    );
  }
  if (title.length > GROUP_TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Group title must be at most ${GROUP_TITLE_MAX_LENGTH} characters.` },
      { status: 422 }
    );
  }
  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Group description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters.`,
      },
      { status: 422 }
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
      if (!canModerateGroup(thread, userId)) {
        throw new Error("Only group owner or admin can rename group.");
      }

      const normalizedTitle = title.toLowerCase();
      const memberIdsSorted = [...thread.memberIds].sort();
      const duplicateThread = store.threads.find((candidate) => {
        if (candidate.id === thread.id || candidate.threadType !== "group") {
          return false;
        }
        const candidateTitle = candidate.title.trim().replace(/\s+/g, " ").toLowerCase();
        if (candidateTitle !== normalizedTitle) {
          return false;
        }
        if (candidate.memberIds.length !== memberIdsSorted.length) {
          return false;
        }
        const candidateMembersSorted = [...candidate.memberIds].sort();
        return candidateMembersSorted.every(
          (memberId, index) => memberId === memberIdsSorted[index]
        );
      });
      if (duplicateThread) {
        throw new Error("A group with the same title and members already exists.");
      }

      thread.title = title;
      thread.description = description;
      thread.updatedAt = Date.now();
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to rename group.";
    const status =
      message === "Group not found."
        ? 404
        : message === "Only group owner or admin can rename group."
          ? 403
          : message === "A group with the same title and members already exists."
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
