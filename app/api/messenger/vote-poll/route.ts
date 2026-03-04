import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { updateStore } from "@/lib/server/store";

type VotePollPayload = {
  userId?: string;
  pollId?: string;
  optionId?: string | null; // null or empty string = unvote
};

export async function POST(request: Request) {
  let body: VotePollPayload;
  try {
    body = (await request.json()) as VotePollPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const claimedUserId = typeof body.userId === "string" ? body.userId : undefined;
  const userId = await requireAuth(request, claimedUserId);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pollId = typeof body.pollId === "string" ? body.pollId.trim() : "";
  const optionId =
    typeof body.optionId === "string" ? body.optionId.trim() : null;

  if (!pollId) {
    return NextResponse.json({ error: "pollId is required." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const poll = (store.polls ?? []).find((p) => p.id === pollId);
      if (!poll) {
        throw new Error("Poll not found.");
      }

      const thread = store.threads.find(
        (t) => t.id === poll.chatId && t.memberIds.includes(userId)
      );
      if (!thread) {
        throw new Error("Chat not found.");
      }

      if (!optionId) {
        // Unvote
        delete poll.votes[userId];
        return;
      }

      const optionExists = poll.options.some((o) => o.id === optionId);
      if (!optionExists) {
        throw new Error("Invalid option.");
      }

      poll.votes[userId] = optionId;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to vote.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
