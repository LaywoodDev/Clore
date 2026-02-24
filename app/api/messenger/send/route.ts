import { NextResponse } from "next/server";

import { getAiProviderConfig } from "@/lib/server/ai-provider";
import {
  BOT_USER_ID,
  createEntityId,
  isBotUserId,
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
  replyToMessageId?: string;
};

type BotConversationMessage = {
  authorName: string;
  text: string;
  isBot: boolean;
};

type SendResult = {
  messageId: string;
  createdAt: number;
  shouldAutoReply: boolean;
  botUserId: string | null;
  conversation: BotConversationMessage[];
  lastUserText: string;
};

const FAVORITES_CHAT_ID = "__favorites__";

function fallbackBotReply(lastUserText: string): string {
  const isRussian = /[а-яё]/i.test(lastUserText);
  return isRussian
    ? "Я бот ChatGPT в этом чате. Могу помочь с вопросами, кодом, текстами и идеями."
    : "I'm the ChatGPT bot in this chat. I can help with questions, code, writing, and ideas.";
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }

  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  }

  return "";
}

function extractChatCompletionText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") {
    return "";
  }
  const message = (firstChoice as Record<string, unknown>).message;
  if (!message || typeof message !== "object") {
    return "";
  }
  const content = (message as Record<string, unknown>).content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  for (const part of content) {
    if (!part || typeof part !== "object") {
      continue;
    }
    const text = (part as Record<string, unknown>).text;
    if (typeof text === "string" && text.trim()) {
      return text.trim();
    }
  }
  return "";
}

async function generateBotReply(
  conversation: BotConversationMessage[],
  lastUserText: string
): Promise<string> {
  let providerConfig: ReturnType<typeof getAiProviderConfig> | null = null;
  try {
    providerConfig = getAiProviderConfig();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[bot] ${error.message}`);
    }
    return fallbackBotReply(lastUserText);
  }

  const { apiKey, model, baseUrl } = providerConfig;
  const systemPrompt =
    "You are ChatGPT in a team messenger. Reply briefly, clearly, and helpfully. Keep responses conversational and safe.";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system" as const,
            content: systemPrompt,
          },
          ...conversation.map((message) => {
            const role: "assistant" | "user" = message.isBot ? "assistant" : "user";
            return {
              role,
              content: `${message.authorName}: ${message.text}`,
            };
          }),
        ],
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => "");
      console.error(
        `[bot] ProxyAPI error ${response.status}: ${errorPayload.slice(0, 400)}`
      );
      return fallbackBotReply(lastUserText);
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const text = extractChatCompletionText(payload) || extractResponseText(payload);
    return text || fallbackBotReply(lastUserText);
  } catch {
    return fallbackBotReply(lastUserText);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SendPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const text = body?.text?.trim() ?? "";
  const replyToMessageId = body?.replyToMessageId?.trim() ?? "";
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
    const result = await updateStore<SendResult>(
      (store) => {
        if (chatId === FAVORITES_CHAT_ID) {
          const hasUser = store.users.some((candidate) => candidate.id === userId);
          if (!hasUser) {
            throw new Error("User not found.");
          }

          const now = Date.now();
          const message: StoredChatMessage = {
            id: createEntityId("msg"),
            chatId: FAVORITES_CHAT_ID,
            authorId: userId,
            text,
            attachments,
            replyToMessageId: "",
            createdAt: now,
            editedAt: 0,
            savedBy: {
              [userId]: now,
            },
          };
          store.messages.push(message);

          return {
            messageId: message.id,
            createdAt: now,
            shouldAutoReply: false,
            botUserId: null,
            conversation: [],
            lastUserText: text,
          };
        }

        const thread = store.threads.find(
          (candidate) =>
            candidate.id === chatId && candidate.memberIds.includes(userId)
        );
        if (!thread) {
          throw new Error("Chat not found.");
        }
        if (thread.threadType === "direct") {
          const peerUserId = thread.memberIds.find((memberId) => memberId !== userId) ?? "";
          if (peerUserId) {
            const sender = store.users.find((candidate) => candidate.id === userId);
            const peerUser = store.users.find((candidate) => candidate.id === peerUserId);
            const senderBlockedPeer = sender?.blockedUserIds.includes(peerUserId) ?? false;
            const peerBlockedSender = peerUser?.blockedUserIds.includes(userId) ?? false;
            if (senderBlockedPeer || peerBlockedSender) {
              throw new Error("Cannot send message because one of users is blocked.");
            }
          }
        }
        if (replyToMessageId) {
          const replyTarget = store.messages.find(
            (candidate) =>
              candidate.id === replyToMessageId && candidate.chatId === chatId
          );
          if (!replyTarget) {
            throw new Error("Reply target not found.");
          }
        }

        const now = Date.now();
        const message: StoredChatMessage = {
          id: createEntityId("msg"),
          chatId,
          authorId: userId,
          text,
          attachments,
          replyToMessageId,
          createdAt: now,
          editedAt: 0,
          savedBy: {},
        };

        store.messages.push(message);
        thread.updatedAt = now;
        thread.readBy = {
          ...thread.readBy,
          [userId]: now,
        };

        const botUserId =
          thread.threadType === "direct"
            ? (thread.memberIds.find((memberId) => memberId !== userId && isBotUserId(memberId)) ??
              null)
            : null;
        const shouldAutoReply = !isBotUserId(userId) && botUserId !== null;
        const usersById = new Map(store.users.map((user) => [user.id, user]));
        const chatMessages = store.messages
          .filter((candidate) => candidate.chatId === chatId)
          .sort((a, b) => a.createdAt - b.createdAt)
          .slice(-12);
        const conversation: BotConversationMessage[] = chatMessages.map((candidate) => {
          const authorName =
            candidate.authorId === BOT_USER_ID
              ? "ChatGPT"
              : (usersById.get(candidate.authorId)?.name ?? "User");
          const renderedText =
            candidate.text.trim() ||
            (candidate.attachments.length > 0 ? "[Attachment]" : "[Empty]");
          return {
            authorName,
            text: renderedText,
            isBot: candidate.authorId === BOT_USER_ID,
          };
        });

        return {
          messageId: message.id,
          createdAt: now,
          shouldAutoReply,
          botUserId,
          conversation,
          lastUserText: text,
        };
      }
    );

    if (result.shouldAutoReply && result.botUserId) {
      const botUserId = result.botUserId;
      const botText = await generateBotReply(result.conversation, result.lastUserText);

      await updateStore<void>((store) => {
        const thread = store.threads.find(
          (candidate) =>
            candidate.id === chatId &&
            candidate.threadType === "direct" &&
            candidate.memberIds.includes(botUserId)
        );
        if (!thread) {
          return;
        }

        const now = Date.now();
        const botMessage: StoredChatMessage = {
          id: createEntityId("msg"),
          chatId,
          authorId: botUserId,
          text: botText,
          attachments: [],
          replyToMessageId: "",
          createdAt: now,
          editedAt: 0,
          savedBy: {},
        };

        store.messages.push(botMessage);
        thread.updatedAt = now;
        thread.readBy = {
          ...thread.readBy,
          [botUserId]: now,
        };
      });
    }

    return NextResponse.json({
      messageId: result.messageId,
      createdAt: result.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    const status =
      message === "Chat not found." ||
      message === "Reply target not found." ||
      message === "User not found."
        ? 404
        : message === "Cannot send message because one of users is blocked."
          ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
