// Tests for search functionality

import { describe, it, expect } from "@jest/globals";
import { extractSearchIntent } from "@/lib/ai-agent/commands/search";

describe("Search Command Parser", () => {
  it("should parse basic search query", () => {
    const result = extractSearchIntent("найди сообщения про оплату");
    expect(result).not.toBeNull();
    expect(result?.query).toContain("оплату");
  });

  it("should parse search with from filter", () => {
    const result = extractSearchIntent("найди сообщения от Ивана");
    expect(result).not.toBeNull();
    expect(result?.fromUser).toBe("Ивана");
  });

  it("should parse search with from filter using @", () => {
    const result = extractSearchIntent("найди сообщения от @ivan");
    expect(result).not.toBeNull();
    expect(result?.fromUser).toBe("ivan");
  });

  it("should parse English search query", () => {
    const result = extractSearchIntent("find messages about payment");
    expect(result).not.toBeNull();
    expect(result?.query).toContain("payment");
  });

  it("should parse search with attachment filter", () => {
    const result = extractSearchIntent("найди сообщения с вложениями");
    expect(result).not.toBeNull();
    expect(result?.hasAttachments).toBe(true);
  });

  it("should return null for non-search queries", () => {
    const result = extractSearchIntent("отправь Ивану привет");
    expect(result).toBeNull();
  });

  it("should handle complex search query", () => {
    const result = extractSearchIntent(
      "найди сообщения от @ivan про оплату с вложениями"
    );
    expect(result).not.toBeNull();
    expect(result?.fromUser).toBe("ivan");
    expect(result?.hasAttachments).toBe(true);
    expect(result?.query).toContain("оплату");
  });
});
