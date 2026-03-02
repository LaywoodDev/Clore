import { NextResponse } from "next/server";

import { getOpenAiCompatibleProviderConfig } from "@/lib/server/ai-provider";
import { AI_FEATURE_ENABLED } from "@/lib/shared/ai-feature";

const DEFAULT_SPEECH_MODEL = "gpt-4o-mini-tts";
const DEFAULT_SPEECH_VOICE = "alloy";

function resolveOpenAiAudioBaseUrl(rawBaseUrl: string): string {
  const normalized = rawBaseUrl.trim().replace(/\/+$/u, "");
  if (normalized.includes("openai.api.proxyapi.ru/v1")) {
    return "https://api.proxyapi.ru/openai/v1";
  }
  return normalized;
}

type SpeechPayload = {
  text?: string;
  language?: string;
};

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

  const body = (await request.json().catch(() => null)) as SpeechPayload | null;
  const input =
    typeof body?.text === "string" ? body.text.trim().slice(0, 4_000) : "";
  if (!input) {
    return NextResponse.json({ error: "Missing speech text." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${resolveOpenAiAudioBaseUrl(providerConfig.baseUrl)}/audio/speech`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_SPEECH_MODEL,
          voice: DEFAULT_SPEECH_VOICE,
          input,
          format: "mp3",
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "Voice playback is temporarily unavailable due to provider rate limits."
              : "Voice playback request failed.",
        },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate speech right now." },
      { status: 502 }
    );
  }
}
