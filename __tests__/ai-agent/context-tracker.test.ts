// Tests for context tracking

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  getConversationContext,
  updateConversationContext,
  clearConversationContext,
  extractMentionedUsers,
  extractTopics,
  resolveContextualReference,
} from "@/lib/ai-agent/utils/context-tracker";

describe("Context Tracker", () => {
  const testUserId = "test-user-123";

  beforeEach(() => {
    clearConversationContext(testUserId);
  });

  describe("Context Management", () => {
    it("should create new context for user", () => {
      const context = getConversationContext(testUserId);
      expect(context).toBeDefined();
      expect(context.recentTopics).toEqual([]);
      expect(context.mentionedUsers).toEqual([]);
    });

    it("should update context with new data", () => {
      updateConversationContext(testUserId, {
        mentionedUsers: ["ivan"],
        recentTopics: ["payment"],
      });

      const context = getConversationContext(testUserId);
      expect(context.mentionedUsers).toContain("ivan");
      expect(context.recentTopics).toContain("payment");
    });

    it("should maintain context across multiple updates", () => {
      updateConversationContext(testUserId, {
        mentionedUsers: ["ivan"],
      });
      updateConversationContext(testUserId, {
        mentionedUsers: ["maria"],
      });

      const context = getConversationContext(testUserId);
      expect(context.mentionedUsers).toContain("ivan");
      expect(context.mentionedUsers).toContain("maria");
    });

    it("should limit context size", () => {
      const manyUsers = Array.from({ length: 30 }, (_, i) => `user${i}`);
      updateConversationContext(testUserId, {
        mentionedUsers: manyUsers,
      });

      const context = getConversationContext(testUserId);
      expect(context.mentionedUsers.length).toBeLessThanOrEqual(20);
    });
  });

  describe("Extract Mentioned Users", () => {
    it("should extract @username mentions", () => {
      const users = extractMentionedUsers("Отправь @ivan и @maria привет");
      expect(users).toContain("ivan");
      expect(users).toContain("maria");
    });

    it("should handle multiple mentions", () => {
      const users = extractMentionedUsers("@user1 @user2 @user3");
      expect(users).toHaveLength(3);
    });

    it("should return empty array for no mentions", () => {
      const users = extractMentionedUsers("Привет всем");
      expect(users).toEqual([]);
    });
  });

  describe("Extract Topics", () => {
    it("should extract payment-related topics", () => {
      const topics = extractTopics("Нужно обсудить оплату проекта");
      expect(topics).toContain("оплата");
      expect(topics).toContain("проект");
    });

    it("should extract English topics", () => {
      const topics = extractTopics("Let's discuss the payment for the project");
      expect(topics).toContain("payment");
      expect(topics).toContain("project");
    });

    it("should return empty array for no topics", () => {
      const topics = extractTopics("Привет как дела");
      expect(topics).toEqual([]);
    });
  });

  describe("Resolve Contextual References", () => {
    it("should resolve pronoun to mentioned user", () => {
      updateConversationContext(testUserId, {
        mentionedUsers: ["ivan"],
      });

      const context = getConversationContext(testUserId);
      const resolved = resolveContextualReference("Отправь ему привет", context);
      expect(resolved).toContain("ivan");
    });

    it("should resolve 'туда' to active group", () => {
      updateConversationContext(testUserId, {
        activeGroup: "Рабочая группа",
      });

      const context = getConversationContext(testUserId);
      const resolved = resolveContextualReference("Добавь Ивана туда", context);
      expect(resolved).toContain("Рабочая группа");
    });

    it("should not modify text without context", () => {
      const context = getConversationContext(testUserId);
      const resolved = resolveContextualReference("Отправь ему привет", context);
      expect(resolved).toBe("Отправь ему привет");
    });
  });
});
