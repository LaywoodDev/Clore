import { NextResponse } from "next/server";

import { assertUserCanSendMessages } from "@/lib/server/admin";
import {
  buildModelCandidates,
  getAiProviderConfig,
} from "@/lib/server/ai-provider";
import {
  buildAiKnowledgeContext,
  buildAiResponseGuidance,
} from "@/lib/server/ai-knowledge-base";
import {
  canModerateGroup,
  canRemoveGroupMember,
  canUserBeAddedToGroupBy,
  createEntityId,
  getStore,
  isGroupOwner,
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
  agentEnabled?: boolean;
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

type DeleteIntent = {
  recipientQuery: string;
};

type DeleteActionOutcome = {
  recipientQuery: string;
  status: "deleted" | "not_found" | "ambiguous" | "forbidden";
  resolvedTitle?: string;
  alternatives?: string[];
};

type DeleteActionSummary = {
  outcomes: DeleteActionOutcome[];
  deletedChats: number;
};

type CreateGroupIntent = {
  title: string;
  memberQueries: string[];
};

type CreateGroupActionOutcome = {
  title: string;
  status: "created" | "invalid" | "not_found" | "ambiguous" | "forbidden" | "duplicate";
  resolvedTitle?: string;
  chatId?: string;
  memberQuery?: string;
  alternatives?: string[];
  details?: string;
};

type CreateGroupActionSummary = {
  outcomes: CreateGroupActionOutcome[];
  createdGroups: number;
};

type InviteToGroupIntent = {
  groupQuery: string;
  memberQueries: string[];
};

type InviteToGroupActionOutcome = {
  groupQuery: string;
  status: "invited" | "no_changes" | "invalid" | "not_found" | "ambiguous" | "forbidden";
  resolvedGroupTitle?: string;
  invitedCount?: number;
  alreadyInGroup?: string[];
  notFoundMembers?: string[];
  ambiguousMembers?: Array<{
    query: string;
    alternatives: string[];
  }>;
  forbiddenMembers?: string[];
  alternatives?: string[];
  details?: string;
};

type InviteToGroupActionSummary = {
  outcomes: InviteToGroupActionOutcome[];
  invitedMembers: number;
};

type RemoveFromGroupIntent = {
  groupQuery: string;
  memberQueries: string[];
};

type RemoveFromGroupActionOutcome = {
  groupQuery: string;
  status: "removed" | "no_changes" | "invalid" | "not_found" | "ambiguous" | "forbidden";
  resolvedGroupTitle?: string;
  removedCount?: number;
  notFoundMembers?: string[];
  ambiguousMembers?: Array<{
    query: string;
    alternatives: string[];
  }>;
  forbiddenMembers?: string[];
  details?: string;
};

type RemoveFromGroupActionSummary = {
  outcomes: RemoveFromGroupActionOutcome[];
  removedMembers: number;
};

type UpdateGroupDataIntent = {
  groupQuery: string;
  title?: string;
  description?: string;
};

type UpdateGroupDataActionOutcome = {
  groupQuery: string;
  status: "updated" | "invalid" | "not_found" | "ambiguous" | "forbidden" | "duplicate";
  resolvedGroupTitle?: string;
  details?: string;
};

type UpdateGroupDataActionSummary = {
  outcomes: UpdateGroupDataActionOutcome[];
  updatedGroups: number;
};

type SetGroupMemberAccessRole = "admin" | "member";

type SetGroupMemberAccessIntent = {
  groupQuery: string;
  memberQueries: string[];
  role: SetGroupMemberAccessRole;
};

type SetGroupMemberAccessActionOutcome = {
  groupQuery: string;
  role: SetGroupMemberAccessRole;
  status: "updated" | "no_changes" | "invalid" | "not_found" | "ambiguous" | "forbidden";
  resolvedGroupTitle?: string;
  changedCount?: number;
  alreadyWithRole?: string[];
  notFoundMembers?: string[];
  ambiguousMembers?: Array<{
    query: string;
    alternatives: string[];
  }>;
  forbiddenMembers?: string[];
  details?: string;
};

type SetGroupMemberAccessActionSummary = {
  outcomes: SetGroupMemberAccessActionOutcome[];
  updatedMemberRoles: number;
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
const GROUP_TITLE_MIN_LENGTH = 3;
const GROUP_TITLE_MAX_LENGTH = 64;
const GROUP_DESCRIPTION_MAX_LENGTH = 280;
const GROUP_MIN_OTHER_MEMBERS = 2;
const GROUP_MAX_MEMBERS = 50;
const LATEST_GROUP_QUERY = "__latest_group__";

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
const DELETE_COMMAND_START_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:удали(?:ть)?|delete|remove|erase)(?=\s|$|[,.!?;:])/iu;
const DELETE_COMMAND_SEGMENT_SEPARATOR_REGEX =
  /\s+(?:и|а|или|and|or)\s+(?=(?:пожалуйста\s+|please\s+|ну\s+)?(?:удали(?:ть)?|delete|remove|erase))/giu;
const CREATE_GROUP_COMMAND_START_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:(?:create|make|start|созда(?:й|йте|ть)|сдела(?:й|йте|ть))\s+(?:new\s+|нов(?:ую|ая|ой)?\s+)?(?:group|групп(?:у|а|ы)?|group\s+chat)|(?:new\s+group|нов(?:ая|ую)\s+групп(?:а|у)?))(?=\s|$|[,.!?;:])/iu;
const CREATE_GROUP_PREFIX_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)*(?:(?:create|make|start|созда(?:й|йте|ть)|сдела(?:й|йте|ть))\s+(?:new\s+|нов(?:ую|ая|ой)?\s+)?(?:group|групп(?:у|а|ы)?|group\s+chat)|(?:new\s+group|нов(?:ая|ую)\s+групп(?:а|у)?))\s*/iu;
const INVITE_TO_GROUP_COMMAND_START_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)?(?:invite|add|приглас(?:и|ите|ить)|добав(?:ь|ьте|ить)|закинь|закиньте)(?=\s|$|[,.!?;:])/iu;
const INVITE_TO_GROUP_PREFIX_REGEX =
  /^(?:please\s+|пожалуйста\s+|ну\s+)*(?:invite|add|приглас(?:и|ите|ить)|добав(?:ь|ьте|ить)|закинь|закиньте)\s+/iu;
const REMOVE_FROM_GROUP_COMMAND_START_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)?(?:remove|kick|exclude|drop|\u0443\u0434\u0430\u043b(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u0438\u0441\u043a\u043b\u044e\u0447(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u043a\u0438\u043a(?:\u043d\u0438|\u043d\u0438\u0442\u0435|\u043d\u0443\u0442\u044c)?)(?=\s|$|[,.!?;:])/iu;
const REMOVE_FROM_GROUP_PREFIX_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)*(?:remove|kick|exclude|drop|\u0443\u0434\u0430\u043b(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u0438\u0441\u043a\u043b\u044e\u0447(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u043a\u0438\u043a(?:\u043d\u0438|\u043d\u0438\u0442\u0435|\u043d\u0443\u0442\u044c)?)\s+/iu;
const UPDATE_GROUP_DATA_COMMAND_START_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)?(?:rename|update|change|edit|set|\u043f\u0435\u0440\u0435\u0438\u043c\u0435\u043d(?:\u0443\u0439|\u0443\u0439\u0442\u0435|\u043e\u0432\u0430\u0442\u044c)|\u0438\u0437\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u043e\u0431\u043d\u043e\u0432(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440(?:\u0443\u0439|\u0443\u0439\u0442\u0435|\u043e\u0432\u0430\u0442\u044c))(?=\s|$|[,.!?;:])/iu;
const UPDATE_GROUP_DATA_PREFIX_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)*(?:rename|update|change|edit|set|\u043f\u0435\u0440\u0435\u0438\u043c\u0435\u043d(?:\u0443\u0439|\u0443\u0439\u0442\u0435|\u043e\u0432\u0430\u0442\u044c)|\u0438\u0437\u043c\u0435\u043d(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u043e\u0431\u043d\u043e\u0432(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440(?:\u0443\u0439|\u0443\u0439\u0442\u0435|\u043e\u0432\u0430\u0442\u044c))\s+/iu;
const SET_GROUP_MEMBER_ACCESS_COMMAND_START_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)?(?:set|make|promote|demote|grant|revoke|\u043d\u0430\u0437\u043d\u0430\u0447(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u0432\u044b\u0441(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u043d\u0438\u0437(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0441\u043d\u0438\u043c(?:\u0438|\u0438\u0442\u0435)|\u0434\u0430\u0439(?:\u0442\u0435)?)(?=\s|$|[,.!?;:])/iu;
const SET_GROUP_MEMBER_ACCESS_PREFIX_REGEX =
  /^(?:please\s+|\u043f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430\s+|\u043d\u0443\s+)*(?:set|make|promote|demote|grant|revoke|\u043d\u0430\u0437\u043d\u0430\u0447(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u0432\u044b\u0441(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u043d\u0438\u0437(?:\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0441\u043d\u0438\u043c(?:\u0438|\u0438\u0442\u0435)|\u0434\u0430\u0439(?:\u0442\u0435)?)\s+/iu;
const DELETE_ALL_RECIPIENT_QUERY = "__all_chats__";
const DELETE_ALL_QUERY_ALIASES = new Set(
  [
    "all",
    "all chats",
    "all chat",
    "all conversations",
    "all dialogs",
    "everything",
    "все",
    "все чаты",
    "все диалоги",
    "все переписки",
    "всё",
  ].map((alias) => normalizeForMatching(alias))
);
const LEADING_FILLER_REGEX = /^(?:пожалуйста|please|ну|на|и|а|and)\s+/iu;
const LATEST_GROUP_QUERY_ALIASES = new Set(
  [
    "туда",
    "в нее",
    "в неё",
    "в эту группу",
    "в текущую группу",
    "в последнюю группу",
    "в новую группу",
    "там",
    "there",
    "into that group",
    "into this group",
    "to that group",
    "to this group",
    "latest group",
    "last group",
    "new group",
  ].map((alias) => normalizeForMatching(alias))
);
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

function isLikelyDeleteCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (!DELETE_COMMAND_START_REGEX.test(trimmed)) {
    return false;
  }
  const normalized = normalizeForMatching(trimmed);
  if (/^(?:удали(?:ть)?|delete|remove|erase)\s*$/iu.test(normalized)) {
    return true;
  }
  if (/(?:^|\s)(?:all|все|everything)(?:\s|$)/iu.test(normalized)) {
    return true;
  }
  if (
    /(?:^|\s)(?:chat|conversation|dialog|чат|чаты|диалог|диалоги|переписк|избран|saved|favorite|favorites)(?:\s|$)/iu.test(
      normalized
    )
  ) {
    return true;
  }
  return /(?:^|\s)(?:with|с|со)\s+@?[\p{L}\p{N}_-]{2,}/u.test(trimmed);
}

function cleanDeleteRecipientQuery(value: string): string {
  let output = value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/\s+/g, " ");
  let previous = "";

  while (output && output !== previous) {
    previous = output;
    output = output
      .replace(/^(?:please|пожалуйста|ну|and|или|и|а)\s+/iu, "")
      .replace(/^(?:this|that|my|этот|эту|мои|мой|мою)\s+/iu, "")
      .replace(
        /^(?:chat(?:s)?|conversation(?:s)?|dialog(?:s)?|чат(?:ы)?|диалог(?:и)?|переписк(?:а|у|и))\s*/iu,
        ""
      )
      .replace(/^(?:with|с|со)\s+/iu, "")
      .replace(/\s+(?:please|пожалуйста)\s*$/iu, "")
      .trim();
  }

  return cleanRecipientQuery(output);
}

function isDeleteAllRecipientQuery(value: string): boolean {
  if (value === DELETE_ALL_RECIPIENT_QUERY) {
    return true;
  }
  const normalized = normalizeForMatching(cleanDeleteRecipientQuery(value));
  if (!normalized) {
    return false;
  }
  return DELETE_ALL_QUERY_ALIASES.has(normalized);
}

function parseDeleteIntentSegment(
  segment: string,
  isFirstSegment: boolean
): DeleteIntent | null {
  const trimmed = segment.trim();
  if (!trimmed) {
    return null;
  }

  const consumedVerb = trimmed.match(
    /^(?:(?:please|пожалуйста|ну)\s+)*(?:удали(?:ть)?|delete|remove|erase)\s+(.+)$/iu
  );
  const working = consumedVerb?.[1]?.trim() ?? (isFirstSegment ? "" : trimmed);
  if (!working) {
    return null;
  }

  const recipientQuery = cleanDeleteRecipientQuery(working);
  if (!recipientQuery) {
    return null;
  }

  return {
    recipientQuery,
  };
}

function extractDeleteIntents(input: string): DeleteIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelyDeleteCommandStart(trimmed)) {
    return [];
  }

  const compact = trimmed.replace(/\r?\n+/g, ", ").replace(/\s+/g, " ").trim();
  const withExplicitSeparators = compact.replace(
    DELETE_COMMAND_SEGMENT_SEPARATOR_REGEX,
    ", "
  );
  const segments = withExplicitSeparators
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const intents: DeleteIntent[] = [];
  const seenQueries = new Set<string>();
  for (let index = 0; index < segments.length; index += 1) {
    const parsed = parseDeleteIntentSegment(segments[index] ?? "", index === 0);
    if (!parsed) {
      continue;
    }
    const dedupeKey = normalizeForMatching(parsed.recipientQuery);
    if (!dedupeKey || seenQueries.has(dedupeKey)) {
      continue;
    }
    seenQueries.add(dedupeKey);
    intents.push(parsed);
    if (intents.length >= MAX_AUTOMATION_TARGETS) {
      break;
    }
  }

  if (intents.length === 0) {
    const fallbackRecipient = cleanDeleteRecipientQuery(
      trimmed.replace(
        /^(?:(?:please|пожалуйста|ну)\s+)*(?:удали(?:ть)?|delete|remove|erase)\s*/iu,
        ""
      )
    );
    if (fallbackRecipient) {
      intents.push({ recipientQuery: fallbackRecipient });
    } else {
      intents.push({ recipientQuery: DELETE_ALL_RECIPIENT_QUERY });
    }
  }

  return intents;
}

function normalizeGroupTitle(value: string): string {
  return value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/\s+/g, " ");
}

function cleanGroupQuery(value: string): string {
  let output = value
    .trim()
    .replace(/^["'«“]+|["'»”]+$/gu, "")
    .replace(/\s+/g, " ");
  let previous = "";

  while (output && output !== previous) {
    previous = output;
    output = output
      .replace(/^(?:please|пожалуйста|ну|and|или|и|а)\s+/iu, "")
      .replace(/^(?:в|во|to|into|for)\s+/iu, "")
      .replace(/^(?:group|groups|групп(?:у|а|е|ы)?)\s+/iu, "")
      .replace(/^(?:this|that|my|эту|эта|эту\s+самую|мою)\s+/iu, "")
      .replace(/\s+(?:please|пожалуйста)\s*$/iu, "")
      .trim();
  }

  return output;
}

function normalizeMemberQueryList(value: string): string {
  return value
    .replace(/\r?\n+/g, " ")
    .replace(/\s+(?:и|или|and|or)\s+/giu, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMemberQueries(value: string): string[] {
  const compact = normalizeMemberQueryList(value);
  if (!compact) {
    return [];
  }

  const mentionHits = [...compact.matchAll(/@([\p{L}\p{N}._-]{2,64})/gu)]
    .map((match) => cleanRecipientQuery(match[1] ?? ""))
    .filter((query) => query.length > 0);

  const splitQueries = compact
    .split(/[;,]/)
    .map((item) =>
      cleanRecipientQuery(
        item
          .replace(
            /^(?:users?|members?|people|пользовател(?:я|ей)?|участник(?:а|ов)?|людей)\s+/iu,
            ""
          )
          .replace(
            /(?:users?|members?|people|пользовател(?:я|ей)?|участник(?:а|ов)?|людей)$/iu,
            ""
          )
      )
    )
    .filter((query) => query.length > 0);

  const combined = splitQueries.length > 0 ? [...splitQueries, ...mentionHits] : mentionHits;
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const query of combined) {
    const key = normalizeForMatching(query);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(query);
    if (deduped.length >= GROUP_MAX_MEMBERS - 1) {
      break;
    }
  }

  return deduped;
}

function isLikelyCreateGroupCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return CREATE_GROUP_COMMAND_START_REGEX.test(trimmed);
}

function parseCreateGroupIntent(input: string): CreateGroupIntent | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const working = trimmed.replace(CREATE_GROUP_PREFIX_REGEX, "").trim();
  if (!working) {
    return null;
  }

  const quotedPattern = working.match(
    /^["'«“](.+?)["'»”](?:\s+(?:with|с|и|members?|участники?|добав(?:ь|ьте|ить)|add)\s+(.+))?$/iu
  );
  if (quotedPattern) {
    return {
      title: normalizeGroupTitle(quotedPattern[1] ?? ""),
      memberQueries: extractMemberQueries(quotedPattern[2] ?? ""),
    };
  }

  const titledWithMembers = working.match(
    /^(.+?)\s+(?:with|с|и|members?|участники?|добав(?:ь|ьте|ить)|add)\s+(.+)$/iu
  );
  if (titledWithMembers) {
    return {
      title: normalizeGroupTitle(titledWithMembers[1] ?? ""),
      memberQueries: extractMemberQueries(titledWithMembers[2] ?? ""),
    };
  }

  const colonPattern = working.match(/^(.+?)\s*[:\-]\s*(.+)$/u);
  if (colonPattern) {
    return {
      title: normalizeGroupTitle(colonPattern[1] ?? ""),
      memberQueries: extractMemberQueries(colonPattern[2] ?? ""),
    };
  }

  const firstMention = working.search(/@[\p{L}\p{N}._-]{2,64}/u);
  if (firstMention > 0) {
    return {
      title: normalizeGroupTitle(working.slice(0, firstMention)),
      memberQueries: extractMemberQueries(working.slice(firstMention)),
    };
  }

  return {
    title: normalizeGroupTitle(working),
    memberQueries: [],
  };
}

function extractCreateGroupIntents(input: string): CreateGroupIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelyCreateGroupCommandStart(trimmed)) {
    return [];
  }

  const intent = parseCreateGroupIntent(trimmed);
  if (!intent) {
    return [];
  }

  return [intent];
}

function isLikelyInviteToGroupCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (!INVITE_TO_GROUP_COMMAND_START_REGEX.test(trimmed)) {
    return false;
  }
  const normalized = normalizeForMatching(trimmed);
  if (/(?:^|\s)(?:group|groups|групп(?:у|а|е|ы)?)(?:\s|$)/iu.test(normalized)) {
    return true;
  }
  return /(?:^|\s)(?:туда|там|there|latest\s+group|last\s+group|new\s+group)(?:\s|$)/iu.test(
    normalized
  );
}

function isLatestGroupQuery(value: string): boolean {
  if (value === LATEST_GROUP_QUERY) {
    return true;
  }
  const normalized = normalizeForMatching(cleanGroupQuery(value));
  if (!normalized) {
    return false;
  }
  return LATEST_GROUP_QUERY_ALIASES.has(normalized);
}

function parseInviteToGroupIntent(input: string): InviteToGroupIntent | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const working = trimmed.replace(INVITE_TO_GROUP_PREFIX_REGEX, "").trim();
  if (!working) {
    return null;
  }

  const toGroupPattern = working.match(
    /^(.+?)\s+(?:в|во|to|into)\s+(?:group|groups|групп(?:у|а|е|ы)?)\s+(.+)$/iu
  );
  if (toGroupPattern) {
    return {
      groupQuery: cleanGroupQuery(toGroupPattern[2] ?? ""),
      memberQueries: extractMemberQueries(toGroupPattern[1] ?? ""),
    };
  }

  const toLatestGroupPattern = working.match(/^(.+?)\s+(?:туда|там|there)$/iu);
  if (toLatestGroupPattern) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: extractMemberQueries(toLatestGroupPattern[1] ?? ""),
    };
  }

  const latestGroupFirstPattern = working.match(/^(?:туда|там|there)\s+(.+)$/iu);
  if (latestGroupFirstPattern) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: extractMemberQueries(latestGroupFirstPattern[1] ?? ""),
    };
  }

  const groupFirstPattern = working.match(
    /^(?:в|во|to|into)\s+(?:group|groups|групп(?:у|а|е|ы)?)\s+(.+?)\s*(?::|-|\s+(?:add|invite|добав(?:ь|ьте|ить)|приглас(?:и|ите|ить)|members?|участники?)\s+)(.+)$/iu
  );
  if (groupFirstPattern) {
    return {
      groupQuery: cleanGroupQuery(groupFirstPattern[1] ?? ""),
      memberQueries: extractMemberQueries(groupFirstPattern[2] ?? ""),
    };
  }

  const mentions = extractMemberQueries(working);
  if (mentions.length > 0) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: mentions,
    };
  }

  return null;
}

function extractInviteToGroupIntents(input: string): InviteToGroupIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelyInviteToGroupCommandStart(trimmed)) {
    return [];
  }

  const intent = parseInviteToGroupIntent(trimmed);
  if (!intent) {
    return [];
  }

  return [intent];
}

function normalizeParsedGroupQuery(value: string): string {
  const cleaned = cleanGroupQuery(value);
  if (!cleaned) {
    return "";
  }
  return isLatestGroupQuery(cleaned) ? LATEST_GROUP_QUERY : cleaned;
}

function isLikelyRemoveFromGroupCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (!REMOVE_FROM_GROUP_COMMAND_START_REGEX.test(trimmed)) {
    return false;
  }
  if (
    /(?:^|\s)(?:group|groups|there|latest\s+group|last\s+group|new\s+group)(?:\s|$)/iu.test(
      trimmed
    )
  ) {
    return true;
  }
  return /(?:^|\s)(?:\u0438\u0437|\u0432)\s+(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?)(?:\s|$)/iu.test(
    trimmed
  );
}

function parseRemoveFromGroupIntent(input: string): RemoveFromGroupIntent | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const working = trimmed.replace(REMOVE_FROM_GROUP_PREFIX_REGEX, "").trim();
  if (!working) {
    return null;
  }

  const memberToGroupPattern = working.match(
    /^(.+?)\s+(?:from|\u0438\u0437)\s+(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?)\s+(.+)$/iu
  );
  if (memberToGroupPattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(memberToGroupPattern[2] ?? ""),
      memberQueries: extractMemberQueries(memberToGroupPattern[1] ?? ""),
    };
  }

  const memberToLatestPattern = working.match(
    /^(.+?)\s+(?:from|\u0438\u0437)\s+(?:there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)$/iu
  );
  if (memberToLatestPattern) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: extractMemberQueries(memberToLatestPattern[1] ?? ""),
    };
  }

  const groupFirstPattern = working.match(
    /^(?:from|\u0438\u0437)\s+(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?)\s+(.+?)\s*(?::|-|\s+(?:remove|kick|exclude|drop|members?|people|\u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a(?:\u0430|\u043e\u0432)?|\u0443\u0434\u0430\u043b(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c)|\u0438\u0441\u043a\u043b\u044e\u0447(?:\u0438|\u0438\u0442\u0435|\u0438\u0442\u044c))\s+)(.+)$/iu
  );
  if (groupFirstPattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(groupFirstPattern[1] ?? ""),
      memberQueries: extractMemberQueries(groupFirstPattern[2] ?? ""),
    };
  }

  const latestFirstPattern = working.match(
    /^(?:there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+)$/iu
  );
  if (latestFirstPattern) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: extractMemberQueries(latestFirstPattern[1] ?? ""),
    };
  }

  const mentions = extractMemberQueries(working);
  if (mentions.length > 0) {
    return {
      groupQuery: LATEST_GROUP_QUERY,
      memberQueries: mentions,
    };
  }

  return null;
}

function extractRemoveFromGroupIntents(input: string): RemoveFromGroupIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelyRemoveFromGroupCommandStart(trimmed)) {
    return [];
  }

  const intent = parseRemoveFromGroupIntent(trimmed);
  if (!intent) {
    return [];
  }

  return [intent];
}

function cleanQuotedCommandValue(value: string): string {
  return value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyUpdateGroupDataCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (!UPDATE_GROUP_DATA_COMMAND_START_REGEX.test(trimmed)) {
    return false;
  }
  if (
    !/(?:^|\s)(?:group|groups|there|latest\s+group|last\s+group|new\s+group|\u0433\u0440\u0443\u043f\u043f(?:\u0430|\u0443|\u0435|\u044b)?|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)(?:\s|$)/iu.test(
      trimmed
    )
  ) {
    return false;
  }
  return /(?:^|\s)(?:name|title|description|desc|bio|to|\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435|\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435)(?:\s|$)/iu.test(
    trimmed
  );
}

function parseUpdateGroupDataIntent(input: string): UpdateGroupDataIntent | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const working = trimmed.replace(UPDATE_GROUP_DATA_PREFIX_REGEX, "").trim();
  if (!working) {
    return null;
  }

  const renamePattern = working.match(
    /^(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?|there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+?)\s+(?:to|\u0432)\s+(.+)$/iu
  );
  if (renamePattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(renamePattern[1] ?? ""),
      title: cleanQuotedCommandValue(renamePattern[2] ?? ""),
    };
  }

  const groupTitlePattern = working.match(
    /^(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?|there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+?)\s+(?:name|title|\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435)\s*(?::|-|\s+(?:to|\u043d\u0430)\s+)(.+)$/iu
  );
  if (groupTitlePattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(groupTitlePattern[1] ?? ""),
      title: cleanQuotedCommandValue(groupTitlePattern[2] ?? ""),
    };
  }

  const groupDescriptionPattern = working.match(
    /^(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?|there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+?)\s+(?:description|desc|bio|\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435)\s*(?::|-|\s+(?:to|\u043d\u0430)\s+)(.+)$/iu
  );
  if (groupDescriptionPattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(groupDescriptionPattern[1] ?? ""),
      description: cleanQuotedCommandValue(groupDescriptionPattern[2] ?? ""),
    };
  }

  const descriptionFirstPattern = working.match(
    /^(?:description|desc|bio|\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435)\s+(?:for|of|\u0434\u043b\u044f)\s+(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?|there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+?)\s*(?::|-|\s+(?:to|\u043d\u0430)\s+)(.+)$/iu
  );
  if (descriptionFirstPattern) {
    return {
      groupQuery: normalizeParsedGroupQuery(descriptionFirstPattern[1] ?? ""),
      description: cleanQuotedCommandValue(descriptionFirstPattern[2] ?? ""),
    };
  }

  return null;
}

function extractUpdateGroupDataIntents(input: string): UpdateGroupDataIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelyUpdateGroupDataCommandStart(trimmed)) {
    return [];
  }

  const intent = parseUpdateGroupDataIntent(trimmed);
  if (!intent) {
    return [];
  }

  return [intent];
}

function parseSetGroupMemberAccessRole(value: string): SetGroupMemberAccessRole | null {
  if (
    /(?:^|\s)(?:admin|administrator)(?:\s|$)/iu.test(value) ||
    /\u0430\u0434\u043c\u0438\u043d(?:\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440)?(?:\u043e\u043c)?/iu.test(value)
  ) {
    return "admin";
  }
  if (
    /(?:^|\s)(?:member|members)(?:\s|$)/iu.test(value) ||
    /\u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a(?:\u0430|\u043e\u043c|\u0438)?/iu.test(value)
  ) {
    return "member";
  }
  return null;
}

function stripRoleHintsFromMemberQueryList(value: string): string {
  return value
    .replace(
      /(?:^|\s)(?:as|role|admin|administrator|member|members|promote|demote|grant|revoke|set|make|\u043a\u0430\u043a|\u0440\u043e\u043b\u044c|\u0430\u0434\u043c\u0438\u043d(?:\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440)?(?:\u043e\u043c)?|\u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a(?:\u0430|\u043e\u043c|\u0438)?|\u043f\u043e\u0432\u044b\u0441(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u043d\u0438\u0437(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043d\u0430\u0437\u043d\u0430\u0447(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0441\u043d\u0438\u043c(?:\u0438|\u0438\u0442\u0435))(?:\s|$)/giu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelySetGroupMemberAccessCommandStart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (!SET_GROUP_MEMBER_ACCESS_COMMAND_START_REGEX.test(trimmed)) {
    return false;
  }
  if (
    !/(?:^|\s)(?:group|groups|there|latest\s+group|last\s+group|new\s+group|\u0433\u0440\u0443\u043f\u043f(?:\u0430|\u0443|\u0435|\u044b)?|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)(?:\s|$)/iu.test(
      trimmed
    )
  ) {
    return false;
  }
  return (
    parseSetGroupMemberAccessRole(trimmed) !== null ||
    /(?:^|\s)(?:promote|demote|grant|revoke|\u043f\u043e\u0432\u044b\u0441(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u043f\u043e\u043d\u0438\u0437(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0434\u0430\u0439(?:\u0442\u0435)?|\u0441\u043d\u0438\u043c(?:\u0438|\u0438\u0442\u0435))(?:\s|$)/iu.test(
      trimmed
    )
  );
}

function parseSetGroupMemberAccessIntent(input: string): SetGroupMemberAccessIntent | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const working = trimmed.replace(SET_GROUP_MEMBER_ACCESS_PREFIX_REGEX, "").trim();
  if (!working) {
    return null;
  }

  const explicitRole = parseSetGroupMemberAccessRole(working);
  const inferredRole =
    /(?:^|\s)(?:promote|grant|\u043f\u043e\u0432\u044b\u0441(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0434\u0430\u0439(?:\u0442\u0435)?)(?:\s|$)/iu.test(
      trimmed
    )
      ? "admin"
      : /(?:^|\s)(?:demote|revoke|\u043f\u043e\u043d\u0438\u0437(?:\u0438|\u044c|\u044c\u0442\u0435|\u0438\u0442\u044c)|\u0441\u043d\u0438\u043c(?:\u0438|\u0438\u0442\u0435))(?:\s|$)/iu.test(
            trimmed
          )
        ? "member"
        : null;
  const role = explicitRole ?? inferredRole;
  if (!role) {
    return null;
  }

  const memberToGroupPattern = working.match(
    /^(.+?)\s+(?:in|for|\u0432)\s+(?:group|groups|\u0433\u0440\u0443\u043f\u043f(?:\u0443|\u0430|\u0435|\u044b)?|there|latest\s+group|last\s+group|new\s+group|\u0442\u0443\u0434\u0430|\u0442\u0430\u043c)\s+(.+)$/iu
  );
  if (!memberToGroupPattern) {
    return null;
  }

  const memberQueries = extractMemberQueries(
    stripRoleHintsFromMemberQueryList(memberToGroupPattern[1] ?? "")
  );
  if (memberQueries.length === 0) {
    return null;
  }

  return {
    groupQuery: normalizeParsedGroupQuery(memberToGroupPattern[2] ?? ""),
    memberQueries,
    role,
  };
}

function extractSetGroupMemberAccessIntents(input: string): SetGroupMemberAccessIntent[] {
  const trimmed = input.trim();
  if (!trimmed || !isLikelySetGroupMemberAccessCommandStart(trimmed)) {
    return [];
  }

  const intent = parseSetGroupMemberAccessIntent(trimmed);
  if (!intent) {
    return [];
  }

  return [intent];
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

function buildAllRecipientCandidates(
  store: StoreData,
  userId: string
): RecipientCandidate[] {
  const sharedCandidates = buildRecipientCandidates(store, userId);
  const sharedByUserId = new Map(
    sharedCandidates.map((candidate) => [candidate.userId, candidate])
  );
  const candidates: RecipientCandidate[] = [...sharedCandidates];

  for (const user of store.users) {
    if (user.id === userId || sharedByUserId.has(user.id)) {
      continue;
    }
    candidates.push({
      userId: user.id,
      name: user.name,
      username: user.username,
      sharedThreadIds: [],
      hasDirectThread: false,
      nameNormalized: normalizeForMatching(user.name),
      usernameNormalized: normalizeForMatching(user.username),
      bioNormalized: normalizeForMatching(user.bio),
      sharedThreadTitlesNormalized: "",
      sharedThreadDescriptionsNormalized: "",
      nameTokenStems: toStemSet(user.name),
      usernameTokenStems: toStemSet(user.username),
      bioTokenStems: toStemSet(user.bio),
      threadTitleTokenStems: new Set<string>(),
      threadDescriptionTokenStems: new Set<string>(),
      userMessageTokenStems: new Set<string>(),
      peerMessageTokenStems: new Set<string>(),
      allMessageTokenStems: new Set<string>(),
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

type DeleteThreadResolution =
  | {
      status: "resolved";
      thread: StoredChatThread;
      label: string;
    }
  | {
      status: "ambiguous";
      alternatives: string[];
    }
  | {
      status: "not_found";
    };

function formatThreadLabel(thread: StoredChatThread): string {
  const title = thread.title.trim();
  return title || thread.id;
}

function resolveThreadByTitleForDelete(
  threads: StoredChatThread[],
  rawQuery: string
): DeleteThreadResolution {
  const queryNormalized = normalizeForMatching(rawQuery);
  const queryTokens = tokenizeForMatching(rawQuery);
  if (!queryNormalized && queryTokens.length === 0) {
    return { status: "not_found" };
  }

  const scored = threads
    .map((thread) => {
      const label = formatThreadLabel(thread);
      const titleNormalized = normalizeForMatching(label);
      const titleTokens = toStemSet(label);
      let score = 0;

      if (queryNormalized && titleNormalized === queryNormalized) {
        score += 320;
      }
      if (queryNormalized.length >= 3 && titleNormalized.startsWith(queryNormalized)) {
        score += 190;
      }
      if (
        queryNormalized.length >= 4 &&
        !titleNormalized.startsWith(queryNormalized) &&
        titleNormalized.includes(queryNormalized)
      ) {
        score += 125;
      }
      for (const token of queryTokens) {
        if (titleTokens.has(token)) {
          score += 55;
        }
      }
      if (thread.threadType === "group") {
        score += 8;
      }

      return {
        thread,
        label,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const top = scored[0];
  if (!top || top.score < 120) {
    return { status: "not_found" };
  }

  const ambiguous = scored
    .filter((item) => item.score >= top.score - 25)
    .slice(0, 3)
    .map((item) => item.label);

  if (ambiguous.length > 1) {
    return {
      status: "ambiguous",
      alternatives: ambiguous,
    };
  }

  return {
    status: "resolved",
    thread: top.thread,
    label: top.label,
  };
}

function resolveThreadForDelete(
  store: StoreData,
  candidates: RecipientCandidate[],
  userId: string,
  rawQuery: string
): DeleteThreadResolution {
  const recipientResolution = resolveRecipient(candidates, rawQuery);
  if (recipientResolution.status === "ambiguous") {
    return {
      status: "ambiguous",
      alternatives: recipientResolution.alternatives.map(formatCandidateLabel).slice(0, 3),
    };
  }
  if (recipientResolution.status === "resolved") {
    const thread = findDirectThread(store, userId, recipientResolution.candidate.userId);
    if (thread) {
      return {
        status: "resolved",
        thread,
        label: formatCandidateLabel(recipientResolution.candidate),
      };
    }
  }

  const userThreads = store.threads.filter((thread) => thread.memberIds.includes(userId));
  return resolveThreadByTitleForDelete(userThreads, rawQuery);
}

function resolveGroupForInvite(
  store: StoreData,
  userId: string,
  rawGroupQuery: string
): DeleteThreadResolution {
  const userGroups = store.threads.filter(
    (thread) => thread.threadType === "group" && thread.memberIds.includes(userId)
  );
  if (userGroups.length === 0) {
    return { status: "not_found" };
  }

  if (isLatestGroupQuery(rawGroupQuery)) {
    const sortedByRecent = [...userGroups].sort(
      (left, right) => right.updatedAt - left.updatedAt
    );
    const top = sortedByRecent[0];
    if (!top) {
      return { status: "not_found" };
    }
    return {
      status: "resolved",
      thread: top,
      label: formatThreadLabel(top),
    };
  }

  const query = cleanGroupQuery(rawGroupQuery);
  if (!query) {
    return { status: "not_found" };
  }
  return resolveThreadByTitleForDelete(userGroups, query);
}

function resolveMemberInGroup(
  candidates: RecipientCandidate[],
  thread: StoredChatThread,
  actorUserId: string,
  rawQuery: string
): RecipientResolution {
  const allowedIds = new Set(
    thread.memberIds.filter((memberId) => memberId !== actorUserId)
  );
  const scopedCandidates = candidates.filter((candidate) =>
    allowedIds.has(candidate.userId)
  );
  if (scopedCandidates.length === 0) {
    return { status: "not_found" };
  }
  return resolveRecipient(scopedCandidates, rawQuery);
}

function removeMemberFromGroupThread(
  thread: StoredChatThread,
  memberId: string
): void {
  thread.memberIds = thread.memberIds.filter((candidateId) => candidateId !== memberId);
  const { [memberId]: _removedReadBy, ...restReadBy } = thread.readBy;
  thread.readBy = restReadBy;
  const { [memberId]: _removedPinnedBy, ...restPinnedBy } = thread.pinnedBy;
  thread.pinnedBy = restPinnedBy;
  const { [memberId]: _removedMutedBy, ...restMutedBy } = thread.mutedBy;
  thread.mutedBy = restMutedBy;
  const { [memberId]: _removedTypingBy, ...restTypingBy } = thread.typingBy;
  thread.typingBy = restTypingBy;
  const { [memberId]: _removedRole, ...restRoles } = thread.groupRoles;
  thread.groupRoles = restRoles;
}

function formatGroupRoleLabel(role: SetGroupMemberAccessRole, language: "en" | "ru"): string {
  if (language === "ru") {
    return role === "admin" ? "Р°РґРјРёРЅ" : "СѓС‡Р°СЃС‚РЅРёРє";
  }
  return role;
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

function buildDeleteActionReply(
  language: "en" | "ru",
  summary: DeleteActionSummary
): string {
  const deleted = summary.outcomes.filter((item) => item.status === "deleted");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const lines: string[] = [];

  if (language === "ru") {
    if (deleted.length > 0) {
      lines.push(
        deleted.length === 1
          ? "Готово. Чат удален."
          : `Готово. Удалено чатов: ${deleted.length}.`
      );
      for (const item of deleted) {
        const label = item.resolvedTitle || item.recipientQuery;
        lines.push(`- ${label}`);
      }
    }
    for (const item of ambiguous) {
      const variants = (item.alternatives ?? []).join(", ");
      lines.push(
        variants
          ? `Нужно уточнение для "${item.recipientQuery}". Подходят: ${variants}.`
          : `Нужно уточнение для "${item.recipientQuery}".`
      );
    }
    if (notFound.length > 0) {
      const labels = notFound.map((item) => `"${item.recipientQuery}"`).join(", ");
      lines.push(`Не нашел подходящий чат для: ${labels}.`);
    }
    if (forbidden.length > 0) {
      for (const item of forbidden) {
        const label = item.resolvedTitle || item.recipientQuery;
        lines.push(`Недостаточно прав для удаления: ${label}.`);
      }
    }
    if (lines.length === 0) {
      return "Не удалось удалить чаты.";
    }
    return lines.join("\n");
  }

  if (deleted.length > 0) {
    lines.push(
      deleted.length === 1
        ? "Done. Chat deleted."
        : `Done. Deleted chats: ${deleted.length}.`
    );
    for (const item of deleted) {
      const label = item.resolvedTitle || item.recipientQuery;
      lines.push(`- ${label}`);
    }
  }
  for (const item of ambiguous) {
    const variants = (item.alternatives ?? []).join(", ");
    lines.push(
      variants
        ? `Need clarification for "${item.recipientQuery}". Matches: ${variants}.`
        : `Need clarification for "${item.recipientQuery}".`
    );
  }
  if (notFound.length > 0) {
    const labels = notFound.map((item) => `"${item.recipientQuery}"`).join(", ");
    lines.push(`Couldn't find a matching chat for: ${labels}.`);
  }
  if (forbidden.length > 0) {
    for (const item of forbidden) {
      const label = item.resolvedTitle || item.recipientQuery;
      lines.push(`Insufficient permissions to delete: ${label}.`);
    }
  }
  if (lines.length === 0) {
    return "Couldn't delete chats.";
  }
  return lines.join("\n");
}

function buildDeleteParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду удаления чата.",
      "Формат: `удали чат с [имя]` или `delete chat with [name]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the delete-chat command.",
    "Use: `delete chat with [recipient]`.",
  ].join("\n");
}

function buildCreateGroupActionReply(
  language: "en" | "ru",
  summary: CreateGroupActionSummary
): string {
  const created = summary.outcomes.filter((item) => item.status === "created");
  const duplicates = summary.outcomes.filter((item) => item.status === "duplicate");
  const invalid = summary.outcomes.filter((item) => item.status === "invalid");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const lines: string[] = [];

  if (language === "ru") {
    if (created.length > 0) {
      lines.push(
        created.length === 1
          ? "Готово. Группа создана."
          : `Готово. Создано групп: ${created.length}.`
      );
      for (const item of created) {
        lines.push(`- ${item.resolvedTitle || item.title}`);
      }
    }
    for (const item of duplicates) {
      lines.push(`Такая группа уже существует: ${item.title}.`);
    }
    for (const item of invalid) {
      lines.push(item.details || `Некорректные параметры для группы: ${item.title}.`);
    }
    for (const item of notFound) {
      lines.push(
        item.memberQuery
          ? `Не нашел пользователя "${item.memberQuery}" для группы "${item.title}".`
          : `Не удалось создать группу "${item.title}": не найден пользователь.`
      );
    }
    for (const item of ambiguous) {
      const variants = (item.alternatives ?? []).join(", ");
      lines.push(
        item.memberQuery
          ? variants
            ? `Нужно уточнение по "${item.memberQuery}" для группы "${item.title}". Подходят: ${variants}.`
            : `Нужно уточнение по "${item.memberQuery}" для группы "${item.title}".`
          : `Нужно уточнение для группы "${item.title}".`
      );
    }
    for (const item of forbidden) {
      lines.push(
        item.memberQuery
          ? `Пользователь "${item.memberQuery}" не разрешает добавление в группы.`
          : item.details || `Недостаточно прав для создания группы "${item.title}".`
      );
    }
    if (lines.length === 0) {
      return "Не удалось создать группу.";
    }
    return lines.join("\n");
  }

  if (created.length > 0) {
    lines.push(
      created.length === 1
        ? "Done. Group created."
        : `Done. Groups created: ${created.length}.`
    );
    for (const item of created) {
      lines.push(`- ${item.resolvedTitle || item.title}`);
    }
  }
  for (const item of duplicates) {
    lines.push(`This group already exists: ${item.title}.`);
  }
  for (const item of invalid) {
    lines.push(item.details || `Invalid group parameters: ${item.title}.`);
  }
  for (const item of notFound) {
    lines.push(
      item.memberQuery
        ? `Couldn't find user "${item.memberQuery}" for group "${item.title}".`
        : `Couldn't create group "${item.title}": user not found.`
    );
  }
  for (const item of ambiguous) {
    const variants = (item.alternatives ?? []).join(", ");
    lines.push(
      item.memberQuery
        ? variants
          ? `Need clarification for "${item.memberQuery}" in group "${item.title}". Matches: ${variants}.`
          : `Need clarification for "${item.memberQuery}" in group "${item.title}".`
        : `Need clarification for group "${item.title}".`
    );
  }
  for (const item of forbidden) {
    lines.push(
      item.memberQuery
        ? `User "${item.memberQuery}" doesn't allow being added to groups.`
        : item.details || `Insufficient permissions for group "${item.title}".`
    );
  }
  if (lines.length === 0) {
    return "Couldn't create the group.";
  }
  return lines.join("\n");
}

function buildCreateGroupParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду создания группы.",
      "Формат: `создай группу [название] с [участник1], [участник2]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the create-group command.",
    "Use: `create group [title] with [member1], [member2]`.",
  ].join("\n");
}

function buildInviteToGroupActionReply(
  language: "en" | "ru",
  summary: InviteToGroupActionSummary
): string {
  const invited = summary.outcomes.filter((item) => item.status === "invited");
  const noChanges = summary.outcomes.filter((item) => item.status === "no_changes");
  const invalid = summary.outcomes.filter((item) => item.status === "invalid");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const lines: string[] = [];

  if (language === "ru") {
    if (summary.invitedMembers > 0) {
      lines.push(
        summary.invitedMembers === 1
          ? "Готово. Пригласил 1 участника."
          : `Готово. Пригласил участников: ${summary.invitedMembers}.`
      );
      for (const item of invited) {
        const label = item.resolvedGroupTitle || item.groupQuery;
        lines.push(`- ${label}: +${item.invitedCount ?? 0}`);
      }
    }

    for (const item of noChanges) {
      const label = item.resolvedGroupTitle || item.groupQuery;
      lines.push(`В группе "${label}" изменений нет.`);
      if (item.alreadyInGroup && item.alreadyInGroup.length > 0) {
        lines.push(`  Уже в группе: ${item.alreadyInGroup.join(", ")}.`);
      }
      if (item.notFoundMembers && item.notFoundMembers.length > 0) {
        lines.push(`  Не нашел: ${item.notFoundMembers.join(", ")}.`);
      }
      if (item.forbiddenMembers && item.forbiddenMembers.length > 0) {
        lines.push(`  Нельзя добавить: ${item.forbiddenMembers.join(", ")}.`);
      }
      if (item.ambiguousMembers && item.ambiguousMembers.length > 0) {
        for (const member of item.ambiguousMembers) {
          const variants = member.alternatives.join(", ");
          lines.push(
            variants
              ? `  Нужна конкретизация "${member.query}": ${variants}.`
              : `  Нужна конкретизация "${member.query}".`
          );
        }
      }
      if (item.details) {
        lines.push(`  ${item.details}`);
      }
    }

    for (const item of invalid) {
      lines.push(item.details || "Некорректная команда приглашения.");
    }
    for (const item of notFound) {
      lines.push(`Не нашел группу: "${item.groupQuery}".`);
    }
    for (const item of ambiguous) {
      const variants = (item.alternatives ?? []).join(", ");
      lines.push(
        variants
          ? `Нужно уточнение для группы "${item.groupQuery}". Подходят: ${variants}.`
          : `Нужно уточнение для группы "${item.groupQuery}".`
      );
    }
    for (const item of forbidden) {
      const label = item.resolvedGroupTitle || item.groupQuery;
      lines.push(`Недостаточно прав для приглашения в "${label}".`);
    }

    if (lines.length === 0) {
      return "Не удалось пригласить участников в группу.";
    }
    return lines.join("\n");
  }

  if (summary.invitedMembers > 0) {
    lines.push(
      summary.invitedMembers === 1
        ? "Done. Invited 1 member."
        : `Done. Invited members: ${summary.invitedMembers}.`
    );
    for (const item of invited) {
      const label = item.resolvedGroupTitle || item.groupQuery;
      lines.push(`- ${label}: +${item.invitedCount ?? 0}`);
    }
  }

  for (const item of noChanges) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`No changes in "${label}".`);
    if (item.alreadyInGroup && item.alreadyInGroup.length > 0) {
      lines.push(`  Already in group: ${item.alreadyInGroup.join(", ")}.`);
    }
    if (item.notFoundMembers && item.notFoundMembers.length > 0) {
      lines.push(`  Not found: ${item.notFoundMembers.join(", ")}.`);
    }
    if (item.forbiddenMembers && item.forbiddenMembers.length > 0) {
      lines.push(`  Cannot add: ${item.forbiddenMembers.join(", ")}.`);
    }
    if (item.ambiguousMembers && item.ambiguousMembers.length > 0) {
      for (const member of item.ambiguousMembers) {
        const variants = member.alternatives.join(", ");
        lines.push(
          variants
            ? `  Need clarification for "${member.query}": ${variants}.`
            : `  Need clarification for "${member.query}".`
        );
      }
    }
    if (item.details) {
      lines.push(`  ${item.details}`);
    }
  }

  for (const item of invalid) {
    lines.push(item.details || "Invalid invite command.");
  }
  for (const item of notFound) {
    lines.push(`Couldn't find group: "${item.groupQuery}".`);
  }
  for (const item of ambiguous) {
    const variants = (item.alternatives ?? []).join(", ");
    lines.push(
      variants
        ? `Need clarification for group "${item.groupQuery}". Matches: ${variants}.`
        : `Need clarification for group "${item.groupQuery}".`
    );
  }
  for (const item of forbidden) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`Insufficient permissions to invite in "${label}".`);
  }

  if (lines.length === 0) {
    return "Couldn't invite members to the group.";
  }
  return lines.join("\n");
}

function buildInviteToGroupParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду приглашения в группу.",
      "Формат: `пригласи [участник] в группу [название]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the invite-to-group command.",
    "Use: `invite [member] to group [title]`.",
  ].join("\n");
}

function buildRemoveFromGroupActionReply(
  language: "en" | "ru",
  summary: RemoveFromGroupActionSummary
): string {
  const removed = summary.outcomes.filter((item) => item.status === "removed");
  const noChanges = summary.outcomes.filter((item) => item.status === "no_changes");
  const invalid = summary.outcomes.filter((item) => item.status === "invalid");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const lines: string[] = [];

  if (summary.removedMembers > 0) {
    lines.push(
      summary.removedMembers === 1
        ? "Done. Removed 1 member."
        : `Done. Removed members: ${summary.removedMembers}.`
    );
    for (const item of removed) {
      const label = item.resolvedGroupTitle || item.groupQuery;
      lines.push(`- ${label}: -${item.removedCount ?? 0}`);
    }
  }

  for (const item of noChanges) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`No removable members in "${label}".`);
    if (item.notFoundMembers && item.notFoundMembers.length > 0) {
      lines.push(`  Not found in group: ${item.notFoundMembers.join(", ")}.`);
    }
    if (item.forbiddenMembers && item.forbiddenMembers.length > 0) {
      lines.push(`  Can't remove: ${item.forbiddenMembers.join(", ")}.`);
    }
    if (item.ambiguousMembers && item.ambiguousMembers.length > 0) {
      for (const member of item.ambiguousMembers) {
        const variants = member.alternatives.join(", ");
        lines.push(
          variants
            ? `  Need clarification for "${member.query}": ${variants}.`
            : `  Need clarification for "${member.query}".`
        );
      }
    }
    if (item.details) {
      lines.push(`  ${item.details}`);
    }
  }

  for (const item of invalid) {
    lines.push(item.details || "Invalid remove-from-group command.");
  }
  for (const item of notFound) {
    lines.push(`Couldn't find group: "${item.groupQuery}".`);
  }
  for (const item of ambiguous) {
    lines.push(`Need clarification for group "${item.groupQuery}".`);
  }
  for (const item of forbidden) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`Insufficient permissions to remove members in "${label}".`);
  }

  if (lines.length === 0) {
    return "Couldn't remove members from the group.";
  }
  return lines.join("\n");
}

function buildRemoveFromGroupParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду удаления участника из группы.",
      "Формат: `remove [member] from group [title]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the remove-from-group command.",
    "Use: `remove [member] from group [title]`.",
  ].join("\n");
}

function buildUpdateGroupDataActionReply(
  _language: "en" | "ru",
  summary: UpdateGroupDataActionSummary
): string {
  const updated = summary.outcomes.filter((item) => item.status === "updated");
  const invalid = summary.outcomes.filter((item) => item.status === "invalid");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const duplicates = summary.outcomes.filter((item) => item.status === "duplicate");
  const lines: string[] = [];

  if (summary.updatedGroups > 0) {
    lines.push(
      summary.updatedGroups === 1
        ? "Done. Group updated."
        : `Done. Groups updated: ${summary.updatedGroups}.`
    );
    for (const item of updated) {
      lines.push(`- ${item.resolvedGroupTitle || item.groupQuery}`);
    }
  }
  for (const item of invalid) {
    lines.push(item.details || `Invalid group update command for "${item.groupQuery}".`);
  }
  for (const item of notFound) {
    lines.push(`Couldn't find group: "${item.groupQuery}".`);
  }
  for (const item of ambiguous) {
    lines.push(`Need clarification for group "${item.groupQuery}".`);
  }
  for (const item of forbidden) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`Insufficient permissions to update "${label}".`);
  }
  for (const item of duplicates) {
    lines.push(
      item.details ||
        `A group with the same title and members already exists: "${item.groupQuery}".`
    );
  }

  if (lines.length === 0) {
    return "Couldn't update group data.";
  }
  return lines.join("\n");
}

function buildUpdateGroupDataParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду изменения данных группы.",
      "Формат: `rename group [old title] to [new title]` или `set description for group [title] to [text]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the group-data update command.",
    "Use: `rename group [old title] to [new title]` or `set description for group [title] to [text]`.",
  ].join("\n");
}

function buildSetGroupMemberAccessActionReply(
  language: "en" | "ru",
  summary: SetGroupMemberAccessActionSummary
): string {
  const updated = summary.outcomes.filter((item) => item.status === "updated");
  const noChanges = summary.outcomes.filter((item) => item.status === "no_changes");
  const invalid = summary.outcomes.filter((item) => item.status === "invalid");
  const notFound = summary.outcomes.filter((item) => item.status === "not_found");
  const ambiguous = summary.outcomes.filter((item) => item.status === "ambiguous");
  const forbidden = summary.outcomes.filter((item) => item.status === "forbidden");
  const lines: string[] = [];

  if (summary.updatedMemberRoles > 0) {
    lines.push(
      summary.updatedMemberRoles === 1
        ? "Done. Updated 1 member role."
        : `Done. Updated member roles: ${summary.updatedMemberRoles}.`
    );
    for (const item of updated) {
      const label = item.resolvedGroupTitle || item.groupQuery;
      lines.push(
        `- ${label}: ${formatGroupRoleLabel(item.role, language)} x${item.changedCount ?? 0}`
      );
    }
  }

  for (const item of noChanges) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(
      `No role changes in "${label}" for target role "${formatGroupRoleLabel(item.role, language)}".`
    );
    if (item.alreadyWithRole && item.alreadyWithRole.length > 0) {
      lines.push(`  Already with role: ${item.alreadyWithRole.join(", ")}.`);
    }
    if (item.notFoundMembers && item.notFoundMembers.length > 0) {
      lines.push(`  Not found in group: ${item.notFoundMembers.join(", ")}.`);
    }
    if (item.forbiddenMembers && item.forbiddenMembers.length > 0) {
      lines.push(`  Can't change role: ${item.forbiddenMembers.join(", ")}.`);
    }
    if (item.ambiguousMembers && item.ambiguousMembers.length > 0) {
      for (const member of item.ambiguousMembers) {
        const variants = member.alternatives.join(", ");
        lines.push(
          variants
            ? `  Need clarification for "${member.query}": ${variants}.`
            : `  Need clarification for "${member.query}".`
        );
      }
    }
    if (item.details) {
      lines.push(`  ${item.details}`);
    }
  }

  for (const item of invalid) {
    lines.push(item.details || "Invalid role update command.");
  }
  for (const item of notFound) {
    lines.push(`Couldn't find group: "${item.groupQuery}".`);
  }
  for (const item of ambiguous) {
    lines.push(`Need clarification for group "${item.groupQuery}".`);
  }
  for (const item of forbidden) {
    const label = item.resolvedGroupTitle || item.groupQuery;
    lines.push(`Insufficient permissions to update roles in "${label}".`);
  }

  if (lines.length === 0) {
    return "Couldn't update member roles in the group.";
  }
  return lines.join("\n");
}

function buildSetGroupMemberAccessParseErrorReply(language: "en" | "ru"): string {
  if (language === "ru") {
    return [
      "Не смог разобрать команду изменения роли участника.",
      "Формат: `set [member] as admin in group [title]` или `set [member] as member in group [title]`.",
    ].join("\n");
  }
  return [
    "Couldn't parse the member-access command.",
    "Use: `set [member] as admin in group [title]` or `set [member] as member in group [title]`.",
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

async function executeDeleteIntents(
  userId: string,
  language: "en" | "ru",
  intents: DeleteIntent[]
): Promise<DeleteActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      recipientQuery:
        intent.recipientQuery === DELETE_ALL_RECIPIENT_QUERY
          ? DELETE_ALL_RECIPIENT_QUERY
          : cleanDeleteRecipientQuery(intent.recipientQuery),
    }))
    .filter(
      (intent) =>
        intent.recipientQuery === DELETE_ALL_RECIPIENT_QUERY ||
        intent.recipientQuery.length > 0
    )
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<DeleteActionSummary>((store) => {
    const actor = store.users.find((user) => user.id === userId);
    if (!actor) {
      throw new Error("User not found.");
    }

    const candidates = buildRecipientCandidates(store, userId);
    const outcomes: DeleteActionOutcome[] = [];
    const deletedThreadIds = new Set<string>();
    let deletedChats = 0;

    for (const intent of preparedIntents) {
      const recipientQuery = intent.recipientQuery;

      if (isDeleteAllRecipientQuery(recipientQuery)) {
        const allUserThreads = store.threads.filter((thread) =>
          thread.memberIds.includes(userId)
        );
        const deletableThreads = allUserThreads.filter(
          (thread) => thread.threadType !== "group" || isGroupOwner(thread, userId)
        );
        const forbiddenThreads = allUserThreads.filter(
          (thread) => thread.threadType === "group" && !isGroupOwner(thread, userId)
        );
        const deletableThreadIds = new Set(deletableThreads.map((thread) => thread.id));

        if (deletableThreadIds.size > 0) {
          for (const threadId of deletableThreadIds) {
            deletedThreadIds.add(threadId);
          }
          store.threads = store.threads.filter(
            (candidate) => !deletableThreadIds.has(candidate.id)
          );
          store.messages = store.messages.filter(
            (message) => !deletableThreadIds.has(message.chatId)
          );
          deletedChats += deletableThreadIds.size;
        }

        const hadFavorites = store.messages.some(
          (message) => message.chatId === FAVORITES_CHAT_ID && message.authorId === userId
        );
        if (hadFavorites) {
          store.messages = store.messages.filter(
            (message) =>
              !(message.chatId === FAVORITES_CHAT_ID && message.authorId === userId)
          );
          deletedChats += 1;
        }

        const totalDeleted = deletableThreadIds.size + (hadFavorites ? 1 : 0);
        outcomes.push({
          recipientQuery:
            recipientQuery === DELETE_ALL_RECIPIENT_QUERY
              ? language === "ru"
                ? "все чаты"
                : "all chats"
              : recipientQuery,
          status: totalDeleted > 0 ? "deleted" : "not_found",
          resolvedTitle:
            language === "ru"
              ? `Все чаты (${totalDeleted})`
              : `All chats (${totalDeleted})`,
        });

        if (forbiddenThreads.length > 0) {
          outcomes.push({
            recipientQuery:
              language === "ru" ? "чаты без прав владельца" : "group chats without owner rights",
            status: "forbidden",
            resolvedTitle:
              language === "ru"
                ? `Группы без прав владельца: ${forbiddenThreads.length}`
                : `Groups without owner rights: ${forbiddenThreads.length}`,
          });
        }
        continue;
      }

      if (isFavoritesRecipientQuery(recipientQuery)) {
        const nextMessages = store.messages.filter(
          (message) => !(message.chatId === FAVORITES_CHAT_ID && message.authorId === userId)
        );
        const removed = nextMessages.length !== store.messages.length;
        store.messages = nextMessages;
        if (removed) {
          deletedChats += 1;
        }
        outcomes.push({
          recipientQuery,
          status: removed ? "deleted" : "not_found",
          resolvedTitle: language === "ru" ? "Избранное" : "Favorites",
        });
        continue;
      }

      const threadResolution = resolveThreadForDelete(
        store,
        candidates,
        userId,
        recipientQuery
      );

      if (threadResolution.status === "not_found") {
        outcomes.push({
          recipientQuery,
          status: "not_found",
        });
        continue;
      }
      if (threadResolution.status === "ambiguous") {
        outcomes.push({
          recipientQuery,
          status: "ambiguous",
          alternatives: threadResolution.alternatives,
        });
        continue;
      }

      const thread = threadResolution.thread;
      if (thread.threadType === "group" && !isGroupOwner(thread, userId)) {
        outcomes.push({
          recipientQuery,
          status: "forbidden",
          resolvedTitle: threadResolution.label,
        });
        continue;
      }

      if (!deletedThreadIds.has(thread.id)) {
        deletedThreadIds.add(thread.id);
        store.threads = store.threads.filter((candidate) => candidate.id !== thread.id);
        store.messages = store.messages.filter((message) => message.chatId !== thread.id);
        deletedChats += 1;
      }

      outcomes.push({
        recipientQuery,
        status: "deleted",
        resolvedTitle: threadResolution.label,
      });
    }

    return {
      outcomes,
      deletedChats,
    };
  });
}

function dedupeNormalizedValues(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = normalizeForMatching(value);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result;
}

async function executeCreateGroupIntents(
  userId: string,
  language: "en" | "ru",
  intents: CreateGroupIntent[]
): Promise<CreateGroupActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      title: normalizeGroupTitle(intent.title),
      memberQueries: dedupeNormalizedValues(
        intent.memberQueries.map((query) => cleanRecipientQuery(query)).filter((query) => query.length > 0)
      ).slice(0, GROUP_MAX_MEMBERS - 1),
    }))
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<CreateGroupActionSummary>((store) => {
    const actorExists = store.users.some((user) => user.id === userId);
    if (!actorExists) {
      throw new Error("User not found.");
    }

    const recipientCandidates = buildAllRecipientCandidates(store, userId);
    const outcomes: CreateGroupActionOutcome[] = [];
    let createdGroups = 0;

    for (const intent of preparedIntents) {
      const title = intent.title;
      const memberQueries = intent.memberQueries;
      const safeTitle = title || (language === "ru" ? "Новая группа" : "New group");

      if (title.length < GROUP_TITLE_MIN_LENGTH) {
        outcomes.push({
          title: safeTitle,
          status: "invalid",
          details:
            language === "ru"
              ? `Название группы должно быть минимум ${GROUP_TITLE_MIN_LENGTH} символа.`
              : `Group title must be at least ${GROUP_TITLE_MIN_LENGTH} characters.`,
        });
        continue;
      }
      if (title.length > GROUP_TITLE_MAX_LENGTH) {
        outcomes.push({
          title: safeTitle,
          status: "invalid",
          details:
            language === "ru"
              ? `Название группы должно быть максимум ${GROUP_TITLE_MAX_LENGTH} символа.`
              : `Group title must be at most ${GROUP_TITLE_MAX_LENGTH} characters.`,
        });
        continue;
      }
      if (memberQueries.length < GROUP_MIN_OTHER_MEMBERS) {
        outcomes.push({
          title: safeTitle,
          status: "invalid",
          details:
            language === "ru"
              ? `Нужно как минимум ${GROUP_MIN_OTHER_MEMBERS} участника помимо вас.`
              : `At least ${GROUP_MIN_OTHER_MEMBERS} other members are required.`,
        });
        continue;
      }

      const resolvedMemberIds: string[] = [];
      const resolvedMemberIdSet = new Set<string>();
      let hasBlockingIssue = false;

      for (const memberQuery of memberQueries) {
        const resolution = resolveRecipient(recipientCandidates, memberQuery);
        if (resolution.status === "not_found") {
          outcomes.push({
            title: safeTitle,
            status: "not_found",
            memberQuery,
          });
          hasBlockingIssue = true;
          break;
        }
        if (resolution.status === "ambiguous") {
          outcomes.push({
            title: safeTitle,
            status: "ambiguous",
            memberQuery,
            alternatives: resolution.alternatives.map(formatCandidateLabel).slice(0, 3),
          });
          hasBlockingIssue = true;
          break;
        }

        const memberId = resolution.candidate.userId;
        if (memberId === userId || resolvedMemberIdSet.has(memberId)) {
          continue;
        }
        const member = store.users.find((user) => user.id === memberId);
        if (!member) {
          outcomes.push({
            title: safeTitle,
            status: "not_found",
            memberQuery,
          });
          hasBlockingIssue = true;
          break;
        }
        if (!canUserBeAddedToGroupBy(member, userId)) {
          outcomes.push({
            title: safeTitle,
            status: "forbidden",
            memberQuery,
          });
          hasBlockingIssue = true;
          break;
        }

        resolvedMemberIdSet.add(memberId);
        resolvedMemberIds.push(memberId);
      }

      if (hasBlockingIssue) {
        continue;
      }

      if (resolvedMemberIds.length < GROUP_MIN_OTHER_MEMBERS) {
        outcomes.push({
          title: safeTitle,
          status: "invalid",
          details:
            language === "ru"
              ? `После проверки осталось меньше ${GROUP_MIN_OTHER_MEMBERS} участников.`
              : `Less than ${GROUP_MIN_OTHER_MEMBERS} members remain after validation.`,
        });
        continue;
      }
      if (resolvedMemberIds.length + 1 > GROUP_MAX_MEMBERS) {
        outcomes.push({
          title: safeTitle,
          status: "invalid",
          details:
            language === "ru"
              ? `В группе может быть максимум ${GROUP_MAX_MEMBERS} участников.`
              : `Group cannot have more than ${GROUP_MAX_MEMBERS} members.`,
        });
        continue;
      }

      const memberSet = new Set([userId, ...resolvedMemberIds]);
      const normalizedTitle = title.toLowerCase();
      const memberIdsSorted = [...memberSet].sort();
      const duplicateThread = store.threads.find((thread) => {
        if (thread.threadType !== "group") {
          return false;
        }
        const threadNormalizedTitle = thread.title
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();
        if (threadNormalizedTitle !== normalizedTitle) {
          return false;
        }
        if (thread.memberIds.length !== memberIdsSorted.length) {
          return false;
        }
        const threadMembersSorted = [...thread.memberIds].sort();
        return threadMembersSorted.every(
          (memberId, index) => memberId === memberIdsSorted[index]
        );
      });
      if (duplicateThread) {
        outcomes.push({
          title: safeTitle,
          status: "duplicate",
          resolvedTitle: duplicateThread.title,
          chatId: duplicateThread.id,
        });
        continue;
      }

      const now = Date.now() + createdGroups;
      const readBy = [...memberSet].reduce<Record<string, number>>((acc, memberId) => {
        acc[memberId] = memberId === userId ? now : 0;
        return acc;
      }, {});
      const groupRoles = [...memberSet].reduce<StoredChatThread["groupRoles"]>(
        (acc, memberId) => {
          acc[memberId] = memberId === userId ? "owner" : "member";
          return acc;
        },
        {}
      );

      const nextThread: StoredChatThread = {
        id: createEntityId("chat"),
        memberIds: [...memberSet],
        threadType: "group",
        title,
        description: "",
        avatarUrl: "",
        bannerUrl: "",
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        readBy,
        pinnedBy: {},
        mutedBy: {},
        typingBy: {},
        groupRoles,
      };
      store.threads.push(nextThread);
      createdGroups += 1;
      outcomes.push({
        title: safeTitle,
        status: "created",
        resolvedTitle: nextThread.title,
        chatId: nextThread.id,
      });
    }

    return {
      outcomes,
      createdGroups,
    };
  });
}

async function executeInviteToGroupIntents(
  userId: string,
  language: "en" | "ru",
  intents: InviteToGroupIntent[]
): Promise<InviteToGroupActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      groupQuery: isLatestGroupQuery(intent.groupQuery)
        ? LATEST_GROUP_QUERY
        : cleanGroupQuery(intent.groupQuery),
      memberQueries: dedupeNormalizedValues(
        intent.memberQueries.map((query) => cleanRecipientQuery(query)).filter((query) => query.length > 0)
      ).slice(0, GROUP_MAX_MEMBERS - 1),
    }))
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<InviteToGroupActionSummary>((store) => {
    const actorExists = store.users.some((user) => user.id === userId);
    if (!actorExists) {
      throw new Error("User not found.");
    }

    const recipientCandidates = buildAllRecipientCandidates(store, userId);
    const outcomes: InviteToGroupActionOutcome[] = [];
    let invitedMembers = 0;

    for (const intent of preparedIntents) {
      const groupQuery =
        intent.groupQuery || (language === "ru" ? "последняя группа" : "latest group");
      const memberQueries = intent.memberQueries;

      if (memberQueries.length === 0) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? "Укажите хотя бы одного участника для приглашения."
              : "Specify at least one member to invite.",
        });
        continue;
      }

      const groupResolution = resolveGroupForInvite(store, userId, groupQuery);
      if (groupResolution.status === "not_found") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (groupResolution.status === "ambiguous") {
        outcomes.push({
          groupQuery,
          status: "ambiguous",
          alternatives: groupResolution.alternatives,
        });
        continue;
      }

      const thread = groupResolution.thread;
      if (thread.threadType !== "group") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (!canModerateGroup(thread, userId)) {
        outcomes.push({
          groupQuery,
          status: "forbidden",
          resolvedGroupTitle: groupResolution.label,
        });
        continue;
      }

      const memberIdsInGroup = new Set(thread.memberIds);
      const memberIdsToAdd: string[] = [];
      const alreadyInGroup: string[] = [];
      const notFoundMembers: string[] = [];
      const forbiddenMembers: string[] = [];
      const ambiguousMembers: Array<{ query: string; alternatives: string[] }> = [];
      let limitReachedDetails = "";

      for (const memberQuery of memberQueries) {
        const resolution = resolveRecipient(recipientCandidates, memberQuery);
        if (resolution.status === "not_found") {
          notFoundMembers.push(memberQuery);
          continue;
        }
        if (resolution.status === "ambiguous") {
          ambiguousMembers.push({
            query: memberQuery,
            alternatives: resolution.alternatives.map(formatCandidateLabel).slice(0, 3),
          });
          continue;
        }

        const memberId = resolution.candidate.userId;
        const memberLabel = formatCandidateLabel(resolution.candidate);
        if (memberId === userId || memberIdsInGroup.has(memberId)) {
          alreadyInGroup.push(memberLabel);
          continue;
        }
        if (thread.memberIds.length + memberIdsToAdd.length >= GROUP_MAX_MEMBERS) {
          limitReachedDetails =
            language === "ru"
              ? `В группе может быть максимум ${GROUP_MAX_MEMBERS} участников.`
              : `Group cannot have more than ${GROUP_MAX_MEMBERS} members.`;
          memberIdsToAdd.length = 0;
          break;
        }

        const member = store.users.find((user) => user.id === memberId);
        if (!member) {
          notFoundMembers.push(memberQuery);
          continue;
        }
        if (!canUserBeAddedToGroupBy(member, userId)) {
          forbiddenMembers.push(memberLabel);
          continue;
        }
        if (memberIdsToAdd.includes(memberId)) {
          continue;
        }

        memberIdsToAdd.push(memberId);
        memberIdsInGroup.add(memberId);
      }

      if (limitReachedDetails) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          resolvedGroupTitle: groupResolution.label,
          details: limitReachedDetails,
        });
        continue;
      }

      if (memberIdsToAdd.length > 0) {
        for (const memberId of memberIdsToAdd) {
          thread.memberIds = [...thread.memberIds, memberId];
          thread.readBy = {
            ...thread.readBy,
            [memberId]: 0,
          };
          thread.groupRoles = {
            ...thread.groupRoles,
            [memberId]: "member",
          };
        }
        thread.updatedAt = Date.now() + invitedMembers;
        invitedMembers += memberIdsToAdd.length;

        outcomes.push({
          groupQuery,
          status: "invited",
          resolvedGroupTitle: groupResolution.label,
          invitedCount: memberIdsToAdd.length,
          alreadyInGroup: dedupeNormalizedValues(alreadyInGroup),
          notFoundMembers: dedupeNormalizedValues(notFoundMembers),
          forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
          ambiguousMembers,
        });
        continue;
      }

      outcomes.push({
        groupQuery,
        status: "no_changes",
        resolvedGroupTitle: groupResolution.label,
        invitedCount: 0,
        alreadyInGroup: dedupeNormalizedValues(alreadyInGroup),
        notFoundMembers: dedupeNormalizedValues(notFoundMembers),
        forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
        ambiguousMembers,
      });
    }

    return {
      outcomes,
      invitedMembers,
    };
  });
}

async function executeRemoveFromGroupIntents(
  userId: string,
  language: "en" | "ru",
  intents: RemoveFromGroupIntent[]
): Promise<RemoveFromGroupActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      groupQuery: isLatestGroupQuery(intent.groupQuery)
        ? LATEST_GROUP_QUERY
        : cleanGroupQuery(intent.groupQuery),
      memberQueries: dedupeNormalizedValues(
        intent.memberQueries.map((query) => cleanRecipientQuery(query)).filter((query) => query.length > 0)
      ).slice(0, GROUP_MAX_MEMBERS - 1),
    }))
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<RemoveFromGroupActionSummary>((store) => {
    const actorExists = store.users.some((user) => user.id === userId);
    if (!actorExists) {
      throw new Error("User not found.");
    }

    const recipientCandidates = buildAllRecipientCandidates(store, userId);
    const outcomes: RemoveFromGroupActionOutcome[] = [];
    let removedMembers = 0;

    for (const intent of preparedIntents) {
      const groupQuery =
        intent.groupQuery || (language === "ru" ? "РїРѕСЃР»РµРґРЅСЏСЏ РіСЂСѓРїРїР°" : "latest group");
      const memberQueries = intent.memberQueries;

      if (memberQueries.length === 0) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? "Укажите хотя бы одного участника для удаления."
              : "Specify at least one member to remove.",
        });
        continue;
      }

      const groupResolution = resolveGroupForInvite(
        store,
        userId,
        groupQuery || LATEST_GROUP_QUERY
      );
      if (groupResolution.status === "not_found") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (groupResolution.status === "ambiguous") {
        outcomes.push({
          groupQuery,
          status: "ambiguous",
          ambiguousMembers: [
            {
              query: groupQuery,
              alternatives: groupResolution.alternatives,
            },
          ],
        });
        continue;
      }

      const thread = groupResolution.thread;
      if (thread.threadType !== "group") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (!canModerateGroup(thread, userId)) {
        outcomes.push({
          groupQuery,
          status: "forbidden",
          resolvedGroupTitle: groupResolution.label,
        });
        continue;
      }

      const notFoundMembers: string[] = [];
      const forbiddenMembers: string[] = [];
      const ambiguousMembers: Array<{ query: string; alternatives: string[] }> = [];
      let removedCount = 0;

      for (const memberQuery of memberQueries) {
        const resolution = resolveMemberInGroup(
          recipientCandidates,
          thread,
          userId,
          memberQuery
        );
        if (resolution.status === "not_found") {
          notFoundMembers.push(memberQuery);
          continue;
        }
        if (resolution.status === "ambiguous") {
          ambiguousMembers.push({
            query: memberQuery,
            alternatives: resolution.alternatives.map(formatCandidateLabel).slice(0, 3),
          });
          continue;
        }

        const memberId = resolution.candidate.userId;
        const memberLabel = formatCandidateLabel(resolution.candidate);
        if (!thread.memberIds.includes(memberId) || memberId === userId) {
          forbiddenMembers.push(memberLabel);
          continue;
        }
        if (!canRemoveGroupMember(thread, userId, memberId)) {
          forbiddenMembers.push(memberLabel);
          continue;
        }

        removeMemberFromGroupThread(thread, memberId);
        removedCount += 1;
        removedMembers += 1;
      }

      if (removedCount > 0) {
        thread.updatedAt = Date.now() + removedMembers;
        outcomes.push({
          groupQuery,
          status: "removed",
          resolvedGroupTitle: groupResolution.label,
          removedCount,
          notFoundMembers: dedupeNormalizedValues(notFoundMembers),
          forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
          ambiguousMembers,
        });
        continue;
      }

      outcomes.push({
        groupQuery,
        status: "no_changes",
        resolvedGroupTitle: groupResolution.label,
        removedCount: 0,
        notFoundMembers: dedupeNormalizedValues(notFoundMembers),
        forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
        ambiguousMembers,
      });
    }

    return {
      outcomes,
      removedMembers,
    };
  });
}

async function executeUpdateGroupDataIntents(
  userId: string,
  language: "en" | "ru",
  intents: UpdateGroupDataIntent[]
): Promise<UpdateGroupDataActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      groupQuery: isLatestGroupQuery(intent.groupQuery)
        ? LATEST_GROUP_QUERY
        : cleanGroupQuery(intent.groupQuery),
      title: typeof intent.title === "string" ? normalizeGroupTitle(intent.title) : undefined,
      description:
        typeof intent.description === "string"
          ? cleanQuotedCommandValue(intent.description)
          : undefined,
    }))
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<UpdateGroupDataActionSummary>((store) => {
    const actorExists = store.users.some((user) => user.id === userId);
    if (!actorExists) {
      throw new Error("User not found.");
    }

    const outcomes: UpdateGroupDataActionOutcome[] = [];
    let updatedGroups = 0;

    for (const intent of preparedIntents) {
      const groupQuery =
        intent.groupQuery || (language === "ru" ? "РїРѕСЃР»РµРґРЅСЏСЏ РіСЂСѓРїРїР°" : "latest group");
      const title = intent.title;
      const description = intent.description;

      if (!title && description === undefined) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? "Укажите новое название или описание группы."
              : "Specify a new group title or description.",
        });
        continue;
      }
      if (title && title.length < GROUP_TITLE_MIN_LENGTH) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? `Название группы должно быть минимум ${GROUP_TITLE_MIN_LENGTH} символа.`
              : `Group title must be at least ${GROUP_TITLE_MIN_LENGTH} characters.`,
        });
        continue;
      }
      if (title && title.length > GROUP_TITLE_MAX_LENGTH) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? `Название группы должно быть максимум ${GROUP_TITLE_MAX_LENGTH} символов.`
              : `Group title must be at most ${GROUP_TITLE_MAX_LENGTH} characters.`,
        });
        continue;
      }
      if (description !== undefined && description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
        outcomes.push({
          groupQuery,
          status: "invalid",
          details:
            language === "ru"
              ? `Описание группы должно быть максимум ${GROUP_DESCRIPTION_MAX_LENGTH} символов.`
              : `Group description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters.`,
        });
        continue;
      }

      const groupResolution = resolveGroupForInvite(
        store,
        userId,
        groupQuery || LATEST_GROUP_QUERY
      );
      if (groupResolution.status === "not_found") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (groupResolution.status === "ambiguous") {
        outcomes.push({
          groupQuery,
          status: "ambiguous",
        });
        continue;
      }

      const thread = groupResolution.thread;
      if (thread.threadType !== "group") {
        outcomes.push({
          groupQuery,
          status: "not_found",
        });
        continue;
      }
      if (!canModerateGroup(thread, userId)) {
        outcomes.push({
          groupQuery,
          status: "forbidden",
          resolvedGroupTitle: groupResolution.label,
        });
        continue;
      }

      if (title) {
        const normalizedTitle = title.toLowerCase();
        const memberIdsSorted = [...thread.memberIds].sort();
        const duplicateThread = store.threads.find((candidate) => {
          if (candidate.id === thread.id || candidate.threadType !== "group") {
            return false;
          }
          const candidateTitle = candidate.title.trim().replace(/\s+/g, " ").toLowerCase();
          if (candidateTitle !== normalizedTitle) {
            return false;
          }
          if (candidate.memberIds.length !== memberIdsSorted.length) {
            return false;
          }
          const candidateMembersSorted = [...candidate.memberIds].sort();
          return candidateMembersSorted.every(
            (memberId, index) => memberId === memberIdsSorted[index]
          );
        });
        if (duplicateThread) {
          outcomes.push({
            groupQuery,
            status: "duplicate",
            details: "A group with the same title and members already exists.",
          });
          continue;
        }
      }

      if (title) {
        thread.title = title;
      }
      if (description !== undefined) {
        thread.description = description;
      }
      thread.updatedAt = Date.now() + updatedGroups;
      updatedGroups += 1;

      outcomes.push({
        groupQuery,
        status: "updated",
        resolvedGroupTitle: thread.title,
      });
    }

    return {
      outcomes,
      updatedGroups,
    };
  });
}

async function executeSetGroupMemberAccessIntents(
  userId: string,
  language: "en" | "ru",
  intents: SetGroupMemberAccessIntent[]
): Promise<SetGroupMemberAccessActionSummary> {
  const preparedIntents = intents
    .map((intent) => ({
      groupQuery: isLatestGroupQuery(intent.groupQuery)
        ? LATEST_GROUP_QUERY
        : cleanGroupQuery(intent.groupQuery),
      role: intent.role,
      memberQueries: dedupeNormalizedValues(
        intent.memberQueries.map((query) => cleanRecipientQuery(query)).filter((query) => query.length > 0)
      ).slice(0, GROUP_MAX_MEMBERS - 1),
    }))
    .slice(0, MAX_AUTOMATION_TARGETS);

  return updateStore<SetGroupMemberAccessActionSummary>((store) => {
    const actorExists = store.users.some((user) => user.id === userId);
    if (!actorExists) {
      throw new Error("User not found.");
    }

    const recipientCandidates = buildAllRecipientCandidates(store, userId);
    const outcomes: SetGroupMemberAccessActionOutcome[] = [];
    let updatedMemberRoles = 0;

    for (const intent of preparedIntents) {
      const groupQuery =
        intent.groupQuery || (language === "ru" ? "РїРѕСЃР»РµРґРЅСЏСЏ РіСЂСѓРїРїР°" : "latest group");
      const role = intent.role;
      const memberQueries = intent.memberQueries;

      if (memberQueries.length === 0) {
        outcomes.push({
          groupQuery,
          role,
          status: "invalid",
          details:
            language === "ru"
              ? "Укажите хотя бы одного участника для изменения роли."
              : "Specify at least one member to change role.",
        });
        continue;
      }

      const groupResolution = resolveGroupForInvite(
        store,
        userId,
        groupQuery || LATEST_GROUP_QUERY
      );
      if (groupResolution.status === "not_found") {
        outcomes.push({
          groupQuery,
          role,
          status: "not_found",
        });
        continue;
      }
      if (groupResolution.status === "ambiguous") {
        outcomes.push({
          groupQuery,
          role,
          status: "ambiguous",
        });
        continue;
      }

      const thread = groupResolution.thread;
      if (thread.threadType !== "group") {
        outcomes.push({
          groupQuery,
          role,
          status: "not_found",
        });
        continue;
      }
      if (!isGroupOwner(thread, userId)) {
        outcomes.push({
          groupQuery,
          role,
          status: "forbidden",
          resolvedGroupTitle: groupResolution.label,
          details:
            language === "ru"
              ? "Только владелец группы может менять роли участников."
              : "Only group owner can change member roles.",
        });
        continue;
      }

      const alreadyWithRole: string[] = [];
      const notFoundMembers: string[] = [];
      const forbiddenMembers: string[] = [];
      const ambiguousMembers: Array<{ query: string; alternatives: string[] }> = [];
      let changedCount = 0;

      for (const memberQuery of memberQueries) {
        const resolution = resolveMemberInGroup(
          recipientCandidates,
          thread,
          userId,
          memberQuery
        );
        if (resolution.status === "not_found") {
          notFoundMembers.push(memberQuery);
          continue;
        }
        if (resolution.status === "ambiguous") {
          ambiguousMembers.push({
            query: memberQuery,
            alternatives: resolution.alternatives.map(formatCandidateLabel).slice(0, 3),
          });
          continue;
        }

        const memberId = resolution.candidate.userId;
        const memberLabel = formatCandidateLabel(resolution.candidate);
        if (!thread.memberIds.includes(memberId) || memberId === userId) {
          forbiddenMembers.push(memberLabel);
          continue;
        }
        const currentRole =
          thread.groupRoles[memberId] ?? (memberId === thread.createdById ? "owner" : "member");
        if (currentRole === "owner") {
          forbiddenMembers.push(memberLabel);
          continue;
        }
        if (currentRole === role) {
          alreadyWithRole.push(memberLabel);
          continue;
        }

        thread.groupRoles = {
          ...thread.groupRoles,
          [memberId]: role,
        };
        changedCount += 1;
        updatedMemberRoles += 1;
      }

      if (changedCount > 0) {
        thread.updatedAt = Date.now() + updatedMemberRoles;
        outcomes.push({
          groupQuery,
          role,
          status: "updated",
          resolvedGroupTitle: groupResolution.label,
          changedCount,
          alreadyWithRole: dedupeNormalizedValues(alreadyWithRole),
          notFoundMembers: dedupeNormalizedValues(notFoundMembers),
          forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
          ambiguousMembers,
        });
        continue;
      }

      outcomes.push({
        groupQuery,
        role,
        status: "no_changes",
        resolvedGroupTitle: groupResolution.label,
        changedCount: 0,
        alreadyWithRole: dedupeNormalizedValues(alreadyWithRole),
        notFoundMembers: dedupeNormalizedValues(notFoundMembers),
        forbiddenMembers: dedupeNormalizedValues(forbiddenMembers),
        ambiguousMembers,
      });
    }

    return {
      outcomes,
      updatedMemberRoles,
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
  searchEnabled: boolean,
  latestUserPrompt: string,
  agentEnabled: boolean
): Promise<string> {
  const { apiKey, baseUrl, model: modelFromEnv } = getAiProviderConfig();
  const systemPrompt =
    language === "ru"
      ? "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully. Prefer Russian unless the user writes in another language. Use the internal app knowledge context when relevant. Do not invent app APIs, permissions, or behaviors."
      : "You are ChatGPT in a messenger app. Reply briefly, clearly, and helpfully. Use the internal app knowledge context when relevant. Do not invent app APIs, permissions, or behaviors.";
  const knowledgeContext = buildAiKnowledgeContext({
    query: latestUserPrompt,
    language,
  });
  const responseGuidance = buildAiResponseGuidance({
    query: latestUserPrompt,
    language,
  });
  const systemMessages: Array<{ role: "system"; content: string }> = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];
  if (responseGuidance) {
    systemMessages.push({
      role: "system",
      content: responseGuidance,
    });
  }
  if (!agentEnabled) {
    systemMessages.push({
      role: "system",
      content:
        language === "ru"
          ? "Agent mode is disabled for this conversation. You cannot execute messenger automation actions (send, delete, create groups, invite/remove members, update group data, change member roles, moderation, profile changes). Provide only guidance and drafts, and never claim an action was executed."
          : "Agent mode is disabled for this conversation. You cannot execute messenger automation actions (send, delete, create groups, invite/remove members, update group data, change member roles, moderation, profile changes). Provide only guidance and drafts, and never claim an action was executed.",
    });
  }
  if (knowledgeContext) {
    systemMessages.push({
      role: "system",
      content: knowledgeContext,
    });
  }
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
            ...systemMessages,
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
  const agentEnabled = body?.agentEnabled !== false;
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
    if (agentEnabled) {
      const recentUserMessages = collectRecentUserMessages(messages);
      const isDeleteCommand = isLikelyDeleteCommandStart(latestUserPrompt);
      const deleteIntents = extractDeleteIntents(latestUserPrompt);
      if (isDeleteCommand && deleteIntents.length === 0) {
        return NextResponse.json({
          message: buildDeleteParseErrorReply(language),
          deletedChats: 0,
        });
      }
      if (deleteIntents.length > 0) {
        const deleteSummary = await executeDeleteIntents(userId, language, deleteIntents);
        const message = buildDeleteActionReply(language, deleteSummary);
        return NextResponse.json({
          message,
          deletedChats: deleteSummary.deletedChats,
        });
      }

      const isCreateGroupCommand = isLikelyCreateGroupCommandStart(latestUserPrompt);
      const createGroupIntents = extractCreateGroupIntents(latestUserPrompt);
      if (isCreateGroupCommand && createGroupIntents.length === 0) {
        return NextResponse.json({
          message: buildCreateGroupParseErrorReply(language),
          createdGroups: 0,
        });
      }
      if (createGroupIntents.length > 0) {
        const createSummary = await executeCreateGroupIntents(
          userId,
          language,
          createGroupIntents
        );
        const message = buildCreateGroupActionReply(language, createSummary);
        return NextResponse.json({
          message,
          createdGroups: createSummary.createdGroups,
        });
      }

      const isInviteToGroupCommand = isLikelyInviteToGroupCommandStart(
        latestUserPrompt
      );
      const inviteToGroupIntents = extractInviteToGroupIntents(latestUserPrompt);
      if (isInviteToGroupCommand && inviteToGroupIntents.length === 0) {
        return NextResponse.json({
          message: buildInviteToGroupParseErrorReply(language),
          invitedMembers: 0,
        });
      }
      if (inviteToGroupIntents.length > 0) {
        const inviteSummary = await executeInviteToGroupIntents(
          userId,
          language,
          inviteToGroupIntents
        );
        const message = buildInviteToGroupActionReply(language, inviteSummary);
        return NextResponse.json({
          message,
          invitedMembers: inviteSummary.invitedMembers,
        });
      }

      const isRemoveFromGroupCommand = isLikelyRemoveFromGroupCommandStart(
        latestUserPrompt
      );
      const removeFromGroupIntents = extractRemoveFromGroupIntents(latestUserPrompt);
      if (isRemoveFromGroupCommand && removeFromGroupIntents.length === 0) {
        return NextResponse.json({
          message: buildRemoveFromGroupParseErrorReply(language),
          removedMembers: 0,
        });
      }
      if (removeFromGroupIntents.length > 0) {
        const removeSummary = await executeRemoveFromGroupIntents(
          userId,
          language,
          removeFromGroupIntents
        );
        const message = buildRemoveFromGroupActionReply(language, removeSummary);
        return NextResponse.json({
          message,
          removedMembers: removeSummary.removedMembers,
        });
      }

      const isUpdateGroupDataCommand = isLikelyUpdateGroupDataCommandStart(
        latestUserPrompt
      );
      const updateGroupDataIntents = extractUpdateGroupDataIntents(latestUserPrompt);
      if (isUpdateGroupDataCommand && updateGroupDataIntents.length === 0) {
        return NextResponse.json({
          message: buildUpdateGroupDataParseErrorReply(language),
          updatedGroups: 0,
        });
      }
      if (updateGroupDataIntents.length > 0) {
        const updateSummary = await executeUpdateGroupDataIntents(
          userId,
          language,
          updateGroupDataIntents
        );
        const message = buildUpdateGroupDataActionReply(language, updateSummary);
        return NextResponse.json({
          message,
          updatedGroups: updateSummary.updatedGroups,
        });
      }

      const isSetGroupMemberAccessCommand = isLikelySetGroupMemberAccessCommandStart(
        latestUserPrompt
      );
      const setGroupMemberAccessIntents = extractSetGroupMemberAccessIntents(
        latestUserPrompt
      );
      if (
        isSetGroupMemberAccessCommand &&
        setGroupMemberAccessIntents.length === 0
      ) {
        return NextResponse.json({
          message: buildSetGroupMemberAccessParseErrorReply(language),
          updatedMemberRoles: 0,
        });
      }
      if (setGroupMemberAccessIntents.length > 0) {
        const roleSummary = await executeSetGroupMemberAccessIntents(
          userId,
          language,
          setGroupMemberAccessIntents
        );
        const message = buildSetGroupMemberAccessActionReply(language, roleSummary);
        return NextResponse.json({
          message,
          updatedMemberRoles: roleSummary.updatedMemberRoles,
        });
      }

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
    }

    const reply = await generateAssistantReply(
      language,
      messages,
      searchEnabled,
      latestUserPrompt,
      agentEnabled
    );
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


