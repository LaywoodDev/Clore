export type ModerationPanelReport = {
  id: string;
  status: "open" | "resolved";
  chatId: string;
  chatTitle: string;
  messageId: string;
  messagePreview: string;
  messageCreatedAt: number;
  reporterUserId: string;
  reporterName: string;
  reporterUsername: string;
  targetUserId: string;
  targetName: string;
  targetUsername: string;
  reason: string;
  details: string;
  createdAt: number;
  resolvedAt: number;
  resolvedByUserId: string;
  resolvedByName: string;
  resolutionNote: string;
};

export type ModerationPanelSanction = {
  userId: string;
  name: string;
  username: string;
  mutedUntil: number;
  bannedUntil: number;
  reason: string;
  updatedAt: number;
};

export type ModerationPanelAuditLog = {
  id: string;
  action:
    | "report_resolved"
    | "message_deleted"
    | "user_muted"
    | "user_unmuted"
    | "user_banned"
    | "user_unbanned";
  actorUserId: string;
  actorName: string;
  targetUserId: string;
  targetName: string;
  reportId: string;
  messageId: string;
  reason: string;
  createdAt: number;
};

export type ModerationPanelSnapshot = {
  reports: ModerationPanelReport[];
  sanctions: ModerationPanelSanction[];
  auditLogs: ModerationPanelAuditLog[];
};

export type ModerationActionPayload = {
  action:
    | "resolve_report"
    | "delete_message"
    | "mute_user"
    | "unmute_user"
    | "ban_user"
    | "unban_user";
  reportId?: string;
  messageId?: string;
  chatId?: string;
  targetUserId?: string;
  reason?: string;
  resolutionNote?: string;
  durationHours?: number;
};
