import { NextResponse } from "next/server";

import { getStore } from "@/lib/server/store";

type AiChatMessagePayload = {
  role?: string;
  content?: string;
};

type AiChatPayload = {
  userId?: string;
  language?: string;
  messages?: AiChatMessagePayload[];
};

type NormalizedAiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const RESPONSE_TIMEOUT_MS = 12_000;

function normalizeMessages(input: AiChatMessagePayload[]): NormalizedAiChatMessage[] {
  return input
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }
      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = typeof message.content === "string" ? message.content.trim() : "";
      if (!role || !content) {
        return null;
      }
      return {
        role,
        content: content.slice(0, MAX_MESSAGE_LENGTH),
      } satisfies NormalizedAiChatMessage;
    })
    .filter((message): message is NormalizedAiChatMessage => message !== null)
    .slice(-MAX_MESSAGES);
}

function fallbackReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return "Got your request. Add a bit more detail and I will help right away.";
  }
  return "I am ready to help. Share more details about your request and I will do my best to help.";
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }

  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  }
  return "";
}

function extractChatCompletionText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") {
    return "";
  }
  const message = (firstChoice as Record<string, unknown>).message;
  if (!message || typeof message !== "object") {
    return "";
  }
  const content = (message as Record<string, unknown>).content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  for (const part of content) {
    if (!part || typeof part !== "object") {
      continue;
    }
    const text = (part as Record<string, unknown>).text;
    if (typeof text === "string" && text.trim()) {
      return text.trim();
    }
  }
  return "";
}

async function generateAssistantReply(
  language: "en" | "ru",
  messages: NormalizedAiChatMessage[]
): Promise<string> {
  const apiKey =
    process.env.PROXYAPI_API_KEY?.trim() ??
    process.env.OPENAI_API_KEY?.trim() ??
    "";
  if (!apiKey) {
    return fallbackReply(language);
  }

  const model = process.env.CLORE_BOT_MODEL?.trim() || "openai/gpt-4o-mini";
  const baseUrl =
    process.env.CLORE_BOT_BASE_URL?.trim() || "https://openai.api.proxyapi.ru/v1";
  const systemPrompt =
    language === "ru"
      ? "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully. Prefer Russian unless the user writes in another language."
      : "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully.";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system" as const,
            content: systemPrompt,
          },
          ...messages,
        ],
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => "");
      console.error(
        `[ai-chat] Provider error ${response.status}: ${errorPayload.slice(0, 400)}`
      );
      return fallbackReply(language);
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const text = extractChatCompletionText(payload) || extractResponseText(payload);
    return text || fallbackReply(language);
  } catch {
    return fallbackReply(language);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AiChatPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const language: "en" | "ru" = body?.language === "ru" ? "ru" : "en";
  const messages = normalizeMessages(Array.isArray(body?.messages) ? body.messages : []);

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (messages.length === 0) {
    return NextResponse.json({ error: "Provide at least one message." }, { status: 400 });
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from user." },
      { status: 400 }
    );
  }

  try {
    const store = await getStore();
    const userExists = store.users.some((user) => user.id === userId);
    if (!userExists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const reply = await generateAssistantReply(language, messages);
    return NextResponse.json({ message: reply });
  } catch {
    return NextResponse.json({ error: "Unable to generate response." }, { status: 500 });
  }
}
