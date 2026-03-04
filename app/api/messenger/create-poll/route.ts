import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { assertUserCanSendMessages } from "@/lib/server/admin";
import {
  canUserPostInThread,
  createEntityId,
  type StoredChatMessage,
  type StoredPoll,
  updateStore,
  getStore,
} from "@/lib/server/store";

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;
const MAX_QUESTION_LENGTH = 300;
const MAX_OPTION_LENGTH = 100;

type CreatePollPayload = {
  userId?: string;
  chatId?: string;
  question?: string;
  options?: unknown[];
  isAnonymous?: boolean;
};

export async function POST(request: Request) {
  let body: CreatePollPayload;
  try {
    body = (await request.json()) as CreatePollPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const claimedUserId = typeof body.userId === "string" ? body.userId : undefined;
  const userId = await requireAuth(request, claimedUserId);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!checkRateLimit(userId, "create-poll", 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many polls. Please slow down." },
      { status: 429 }
    );
  }

  const store = await getStore();
  const now = Date.now();
  assertUserCanSendMessages(store, userId, now);

  const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const isAnonymous = body.isAnonymous === true;

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required." }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "Poll question is required." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Poll question is too long." }, { status: 400 });
  }

  const rawOptions = Array.isArray(body.options) ? body.options : [];
  const optionTexts = rawOptions
    .map((o) => (typeof o === "string" ? o.trim() : ""))
    .filter((o) => o.length > 0);

  if (optionTexts.length < MIN_OPTIONS) {
    return NextResponse.json(
      { error: `Poll must have at least ${MIN_OPTIONS} options.` },
      { status: 400 }
    );
  }
  if (optionTexts.length > MAX_OPTIONS) {
    return NextResponse.json(
      { error: `Poll can have at most ${MAX_OPTIONS} options.` },
      { status: 400 }
    );
  }
  for (const optText of optionTexts) {
    if (optText.length > MAX_OPTION_LENGTH) {
      return NextResponse.json({ error: "Poll option text is too long." }, { status: 400 });
    }
  }

  try {
    const result = await updateStore<{ messageId: string; pollId: string; createdAt: number }>(
      (store) => {
        const thread = store.threads.find(
          (t) => t.id === chatId && t.memberIds.includes(userId)
        );
        if (!thread) {
          throw new Error("Chat not found.");
        }
        if (!canUserPostInThread(thread, userId)) {
          throw new Error("You cannot post in this chat.");
        }

        const now = Date.now();
        const messageId = createEntityId("msg");
        const pollId = createEntityId("poll");

        const options = optionTexts.map((text) => ({
          id: createEntityId("opt"),
          text,
        }));

        const message: StoredChatMessage = {
          id: messageId,
          chatId,
          authorId: userId,
          text: question,
          attachments: [],
          replyToMessageId: "",
          pollId,
          createdAt: now,
          scheduledAt: 0,
          editedAt: 0,
          pinnedAt: 0,
          pinnedByUserId: "",
          savedBy: {},
        };

        const poll: StoredPoll = {
          id: pollId,
          messageId,
          chatId,
          authorId: userId,
          question,
          options,
          votes: {},
          isAnonymous,
          createdAt: now,
        };

        store.messages.push(message);
        if (!store.polls) store.polls = [];
        store.polls.push(poll);

        thread.updatedAt = now;
        thread.readBy = { ...thread.readBy, [userId]: now };

        return { messageId, pollId, createdAt: now };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create poll.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
