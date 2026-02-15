import { NextResponse } from "next/server";

import {
  createEntityId,
  type StoredChatAttachment,
  type StoredChatMessage,
  updateStore,
} from "@/lib/server/store";

type SendAttachmentPayload = {
  name?: string;
  type?: string;
  size?: number;
  url?: string;
};

type SendPayload = {
  userId?: string;
  chatId?: string;
  text?: string;
  attachments?: SendAttachmentPayload[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SendPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const text = body?.text?.trim() ?? "";
  const attachmentsRaw = Array.isArray(body?.attachments) ? body.attachments : [];
  const attachments: StoredChatAttachment[] = attachmentsRaw
    .map((attachment) => {
      const name = attachment?.name?.trim() ?? "";
      const url = attachment?.url?.trim() ?? "";
      if (!name || !url) {
        return null;
      }
      const type = attachment?.type?.trim() || "application/octet-stream";
      const size =
        typeof attachment?.size === "number" && Number.isFinite(attachment.size)
          ? Math.max(0, attachment.size)
          : 0;
      return {
        id: createEntityId("att"),
        name,
        type,
        size,
        url,
      };
    })
    .filter((attachment): attachment is StoredChatAttachment => attachment !== null)
    .slice(0, 10);

  if (!userId || !chatId || (!text && attachments.length === 0)) {
    return NextResponse.json({ error: "Missing message fields." }, { status: 400 });
  }

  try {
    const result = await updateStore<{ messageId: string; createdAt: number }>(
      (store) => {
        const thread = store.threads.find(
          (candidate) =>
            candidate.id === chatId && candidate.memberIds.includes(userId)
        );
        if (!thread) {
          throw new Error("Chat not found.");
        }

        const now = Date.now();
        const message: StoredChatMessage = {
          id: createEntityId("msg"),
          chatId,
          authorId: userId,
          text,
          attachments,
          createdAt: now,
        };

        store.messages.push(message);
        thread.updatedAt = now;
        thread.readBy = {
          ...thread.readBy,
          [userId]: now,
        };

        return {
          messageId: message.id,
          createdAt: now,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    const status = message === "Chat not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
