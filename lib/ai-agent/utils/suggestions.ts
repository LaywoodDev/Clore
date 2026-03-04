// Proactive suggestions based on user context

import type { ConversationContext, Language } from "../types";
import type { StoreData } from "@/lib/server/store";

export function generateProactiveSuggestions(
  store: StoreData,
  userId: string,
  context: ConversationContext,
  language: Language
): string[] {
  const suggestions: string[] = [];

  // Unread messages suggestion
  if (context.unreadCount && context.unreadCount > 10) {
    suggestions.push(
      language === "ru"
        ? `У вас ${context.unreadCount} непрочитанных сообщений. Хотите отметить все как прочитанное?`
        : `You have ${context.unreadCount} unread messages. Mark all as read?`
    );
  }

  // Scheduled messages reminder
  if (context.scheduledMessages && context.scheduledMessages.length > 0) {
    const count = context.scheduledMessages.length;
    suggestions.push(
      language === "ru"
        ? `У вас ${count} запланированных сообщений`
        : `You have ${count} scheduled messages`
    );
  }

  // Recent activity patterns
  const userThreads = store.threads.filter((t) =>
    t.memberIds.includes(userId)
  );
  const recentThreads = userThreads
    .filter((t) => Date.now() - t.updatedAt < 3600_000) // Last hour
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (recentThreads.length > 5) {
    suggestions.push(
      language === "ru"
        ? "Много активных чатов. Хотите закрепить важные?"
        : "Many active chats. Want to pin important ones?"
    );
  }

  // Group management suggestions
  const userGroups = userThreads.filter((t) => t.threadType === "group");
  const largeGroups = userGroups.filter(
    (g) => g.memberIds.length > 30
  );

  if (largeGroups.length > 0) {
    suggestions.push(
      language === "ru"
        ? "В некоторых группах много участников. Рассмотрите создание подгрупп."
        : "Some groups have many members. Consider creating subgroups."
    );
  }

  // Favorites suggestion
  const favoriteMessages = store.messages.filter(
    (m) => m.savedBy && m.savedBy[userId]
  );

  if (favoriteMessages.length > 50) {
    suggestions.push(
      language === "ru"
        ? "У вас много сохраненных сообщений. Хотите их организовать?"
        : "You have many saved messages. Want to organize them?"
    );
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

export function suggestNextActions(
  lastAction: string | undefined,
  language: Language
): string[] {
  if (!lastAction) {
    return [];
  }

  const suggestions: string[] = [];

  switch (lastAction) {
    case "create_group":
      suggestions.push(
        language === "ru"
          ? "Хотите добавить описание группы?"
          : "Want to add a group description?",
        language === "ru"
          ? "Настроить права доступа?"
          : "Configure access rights?"
      );
      break;

    case "send_message":
      suggestions.push(
        language === "ru"
          ? "Отправить еще кому-нибудь?"
          : "Send to someone else?",
        language === "ru"
          ? "Запланировать напоминание?"
          : "Schedule a reminder?"
      );
      break;

    case "invite_to_group":
      suggestions.push(
        language === "ru"
          ? "Назначить роли новым участникам?"
          : "Assign roles to new members?",
        language === "ru"
          ? "Отправить приветственное сообщение?"
          : "Send a welcome message?"
      );
      break;

    case "delete_chat":
      suggestions.push(
        language === "ru"
          ? "Экспортировать переписку перед удалением?"
          : "Export chat before deletion?"
      );
      break;
  }

  return suggestions;
}

export function buildQuickActionsMenu(language: Language): string {
  const actions =
    language === "ru"
      ? [
          "📨 Отправить сообщение",
          "👥 Создать группу",
          "📋 Показать чаты",
          "🔍 Найти сообщение",
          "⏰ Запланировать сообщение",
          "📊 Статистика",
          "⚙️ Настройки",
          "❓ Помощь",
        ]
      : [
          "📨 Send message",
          "👥 Create group",
          "📋 Show chats",
          "🔍 Search message",
          "⏰ Schedule message",
          "📊 Statistics",
          "⚙️ Settings",
          "❓ Help",
        ];

  return actions.join("\n");
}

export function buildHelpMessage(language: Language): string {
  return language === "ru"
    ? `🤖 Доступные команды:

📨 Отправка сообщений:
• "отправь [имя] [текст]"
• "напиши [имя] [текст]"
• "запланируй сообщение [имя] [текст] на [время]"

👥 Управление группами:
• "создай группу [название] с [участники]"
• "добавь [участники] в [группу]"
• "удали [участники] из [группы]"
• "переименуй [группу] в [название]"
• "назначь [участник] админом в [группе]"

📋 Информация:
• "покажи мои чаты"
• "покажи мои группы"
• "сколько у меня чатов"

🗑️ Удаление:
• "удали чат с [имя]"
• "удали все чаты"

🔍 Поиск:
• "найди сообщения от [имя]"
• "найди сообщения про [тема]"

Используйте @username для точного указания пользователя.`
    : `🤖 Available commands:

📨 Send messages:
• "send [name] [text]"
• "message [name] [text]"
• "schedule message [name] [text] at [time]"

👥 Group management:
• "create group [name] with [members]"
• "add [members] to [group]"
• "remove [members] from [group]"
• "rename [group] to [name]"
• "make [member] admin in [group]"

📋 Information:
• "show my chats"
• "show my groups"
• "how many chats do I have"

🗑️ Delete:
• "delete chat with [name]"
• "delete all chats"

🔍 Search:
• "find messages from [name]"
• "find messages about [topic]"

Use @username for exact user reference.`;
}
