import { NextResponse } from "next/server";

import {
  buildModelCandidates,
  getAiProviderConfig,
} from "@/lib/server/ai-provider";
import { getStore } from "@/lib/server/store";

type AiChatMessagePayload = {
  role?: string;
  content?: string;
};

type AiChatPayload = {
  userId?: string;
  language?: string;
  messages?: AiChatMessagePayload[];
  searchEnabled?: boolean;
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
  messages: NormalizedAiChatMessage[],
  searchEnabled: boolean
): Promise<string> {
  const { apiKey, baseUrl, model: modelFromEnv } = getAiProviderConfig();
  const systemPrompt =
    language === "ru"
      ? "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully. Prefer Russian unless the user writes in another language."
      : "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully.";
  const modelCandidates = buildModelCandidates(modelFromEnv, searchEnabled);

  let lastErrorMessage = "";
  for (const model of modelCandidates) {
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
        lastErrorMessage = `model "${model}" returned ${response.status}`;
        console.error(
          `[ai-chat] Provider error ${response.status} for model "${model}": ${errorPayload.slice(0, 400)}`
        );
        continue;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const text = extractChatCompletionText(payload) || extractResponseText(payload);
      if (text.trim().length > 0) {
        return text;
      }
      lastErrorMessage = `model "${model}" returned empty response`;
      console.error(`[ai-chat] Empty response for model "${model}".`);
    } catch (error) {
      lastErrorMessage =
        error instanceof Error && error.message.trim().length > 0
          ? `model "${model}" failed: ${error.message}`
          : `model "${model}" failed`;
      console.error(`[ai-chat] ${lastErrorMessage}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(lastErrorMessage || "AI provider request failed.");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AiChatPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const language: "en" | "ru" = body?.language === "ru" ? "ru" : "en";
  const searchEnabled = body?.searchEnabled === true;
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

    const reply = await generateAssistantReply(language, messages, searchEnabled);
    return NextResponse.json({ message: reply });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Unable to generate response.";
    const isConfigError =
      message.includes("not configured") ||
      message.includes("API_KEY") ||
      message.includes("CLORE_BOT_");
    const status =
      isConfigError || message.includes("provider")
        ? 502
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
