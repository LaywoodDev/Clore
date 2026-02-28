import { NextResponse } from "next/server";

import {
  canUserBeAddedToGroupBy,
  createEntityId,
  isValidGroupUsername,
  normalizeGroupUsername,
  type StoredChatThread,
  updateStore,
} from "@/lib/server/store";

type CreateGroupPayload = {
  userId?: string;
  title?: string;
  memberIds?: string[];
  kind?: "group" | "channel";
  accessType?: "private" | "public";
  username?: string;
};

const GROUP_TITLE_MIN_LENGTH = 1;
const GROUP_TITLE_MAX_LENGTH = 64;
const GROUP_MAX_MEMBERS = 50;
const GROUP_USERNAME_VALIDATION_MESSAGE =
  "Group username must use 3-32 characters: lowercase letters, numbers, underscore.";

function normalizeGroupTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function getValidationError(
  userId: string,
  title: string,
  memberIds: string[],
  kind: "group" | "channel",
  accessType: "private" | "public",
  username: string
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
  if (kind === "channel" && memberIds.length > 0) {
    return "Channels cannot include members on creation.";
  }
  if (memberIds.length + 1 > GROUP_MAX_MEMBERS) {
    return `Group cannot have more than ${GROUP_MAX_MEMBERS} members.`;
  }
  if (accessType === "public" && !isValidGroupUsername(username)) {
    return GROUP_USERNAME_VALIDATION_MESSAGE;
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const title = normalizeGroupTitle(body?.title ?? "");
  const kind: "group" | "channel" = body?.kind === "channel" ? "channel" : "group";
  const accessType: "private" | "public" =
    body?.accessType === "public"
      ? "public"
      : body?.accessType === "private"
        ? "private"
        : kind === "channel"
          ? "public"
          : "private";
  const username = normalizeGroupUsername(body?.username ?? "");
  const memberIdsRaw = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const memberIds = [
    ...new Set(
      memberIdsRaw
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value !== userId)
    ),
  ];

  const validationError = getValidationError(
    userId,
    title,
    memberIds,
    kind,
    accessType,
    username
  );
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
        if (accessType === "public" && !canUserBeAddedToGroupBy(member, userId)) {
          throw new Error("One or more users do not allow adding to groups.");
        }
      }
      if (accessType === "public") {
        const duplicateUsernameThread = store.threads.find(
          (thread) =>
            thread.threadType === "group" &&
            thread.groupAccess === "public" &&
            normalizeGroupUsername(thread.groupUsername ?? "") === username
        );
        if (duplicateUsernameThread) {
          throw new Error("Group username is already taken.");
        }
      }
      const normalizedTitle = title.toLowerCase();
      const memberIdsSorted = [...memberSet].sort();
      const duplicateThread = store.threads.find((thread) => {
        if (thread.threadType !== "group") {
          return false;
        }
        if ((thread.groupKind ?? "group") !== kind) {
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
        groupKind: kind,
        groupAccess: accessType,
        groupUsername: accessType === "public" ? username : "",
        groupInviteToken: createEntityId("invite"),
        groupInviteUsageLimit: 0,
        groupInviteUsedCount: 0,
        contentProtectionEnabled: false,
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
        : message === "Channels cannot include members on creation."
          ? 422
        : message === "A group with the same title and members already exists."
          ? 409
          : message === "Group username is already taken."
            ? 409
            : message === GROUP_USERNAME_VALIDATION_MESSAGE
              ? 422
          : message.includes("Group title") || message.includes("members")
            ? 422
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
