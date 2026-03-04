// Conversation context tracking for better intent understanding

import type { ConversationContext } from "../types";

const contextStore = new Map<string, ConversationContext>();

export function getConversationContext(userId: string): ConversationContext {
  const existing = contextStore.get(userId);
  if (existing) {
    return existing;
  }

  const newContext: ConversationContext = {
    recentTopics: [],
    mentionedUsers: [],
    activeGroup: undefined,
    lastAction: undefined,
    unreadCount: 0,
    scheduledMessages: [],
  };

  contextStore.set(userId, newContext);
  return newContext;
}

export function updateConversationContext(
  userId: string,
  updates: Partial<ConversationContext>
): void {
  const context = getConversationContext(userId);
  
  if (updates.recentTopics) {
    context.recentTopics = [
      ...updates.recentTopics,
      ...context.recentTopics,
    ].slice(0, 10);
  }

  if (updates.mentionedUsers) {
    context.mentionedUsers = [
      ...updates.mentionedUsers,
      ...context.mentionedUsers.filter(
        (u) => !updates.mentionedUsers!.includes(u)
      ),
    ].slice(0, 20);
  }

  if (updates.activeGroup !== undefined) {
    context.activeGroup = updates.activeGroup;
  }

  if (updates.lastAction !== undefined) {
    context.lastAction = updates.lastAction;
  }

  if (updates.unreadCount !== undefined) {
    context.unreadCount = updates.unreadCount;
  }

  if (updates.scheduledMessages) {
    context.scheduledMessages = updates.scheduledMessages;
  }

  contextStore.set(userId, context);
}

export function clearConversationContext(userId: string): void {
  contextStore.delete(userId);
}

export function extractMentionedUsers(text: string): string[] {
  const mentions: string[] = [];
  
  // Extract @username mentions
  const usernameMatches = text.matchAll(/@([\w\d_-]+)/g);
  for (const match of usernameMatches) {
    if (match[1]) {
      mentions.push(match[1]);
    }
  }

  return mentions;
}

export function extractTopics(text: string): string[] {
  const topics: string[] = [];
  
  // Simple keyword extraction (can be improved with NLP)
  const keywords = [
    "оплата", "payment", "деньги", "money",
    "встреча", "meeting", "созвон", "call",
    "проект", "project", "задача", "task",
    "документ", "document", "файл", "file",
    "дизайн", "design", "макет", "layout",
  ];

  const normalized = text.toLowerCase();
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      topics.push(keyword);
    }
  }

  return topics;
}

export function resolveContextualReference(
  text: string,
  context: ConversationContext
): string {
  let resolved = text;

  // Resolve pronouns based on context
  const pronouns = [
    { pattern: /\b(его|him|he)\b/gi, replacement: context.mentionedUsers[0] },
    { pattern: /\b(её|ее|her|she)\b/gi, replacement: context.mentionedUsers[0] },
    { pattern: /\b(туда|there)\b/gi, replacement: context.activeGroup },
  ];

  for (const { pattern, replacement } of pronouns) {
    if (replacement && pattern.test(resolved)) {
      resolved = resolved.replace(pattern, replacement);
    }
  }

  return resolved;
}
