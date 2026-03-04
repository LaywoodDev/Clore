// Bulk operations command handlers

import { updateStore, type StoreData } from "@/lib/server/store";
import type { Language } from "../types";

export type MarkAllReadResult = {
  markedCount: number;
  totalChats: number;
};

export type ExportChatIntent = {
  chatQuery: string;
  format?: "json" | "txt" | "html";
};

export type ExportChatResult = {
  chatTitle: string;
  messageCount: number;
  exportData: string;
  format: string;
};

export async function markAllChatsAsRead(
  userId: string
): Promise<MarkAllReadResult> {
  return await updateStore<MarkAllReadResult>((store) => {
    const userThreads = store.threads.filter((t) =>
      t.memberIds.includes(userId)
    );

    const now = Date.now();
    let markedCount = 0;

    for (const thread of userThreads) {
      const lastRead = thread.readBy?.[userId] || 0;
      if (thread.updatedAt > lastRead) {
        thread.readBy = {
          ...thread.readBy,
          [userId]: now,
        };
        markedCount++;
      }
    }

    return {
      markedCount,
      totalChats: userThreads.length,
    };
  });
}

export function buildMarkAllReadReply(
  language: Language,
  result: MarkAllReadResult
): string {
  if (result.markedCount === 0) {
    return language === "ru"
      ? "✅ Все чаты уже прочитаны!"
      : "✅ All chats are already read!";
  }

  return language === "ru"
    ? `✅ Отмечено как прочитанное: ${result.markedCount} из ${result.totalChats} чатов`
    : `✅ Marked as read: ${result.markedCount} of ${result.totalChats} chats`;
}

export function exportChatToJson(
  store: StoreData,
  userId: string,
  chatId: string
): ExportChatResult | null {
  const thread = store.threads.find(
    (t) => t.id === chatId && t.memberIds.includes(userId)
  );

  if (!thread) {
    return null;
  }

  const messages = store.messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const usersMap = new Map(store.users.map((u) => [u.id, u]));

  const exportData = {
    chat: {
      id: thread.id,
      title: thread.title,
      type: thread.threadType,
      createdAt: thread.createdAt,
      memberCount: thread.memberIds.length,
    },
    messages: messages.map((m) => ({
      id: m.id,
      author: {
        id: m.authorId,
        name: usersMap.get(m.authorId)?.name || "Unknown",
        username: usersMap.get(m.authorId)?.username || "",
      },
      text: m.text,
      attachments: m.attachments,
      createdAt: m.createdAt,
      editedAt: m.editedAt || undefined,
      replyToMessageId: m.replyToMessageId || undefined,
    })),
    exportedAt: Date.now(),
    exportedBy: userId,
  };

  return {
    chatTitle: thread.title,
    messageCount: messages.length,
    exportData: JSON.stringify(exportData, null, 2),
    format: "json",
  };
}

export function exportChatToText(
  store: StoreData,
  userId: string,
  chatId: string
): ExportChatResult | null {
  const thread = store.threads.find(
    (t) => t.id === chatId && t.memberIds.includes(userId)
  );

  if (!thread) {
    return null;
  }

  const messages = store.messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const usersMap = new Map(store.users.map((u) => [u.id, u]));

  const lines: string[] = [];
  lines.push(`Chat: ${thread.title}`);
  lines.push(`Type: ${thread.threadType}`);
  lines.push(`Members: ${thread.memberIds.length}`);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("=" .repeat(60));
  lines.push("");

  for (const message of messages) {
    const author = usersMap.get(message.authorId);
    const date = new Date(message.createdAt).toLocaleString();
    const edited = message.editedAt ? " (edited)" : "";
    
    lines.push(`[${date}] ${author?.name || "Unknown"}${edited}:`);
    lines.push(message.text);
    
    if (message.attachments.length > 0) {
      lines.push(`  Attachments: ${message.attachments.map((a) => a.name).join(", ")}`);
    }
    
    lines.push("");
  }

  return {
    chatTitle: thread.title,
    messageCount: messages.length,
    exportData: lines.join("\n"),
    format: "txt",
  };
}

export function buildExportReply(
  language: Language,
  result: ExportChatResult | null
): string {
  if (!result) {
    return language === "ru"
      ? "❌ Не удалось экспортировать чат. Проверьте название чата и права доступа."
      : "❌ Failed to export chat. Check chat name and access rights.";
  }

  return language === "ru"
    ? `📦 Экспортирован чат "${result.chatTitle}"
Сообщений: ${result.messageCount}
Формат: ${result.format.toUpperCase()}

Данные готовы к скачиванию.`
    : `📦 Exported chat "${result.chatTitle}"
Messages: ${result.messageCount}
Format: ${result.format.toUpperCase()}

Data ready for download.`;
}

export function extractMarkAllReadIntent(userInput: string): boolean {
  const patterns = [
    /(?:отметь|mark)\s+(?:все|all)\s+(?:как\s+)?(?:прочитанн|read)/i,
    /(?:прочитать|read)\s+(?:все|all)/i,
    /mark\s+all\s+as\s+read/i,
  ];

  return patterns.some((pattern) => pattern.test(userInput));
}

export function extractExportChatIntent(
  userInput: string
): ExportChatIntent | null {
  const patterns = [
    /(?:экспортир(?:уй|овать)|export)\s+(?:чат|chat|переписку|conversation)\s+(?:с\s+)?(.+?)(?:\s+в\s+(\w+))?$/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      const chatQuery = match[1].trim();
      const format = match[2]?.toLowerCase() as "json" | "txt" | undefined;
      
      return {
        chatQuery,
        format: format || "json",
      };
    }
  }

  return null;
}
