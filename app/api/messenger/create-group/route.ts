import { NextResponse } from "next/server";

import {
  createEntityId,
  type StoredChatThread,
  updateStore,
} from "@/lib/server/store";

type CreateGroupPayload = {
  userId?: string;
  title?: string;
  memberIds?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateGroupPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const title = body?.title?.trim() ?? "";
  const memberIdsRaw = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const memberIds = [...new Set(memberIdsRaw.map((value) => value.trim()).filter(Boolean))];

  if (!userId || !title || memberIds.length < 2) {
    return NextResponse.json(
      { error: "Missing group fields." },
      { status: 400 }
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

      const now = Date.now();
      const readBy = [...memberSet].reduce<Record<string, number>>((acc, memberId) => {
        acc[memberId] = memberId === userId ? now : 0;
        return acc;
      }, {});

      const nextThread: StoredChatThread = {
        id: createEntityId("chat"),
        memberIds: [...memberSet],
        threadType: "group",
        title,
        avatarUrl: "",
        bannerUrl: "",
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        readBy,
        pinnedBy: {},
      };

      store.threads.push(nextThread);
      return { chatId: nextThread.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create group.";
    const status = message === "User not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
