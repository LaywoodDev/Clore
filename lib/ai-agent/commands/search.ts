// Search messages command handler

import type { StoreData, StoredChatMessage } from "@/lib/server/store";
import type { Language } from "../types";

export type SearchIntent = {
  query: string;
  fromUser?: string;
  inChat?: string;
  dateFrom?: number;
  dateTo?: number;
  hasAttachments?: boolean;
};

export type SearchResult = {
  message: StoredChatMessage;
  chatTitle: string;
  authorName: string;
  relevanceScore: number;
};

export type SearchActionSummary = {
  results: SearchResult[];
  totalFound: number;
  query: string;
};

function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function calculateRelevanceScore(
  message: StoredChatMessage,
  query: string,
  authorMatch: boolean
): number {
  let score = 0;
  const normalizedText = normalizeSearchQuery(message.text);
  const normalizedQuery = normalizeSearchQuery(query);

  // Exact match
  if (normalizedText.includes(normalizedQuery)) {
    score += 10;
  }

  // Word matches
  const queryWords = normalizedQuery.split(/\s+/);
  const textWords = normalizedText.split(/\s+/);
  const matchingWords = queryWords.filter((qw) =>
    textWords.some((tw) => tw.includes(qw) || qw.includes(tw))
  );
  score += matchingWords.length * 2;

  // Author match bonus
  if (authorMatch) {
    score += 5;
  }

  // Recency bonus (newer messages score higher)
  const daysSinceCreation = (Date.now() - message.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 7) {
    score += 3;
  } else if (daysSinceCreation < 30) {
    score += 1;
  }

  // Attachment bonus
  if (message.attachments.length > 0) {
    score += 1;
  }

  return score;
}

export function searchMessages(
  store: StoreData,
  userId: string,
  intent: SearchIntent
): SearchResult[] {
  const userThreads = store.threads.filter((t) =>
    t.memberIds.includes(userId)
  );
  const userThreadIds = new Set(userThreads.map((t) => t.id));

  let messages = store.messages.filter((m) => {
    // User must have access to the chat
    if (!userThreadIds.has(m.chatId) && !m.savedBy?.[userId]) {
      return false;
    }

    // Date filters
    if (intent.dateFrom && m.createdAt < intent.dateFrom) {
      return false;
    }
    if (intent.dateTo && m.createdAt > intent.dateTo) {
      return false;
    }

    // Attachment filter
    if (intent.hasAttachments && m.attachments.length === 0) {
      return false;
    }

    // Chat filter
    if (intent.inChat && m.chatId !== intent.inChat) {
      return false;
    }

    return true;
  });

  // Author filter
  let authorUserId: string | undefined;
  if (intent.fromUser) {
    const normalizedFromUser = normalizeSearchQuery(intent.fromUser);
    const author = store.users.find((u) => {
      const normalizedName = normalizeSearchQuery(u.name);
      const normalizedUsername = normalizeSearchQuery(u.username);
      return (
        normalizedName.includes(normalizedFromUser) ||
        normalizedFromUser.includes(normalizedName) ||
        normalizedUsername.includes(normalizedFromUser) ||
        normalizedFromUser.includes(normalizedUsername)
      );
    });
    if (author) {
      authorUserId = author.id;
      messages = messages.filter((m) => m.authorId === authorUserId);
    }
  }

  // Text search and scoring
  const results: SearchResult[] = messages
    .map((message) => {
      const thread = userThreads.find((t) => t.id === message.chatId);
      const author = store.users.find((u) => u.id === message.authorId);
      const authorMatch = authorUserId === message.authorId;

      const relevanceScore = calculateRelevanceScore(
        message,
        intent.query,
        authorMatch
      );

      if (relevanceScore === 0) {
        return null;
      }

      return {
        message,
        chatTitle: thread?.title || author?.name || "Unknown",
        authorName: author?.name || "Unknown",
        relevanceScore,
      };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 50); // Limit to top 50 results

  return results;
}

export function buildSearchReply(
  language: Language,
  summary: SearchActionSummary
): string {
  if (summary.totalFound === 0) {
    return language === "ru"
      ? `Ничего не найдено по запросу "${summary.query}".

Попробуйте:
• Упростить запрос
• Проверить написание
• Использовать ключевые слова`
      : `No results found for "${summary.query}".

Try:
• Simplify the query
• Check spelling
• Use keywords`;
  }

  const resultsList = summary.results
    .slice(0, 10)
    .map((result, index) => {
      const preview = result.message.text.slice(0, 100);
      const hasMore = result.message.text.length > 100;
      const date = new Date(result.message.createdAt).toLocaleDateString();
      
      return `${index + 1}. ${result.authorName} в "${result.chatTitle}" (${date})
   ${preview}${hasMore ? "..." : ""}`;
    })
    .join("\n\n");

  const header =
    language === "ru"
      ? `🔍 Найдено ${summary.totalFound} сообщений по запросу "${summary.query}":`
      : `🔍 Found ${summary.totalFound} messages for "${summary.query}":`;

  const footer =
    summary.totalFound > 10
      ? language === "ru"
        ? `\n\nПоказаны первые 10 результатов из ${summary.totalFound}.`
        : `\n\nShowing first 10 of ${summary.totalFound} results.`
      : "";

  return `${header}\n\n${resultsList}${footer}`;
}

export function extractSearchIntent(userInput: string): SearchIntent | null {
  const normalized = normalizeSearchQuery(userInput);

  // Check if it's a search command
  const searchPatterns = [
    /(?:найди|найти|поиск|search|find)\s+(?:сообщени[яе]|messages?)\s+(.+)/i,
    /(?:найди|найти|поиск|search|find)\s+(.+)/i,
  ];

  let query = "";
  for (const pattern of searchPatterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      query = match[1].trim();
      break;
    }
  }

  if (!query) {
    return null;
  }

  const intent: SearchIntent = { query };

  // Extract "from user" filter
  const fromMatch = query.match(/(?:от|from)\s+(@?\w+)/i);
  if (fromMatch && fromMatch[1]) {
    intent.fromUser = fromMatch[1].replace("@", "");
    query = query.replace(fromMatch[0], "").trim();
  }

  // Extract "in chat" filter
  const inMatch = query.match(/(?:в|in)\s+(.+?)(?:\s+|$)/i);
  if (inMatch && inMatch[1]) {
    intent.inChat = inMatch[1].trim();
    query = query.replace(inMatch[0], "").trim();
  }

  // Extract "with attachments" filter
  if (/(?:с|with)\s+(?:вложени|attachment)/i.test(query)) {
    intent.hasAttachments = true;
    query = query.replace(/(?:с|with)\s+(?:вложени[ями]*|attachments?)/gi, "").trim();
  }

  intent.query = query;

  return intent.query ? intent : null;
}
