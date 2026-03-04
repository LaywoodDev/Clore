// Core AI Agent Types

export type Language = "en" | "ru";

export type SendVerbKind = "send" | "congratulate";

export type SendIntent = {
  recipientQuery: string;
  messageText: string;
  scheduledFor?: number | null;
};

export type DeleteIntent = {
  recipientQuery: string;
};

export type CreateGroupIntent = {
  title: string;
  memberQueries: string[];
};

export type InviteToGroupIntent = {
  groupQuery: string;
  memberQueries: string[];
};

export type RemoveFromGroupIntent = {
  groupQuery: string;
  memberQueries: string[];
};

export type UpdateGroupDataIntent = {
  groupQuery: string;
  title?: string;
  description?: string;
};

export type SetGroupMemberAccessRole = "admin" | "member";

export type SetGroupMemberAccessIntent = {
  groupQuery: string;
  memberQueries: string[];
  role: SetGroupMemberAccessRole;
};

export type RecipientCandidate = {
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

export type RecipientResolution =
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

export type SendActionOutcome = {
  recipientQuery: string;
  messageText: string;
  status: "sent" | "not_found" | "ambiguous" | "blocked" | "scheduled";
  resolvedName?: string;
  resolvedUsername?: string;
  alternatives?: string[];
  scheduledFor?: number;
};

export type SendActionSummary = {
  outcomes: SendActionOutcome[];
  sentMessages: number;
  scheduledMessages: number;
};

export type DeleteActionOutcome = {
  recipientQuery: string;
  status: "deleted" | "not_found" | "ambiguous" | "forbidden";
  resolvedTitle?: string;
  alternatives?: string[];
};

export type DeleteActionSummary = {
  outcomes: DeleteActionOutcome[];
  deletedChats: number;
};

export type CreateGroupActionOutcome = {
  title: string;
  status: "created" | "invalid" | "not_found" | "ambiguous" | "forbidden" | "duplicate";
  resolvedTitle?: string;
  chatId?: string;
  memberQuery?: string;
  alternatives?: string[];
  details?: string;
};

export type CreateGroupActionSummary = {
  outcomes: CreateGroupActionOutcome[];
  createdGroups: number;
};

export type InviteToGroupActionOutcome = {
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

export type InviteToGroupActionSummary = {
  outcomes: InviteToGroupActionOutcome[];
  invitedMembers: number;
};

export type RemoveFromGroupActionOutcome = {
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

export type RemoveFromGroupActionSummary = {
  outcomes: RemoveFromGroupActionOutcome[];
  removedMembers: number;
};

export type UpdateGroupDataActionOutcome = {
  groupQuery: string;
  status: "updated" | "invalid" | "not_found" | "ambiguous" | "forbidden" | "duplicate";
  resolvedGroupTitle?: string;
  details?: string;
};

export type UpdateGroupDataActionSummary = {
  outcomes: UpdateGroupDataActionOutcome[];
  updatedGroups: number;
};

export type SetGroupMemberAccessActionOutcome = {
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

export type SetGroupMemberAccessActionSummary = {
  outcomes: SetGroupMemberAccessActionOutcome[];
  updatedMemberRoles: number;
};

export type ConversationContext = {
  recentTopics: string[];
  mentionedUsers: string[];
  activeGroup?: string;
  lastAction?: string;
  unreadCount?: number;
  scheduledMessages?: Array<{ id: string; recipientQuery: string; scheduledFor: number }>;
};

export type WorkspaceQueryRequest = {
  wantsChatCount: boolean;
  wantsChatList: boolean;
  wantsDirectCount: boolean;
  wantsDirectList: boolean;
  wantsGroupCount: boolean;
  wantsGroupList: boolean;
  wantsChannelCount: boolean;
  wantsChannelList: boolean;
};

export type CommandType =
  | "send"
  | "delete"
  | "create_group"
  | "invite_to_group"
  | "remove_from_group"
  | "update_group_data"
  | "set_group_member_access"
  | "workspace_query"
  | "search_messages"
  | "mark_all_read"
  | "export_chat"
  | "unknown";

export type CommandIntent = {
  type: CommandType;
  confidence: number;
  rawInput: string;
  parsedData?: unknown;
};
