// Command coordinator - routes commands to appropriate handlers

import type { StoreData } from "@/lib/server/store";
import type { Language, CommandType, CommandIntent } from "../types";
import { extractSearchIntent, searchMessages, buildSearchReply } from "./search";
import {
  extractMarkAllReadIntent,
  extractExportChatIntent,
  markAllChatsAsRead,
  buildMarkAllReadReply,
  exportChatToJson,
  buildExportReply,
} from "./bulk-operations";
import {
  extractStatisticsIntent,
  calculateUserStatistics,
  buildStatisticsReply,
} from "./statistics";
import { buildHelpMessage } from "../utils/suggestions";

export type CommandResult = {
  message: string;
  metadata?: Record<string, unknown>;
};

export async function detectCommandIntent(
  userInput: string,
  language: Language
): Promise<CommandIntent> {
  const normalized = userInput.toLowerCase().trim();

  // Help command
  if (
    /^(?:помощь|help|справка|\?)$/i.test(normalized) ||
    /(?:как|how)\s+(?:использовать|use|работать|work)/i.test(normalized)
  ) {
    return {
      type: "unknown",
      confidence: 1.0,
      rawInput: userInput,
      parsedData: { isHelp: true },
    };
  }

  // Statistics
  if (extractStatisticsIntent(userInput)) {
    return {
      type: "unknown",
      confidence: 0.9,
      rawInput: userInput,
      parsedData: { isStatistics: true },
    };
  }

  // Search
  const searchIntent = extractSearchIntent(userInput);
  if (searchIntent) {
    return {
      type: "search_messages",
      confidence: 0.9,
      rawInput: userInput,
      parsedData: searchIntent,
    };
  }

  // Mark all read
  if (extractMarkAllReadIntent(userInput)) {
    return {
      type: "mark_all_read",
      confidence: 0.95,
      rawInput: userInput,
    };
  }

  // Export chat
  const exportIntent = extractExportChatIntent(userInput);
  if (exportIntent) {
    return {
      type: "export_chat",
      confidence: 0.9,
      rawInput: userInput,
      parsedData: exportIntent,
    };
  }

  // Default: unknown command
  return {
    type: "unknown",
    confidence: 0.0,
    rawInput: userInput,
  };
}

export async function executeCommand(
  store: StoreData,
  userId: string,
  language: Language,
  intent: CommandIntent
): Promise<CommandResult> {
  // Help
  if (intent.parsedData && (intent.parsedData as { isHelp?: boolean }).isHelp) {
    return {
      message: buildHelpMessage(language),
    };
  }

  // Statistics
  if (
    intent.parsedData &&
    (intent.parsedData as { isStatistics?: boolean }).isStatistics
  ) {
    const stats = calculateUserStatistics(store, userId);
    return {
      message: buildStatisticsReply(language, stats),
      metadata: { statistics: stats },
    };
  }

  // Search messages
  if (intent.type === "search_messages" && intent.parsedData) {
    const searchIntent = intent.parsedData as ReturnType<
      typeof extractSearchIntent
    >;
    if (searchIntent) {
      const results = searchMessages(store, userId, searchIntent);
      const summary = {
        results,
        totalFound: results.length,
        query: searchIntent.query,
      };
      return {
        message: buildSearchReply(language, summary),
        metadata: { searchResults: results },
      };
    }
  }

  // Mark all read
  if (intent.type === "mark_all_read") {
    const result = await markAllChatsAsRead(userId);
    return {
      message: buildMarkAllReadReply(language, result),
      metadata: { markedCount: result.markedCount },
    };
  }

  // Export chat
  if (intent.type === "export_chat" && intent.parsedData) {
    const exportIntent = intent.parsedData as ReturnType<
      typeof extractExportChatIntent
    >;
    if (exportIntent) {
      // Find chat by query
      const userThreads = store.threads.filter((t) =>
        t.memberIds.includes(userId)
      );
      const normalizedQuery = exportIntent.chatQuery.toLowerCase();
      const thread = userThreads.find((t) =>
        t.title.toLowerCase().includes(normalizedQuery)
      );

      if (thread) {
        const result = exportChatToJson(store, userId, thread.id);
        return {
          message: buildExportReply(language, result),
          metadata: { exportData: result?.exportData },
        };
      }

      return {
        message: buildExportReply(language, null),
      };
    }
  }

  // Unknown command
  return {
    message:
      language === "ru"
        ? `Команда не распознана. Напишите "помощь" для списка доступных команд.`
        : `Command not recognized. Type "help" for available commands.`,
  };
}
