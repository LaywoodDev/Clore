import { NextResponse } from "next/server";

import {
  canUserBeAddedToGroupBy,
  createEntityId,
  type StoredChatThread,
  updateStore,
} from "@/lib/server/store";

type CreateGroupPayload = {
  userId?: string;
  title?: string;
  memberIds?: string[];
};

const GROUP_TITLE_MIN_LENGTH = 3;
const GROUP_TITLE_MAX_LENGTH = 64;
const GROUP_MIN_OTHER_MEMBERS = 2;
const GROUP_MAX_MEMBERS = 50;

function normalizeGroupTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function getValidationError(
  userId: string,
  title: string,
  memberIds: string[]
): string | null {
  if (!userId) {
    return "Missing user ID.";
  }
  if (title.length < GROUP_TITLE_MIN_LENGTH) {
    return `Group title must be at least ${GROUP_TITLE_MIN_LENGTH} characters.`;
  }
  if (title.length > GROUP_TITLE_MAX_LENGTH) {
    return `Group title must be at most ${GROUP_TITLE_MAX_LENGTH} characters.`;
  }
  if (memberIds.length < GROUP_MIN_OTHER_MEMBERS) {
    return `At least ${GROUP_MIN_OTHER_MEMBERS} other members are required.`;
  }
  if (memberIds.length + 1 > GROUP_MAX_MEMBERS) {
    return `Group cannot have more than ${GROUP_MAX_MEMBERS} members.`;
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const title = normalizeGroupTitle(body?.title ?? "");
  const memberIdsRaw = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const memberIds = [
    ...new Set(
      memberIdsRaw
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value !== userId)
    ),
  ];

  const validationError = getValidationError(userId, title, memberIds);
  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 422 }
    );
  }

  try {
    const result = await updateStore<{ chatId: string }>((store) => {
      const memberSet = new Set([userId, ...memberIds]);
      const hasAllUsers = [...memberSet].every((candidateId) =>
        store.users.some((user) => user.id === candidateId)
      );
      if (!hasAllUsers) {
        throw new Error("User not found.");
      }
      for (const memberId of memberIds) {
        const member = store.users.find((user) => user.id === memberId);
        if (!member) {
          throw new Error("User not found.");
        }
        if (!canUserBeAddedToGroupBy(member, userId)) {
          throw new Error("One or more users do not allow adding to groups.");
        }
      }
      const normalizedTitle = title.toLowerCase();
      const memberIdsSorted = [...memberSet].sort();
      const duplicateThread = store.threads.find((thread) => {
        if (thread.threadType !== "group") {
          return false;
        }
        const threadNormalizedTitle = thread.title.trim().replace(/\s+/g, " ").toLowerCase();
        if (threadNormalizedTitle !== normalizedTitle) {
          return false;
        }
        if (thread.memberIds.length !== memberIdsSorted.length) {
          return false;
        }
        const threadMembersSorted = [...thread.memberIds].sort();
        return threadMembersSorted.every((memberId, index) => memberId === memberIdsSorted[index]);
      });
      if (duplicateThread) {
        throw new Error("A group with the same title and members already exists.");
      }

      const now = Date.now();
      const readBy = [...memberSet].reduce<Record<string, number>>((acc, memberId) => {
        acc[memberId] = memberId === userId ? now : 0;
        return acc;
      }, {});
      const groupRoles = [...memberSet].reduce<StoredChatThread["groupRoles"]>(
        (acc, memberId) => {
          acc[memberId] = memberId === userId ? "owner" : "member";
          return acc;
        },
        {}
      );

      const nextThread: StoredChatThread = {
        id: createEntityId("chat"),
        memberIds: [...memberSet],
        threadType: "group",
        title,
        description: "",
        avatarUrl: "",
        bannerUrl: "",
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        readBy,
        pinnedBy: {},
        mutedBy: {},
        typingBy: {},
        groupRoles,
      };

      store.threads.push(nextThread);
      return { chatId: nextThread.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create group.";
    const status =
      message === "User not found."
        ? 404
        : message === "One or more users do not allow adding to groups."
          ? 403
        : message === "A group with the same title and members already exists."
          ? 409
          : message.includes("Group title") || message.includes("members")
            ? 422
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
