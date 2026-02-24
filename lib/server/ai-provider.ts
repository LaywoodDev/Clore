const DEFAULT_AI_MODEL = "openai/gpt-4o-mini";
const DEFAULT_AI_BASE_URL = "https://openai.api.proxyapi.ru/v1";
const DEFAULT_SEARCH_MODELS = [
  "openai/gpt-4o-mini-search-preview-2025-03-11",
  "gpt-4o-mini-search-preview-2025-03-11",
  "openai/gpt-4o-mini-search-preview",
  "gpt-4o-mini-search-preview",
];

type EnvEntry = {
  name: string;
  value: string;
};

function normalizeEnvValue(raw: string | undefined): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function findNonLatin1Index(input: string): number {
  for (let index = 0; index < input.length; index += 1) {
    if (input.charCodeAt(index) > 255) {
      return index;
    }
  }
  return -1;
}

function assertHeaderSafeValue(name: string, value: string) {
  const invalidIndex = findNonLatin1Index(value);
  if (invalidIndex >= 0) {
    throw new Error(
      `${name} contains a non-Latin character at index ${invalidIndex}. Copy the value again using plain ASCII characters.`
    );
  }
}

function assertValidUrl(name: string, value: string) {
  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

function readApiKeyFromEnv(): EnvEntry | null {
  const candidates: EnvEntry[] = [
    {
      name: "PROXYAPI_API_KEY",
      value: normalizeEnvValue(process.env.PROXYAPI_API_KEY),
    },
    {
      name: "OPENAI_API_KEY",
      value: normalizeEnvValue(process.env.OPENAI_API_KEY),
    },
  ];
  return candidates.find((candidate) => candidate.value.length > 0) ?? null;
}

export function getAiProviderConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} {
  const apiKeyEntry = readApiKeyFromEnv();
  if (!apiKeyEntry) {
    throw new Error("AI provider key is not configured on the server.");
  }
  assertHeaderSafeValue(apiKeyEntry.name, apiKeyEntry.value);

  const baseUrl =
    normalizeEnvValue(process.env.CLORE_BOT_BASE_URL) || DEFAULT_AI_BASE_URL;
  assertHeaderSafeValue("CLORE_BOT_BASE_URL", baseUrl);
  assertValidUrl("CLORE_BOT_BASE_URL", baseUrl);

  const model = normalizeEnvValue(process.env.CLORE_BOT_MODEL) || DEFAULT_AI_MODEL;

  return {
    apiKey: apiKeyEntry.value,
    baseUrl,
    model,
  };
}

function isSearchModel(model: string): boolean {
  return model.toLowerCase().includes("search");
}

function pushModelVariants(target: string[], model: string) {
  const normalized = model.trim();
  if (!normalized) {
    return;
  }
  target.push(normalized);
  if (normalized.startsWith("openai/")) {
    target.push(normalized.slice("openai/".length));
    return;
  }
  target.push(`openai/${normalized}`);
}

export function buildModelCandidates(
  modelFromEnv: string,
  searchEnabled: boolean
): string[] {
  const candidates: string[] = [];
  if (searchEnabled) {
    if (isSearchModel(modelFromEnv)) {
      pushModelVariants(candidates, modelFromEnv);
    }
    for (const model of DEFAULT_SEARCH_MODELS) {
      pushModelVariants(candidates, model);
    }
    if (!isSearchModel(modelFromEnv)) {
      pushModelVariants(candidates, modelFromEnv);
    }
    pushModelVariants(candidates, DEFAULT_AI_MODEL);
    return Array.from(new Set(candidates));
  }

  if (!isSearchModel(modelFromEnv)) {
    pushModelVariants(candidates, modelFromEnv);
  }
  pushModelVariants(candidates, DEFAULT_AI_MODEL);
  return Array.from(new Set(candidates));
}
