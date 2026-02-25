import { NextResponse } from "next/server";

import { assertUserCanReadMessenger } from "@/lib/server/admin";
import {
  createEntityId,
  type StoredModerationReport,
  updateStore,
} from "@/lib/server/store";

type ReportPayload = {
  userId?: string;
  chatId?: string;
  messageId?: string;
  reason?: string;
  details?: string;
};

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 220;
const MAX_DETAILS_LENGTH = 600;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReportPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";
  const reason = body?.reason?.trim() ?? "";
  const details = body?.details?.trim() ?? "";

  if (!userId || !chatId || !messageId || !reason) {
    return NextResponse.json(
      { error: "Missing report fields." },
      { status: 400 }
    );
  }
  if (reason.length < MIN_REASON_LENGTH || reason.length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      {
        error: `Reason must be ${MIN_REASON_LENGTH}-${MAX_REASON_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    return NextResponse.json(
      { error: `Details are limited to ${MAX_DETAILS_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const report = await updateStore<StoredModerationReport>((store) => {
      const reporter = store.users.find((candidate) => candidate.id === userId);
      if (!reporter) {
        throw new Error("User not found.");
      }
      assertUserCanReadMessenger(store, userId);

      const thread = store.threads.find(
        (candidate) => candidate.id === chatId && candidate.memberIds.includes(userId)
      );
      if (!thread) {
        throw new Error("Chat not found.");
      }

      const targetMessage = store.messages.find(
        (candidate) => candidate.id === messageId && candidate.chatId === chatId
      );
      if (!targetMessage) {
        throw new Error("Message not found.");
      }
      if (targetMessage.authorId === userId) {
        throw new Error("You cannot report your own message.");
      }

      const targetUser = store.users.find(
        (candidate) => candidate.id === targetMessage.authorId
      );
      if (!targetUser) {
        throw new Error("Target user not found.");
      }

      const existingOpen = store.moderationReports.find(
        (candidate) =>
          candidate.status === "open" &&
          candidate.reporterUserId === userId &&
          candidate.messageId === messageId
      );
      if (existingOpen) {
        return existingOpen;
      }

      const now = Date.now();
      const created: StoredModerationReport = {
        id: createEntityId("rpt"),
        reporterUserId: userId,
        targetUserId: targetUser.id,
        chatId,
        messageId,
        reason,
        details,
        status: "open",
        createdAt: now,
        resolvedAt: 0,
        resolvedByUserId: "",
        resolutionNote: "",
      };
      store.moderationReports.push(created);
      return created;
    });

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit report.";
    const status =
      message === "User not found." ||
      message === "Chat not found." ||
      message === "Message not found." ||
      message === "Target user not found."
        ? 404
        : message === "You cannot report your own message."
          ? 400
          : message.startsWith("Your account is suspended")
            ? 403
            : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
