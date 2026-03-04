// Smart error handling with contextual suggestions

import type { Language } from "../types";

export type ErrorContext = {
  command: string;
  userInput: string;
  attemptedAction?: string;
  availableOptions?: string[];
};

export function buildSmartErrorReply(
  error: Error,
  language: Language,
  context: ErrorContext
): string {
  const message = error.message;

  // User not found errors
  if (message.includes("User not found") || message.includes("not found")) {
    return language === "ru"
      ? `Не могу найти пользователя или чат. Попробуйте:
• Использовать @username для точного поиска
• Проверить написание имени
• Показать список контактов: "покажи мои чаты"
• Показать список групп: "покажи мои группы"`
      : `Cannot find user or chat. Try:
• Use @username for exact search
• Check the spelling
• Show contact list: "show my chats"
• Show group list: "show my groups"`;
  }

  // Ambiguous recipient errors
  if (message.includes("ambiguous") || message.includes("alternatives")) {
    const alternatives = context.availableOptions?.join(", ") || "";
    return language === "ru"
      ? `Найдено несколько совпадений. Уточните, кого вы имеете в виду:
${alternatives ? `• ${alternatives}` : ""}
Используйте @username для точного указания.`
      : `Multiple matches found. Please specify:
${alternatives ? `• ${alternatives}` : ""}
Use @username for exact match.`;
  }

  // Permission errors
  if (
    message.includes("blocked") ||
    message.includes("forbidden") ||
    message.includes("not allowed")
  ) {
    return language === "ru"
      ? `Действие запрещено. Возможные причины:
• Пользователь заблокирован
• Недостаточно прав в группе
• Настройки приватности пользователя
Проверьте права доступа и попробуйте снова.`
      : `Action forbidden. Possible reasons:
• User is blocked
• Insufficient group permissions
• User's privacy settings
Check access rights and try again.`;
  }

  // Rate limit errors
  if (message.includes("rate limit") || message.includes("too many")) {
    return language === "ru"
      ? `Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.`
      : `Too many requests. Please wait a moment and try again.`;
  }

  // Group errors
  if (message.includes("group")) {
    if (message.includes("duplicate")) {
      return language === "ru"
        ? `Группа с таким названием уже существует. Выберите другое название.`
        : `A group with this name already exists. Choose a different name.`;
    }
    if (message.includes("members")) {
      return language === "ru"
        ? `Проблема с участниками группы. Проверьте:
• Минимум 2 других участника для создания группы
• Максимум 50 участников в группе
• Все участники должны существовать`
        : `Group member issue. Check:
• Minimum 2 other members to create group
• Maximum 50 members per group
• All members must exist`;
    }
  }

  // Scheduled message errors
  if (message.includes("scheduled") || message.includes("future")) {
    return language === "ru"
      ? `Ошибка планирования сообщения. Время должно быть минимум на 5 секунд в будущем.`
      : `Scheduling error. Time must be at least 5 seconds in the future.`;
  }

  // Generic fallback with suggestions
  return language === "ru"
    ? `Произошла ошибка: ${message}

Попробуйте:
• Упростить команду
• Использовать @username для точного указания
• Проверить права доступа
• Показать справку: "помощь"`
    : `An error occurred: ${message}

Try:
• Simplify the command
• Use @username for exact reference
• Check access permissions
• Show help: "help"`;
}

export function logFailedCommand(
  userId: string,
  userInput: string,
  detectedIntent: string | null,
  error: Error
): void {
  // Log for analytics and model improvement
  const failedCommand = {
    userId,
    userInput,
    detectedIntent,
    error: error.message,
    timestamp: Date.now(),
  };

  // In production, send to analytics service
  console.warn("[AI Agent] Failed command:", failedCommand);
}
