// Statistics command handler

import type { StoreData } from "@/lib/server/store";
import type { Language } from "../types";

export type UserStatistics = {
  totalChats: number;
  directChats: number;
  groupChats: number;
  channelChats: number;
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  favoriteMessages: number;
  unreadChats: number;
  activeToday: number;
  activeThisWeek: number;
  mostActiveChat: {
    title: string;
    messageCount: number;
  } | null;
  topContacts: Array<{
    name: string;
    messageCount: number;
  }>;
};

export function calculateUserStatistics(
  store: StoreData,
  userId: string
): UserStatistics {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Threads
  const userThreads = store.threads.filter((t) =>
    t.memberIds.includes(userId)
  );

  const directChats = userThreads.filter((t) => t.threadType === "direct");
  const groupChats = userThreads.filter((t) => t.threadType === "group" && t.groupKind !== "channel");
  const channelChats = userThreads.filter((t) => t.threadType === "group" && t.groupKind === "channel");

  // Unread chats
  const unreadChats = userThreads.filter((t) => {
    const lastRead = t.readBy?.[userId] || 0;
    return t.updatedAt > lastRead;
  });

  // Messages
  const userThreadIds = new Set(userThreads.map((t) => t.id));
  const accessibleMessages = store.messages.filter(
    (m) => userThreadIds.has(m.chatId) || m.savedBy?.[userId]
  );

  const sentMessages = accessibleMessages.filter((m) => m.authorId === userId);
  const receivedMessages = accessibleMessages.filter(
    (m) => m.authorId !== userId
  );

  const favoriteMessages = store.messages.filter((m) => m.savedBy?.[userId]);

  // Activity
  const activeToday = userThreads.filter(
    (t) => t.updatedAt > oneDayAgo
  ).length;

  const activeThisWeek = userThreads.filter(
    (t) => t.updatedAt > oneWeekAgo
  ).length;

  // Most active chat
  const chatMessageCounts = new Map<string, number>();
  for (const message of accessibleMessages) {
    const count = chatMessageCounts.get(message.chatId) || 0;
    chatMessageCounts.set(message.chatId, count + 1);
  }

  let mostActiveChat: UserStatistics["mostActiveChat"] = null;
  let maxMessages = 0;

  for (const [chatId, count] of chatMessageCounts.entries()) {
    if (count > maxMessages) {
      const thread = userThreads.find((t) => t.id === chatId);
      if (thread) {
        mostActiveChat = {
          title: thread.title,
          messageCount: count,
        };
        maxMessages = count;
      }
    }
  }

  // Top contacts (by message count in direct chats)
  const contactMessageCounts = new Map<string, number>();
  
  for (const thread of directChats) {
    const peerUserId = thread.memberIds.find((id) => id !== userId);
    if (!peerUserId) continue;

    const threadMessages = accessibleMessages.filter(
      (m) => m.chatId === thread.id
    );
    contactMessageCounts.set(peerUserId, threadMessages.length);
  }

  const topContacts = Array.from(contactMessageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([contactId, count]) => {
      const user = store.users.find((u) => u.id === contactId);
      return {
        name: user?.name || "Unknown",
        messageCount: count,
      };
    });

  return {
    totalChats: userThreads.length,
    directChats: directChats.length,
    groupChats: groupChats.length,
    channelChats: channelChats.length,
    totalMessages: accessibleMessages.length,
    sentMessages: sentMessages.length,
    receivedMessages: receivedMessages.length,
    favoriteMessages: favoriteMessages.length,
    unreadChats: unreadChats.length,
    activeToday,
    activeThisWeek,
    mostActiveChat,
    topContacts,
  };
}

export function buildStatisticsReply(
  language: Language,
  stats: UserStatistics
): string {
  if (language === "ru") {
    return `📊 Ваша статистика:

💬 Чаты:
• Всего: ${stats.totalChats}
• Личные: ${stats.directChats}
• Группы: ${stats.groupChats}
• Каналы: ${stats.channelChats}
• Непрочитанные: ${stats.unreadChats}

📨 Сообщения:
• Всего: ${stats.totalMessages}
• Отправлено: ${stats.sentMessages}
• Получено: ${stats.receivedMessages}
• В избранном: ${stats.favoriteMessages}

📈 Активность:
• Активных сегодня: ${stats.activeToday}
• Активных за неделю: ${stats.activeThisWeek}

${
  stats.mostActiveChat
    ? `🔥 Самый активный чат:
"${stats.mostActiveChat.title}" (${stats.mostActiveChat.messageCount} сообщений)`
    : ""
}

${
  stats.topContacts.length > 0
    ? `👥 Топ контактов:
${stats.topContacts
  .map((c, i) => `${i + 1}. ${c.name} (${c.messageCount} сообщений)`)
  .join("\n")}`
    : ""
}`;
  }

  return `📊 Your Statistics:

💬 Chats:
• Total: ${stats.totalChats}
• Direct: ${stats.directChats}
• Groups: ${stats.groupChats}
• Channels: ${stats.channelChats}
• Unread: ${stats.unreadChats}

📨 Messages:
• Total: ${stats.totalMessages}
• Sent: ${stats.sentMessages}
• Received: ${stats.receivedMessages}
• Favorites: ${stats.favoriteMessages}

📈 Activity:
• Active today: ${stats.activeToday}
• Active this week: ${stats.activeThisWeek}

${
  stats.mostActiveChat
    ? `🔥 Most active chat:
"${stats.mostActiveChat.title}" (${stats.mostActiveChat.messageCount} messages)`
    : ""
}

${
  stats.topContacts.length > 0
    ? `👥 Top contacts:
${stats.topContacts
  .map((c, i) => `${i + 1}. ${c.name} (${c.messageCount} messages)`)
  .join("\n")}`
    : ""
}`;
}

export function extractStatisticsIntent(userInput: string): boolean {
  const patterns = [
    /(?:покажи|show|display)\s+(?:мою\s+)?(?:статистик|statistics|stats)/i,
    /(?:статистик|statistics|stats)/i,
    /(?:сколько|how\s+many)\s+(?:у\s+меня\s+)?(?:чатов|сообщений|chats|messages)/i,
  ];

  return patterns.some((pattern) => pattern.test(userInput));
}
