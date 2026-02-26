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

type RecipientCandidate = {
  userId: string;
  name: string;
  username: string;
  sharedThreadIds: string[];
  hasDirectThread: boolean;
  nameNormalized: string;
  usernameNormalized: string;
  bioNormalized: string;
  nameTokenStems: Set<string>;
  usernameTokenStems: Set<string>;
  bioTokenStems: Set<string>;
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

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const RESPONSE_TIMEOUT_MS = 12_000;
const MAX_AUTOMATION_TARGETS = 8;
const MAX_CONTEXT_MESSAGES_PER_CANDIDATE = 160;

const SEND_COMMAND_START_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:отправ(?:ь|ьте)|напиш(?:и|ите)|передай|сообщи|скажи|уведоми|send|text|message|write|tell|notify|поздрав(?:ь|ьте)|congratulate)\b/iu;
const SEND_LEADING_VERB_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:отправ(?:ь|ьте)|напиш(?:и|ите)|передай|сообщи|скажи|уведоми|send|text|message|write|tell|notify|поздрав(?:ь|ьте)|congratulate)\s+/iu;
const SEND_SEGMENT_PREFIX_REGEX =
  /^(?:please\s+|пожалуйста\s+|and\s+|и\s+|а\s+)?(?:отправ(?:ь|ьте)|напиш(?:и|ите)|передай|сообщи|скажи|уведоми|send|text|message|write|tell|notify)\s+/iu;

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

  for (const token of tokens) {
    const stem = stemToken(token);
    if (stem.length < 2 || STOP_WORD_STEMS.has(stem) || seen.has(stem)) {
      continue;
    }
    seen.add(stem);
    result.push(stem);
  }

  return result;
}

function toStemSet(value: string): Set<string> {
  return new Set(tokenizeForMatching(value));
}

function cleanRecipientQuery(value: string): string {
  return value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/^(?:для|к|to|for)\s+/iu, "")
    .replace(/\b(?:пожалуйста|please)\b/giu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMessageText(value: string): string {
  return value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
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

function splitIntoIntentSegments(input: string): string[] {
  const compact = input.replace(/\r?\n+/g, ", ").replace(/\s+/g, " ").trim();
  if (!compact) {
    return [];
  }
  const withImplicitSeparators = compact.replace(
    /\s+\b(?:и|а|and)\b\s+(?=[^,;]{1,90}\b(?:что|that|поздрав|congratulat)\b)/giu,
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
  const trimmed = segment.trim().replace(/^(?:и|а|and)\s+/iu, "");
  const startsWithCongratulation = /^(?:пожалуйста\s+|please\s+)?(?:поздрав(?:ь|ьте)|congratulate)\b/iu.test(
    trimmed
  );

  let working = trimmed.replace(/^(?:пожалуйста|please)\s+/iu, "");
  working = isFirstSegment
    ? working.replace(SEND_LEADING_VERB_REGEX, "")
    : working.replace(SEND_SEGMENT_PREFIX_REGEX, "");
  working = working.trim();

  if (!working) {
    return null;
  }

  const messageByWhat = working.match(/^(.+?)\s+(?:что|that)\s+(.+)$/iu);
  if (messageByWhat) {
    const recipientQuery = cleanRecipientQuery(messageByWhat[1] ?? "");
    const messageText = cleanMessageText(messageByWhat[2] ?? "");
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

  return null;
}

function extractSendIntents(
  input: string,
  language: "en" | "ru"
): SendIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !SEND_COMMAND_START_REGEX.test(trimmed)) {
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
      nameTokenStems: toStemSet(user.name),
      usernameTokenStems: toStemSet(user.username),
      bioTokenStems: toStemSet(user.bio),
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

function scoreRecipientCandidate(
  candidate: RecipientCandidate,
  queryNormalized: string,
  queryTokens: string[],
  relationKeys: string[]
): { score: number; exact: boolean } {
  let score = 0;
  let exact = false;

  if (!queryNormalized || queryTokens.length === 0) {
    return { score, exact };
  }

  if (
    candidate.nameNormalized === queryNormalized ||
    candidate.usernameNormalized === queryNormalized ||
    `@${candidate.usernameNormalized}` === queryNormalized
  ) {
    score += 280;
    exact = true;
  }

  if (candidate.nameNormalized.includes(queryNormalized)) {
    score += 150;
  }
  if (
    candidate.usernameNormalized.includes(queryNormalized) ||
    `@${candidate.usernameNormalized}`.includes(queryNormalized)
  ) {
    score += 150;
  }
  if (candidate.bioNormalized.includes(queryNormalized)) {
    score += 70;
  }

  for (const token of queryTokens) {
    if (candidate.nameTokenStems.has(token)) {
      score += 75;
    }
    if (candidate.usernameTokenStems.has(token)) {
      score += 65;
    }
    if (candidate.bioTokenStems.has(token)) {
      score += 40;
    }
    if (candidate.userMessageTokenStems.has(token)) {
      score += 45;
    }
    if (candidate.peerMessageTokenStems.has(token)) {
      score += 28;
    }
    if (candidate.allMessageTokenStems.has(token)) {
      score += 12;
    }
  }

  if (candidate.hasDirectThread) {
    score += 14;
  }
  score += Math.min(candidate.sharedThreadIds.length, 3) * 5;

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
    }
    if (hasAliasStemHit(candidate.userMessageTokenStems, aliasStems)) {
      score += 130;
    }
    if (hasAliasStemHit(candidate.peerMessageTokenStems, aliasStems)) {
      score += 55;
    }
    if (hasAliasStemHit(candidate.allMessageTokenStems, aliasStems)) {
      score += 24;
    }
  }

  return { score, exact };
}

function resolveRecipient(
  candidates: RecipientCandidate[],
  rawQuery: string
): RecipientResolution {
  const queryNormalized = normalizeForMatching(rawQuery);
  const queryTokens = tokenizeForMatching(rawQuery);
  const relationKeys = detectRelationKeys(queryTokens);

  if (!queryNormalized || queryTokens.length === 0) {
    return {
      status: "not_found",
    };
  }

  const scored = candidates
    .map((candidate) => {
      const scoreData = scoreRecipientCandidate(
        candidate,
        queryNormalized,
        queryTokens,
        relationKeys
      );
      return {
        candidate,
        score: scoreData.score,
        exact: scoreData.exact,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const minimumScore = relationKeys.length > 0 ? 55 : 70;
  const top = scored[0];
  const second = scored[1];

  if (!top || top.score < minimumScore) {
    return {
      status: "not_found",
    };
  }

  const shouldAskClarification =
    !top.exact &&
    Boolean(
      second &&
        second.score >= minimumScore &&
        top.score - second.score < 18 &&
        second.score >= Math.floor(top.score * 0.82)
    );

  if (shouldAskClarification) {
    return {
      status: "ambiguous",
      alternatives: [top.candidate, second!.candidate].filter(
        (candidate, index, all) =>
          all.findIndex((item) => item.userId === candidate.userId) === index
      ),
    };
  }

  return {
    status: "resolved",
    candidate: top.candidate,
    score: top.score,
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

async function executeSendIntents(
  userId: string,
  intents: SendIntent[]
): Promise<SendActionSummary> {
  return updateStore<SendActionSummary>((store) => {
    const sender = store.users.find((user) => user.id === userId);
    if (!sender) {
      throw new Error("User not found.");
    }

    assertUserCanSendMessages(store, userId);
    const candidates = buildRecipientCandidates(store, userId);
    const outcomes: SendActionOutcome[] = [];
    let sentMessages = 0;

    for (const intent of intents) {
      const recipientQuery = cleanRecipientQuery(intent.recipientQuery);
      const messageText = cleanMessageText(intent.messageText);
      if (!recipientQuery || !messageText) {
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
    const sendIntents = extractSendIntents(latestUserPrompt, language);
    if (sendIntents.length > 0) {
      const sendSummary = await executeSendIntents(userId, sendIntents);
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
