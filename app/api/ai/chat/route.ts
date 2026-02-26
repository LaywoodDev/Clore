import { NextResponse } from "next/server";

import { assertUserCanSendMessages } from "@/lib/server/admin";
import {
  buildModelCandidates,
  getAiProviderConfig,
} from "@/lib/server/ai-provider";
import {
  createEntityId,
  getStore,
  type StoreData,
  type StoredChatMessage,
  type StoredChatThread,
  updateStore,
} from "@/lib/server/store";

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

type SendIntent = {
  recipientQuery: string;
  messageText: string;
};

type SendVerbKind = "send" | "congratulate";
type ConsumedSendVerb = {
  rest: string;
  kind: SendVerbKind;
  leadingText?: string;
};

type RecipientCandidate = {
  userId: string;
  name: string;
  username: string;
  sharedThreadIds: string[];
  hasDirectThread: boolean;
  nameNormalized: string;
  usernameNormalized: string;
  bioNormalized: string;
  sharedThreadTitlesNormalized: string;
  sharedThreadDescriptionsNormalized: string;
  nameTokenStems: Set<string>;
  usernameTokenStems: Set<string>;
  bioTokenStems: Set<string>;
  threadTitleTokenStems: Set<string>;
  threadDescriptionTokenStems: Set<string>;
  userMessageTokenStems: Set<string>;
  peerMessageTokenStems: Set<string>;
  allMessageTokenStems: Set<string>;
};

type RecipientResolution =
  | {
      status: "resolved";
      candidate: RecipientCandidate;
      score: number;
    }
  | {
      status: "ambiguous";
      alternatives: RecipientCandidate[];
    }
  | {
      status: "not_found";
    };

type SendActionOutcome = {
  recipientQuery: string;
  messageText: string;
  status: "sent" | "not_found" | "ambiguous" | "blocked";
  resolvedName?: string;
  resolvedUsername?: string;
  alternatives?: string[];
};

type SendActionSummary = {
  outcomes: SendActionOutcome[];
  sentMessages: number;
};

type PlannedSendIntentPayload = {
  recipientQuery?: unknown;
  recipient?: unknown;
  to?: unknown;
  messageText?: unknown;
  message?: unknown;
  text?: unknown;
  content?: unknown;
};

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const RESPONSE_TIMEOUT_MS = 12_000;
const SEND_AI_PLANNER_TIMEOUT_MS = 9_000;
const SEND_AI_COMPOSE_TIMEOUT_MS = 9_000;
const MAX_SEND_AI_USER_CONTEXT_MESSAGES = 5;
const MAX_AUTOMATION_TARGETS = 8;
const MAX_CONTEXT_MESSAGES_PER_CANDIDATE = 160;
const MAX_SEND_AI_CONTACTS = 140;
const FAVORITES_CHAT_ID = "__favorites__";

const FAVORITES_RECIPIENT_ALIASES = new Set(
  [
    "избранное",
    "избранном",
    "избранку",
    "мое избранное",
    "моё избранное",
    "сохраненное",
    "сохранённое",
    "сохраненные",
    "сохранённые",
    "saved",
    "saved messages",
    "favorite",
    "favorites",
    "my favorites",
  ].map((alias) => normalizeForMatching(alias))
);

const SEND_COMMAND_START_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:отправ(?:ь|ьте)|напиш(?:и|ите)|передай|сообщи|скажи|уведоми|send|text|message|write|tell|notify|поздрав(?:ь|ьте)|congratulate)(?=\s|$|[,.!?;:])/iu;
const SEND_VERB_DEFINITIONS: Array<{ value: string; kind: SendVerbKind }> = [
  { value: "отправь", kind: "send" },
  { value: "отправьте", kind: "send" },
  { value: "напиши", kind: "send" },
  { value: "напишите", kind: "send" },
  { value: "передай", kind: "send" },
  { value: "сообщи", kind: "send" },
  { value: "скажи", kind: "send" },
  { value: "уведоми", kind: "send" },
  { value: "send", kind: "send" },
  { value: "text", kind: "send" },
  { value: "message", kind: "send" },
  { value: "write", kind: "send" },
  { value: "tell", kind: "send" },
  { value: "notify", kind: "send" },
  { value: "поздравь", kind: "congratulate" },
  { value: "поздравьте", kind: "congratulate" },
  { value: "congratulate", kind: "congratulate" },
];
const LEADING_FILLER_REGEX = /^(?:пожалуйста|please|ну|на|и|а|and)\s+/iu;
const FAVORITES_RECIPIENT_PREFIX_REGEX =
  /^(?:(?:в|во|to|for|into)\s+)?((?:мо[её]\s+)?избран(?:ное|ном|ку)|(?:сохран[её]н(?:ное|ные))|saved(?:\s+messages)?|favorites?|my\s+favorites)(?:\s+(.+))?$/iu;
const NON_RECIPIENT_LEAD_STEMS = new Set(
  [
    "please",
    "пожалуйста",
    "ну",
    "and",
    "и",
    "а",
    "давай",
    "можешь",
    "сможешь",
    "можно",
    "как",
    "если",
    "когда",
    "почему",
    "зачем",
    "что",
    "чтобы",
    "кто",
    "где",
    "куда",
    "can",
    "could",
    "would",
    "how",
    "if",
    "when",
    "why",
    "what",
    "who",
    "where",
    "you",
    "ты",
    "вы",
    "i",
    "я",
    "we",
    "мы",
  ]
    .map((word) => stemToken(word))
    .filter((token) => token.length > 0)
);

const RAW_STOP_WORDS = [
  "что",
  "that",
  "пожалуйста",
  "please",
  "сообщение",
  "message",
  "msg",
  "to",
  "for",
  "the",
  "a",
  "an",
  "и",
  "а",
  "но",
  "на",
  "в",
  "к",
  "по",
  "за",
  "со",
  "или",
  "буду",
  "будет",
  "будем",
  "у",
  "мой",
  "моя",
  "моей",
  "мою",
  "моему",
  "мне",
  "его",
  "ее",
  "её",
];

const RELATION_ALIASES: Record<string, string[]> = {
  mother: ["мама", "мам", "маме", "маму", "мамуля", "mom", "mother", "mommy"],
  father: ["папа", "пап", "папе", "папу", "dad", "father", "daddy"],
  grandfather: ["дед", "дедушка", "деду", "дедушке", "grandpa", "grandfather"],
  grandmother: ["бабушка", "бабуля", "бабушке", "бабушку", "grandma", "grandmother"],
  brother: ["брат", "братишка", "brother"],
  sister: ["сестра", "сестр", "sister"],
  husband: ["муж", "супруг", "husband"],
  wife: ["жена", "супруга", "wife"],
  son: ["сын", "сыну", "son"],
  daughter: ["дочь", "дочка", "daughter"],
};

const RELATION_ALIAS_STEMS: Record<string, Set<string>> = Object.entries(
  RELATION_ALIASES
).reduce<Record<string, Set<string>>>((acc, [relation, aliases]) => {
  acc[relation] = new Set(
    aliases
      .map((alias) => stemToken(alias))
      .filter((token) => token.length > 0)
  );
  return acc;
}, {});

const STOP_WORD_STEMS = new Set(
  RAW_STOP_WORDS.map((word) => stemToken(word)).filter(
    (token) => token.length > 0
  )
);

const CONTEXT_QUERY_NOISE_STEMS = new Set(
  [
    "person",
    "someone",
    "somebody",
    "who",
    "which",
    "that",
    "about",
    "regarding",
    "topic",
    "chat",
    "user",
    "\u0447\u0435\u043b\u043e\u0432\u0435\u043a",
    "\u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0443",
    "\u043b\u044e\u0434\u0438",
    "\u043a\u0442\u043e",
    "\u0442\u043e\u0442",
    "\u0442\u0430",
    "\u044d\u0442\u043e\u0442",
    "\u044d\u0442\u0430",
    "\u043a\u043e\u0442\u043e\u0440\u044b\u0439",
    "\u043a\u043e\u0442\u043e\u0440\u0430\u044f",
    "\u043a\u043e\u0442\u043e\u0440\u044b\u0435",
    "\u043a\u043e\u0442\u043e\u0440\u043e\u043c\u0443",
    "\u043a\u043e\u0442\u043e\u0440\u043e\u0439",
    "\u043f\u0440\u043e",
    "\u0442\u0435\u043c\u0430",
    "\u0442\u0435\u043c\u0435",
    "\u0442\u0435\u043c\u0443",
    "\u043d\u0430\u0441\u0447\u0435\u0442",
  ]
    .map((word) => stemToken(word))
    .filter((token) => token.length > 0)
);

const QUERY_TOKEN_EXPANSION_GROUPS = [
  [
    "оплата",
    "оплатить",
    "оплатил",
    "платеж",
    "платёж",
    "деньги",
    "перевод",
    "счет",
    "счёт",
    "payment",
    "pay",
    "paid",
    "invoice",
    "bill",
    "billing",
    "transfer",
    "bank",
    "wire",
  ],
  [
    "дизайн",
    "макет",
    "баннер",
    "интерфейс",
    "design",
    "ui",
    "ux",
    "layout",
    "banner",
  ],
  [
    "договор",
    "контракт",
    "соглашение",
    "contract",
    "agreement",
    "terms",
  ],
] as const;

const QUERY_TOKEN_EXPANSIONS = QUERY_TOKEN_EXPANSION_GROUPS.reduce<
  Map<string, Set<string>>
>((map, group) => {
  const stems = new Set(group.map((item) => stemToken(item)).filter((item) => item.length > 1));
  for (const stem of stems) {
    const existing = map.get(stem);
    if (existing) {
      for (const value of stems) {
        existing.add(value);
      }
    } else {
      map.set(stem, new Set(stems));
    }
  }
  return map;
}, new Map<string, Set<string>>());

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

function normalizeForMatching(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^0-9a-zа-я@]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVerbToken(value: string): string {
  return normalizeForMatching(value).replace(/\s+/g, "");
}

function levenshteinDistanceWithLimit(
  left: string,
  right: string,
  maxDistance: number
): number {
  if (left === right) {
    return 0;
  }
  const leftLength = left.length;
  const rightLength = right.length;
  if (leftLength === 0 || rightLength === 0) {
    return Math.max(leftLength, rightLength);
  }
  if (Math.abs(leftLength - rightLength) > maxDistance) {
    return maxDistance + 1;
  }

  const previous = new Array<number>(rightLength + 1);
  const current = new Array<number>(rightLength + 1);
  for (let index = 0; index <= rightLength; index += 1) {
    previous[index] = index;
  }

  for (let row = 1; row <= leftLength; row += 1) {
    current[0] = row;
    let rowMin = current[0];
    const leftCode = left.charCodeAt(row - 1);

    for (let column = 1; column <= rightLength; column += 1) {
      const cost = leftCode === right.charCodeAt(column - 1) ? 0 : 1;
      const insertion = current[column - 1] + 1;
      const deletion = previous[column] + 1;
      const substitution = previous[column - 1] + cost;
      const next = Math.min(insertion, deletion, substitution);
      current[column] = next;
      if (next < rowMin) {
        rowMin = next;
      }
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let column = 0; column <= rightLength; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[rightLength] ?? maxDistance + 1;
}

function stripLeadingCommandFillers(value: string): string {
  let output = value.trim();
  let changed = true;
  while (changed) {
    const next = output.replace(LEADING_FILLER_REGEX, "").trimStart();
    changed = next !== output;
    output = next;
  }
  return output;
}

function isLikelyRecipientLead(value: string): boolean {
  const normalized = normalizeForMatching(cleanRecipientQuery(value));
  if (!normalized) {
    return false;
  }
  if (normalized.includes("@")) {
    return true;
  }

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0 || tokens.length > 2) {
    return false;
  }

  return tokens.some((token) => {
    const stem = stemToken(token);
    return stem.length > 0 && !NON_RECIPIENT_LEAD_STEMS.has(stem);
  });
}

function findMatchingSendVerb(
  tokenRaw: string
): { kind: SendVerbKind } | null {
  const token = normalizeVerbToken(tokenRaw);
  if (!token) {
    return null;
  }

  let bestMatch: { kind: SendVerbKind; distance: number } | null = null;

  for (const definition of SEND_VERB_DEFINITIONS) {
    const target = normalizeVerbToken(definition.value);
    if (!target) {
      continue;
    }

    if (token === target) {
      return { kind: definition.kind };
    }

    if (token.length <= 3 || target.length <= 3) {
      continue;
    }
    if (token[0] !== target[0]) {
      continue;
    }
    if (Math.abs(token.length - target.length) > 2) {
      continue;
    }

    const minLength = Math.min(token.length, target.length);
    const maxDistance = minLength <= 4 ? 1 : 2;
    const distance = levenshteinDistanceWithLimit(token, target, maxDistance);
    if (distance > maxDistance) {
      continue;
    }

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { kind: definition.kind, distance };
    }
  }

  return bestMatch ? { kind: bestMatch.kind } : null;
}

function consumeLeadingSendVerb(
  value: string
): ConsumedSendVerb | null {
  const withoutFillers = stripLeadingCommandFillers(value);
  if (!withoutFillers) {
    return null;
  }

  const tokenMatch = withoutFillers.match(/^([^\s,;:.!?-–—]+)([\s\S]*)$/u);
  if (!tokenMatch) {
    return null;
  }

  const token = tokenMatch[1] ?? "";
  const matchedVerb = findMatchingSendVerb(token);
  if (!matchedVerb) {
    return null;
  }

  const rest = (tokenMatch[2] ?? "").replace(/^[\s,;:.!?-–—]+/u, "").trim();
  return {
    rest,
    kind: matchedVerb.kind,
  };
}

function consumeSendVerbNearStart(
  value: string,
  maxPrefixTokens = 4
): ConsumedSendVerb | null {
  const compact = value.trim().replace(/^[\s,;:.!?-–—]+/u, "");
  if (!compact) {
    return null;
  }

  const words = compact.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return null;
  }

  const limit = Math.min(words.length - 1, Math.max(0, maxPrefixTokens - 1));
  for (let index = 0; index <= limit; index += 1) {
    const token = words[index] ?? "";
    const matchedVerb = findMatchingSendVerb(token);
    if (!matchedVerb) {
      continue;
    }
    const leadingText = words.slice(0, index).join(" ").trim();
    const rest = words.slice(index + 1).join(" ").trim();
    return {
      rest,
      kind: matchedVerb.kind,
      leadingText: leadingText || undefined,
    };
  }

  return null;
}

function isLikelySendCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (SEND_COMMAND_START_REGEX.test(trimmed)) {
    return true;
  }
  if (consumeLeadingSendVerb(trimmed) !== null) {
    return true;
  }
  return consumeSendVerbNearStart(trimmed) !== null;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterateCyrillicToLatin(value: string): string {
  const normalized = value.toLowerCase().replace(/ё/g, "е");
  let out = "";
  for (const char of normalized) {
    out += CYRILLIC_TO_LATIN[char] ?? char;
  }
  return out;
}

function containsCyrillic(value: string): boolean {
  return /[а-яё]/iu.test(value);
}

function stemToken(value: string): string {
  let token = normalizeForMatching(value).replace(/\s+/g, "");
  if (!token) {
    return "";
  }

  if (token.endsWith("'s")) {
    token = token.slice(0, -2);
  }
  token = token.replace(/[ъьй]+$/u, "");

  const suffixes = [
    "иями",
    "ями",
    "ами",
    "ого",
    "ему",
    "ому",
    "ыми",
    "ими",
    "ией",
    "ией",
    "ей",
    "ой",
    "ий",
    "ый",
    "ая",
    "яя",
    "ую",
    "юю",
    "ам",
    "ям",
    "ах",
    "ях",
    "ом",
    "ем",
    "ов",
    "ев",
    "а",
    "я",
    "у",
    "ю",
    "е",
    "ы",
    "и",
    "s",
  ];
  for (const suffix of suffixes) {
    if (token.length <= suffix.length + 2) {
      continue;
    }
    if (!token.endsWith(suffix)) {
      continue;
    }
    token = token.slice(0, -suffix.length);
    break;
  }

  return token;
}

function tokenizeForMatching(value: string): string[] {
  const normalized = normalizeForMatching(value);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(" ");
  const result: string[] = [];
  const seen = new Set<string>();

  const pushToken = (token: string) => {
    const stem = stemToken(token);
    if (
      stem.length < 2 ||
      STOP_WORD_STEMS.has(stem) ||
      CONTEXT_QUERY_NOISE_STEMS.has(stem) ||
      seen.has(stem)
    ) {
      return;
    }
    seen.add(stem);
    result.push(stem);
  };

  for (const token of tokens) {
    pushToken(token);
    if (containsCyrillic(token)) {
      const transliterated = transliterateCyrillicToLatin(token);
      if (transliterated && transliterated !== token) {
        pushToken(transliterated);
      }
      const stemmedToken = stemToken(token);
      if (stemmedToken && stemmedToken !== token && containsCyrillic(stemmedToken)) {
        const transliteratedStem = transliterateCyrillicToLatin(stemmedToken);
        if (transliteratedStem && transliteratedStem !== transliterated) {
          pushToken(transliteratedStem);
        }
      }
    }
  }

  return result;
}

function expandQueryTokens(tokens: string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }

  const expanded = new Set(tokens);
  for (const token of tokens) {
    const variants = QUERY_TOKEN_EXPANSIONS.get(token);
    if (!variants) {
      continue;
    }
    for (const variant of variants) {
      expanded.add(variant);
    }
  }
  return [...expanded];
}

function toStemSet(value: string): Set<string> {
  return new Set(tokenizeForMatching(value));
}

function cleanRecipientQuery(value: string): string {
  return value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/^(?:для|к|в|во|to|for|into)\s+/iu, "")
    .replace(/(?:^|\s)(?:пожалуйста|please)(?=\s|$)/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUsernameHints(value: string): string[] {
  const result = new Set<string>();
  for (const match of value.matchAll(/@([\p{L}\p{N}._-]{2,64})/gu)) {
    const candidate = normalizeForMatching(match[1] ?? "").replace(/^@+/, "");
    if (candidate.length < 2) {
      continue;
    }
    result.add(candidate);
  }
  return [...result];
}

function hasMessageReferenceHint(value: string): boolean {
  const normalized = normalizeForMatching(value);
  if (!normalized) {
    return false;
  }
  return /(?:wrote|written|said|mentioned|писал|писала|писали|написал|написала|написали|говорил|говорила|говорили|упоминал|упоминала|упоминали)/iu.test(
    normalized
  );
}

function capitalizeLeadingLetter(value: string): string {
  const firstChar = value.charAt(0);
  if (!firstChar || !/[a-zа-яё]/iu.test(firstChar)) {
    return value;
  }
  return `${firstChar.toLocaleUpperCase()}${value.slice(firstChar.length)}`;
}

function normalizeCommandMessageText(value: string): string {
  const compact = value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) {
    return "";
  }

  const startsWithBridge = compact.match(/^(?:что|that)\s+(.+)$/iu);
  if (!startsWithBridge || /\?\s*$/u.test(compact)) {
    return compact;
  }

  const bridgedText = (startsWithBridge[1] ?? "").trim();
  if (!bridgedText) {
    return compact;
  }
  return capitalizeLeadingLetter(bridgedText);
}

function cleanMessageText(value: string): string {
  return normalizeCommandMessageText(value).slice(0, MAX_MESSAGE_LENGTH);
}

function isFavoritesRecipientQuery(value: string): boolean {
  const normalized = normalizeForMatching(cleanRecipientQuery(value));
  if (!normalized) {
    return false;
  }

  if (FAVORITES_RECIPIENT_ALIASES.has(normalized)) {
    return true;
  }

  if (normalized.startsWith("мои ")) {
    return FAVORITES_RECIPIENT_ALIASES.has(normalized.slice(4).trim());
  }

  return false;
}

function buildCongratulationMessage(
  details: string,
  language: "en" | "ru"
): string {
  const trimmed = details.trim().replace(/\s+/g, " ").replace(/[.!?]+$/g, "");
  if (!trimmed) {
    return language === "ru" ? "Поздравляю!" : "Congratulations!";
  }

  if (language === "ru") {
    if (/^с\s+/iu.test(trimmed)) {
      return `Поздравляю ${trimmed}!`;
    }
    return `${trimmed}${/[!?]$/u.test(trimmed) ? "" : "!"}`;
  }

  if (/^(with|on)\s+/iu.test(trimmed)) {
    return `Congratulations ${trimmed}!`;
  }
  return `${trimmed}${/[!?]$/u.test(trimmed) ? "" : "!"}`;
}

function parseLooseSendIntent(working: string): SendIntent | null {
  const compact = working.trim();
  if (!compact) {
    return null;
  }

  const favoritePrefix = compact.match(FAVORITES_RECIPIENT_PREFIX_REGEX);
  if (favoritePrefix) {
    const recipientQuery = cleanRecipientQuery(favoritePrefix[1] ?? "");
    const messageText = cleanMessageText(favoritePrefix[2] ?? "");
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const words = compact.split(/\s+/).filter((word) => word.length > 0);
  if (words.length < 2) {
    return null;
  }

  const firstWord = words[0] ?? "";
  const secondWord = words[1] ?? "";
  const prepositionHead = /^(?:в|во|к|для|to|for|into)$/iu.test(firstWord);
  const recipientQuery = cleanRecipientQuery(prepositionHead ? secondWord : firstWord);
  const messageText = cleanMessageText(
    prepositionHead ? words.slice(2).join(" ") : words.slice(1).join(" ")
  );
  if (!recipientQuery || !messageText) {
    return null;
  }

  return {
    recipientQuery,
    messageText,
  };
}

function splitIntoIntentSegments(input: string): string[] {
  const compact = input.replace(/\r?\n+/g, ", ").replace(/\s+/g, " ").trim();
  if (!compact) {
    return [];
  }
  const withCommandSeparators = compact.replace(
    /\s+(?:и|а|или|and|or)\s+(?=(?:пожалуйста\s+|please\s+|ну\s+)?(?:отправ|напиш|передай|сообщи|скажи|уведоми|send|text|message|write|tell|notify|поздрав|congratulat))/giu,
    ", "
  );
  const withImplicitSeparators = withCommandSeparators.replace(
    /\s+(?:и|а|and)\s+(?=[^,;]{1,90}(?:что|that|поздрав|congratulat))/giu,
    ", "
  );
  return withImplicitSeparators
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function parseIntentSegment(
  segment: string,
  language: "en" | "ru",
  isFirstSegment: boolean
): SendIntent | null {
  const trimmed = segment.trim();
  if (!trimmed) {
    return null;
  }

  const consumedVerb =
    consumeLeadingSendVerb(trimmed) ||
    (isFirstSegment ? consumeSendVerbNearStart(trimmed) : null);
  const startsWithCongratulation =
    consumedVerb?.kind === "congratulate";

  let working = "";
  if (consumedVerb) {
    working = consumedVerb.rest;
  } else if (!isFirstSegment) {
    // Follow-up segments like "..., маме что ..." may omit the verb.
    working = stripLeadingCommandFillers(trimmed);
  } else {
    return null;
  }

  if (!working) {
    return null;
  }

  const messageByWhat = working.match(/^(.+?)\s+(?:что|that)\s+(.+)$/iu);
  if (messageByWhat) {
    const rawRecipient = messageByWhat[1] ?? "";
    const rawMessage = messageByWhat[2] ?? "";
    const favoritePrefix = rawRecipient.match(FAVORITES_RECIPIENT_PREFIX_REGEX);
    if (favoritePrefix) {
      const recipientQuery = cleanRecipientQuery(favoritePrefix[1] ?? "");
      const messageText = cleanMessageText(
        [favoritePrefix[2] ?? "", rawMessage].filter((part) => part.trim().length > 0).join(" ")
      );
      if (recipientQuery && messageText) {
        return {
          recipientQuery,
          messageText,
        };
      }
    }

    const recipientQuery = cleanRecipientQuery(rawRecipient);
    const messageText = cleanMessageText(rawMessage);
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const messageByDash = working.match(/^(.+?)\s*[-–—]\s*(.+)$/u);
  if (messageByDash) {
    const rawRecipient = messageByDash[1] ?? "";
    const rawMessage = messageByDash[2] ?? "";
    const favoritePrefix = rawRecipient.match(FAVORITES_RECIPIENT_PREFIX_REGEX);
    if (favoritePrefix) {
      const recipientQuery = cleanRecipientQuery(favoritePrefix[1] ?? "");
      const messageText = cleanMessageText(
        [favoritePrefix[2] ?? "", rawMessage].filter((part) => part.trim().length > 0).join(" ")
      );
      if (recipientQuery && messageText) {
        return {
          recipientQuery,
          messageText,
        };
      }
    }

    const recipientQuery = cleanRecipientQuery(rawRecipient);
    const messageText = cleanMessageText(rawMessage);
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const congratulationInline = working.match(
    /^(.+?)\s+(?:поздрав(?:ь|ьте|ить)|congratulate)\s+(.+)$/iu
  );
  if (congratulationInline) {
    const recipientQuery = cleanRecipientQuery(congratulationInline[1] ?? "");
    const messageText = buildCongratulationMessage(
      congratulationInline[2] ?? "",
      language
    );
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  if (startsWithCongratulation) {
    const congratulationDirect = working.match(/^(.+?)\s+(с\s+.+)$/iu);
    if (congratulationDirect) {
      const recipientQuery = cleanRecipientQuery(congratulationDirect[1] ?? "");
      const messageText = buildCongratulationMessage(
        congratulationDirect[2] ?? "",
        language
      );
      if (recipientQuery && messageText) {
        return {
          recipientQuery,
          messageText,
        };
      }
    }
  }

  const messageByColon = working.match(/^(.+?)\s*:\s*(.+)$/u);
  if (messageByColon) {
    const recipientQuery = cleanRecipientQuery(messageByColon[1] ?? "");
    const messageText = cleanMessageText(messageByColon[2] ?? "");
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const messageByQuotes = working.match(/^(.+?)\s+["'«“](.+)["'»”]$/u);
  if (messageByQuotes) {
    const recipientQuery = cleanRecipientQuery(messageByQuotes[1] ?? "");
    const messageText = cleanMessageText(messageByQuotes[2] ?? "");
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const favoritesBySpace = working.match(FAVORITES_RECIPIENT_PREFIX_REGEX);
  if (favoritesBySpace) {
    const recipientQuery = cleanRecipientQuery(favoritesBySpace[1] ?? "");
    const messageText = cleanMessageText(favoritesBySpace[2] ?? "");
    if (recipientQuery && messageText) {
      return {
        recipientQuery,
        messageText,
      };
    }
  }

  const looseIntent = parseLooseSendIntent(working);
  if (looseIntent) {
    return looseIntent;
  }

  if (consumedVerb?.leadingText && isLikelyRecipientLead(consumedVerb.leadingText)) {
    const mergedIntent = parseLooseSendIntent(
      `${consumedVerb.leadingText} ${working}`.trim()
    );
    if (mergedIntent) {
      return mergedIntent;
    }
  }

  return null;
}

function extractSendIntents(
  input: string,
  language: "en" | "ru"
): SendIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelySendCommandStart(trimmed)) {
    return [];
  }

  const segments = splitIntoIntentSegments(trimmed);
  const intents: SendIntent[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const parsed = parseIntentSegment(segments[index] ?? "", language, index === 0);
    if (!parsed) {
      continue;
    }
    intents.push(parsed);
    if (intents.length >= MAX_AUTOMATION_TARGETS) {
      break;
    }
  }

  if (intents.length === 0) {
    const consumedVerb =
      consumeLeadingSendVerb(trimmed) || consumeSendVerbNearStart(trimmed);
    if (consumedVerb) {
      const fallbackIntent = parseLooseSendIntent(consumedVerb.rest);
      if (fallbackIntent) {
        intents.push(fallbackIntent);
      }
    }
  }

  return intents;
}

function buildRecipientCandidates(
  store: StoreData,
  userId: string
): RecipientCandidate[] {
  const threadById = new Map(store.threads.map((thread) => [thread.id, thread]));
  const sharedThreadsByUserId = new Map<string, string[]>();
  const relevantThreadIds = new Set<string>();

  for (const thread of store.threads) {
    if (!thread.memberIds.includes(userId)) {
      continue;
    }
    relevantThreadIds.add(thread.id);
    for (const memberId of thread.memberIds) {
      if (memberId === userId) {
        continue;
      }
      const existing = sharedThreadsByUserId.get(memberId);
      if (existing) {
        existing.push(thread.id);
      } else {
        sharedThreadsByUserId.set(memberId, [thread.id]);
      }
    }
  }

  const messagesByChatId = new Map<string, StoredChatMessage[]>();
  for (const message of store.messages) {
    if (!relevantThreadIds.has(message.chatId)) {
      continue;
    }
    const existing = messagesByChatId.get(message.chatId);
    if (existing) {
      existing.push(message);
    } else {
      messagesByChatId.set(message.chatId, [message]);
    }
  }
  for (const messages of messagesByChatId.values()) {
    messages.sort((a, b) => b.createdAt - a.createdAt);
  }

  const candidates: RecipientCandidate[] = [];

  for (const user of store.users) {
    if (user.id === userId) {
      continue;
    }

    const sharedThreadIds = sharedThreadsByUserId.get(user.id) ?? [];
    if (sharedThreadIds.length === 0) {
      continue;
    }

    const sharedMessages = sharedThreadIds
      .flatMap((threadId) => messagesByChatId.get(threadId) ?? [])
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_CONTEXT_MESSAGES_PER_CANDIDATE);
    const sharedThreads = sharedThreadIds
      .map((threadId) => threadById.get(threadId))
      .filter((thread): thread is StoredChatThread => Boolean(thread));

    const sharedThreadTitlesText = sharedThreads
      .map((thread) => thread.title.trim())
      .filter((title) => title.length > 0)
      .join(" ");
    const sharedThreadDescriptionsText = sharedThreads
      .map((thread) => thread.description.trim())
      .filter((description) => description.length > 0)
      .join(" ");

    const allMessagesText = sharedMessages
      .map((message) => message.text.trim())
      .filter((text) => text.length > 0)
      .join(" ");
    const userMessagesText = sharedMessages
      .filter((message) => message.authorId === userId)
      .map((message) => message.text.trim())
      .filter((text) => text.length > 0)
      .join(" ");
    const peerMessagesText = sharedMessages
      .filter((message) => message.authorId === user.id)
      .map((message) => message.text.trim())
      .filter((text) => text.length > 0)
      .join(" ");

    const hasDirectThread = sharedThreadIds.some((threadId) => {
      const thread = threadById.get(threadId);
      return (
        Boolean(thread) &&
        thread?.threadType === "direct" &&
        thread.memberIds.length === 2
      );
    });

    candidates.push({
      userId: user.id,
      name: user.name,
      username: user.username,
      sharedThreadIds,
      hasDirectThread,
      nameNormalized: normalizeForMatching(user.name),
      usernameNormalized: normalizeForMatching(user.username),
      bioNormalized: normalizeForMatching(user.bio),
      sharedThreadTitlesNormalized: normalizeForMatching(sharedThreadTitlesText),
      sharedThreadDescriptionsNormalized: normalizeForMatching(sharedThreadDescriptionsText),
      nameTokenStems: toStemSet(user.name),
      usernameTokenStems: toStemSet(user.username),
      bioTokenStems: toStemSet(user.bio),
      threadTitleTokenStems: toStemSet(sharedThreadTitlesText),
      threadDescriptionTokenStems: toStemSet(sharedThreadDescriptionsText),
      userMessageTokenStems: toStemSet(userMessagesText),
      peerMessageTokenStems: toStemSet(peerMessagesText),
      allMessageTokenStems: toStemSet(allMessagesText),
    });
  }

  return candidates;
}

function detectRelationKeys(queryTokens: string[]): string[] {
  const keys: string[] = [];
  for (const [relation, aliasStems] of Object.entries(RELATION_ALIAS_STEMS)) {
    const hit = queryTokens.some((token) => aliasStems.has(token));
    if (hit) {
      keys.push(relation);
    }
  }
  return keys;
}

function hasAliasStemHit(stemSet: Set<string>, aliasStems: Set<string>): boolean {
  for (const stem of aliasStems) {
    if (stemSet.has(stem)) {
      return true;
    }
  }
  return false;
}

function scoreRecipientIdentity(
  candidate: RecipientCandidate,
  queryNormalized: string,
  queryTokens: string[],
  usernameHints: string[]
): { score: number; exact: boolean; tokenHits: number } {
  let score = 0;
  let exact = false;
  let tokenHits = 0;
  const candidateUsername = candidate.usernameNormalized.replace(/^@+/, "");

  if (!queryNormalized && queryTokens.length === 0 && usernameHints.length === 0) {
    return { score, exact, tokenHits };
  }

  const queryWithoutAt = queryNormalized.replace(/^@+/, "");
  const queryWithoutAtLatin =
    containsCyrillic(queryWithoutAt) && queryWithoutAt.length > 0
      ? normalizeForMatching(transliterateCyrillicToLatin(queryWithoutAt)).replace(/^@+/, "")
      : "";

  if (
    candidate.nameNormalized === queryNormalized ||
    candidateUsername === queryWithoutAt
  ) {
    score += 320;
    exact = true;
  }

  if (queryNormalized.length >= 3 && candidate.nameNormalized.startsWith(queryNormalized)) {
    score += 150;
  }
  if (
    queryWithoutAt.length >= 2 &&
    candidateUsername.startsWith(queryWithoutAt)
  ) {
    score += 165;
  }
  if (
    queryNormalized.length >= 4 &&
    !candidate.nameNormalized.startsWith(queryNormalized) &&
    candidate.nameNormalized.includes(queryNormalized)
  ) {
    score += 55;
  }
  if (
    queryWithoutAt.length >= 3 &&
    !candidateUsername.startsWith(queryWithoutAt) &&
    candidateUsername.includes(queryWithoutAt)
  ) {
    score += 65;
  }

  if (queryWithoutAtLatin && queryWithoutAtLatin !== queryWithoutAt) {
    if (
      candidate.nameNormalized === queryWithoutAtLatin ||
      candidateUsername === queryWithoutAtLatin
    ) {
      score += 300;
      tokenHits += 1;
      exact = true;
    }
    if (queryWithoutAtLatin.length >= 3 && candidate.nameNormalized.startsWith(queryWithoutAtLatin)) {
      score += 145;
    }
    if (queryWithoutAtLatin.length >= 2 && candidateUsername.startsWith(queryWithoutAtLatin)) {
      score += 170;
    }
    if (
      queryWithoutAtLatin.length >= 4 &&
      !candidate.nameNormalized.startsWith(queryWithoutAtLatin) &&
      candidate.nameNormalized.includes(queryWithoutAtLatin)
    ) {
      score += 52;
    }
    if (
      queryWithoutAtLatin.length >= 3 &&
      !candidateUsername.startsWith(queryWithoutAtLatin) &&
      candidateUsername.includes(queryWithoutAtLatin)
    ) {
      score += 70;
    }
  }

  for (const usernameHint of usernameHints) {
    if (candidateUsername === usernameHint) {
      score += 300;
      tokenHits += 1;
      exact = true;
      continue;
    }
    if (candidateUsername.startsWith(usernameHint)) {
      score += 190;
      tokenHits += 1;
      continue;
    }
    if (candidateUsername.includes(usernameHint)) {
      score += 95;
    }
  }

  for (const token of queryTokens) {
    if (candidate.nameTokenStems.has(token)) {
      score += 95;
      tokenHits += 1;
    }
    if (candidate.usernameTokenStems.has(token)) {
      score += 105;
      tokenHits += 1;
    }
  }

  if (candidate.hasDirectThread) {
    score += 8;
  }

  return { score, exact, tokenHits };
}

type RecipientContextScoreData = {
  score: number;
  evidenceHits: number;
  strongSignals: number;
};

function scoreRecipientContext(
  candidate: RecipientCandidate,
  queryNormalized: string,
  queryTokens: string[],
  relationKeys: string[],
  usernameHints: string[],
  hasMessageReference: boolean
): RecipientContextScoreData {
  let score = 0;
  let evidenceHits = 0;
  let strongSignals = 0;
  const candidateUsername = candidate.usernameNormalized.replace(/^@+/, "");

  if (!queryNormalized && queryTokens.length === 0 && usernameHints.length === 0) {
    return { score, evidenceHits, strongSignals };
  }

  if (queryNormalized.length >= 4 && candidate.bioNormalized.includes(queryNormalized)) {
    score += 70;
    evidenceHits += 1;
  }
  if (
    queryNormalized.length >= 4 &&
    candidate.sharedThreadTitlesNormalized.includes(queryNormalized)
  ) {
    score += 120;
    evidenceHits += 2;
    strongSignals += 1;
  }
  if (
    queryNormalized.length >= 4 &&
    candidate.sharedThreadDescriptionsNormalized.includes(queryNormalized)
  ) {
    score += 52;
    evidenceHits += 1;
  }

  for (const usernameHint of usernameHints) {
    if (candidateUsername === usernameHint) {
      score += 230;
      evidenceHits += 3;
      strongSignals += 1;
      continue;
    }
    if (candidateUsername.startsWith(usernameHint)) {
      score += 160;
      evidenceHits += 2;
      strongSignals += 1;
      continue;
    }
    if (candidateUsername.includes(usernameHint)) {
      score += 90;
      evidenceHits += 1;
    }
  }

  for (const token of queryTokens) {
    if (candidate.bioTokenStems.has(token)) {
      score += 42;
      evidenceHits += 1;
    }
    if (candidate.threadTitleTokenStems.has(token)) {
      score += 64;
      evidenceHits += 2;
      strongSignals += 1;
    }
    if (candidate.threadDescriptionTokenStems.has(token)) {
      score += 28;
      evidenceHits += 1;
    }
    if (candidate.userMessageTokenStems.has(token)) {
      score += 52;
      evidenceHits += 2;
    }
    if (candidate.peerMessageTokenStems.has(token)) {
      if (hasMessageReference) {
        score += 78;
        evidenceHits += 2;
        strongSignals += 1;
      } else {
        score += 30;
        evidenceHits += 1;
      }
    }
    if (candidate.allMessageTokenStems.has(token)) {
      score += hasMessageReference ? 18 : 12;
      evidenceHits += 1;
    }
  }

  for (const relationKey of relationKeys) {
    const aliasStems = RELATION_ALIAS_STEMS[relationKey];
    if (!aliasStems || aliasStems.size === 0) {
      continue;
    }
    if (
      hasAliasStemHit(candidate.nameTokenStems, aliasStems) ||
      hasAliasStemHit(candidate.usernameTokenStems, aliasStems) ||
      hasAliasStemHit(candidate.bioTokenStems, aliasStems)
    ) {
      score += 85;
      evidenceHits += 2;
      strongSignals += 1;
    }
    if (hasAliasStemHit(candidate.userMessageTokenStems, aliasStems)) {
      score += 140;
      evidenceHits += 3;
      strongSignals += 1;
    }
    if (hasAliasStemHit(candidate.peerMessageTokenStems, aliasStems)) {
      score += 70;
      evidenceHits += 2;
    }
    if (hasAliasStemHit(candidate.allMessageTokenStems, aliasStems)) {
      score += 28;
      evidenceHits += 1;
    }
  }

  if (candidate.hasDirectThread) {
    score += 4;
  }
  score += Math.min(candidate.sharedThreadIds.length, 3) * 3;

  return { score, evidenceHits, strongSignals };
}

function resolveRecipient(
  candidates: RecipientCandidate[],
  rawQuery: string
): RecipientResolution {
  const queryNormalized = normalizeForMatching(rawQuery);
  const identityTokens = tokenizeForMatching(rawQuery);
  const contextTokens = expandQueryTokens(identityTokens);
  const usernameHints = extractUsernameHints(rawQuery);
  const hasMessageReference = hasMessageReferenceHint(rawQuery);
  const relationKeys = detectRelationKeys(identityTokens);

  if (
    !queryNormalized ||
    (identityTokens.length === 0 && contextTokens.length === 0 && usernameHints.length === 0)
  ) {
    return {
      status: "not_found",
    };
  }

  const scoredBase = candidates
    .map((candidate) => {
      const identityData = scoreRecipientIdentity(
        candidate,
        queryNormalized,
        identityTokens,
        usernameHints
      );
      const contextData = scoreRecipientContext(
        candidate,
        queryNormalized,
        contextTokens,
        relationKeys,
        usernameHints,
        hasMessageReference
      );
      return {
        candidate,
        identityScore: identityData.score,
        identityExact: identityData.exact,
        identityTokenHits: identityData.tokenHits,
        contextScore: contextData.score,
        contextEvidenceHits: contextData.evidenceHits,
        contextStrongSignals: contextData.strongSignals,
      };
    });

  const hasIdentityCandidates = scoredBase.some(
    (item) =>
      item.identityExact ||
      item.identityTokenHits > 0 ||
      item.identityScore >= 170
  );
  const strongestContextScore = scoredBase.reduce(
    (max, item) => Math.max(max, item.contextScore),
    0
  );
  const strongestContextEvidence = scoredBase.reduce(
    (max, item) => Math.max(max, item.contextEvidenceHits),
    0
  );
  const strongestContextSignals = scoredBase.reduce(
    (max, item) => Math.max(max, item.contextStrongSignals),
    0
  );
  const allowPureContextMode =
    !hasIdentityCandidates &&
    (relationKeys.length > 0 ||
      hasMessageReference ||
      contextTokens.length >= 2 ||
      usernameHints.length > 0 ||
      strongestContextSignals > 0 ||
      (contextTokens.length === 1 &&
        strongestContextEvidence >= 2 &&
        strongestContextScore >= 85));

  if (!hasIdentityCandidates && !allowPureContextMode) {
    return {
      status: "not_found",
    };
  }

  const scored = scoredBase
    .map((item) => {
      if (hasIdentityCandidates) {
        if (item.identityScore <= 0) {
          return null;
        }
        const allowContextTieBreaker =
          relationKeys.length > 0 || contextTokens.length > 1;
        const contextBonus = allowContextTieBreaker
          ? Math.min(item.contextScore, 45)
          : 0;
        return {
          ...item,
          totalScore: item.identityScore + contextBonus,
        };
      }

      const totalScore = item.contextScore + Math.min(item.identityScore, 40);
      if (totalScore <= 0) {
        return null;
      }
      return {
        ...item,
        totalScore,
      };
    })
    .filter(
      (
        item
      ): item is (typeof scoredBase)[number] & {
        totalScore: number;
      } => item !== null
    )
    .sort((a, b) => b.totalScore - a.totalScore);

  const minimumScore = hasIdentityCandidates
    ? 78
    : relationKeys.length > 0
      ? 72
      : hasMessageReference
        ? 68
      : usernameHints.length > 0
        ? 80
        : contextTokens.length >= 2
          ? 95
          : 88;
  const top = scored[0];
  const second = scored[1];

  if (!top || top.totalScore < minimumScore) {
    return {
      status: "not_found",
    };
  }

  if (
    hasIdentityCandidates &&
    !top.identityExact &&
    top.identityTokenHits === 0 &&
    top.identityScore < 170
  ) {
    return {
      status: "not_found",
    };
  }

  if (
    !hasIdentityCandidates &&
    top.contextEvidenceHits === 0 &&
    top.contextStrongSignals === 0
  ) {
    return {
      status: "not_found",
    };
  }

  const hasClearlyExactTop =
    top.identityExact &&
    top.identityScore >= 250 &&
    (!second || second.identityExact === false);

  const shouldAskClarification =
    !hasClearlyExactTop &&
    Boolean(
      second &&
        second.totalScore >= minimumScore &&
        (top.totalScore - second.totalScore <
          (hasIdentityCandidates
            ? 28
            : contextTokens.length === 1 && usernameHints.length === 0
              ? 26
              : 20) ||
          second.totalScore >= Math.floor(top.totalScore * 0.88))
    );

  if (shouldAskClarification) {
    return {
      status: "ambiguous",
      alternatives: scored
        .slice(0, 3)
        .map((item) => item.candidate)
        .filter(
          (candidate, index, all) =>
            all.findIndex((item) => item.userId === candidate.userId) === index
        ),
    };
  }

  return {
    status: "resolved",
    candidate: top.candidate,
    score: top.totalScore,
  };
}

function findDirectThread(
  store: StoreData,
  userId: string,
  targetUserId: string
): StoredChatThread | null {
  return (
    store.threads.find(
      (thread) =>
        thread.threadType === "direct" &&
        thread.memberIds.length === 2 &&
        thread.memberIds.includes(userId) &&
        thread.memberIds.includes(targetUserId)
    ) ?? null
  );
}

function ensureDirectThread(
  store: StoreData,
  userId: string,
  targetUserId: string,
  createdAt: number
): StoredChatThread {
  const existing = findDirectThread(store, userId, targetUserId);
  if (existing) {
    return existing;
  }

  const thread: StoredChatThread = {
    id: createEntityId("chat"),
    memberIds: [userId, targetUserId],
    threadType: "direct",
    title: "",
    description: "",
    avatarUrl: "",
    bannerUrl: "",
    createdById: userId,
    createdAt,
    updatedAt: createdAt,
    readBy: {
      [userId]: createdAt,
      [targetUserId]: 0,
    },
    pinnedBy: {},
    mutedBy: {},
    typingBy: {},
    groupRoles: {},
  };
  store.threads.push(thread);
  return thread;
}

function formatCandidateLabel(candidate: RecipientCandidate): string {
  const username = candidate.username.trim();
  const name = candidate.name.trim();
  if (name && username) {
    return `${name} (@${username})`;
  }
  return name || (username ? `@${username}` : candidate.userId);
}

function shortenPreview(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxLength - 1))}…`;
}

function buildSendActionReply(
  language: "en" | "ru",
  summary: SendActionSummary
): string {
  const sent = summary.outcomes.filter((item) => item.status === "sent");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const blocked = summary.outcomes.filter((item) => item.status === "blocked");

  const lines: string[] = [];

  if (language === "ru") {
    if (sent.length > 0) {
      lines.push(
        sent.length === 1
          ? "Готово. Сообщение отправлено."
          : `Готово. Отправил ${sent.length} сообщений.`
      );
      for (const item of sent) {
        const label =
          item.resolvedName && item.resolvedUsername
            ? `${item.resolvedName} (@${item.resolvedUsername})`
            : item.resolvedName || item.recipientQuery;
        lines.push(`- ${label}: "${shortenPreview(item.messageText, 90)}"`);
      }
    }

    if (ambiguous.length > 0) {
      for (const item of ambiguous) {
        const variants = (item.alternatives ?? []).join(", ");
        lines.push(
          variants
            ? `Нужно уточнение для "${item.recipientQuery}". Подходят: ${variants}.`
            : `Нужно уточнение для "${item.recipientQuery}".`
        );
      }
    }

    if (notFound.length > 0) {
      const labels = notFound.map((item) => `"${item.recipientQuery}"`).join(", ");
      lines.push(`Не нашел подходящий чат для: ${labels}.`);
    }

    if (blocked.length > 0) {
      const labels = blocked.map((item) => `"${item.recipientQuery}"`).join(", ");
      lines.push(`Не могу отправить из-за блокировки: ${labels}.`);
    }

    if (lines.length === 0) {
      return "Не удалось отправить сообщения.";
    }

    return lines.join("\n");
  }

  if (sent.length > 0) {
    lines.push(
      sent.length === 1
        ? "Done. Message sent."
        : `Done. Sent ${sent.length} messages.`
    );
    for (const item of sent) {
      const label =
        item.resolvedName && item.resolvedUsername
          ? `${item.resolvedName} (@${item.resolvedUsername})`
          : item.resolvedName || item.recipientQuery;
      lines.push(`- ${label}: "${shortenPreview(item.messageText, 90)}"`);
    }
  }

  if (ambiguous.length > 0) {
    for (const item of ambiguous) {
      const variants = (item.alternatives ?? []).join(", ");
      lines.push(
        variants
          ? `Need clarification for "${item.recipientQuery}". Matches: ${variants}.`
          : `Need clarification for "${item.recipientQuery}".`
      );
    }
  }

  if (notFound.length > 0) {
    const labels = notFound.map((item) => `"${item.recipientQuery}"`).join(", ");
    lines.push(`Couldn't find a matching chat for: ${labels}.`);
  }

  if (blocked.length > 0) {
    const labels = blocked.map((item) => `"${item.recipientQuery}"`).join(", ");
    lines.push(`Can't send because of blocking: ${labels}.`);
  }

  if (lines.length === 0) {
    return "Couldn't send the messages.";
  }

  return lines.join("\n");
}

function buildSendParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду отправки.",
      'Формат: `напиши [кому] что [текст]` или `send [name] - [text]`.',
    ].join("\n");
  }
  return [
    "Couldn't parse the send command.",
    "Use: `send [recipient] that [message]` or `send [recipient] - [message]`.",
  ].join("\n");
}

function extractFirstJsonObject(raw: string): string | null {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/iu);
  if (fencedMatch?.[1]) {
    const fenced = fencedMatch[1].trim();
    if (fenced.length > 0) {
      return fenced;
    }
  }

  const startIndex = raw.indexOf("{");
  if (startIndex < 0) {
    return null;
  }

  let depth = 0;
  let insideString = false;
  let escaping = false;
  for (let index = startIndex; index < raw.length; index += 1) {
    const char = raw[index];
    if (!char) {
      continue;
    }
    if (insideString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === "\\") {
        escaping = true;
        continue;
      }
      if (char === '"') {
        insideString = false;
      }
      continue;
    }

    if (char === '"') {
      insideString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function normalizePlannedSendIntents(payload: unknown): SendIntent[] {
  const asRecord =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const rawActions = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord?.actions)
      ? asRecord.actions
      : Array.isArray(asRecord?.intents)
        ? asRecord.intents
        : [];

  const intents: SendIntent[] = [];
  for (const item of rawActions) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const action = item as PlannedSendIntentPayload;
    const recipientRaw = [
      action.recipientQuery,
      action.recipient,
      action.to,
    ].find((value) => typeof value === "string") as string | undefined;
    const messageRaw = [
      action.messageText,
      action.message,
      action.text,
      action.content,
    ].find((value) => typeof value === "string") as string | undefined;

    const recipientQuery = cleanRecipientQuery(recipientRaw ?? "");
    const messageText = cleanMessageText(messageRaw ?? "");
    if (!recipientQuery || !messageText) {
      continue;
    }
    intents.push({
      recipientQuery,
      messageText,
    });
    if (intents.length >= MAX_AUTOMATION_TARGETS) {
      break;
    }
  }

  return intents;
}

function wantsDetailedSendMessage(text: string): boolean {
  return /(?:подроб|деталь|распиш|развернут|разверни|expand|elaborate|detailed|in detail)/iu.test(
    text
  );
}

function collectRecentUserMessages(
  messages: NormalizedAiChatMessage[],
  limit = MAX_SEND_AI_USER_CONTEXT_MESSAGES
): string[] {
  if (limit <= 0) {
    return [];
  }
  return messages
    .filter((message) => message.role === "user" && message.content.trim().length > 0)
    .map((message) => message.content.trim().slice(0, MAX_MESSAGE_LENGTH))
    .slice(-limit);
}

function containsQuestionRequest(text: string): boolean {
  const compact = text.trim();
  if (!compact) {
    return false;
  }
  if (/[?？]/u.test(compact)) {
    return true;
  }
  return /(?:спроси|спросить|задай вопрос|вопрос|ask|ask him|ask her|question|inquire)/iu.test(
    compact
  );
}

function isLikelySendAiRefusal(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return /(?:пожалуйста.*уважитель|давай.*уважитель|не могу помочь|не могу выполнить|извини|как ai|как ии|as an ai|i can't help|i cannot help|i can't assist|i cannot assist|i'm unable|i am unable)/iu.test(
    normalized
  );
}
async function planSendIntentsWithAi(
  store: StoreData,
  userId: string,
  language: "en" | "ru",
  userCommand: string,
  recentUserMessages: string[]
): Promise<SendIntent[]> {
  const cleanedCommand = userCommand.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!cleanedCommand) {
    return [];
  }

  let providerConfig: ReturnType<typeof getAiProviderConfig> | null = null;
  try {
    providerConfig = getAiProviderConfig();
  } catch {
    return [];
  }

  const candidates = buildRecipientCandidates(store, userId);
  const contactsCatalog = [...candidates]
    .sort((left, right) => {
      const directDiff = Number(right.hasDirectThread) - Number(left.hasDirectThread);
      if (directDiff !== 0) {
        return directDiff;
      }
      const sharedDiff = right.sharedThreadIds.length - left.sharedThreadIds.length;
      if (sharedDiff !== 0) {
        return sharedDiff;
      }
      return right.name.localeCompare(left.name);
    })
    .slice(0, MAX_SEND_AI_CONTACTS)
    .map((candidate) => {
      const name = candidate.name.trim() || candidate.userId;
      const username = candidate.username.trim().replace(/^@+/, "");
      return username ? `- ${name} (@${username})` : `- ${name}`;
    })
    .join("\n");

  const { apiKey, baseUrl, model: modelFromEnv } = providerConfig;
  const modelCandidates = buildModelCandidates(modelFromEnv, false).slice(0, 2);
  const systemPrompt =
    language === "ru"
      ? [
          "Ты AI-оркестратор команды send в мессенджере.",
          "На входе команда пользователя и список известных контактов.",
          "Нужно вернуть только JSON без markdown и без пояснений.",
          "Формат строго: {\"actions\":[{\"recipientQuery\":\"...\",\"messageText\":\"...\"}]}",
          "recipientQuery должен быть из команды и по возможности с точным @username из списка.",
          "Если текст похож на задачу для написания сообщения, сам сгенерируй финальное сообщение.",
          "Если просят подробно, сообщение должно быть развернутым и конкретным.",
          `Максимум действий: ${MAX_AUTOMATION_TARGETS}.`,
        ].join(" ")
      : [
          "You are the send-command orchestrator in a messenger app.",
          "Input includes user command plus known contacts.",
          "Return JSON only, with no markdown and no explanations.",
          'Strict format: {"actions":[{"recipientQuery":"...","messageText":"..."}]}',
          "recipientQuery should use the exact contact identifier, preferably @username from the catalog.",
          "If user text is an instruction, generate the final outgoing message.",
          "If user asks for details, make the message detailed and concrete.",
          `Maximum actions: ${MAX_AUTOMATION_TARGETS}.`,
        ].join(" ");

  for (const model of modelCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEND_AI_PLANNER_TIMEOUT_MS);

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
            {
              role: "user" as const,
              content: [
                `Command: ${cleanedCommand}`,
                "Recent user messages (last 5):",
                recentUserMessages.length > 0
                  ? recentUserMessages.map((message, index) => `${index + 1}. ${message}`).join("\n")
                  : "(none)",
                "Known contacts:",
                contactsCatalog || "(none)",
              ].join("\n"),
            },
          ],
          max_tokens: 850,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const raw =
        extractChatCompletionText(payload) || extractResponseText(payload);
      if (!raw.trim()) {
        continue;
      }

      const jsonText = extractFirstJsonObject(raw) ?? raw.trim();
      const parsed = JSON.parse(jsonText) as unknown;
      const planned = normalizePlannedSendIntents(parsed);
      if (planned.length > 0) {
        return planned;
      }
    } catch {
      // Ignore planner errors and fallback to deterministic parser.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return [];
}

async function rewriteSendMessageText(
  language: "en" | "ru",
  rawMessageText: string,
  recentUserMessages: string[]
): Promise<string> {
  const locallyCleaned = cleanMessageText(rawMessageText);
  if (!locallyCleaned) {
    return "";
  }

  let providerConfig: ReturnType<typeof getAiProviderConfig> | null = null;
  try {
    providerConfig = getAiProviderConfig();
  } catch {
    return locallyCleaned;
  }

  const wantsDetailed = wantsDetailedSendMessage(locallyCleaned);
  const { apiKey, baseUrl, model: modelFromEnv } = providerConfig;
  const modelCandidates = buildModelCandidates(modelFromEnv, false).slice(0, 2);
  if (modelCandidates.length === 0) {
    return locallyCleaned;
  }

  const systemPrompt =
    language === "ru"
      ? [
          "Ты редактор/автор исходящих сообщений.",
          "На вход подается текст-команда или черновик.",
          "Верни только финальный текст сообщения, который нужно отправить.",
          "Сохраняй замысел пользователя и не придумывай факты вне запроса.",
          "Если в тексте просьба написать подробно, сделай развернутое сообщение (минимум 5 предложений).",
          "Не добавляй морализаторство, вежливые отказы и советы в стиле ассистента.",
          "Никаких пояснений, заголовков, markdown или кавычек вокруг всего ответа.",
        ].join(" ")
      : [
          "You are an outgoing-message writer/editor.",
          "Input can be an instruction or a draft.",
          "Return only the final outgoing message text.",
          "Preserve user intent and do not invent unrelated facts.",
          "If user asks for detail, produce a detailed message (at least 5 sentences).",
          "Do not add assistant-style refusals, moralizing, or safety lectures.",
          "No explanations, no markdown, no wrapper quotes.",
        ].join(" ");

  const minLength = wantsDetailed
    ? Math.max(160, Math.floor(locallyCleaned.length * 1.1))
    : Math.max(8, Math.floor(locallyCleaned.length * 0.5));
  const sourceHasQuestionRequest = containsQuestionRequest(locallyCleaned);
  const maxLengthWithoutDetail = Math.max(
    60,
    Math.ceil(locallyCleaned.length * 1.8)
  );

  for (const model of modelCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEND_AI_COMPOSE_TIMEOUT_MS);

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
            {
              role: "user" as const,
              content: [
                "Recent user messages (last 5):",
                recentUserMessages.length > 0
                  ? recentUserMessages.map((message, index) => `${index + 1}. ${message}`).join("\n")
                  : "(none)",
                "Current send instruction:",
                locallyCleaned,
              ].join("\n"),
            },
          ],
          max_tokens: Math.min(
            900,
            Math.max(120, Math.ceil(locallyCleaned.length * (wantsDetailed ? 2.2 : 1.6)))
          ),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const generatedRaw =
        extractChatCompletionText(payload) || extractResponseText(payload);
      const generated = cleanMessageText(generatedRaw);
      if (!generated) {
        continue;
      }
      if (isLikelySendAiRefusal(generated)) {
        continue;
      }
      if (!sourceHasQuestionRequest && /[?？]/u.test(generated)) {
        continue;
      }
      if (generated.length < minLength) {
        continue;
      }
      if (!wantsDetailed && generated.length > maxLengthWithoutDetail) {
        continue;
      }
      return generated;
    } catch {
      // Ignore generation errors and fallback to local text.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return locallyCleaned;
}

async function prepareSendIntent(
  intent: SendIntent,
  language: "en" | "ru",
  recentUserMessages: string[]
): Promise<SendIntent | null> {
  const recipientQuery = cleanRecipientQuery(intent.recipientQuery);
  if (!recipientQuery) {
    return null;
  }

  const messageText = await rewriteSendMessageText(
    language,
    intent.messageText,
    recentUserMessages
  );
  if (!messageText) {
    return null;
  }

  return {
    recipientQuery,
    messageText,
  };
}

async function executeSendIntents(
  userId: string,
  language: "en" | "ru",
  intents: SendIntent[],
  recentUserMessages: string[]
): Promise<SendActionSummary> {
  const preparedIntents = (
    await Promise.all(
      intents.map((intent) => prepareSendIntent(intent, language, recentUserMessages))
    )
  ).filter((intent): intent is SendIntent => intent !== null);

  return updateStore<SendActionSummary>((store) => {
    const sender = store.users.find((user) => user.id === userId);
    if (!sender) {
      throw new Error("User not found.");
    }

    assertUserCanSendMessages(store, userId);
    const candidates = buildRecipientCandidates(store, userId);
    const outcomes: SendActionOutcome[] = [];
    let sentMessages = 0;

    for (const intent of preparedIntents) {
      const recipientQuery = intent.recipientQuery;
      const messageText = intent.messageText;

      if (isFavoritesRecipientQuery(recipientQuery)) {
        const createdAt = Date.now() + sentMessages;
        const nextMessage: StoredChatMessage = {
          id: createEntityId("msg"),
          chatId: FAVORITES_CHAT_ID,
          authorId: userId,
          text: messageText,
          attachments: [],
          replyToMessageId: "",
          createdAt,
          editedAt: 0,
          savedBy: {
            [userId]: createdAt,
          },
        };

        store.messages.push(nextMessage);
        sentMessages += 1;

        outcomes.push({
          recipientQuery,
          messageText,
          status: "sent",
          resolvedName: /[а-яё]/iu.test(recipientQuery)
            ? "Избранное"
            : "Favorites",
        });
        continue;
      }

      const resolution = resolveRecipient(candidates, recipientQuery);

      if (resolution.status === "not_found") {
        outcomes.push({
          recipientQuery,
          messageText,
          status: "not_found",
        });
        continue;
      }

      if (resolution.status === "ambiguous") {
        outcomes.push({
          recipientQuery,
          messageText,
          status: "ambiguous",
          alternatives: resolution.alternatives.map(formatCandidateLabel).slice(0, 3),
        });
        continue;
      }

      const targetUser = store.users.find(
        (candidate) => candidate.id === resolution.candidate.userId
      );
      if (!targetUser) {
        outcomes.push({
          recipientQuery,
          messageText,
          status: "not_found",
        });
        continue;
      }

      const senderBlockedTarget = sender.blockedUserIds.includes(targetUser.id);
      const targetBlockedSender = targetUser.blockedUserIds.includes(userId);
      if (senderBlockedTarget || targetBlockedSender) {
        outcomes.push({
          recipientQuery,
          messageText,
          status: "blocked",
          resolvedName: targetUser.name,
          resolvedUsername: targetUser.username,
        });
        continue;
      }

      const createdAt = Date.now() + sentMessages;
      const thread = ensureDirectThread(store, userId, targetUser.id, createdAt);
      const nextMessage: StoredChatMessage = {
        id: createEntityId("msg"),
        chatId: thread.id,
        authorId: userId,
        text: messageText,
        attachments: [],
        replyToMessageId: "",
        createdAt,
        editedAt: 0,
        savedBy: {},
      };

      store.messages.push(nextMessage);
      thread.updatedAt = createdAt;
      thread.readBy = {
        ...thread.readBy,
        [userId]: createdAt,
      };
      sentMessages += 1;

      outcomes.push({
        recipientQuery,
        messageText,
        status: "sent",
        resolvedName: targetUser.name,
        resolvedUsername: targetUser.username,
      });
    }

    return {
      outcomes,
      sentMessages,
    };
  });
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

    const latestUserPrompt = messages[messages.length - 1]?.content ?? "";
    const recentUserMessages = collectRecentUserMessages(messages);
    const isSendCommand = isLikelySendCommandStart(latestUserPrompt);
    const parsedSendIntents = extractSendIntents(latestUserPrompt, language);
    let sendIntents = parsedSendIntents;
    if (isSendCommand) {
      const aiPlannedIntents = await planSendIntentsWithAi(
        store,
        userId,
        language,
        latestUserPrompt,
        recentUserMessages
      );
      if (aiPlannedIntents.length > 0) {
        const usableAiIntents = aiPlannedIntents.filter(
          (intent) => !isLikelySendAiRefusal(intent.messageText)
        );
        sendIntents =
          usableAiIntents.length > 0
            ? usableAiIntents
            : parsedSendIntents.length > 0
              ? parsedSendIntents
              : aiPlannedIntents;
      }
    }
    if (isSendCommand && sendIntents.length === 0) {
      return NextResponse.json({
        message: buildSendParseErrorReply(language),
        sentMessages: 0,
      });
    }
    if (sendIntents.length > 0) {
      const sendSummary = await executeSendIntents(
        userId,
        language,
        sendIntents,
        recentUserMessages
      );
      const message = buildSendActionReply(language, sendSummary);
      return NextResponse.json({
        message,
        sentMessages: sendSummary.sentMessages,
      });
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


