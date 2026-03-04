// Tests for bulk operations

import { describe, it, expect } from "@jest/globals";
import {
  extractMarkAllReadIntent,
  extractExportChatIntent,
} from "@/lib/ai-agent/commands/bulk-operations";

describe("Bulk Operations Parser", () => {
  describe("Mark All Read", () => {
    it("should detect mark all read command in Russian", () => {
      expect(extractMarkAllReadIntent("отметь все как прочитанное")).toBe(true);
      expect(extractMarkAllReadIntent("прочитать все")).toBe(true);
    });

    it("should detect mark all read command in English", () => {
      expect(extractMarkAllReadIntent("mark all as read")).toBe(true);
      expect(extractMarkAllReadIntent("mark all read")).toBe(true);
    });

    it("should return false for non-matching queries", () => {
      expect(extractMarkAllReadIntent("отправь сообщение")).toBe(false);
      expect(extractMarkAllReadIntent("покажи чаты")).toBe(false);
    });
  });

  describe("Export Chat", () => {
    it("should parse export command with chat name", () => {
      const result = extractExportChatIntent("экспортируй чат с Иваном");
      expect(result).not.toBeNull();
      expect(result?.chatQuery).toBe("Иваном");
      expect(result?.format).toBe("json");
    });

    it("should parse export command with format", () => {
      const result = extractExportChatIntent("экспортируй чат с Иваном в txt");
      expect(result).not.toBeNull();
      expect(result?.chatQuery).toBe("Иваном");
      expect(result?.format).toBe("txt");
    });

    it("should parse English export command", () => {
      const result = extractExportChatIntent("export chat with Ivan");
      expect(result).not.toBeNull();
      expect(result?.chatQuery).toBe("Ivan");
    });

    it("should return null for non-export queries", () => {
      const result = extractExportChatIntent("отправь сообщение");
      expect(result).toBeNull();
    });
  });
});
