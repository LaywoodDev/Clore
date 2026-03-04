// Main AI Agent entry point with enhanced capabilities

import { getStore } from "@/lib/server/store";
import type { Language } from "./types";
import { commandRateLimiter } from "./utils/cache";
import {
  getConversationContext,
  updateConversationContext,
  extractMentionedUsers,
  extractTopics,
  resolveContextualReference,
} from "./utils/context-tracker";
import {
  buildSmartErrorReply,
  logFailedCommand,
  type ErrorContext,
} from "./utils/error-handler";
import {
  generateProactiveSuggestions,
  suggestNextActions,
  buildQuickActionsMenu,
} from "./utils/suggestions";
import {
  detectCommandIntent,
  executeCommand,
  type CommandResult,
} from "./commands/coordinator";

export type AiAgentRequest = {
  userId: string;
  userInput: string;
  language: Language;
  includeContext?: boolean;
  includeSuggestions?: boolean;
};

export type AiAgentResponse = {
  message: string;
  suggestions?: string[];
  quickActions?: string;
  metadata?: Record<string, unknown>;
  error?: string;
};

export async function processAiAgentRequest(
  request: AiAgentRequest
): Promise<AiAgentResponse> {
  const { userId, userInput, language, includeContext, includeSuggestions } =
    request;

  try {
    // Rate limiting
    if (!commandRateLimiter.check(userId)) {
      const remaining = commandRateLimiter.getRemainingRequests(userId);
      return {
        message:
          language === "ru"
            ? `⏱️ Слишком много запросов. Пожалуйста, подождите немного.
Осталось запросов: ${remaining}/30 в минуту`
            : `⏱️ Too many requests. Please wait a moment.
Remaining requests: ${remaining}/30 per minute`,
        error: "rate_limit_exceeded",
      };
    }

    // Get conversation context
    const context = getConversationContext(userId);

    // Resolve contextual references
    const resolvedInput = includeContext
      ? resolveContextualReference(userInput, context)
      : userInput;

    // Extract context from input
    const mentionedUsers = extractMentionedUsers(resolvedInput);
    const topics = extractTopics(resolvedInput);

    if (mentionedUsers.length > 0 || topics.length > 0) {
      updateConversationContext(userId, {
        mentionedUsers,
        recentTopics: topics,
      });
    }

    // Get store data
    const store = await getStore();

    // Detect command intent
    const intent = await detectCommandIntent(resolvedInput, language);

    // Execute command
    const result = await executeCommand(store, userId, language, intent);

    // Update context with action
    if (intent.type !== "unknown") {
      updateConversationContext(userId, {
        lastAction: intent.type,
      });
    }

    // Generate suggestions if requested
    let suggestions: string[] | undefined;
    if (includeSuggestions) {
      const proactiveSuggestions = generateProactiveSuggestions(
        store,
        userId,
        context,
        language
      );
      const nextActions = suggestNextActions(context.lastAction, language);
      suggestions = [...proactiveSuggestions, ...nextActions].slice(0, 3);
    }

    // Build response
    const response: AiAgentResponse = {
      message: result.message,
      metadata: result.metadata,
    };

    if (suggestions && suggestions.length > 0) {
      response.suggestions = suggestions;
    }

    if (includeSuggestions && intent.confidence < 0.5) {
      response.quickActions = buildQuickActionsMenu(language);
    }

    return response;
  } catch (error) {
    const errorContext: ErrorContext = {
      command: "ai_agent",
      userInput,
    };

    const errorMessage =
      error instanceof Error
        ? buildSmartErrorReply(error, language, errorContext)
        : language === "ru"
          ? "Произошла неизвестная ошибка. Попробуйте еще раз."
          : "An unknown error occurred. Please try again.";

    if (error instanceof Error) {
      logFailedCommand(userId, userInput, null, error);
    }

    return {
      message: errorMessage,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

// Export utilities for use in other parts of the app
export * from "./types";
export * from "./utils/cache";
export * from "./utils/context-tracker";
export * from "./utils/error-handler";
export * from "./utils/suggestions";
export * from "./commands/search";
export * from "./commands/bulk-operations";
export * from "./commands/statistics";
export * from "./commands/coordinator";
