import { NextResponse } from "next/server";

import { getOpenAiCompatibleProviderConfig } from "@/lib/server/ai-provider";
import { AI_FEATURE_ENABLED } from "@/lib/shared/ai-feature";

const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

function resolveOpenAiAudioBaseUrl(rawBaseUrl: string): string {
  const normalized = rawBaseUrl.trim().replace(/\/+$/u, "");
  if (normalized.includes("openai.api.proxyapi.ru/v1")) {
    return "https://api.proxyapi.ru/openai/v1";
  }
  return normalized;
}

export async function POST(request: Request) {
  if (!AI_FEATURE_ENABLED) {
    return NextResponse.json({ error: "AI is disabled." }, { status: 503 });
  }

  const providerConfig = getOpenAiCompatibleProviderConfig();
  if (!providerConfig) {
    return NextResponse.json(
      { error: "OpenAI-compatible voice provider is not configured." },
      { status: 502 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const audioFile = formData?.get("audio");
  if (!(audioFile instanceof File)) {
    return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  }

  const payload = new FormData();
  payload.set("file", audioFile, audioFile.name || "speech.webm");
  payload.set("model", DEFAULT_TRANSCRIPTION_MODEL);

  const language = formData?.get("language");
  if (typeof language === "string" && language.trim()) {
    payload.set("language", language.trim());
  }

  try {
    const response = await fetch(
      `${resolveOpenAiAudioBaseUrl(providerConfig.baseUrl)}/audio/transcriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
        },
        body: payload,
      }
    );

    const rawText = await response.text().catch(() => "");
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "Voice transcription is temporarily unavailable due to provider rate limits."
              : "Voice transcription request failed.",
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText) as { text?: unknown };
    const text = typeof parsed?.text === "string" ? parsed.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Empty transcription result." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Unable to transcribe audio right now." },
      { status: 502 }
    );
  }
}
