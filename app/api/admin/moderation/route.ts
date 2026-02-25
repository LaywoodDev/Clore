import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/server/admin";
import {
  createEntityId,
  getStore,
  type StoreData,
  type StoredModerationAuditAction,
  type StoredModerationAuditLog,
  type StoredModerationReport,
  type StoredUserSanction,
  updateStore,
} from "@/lib/server/store";

type ModerationAction =
  | "resolve_report"
  | "delete_message"
  | "mute_user"
  | "unmute_user"
  | "ban_user"
  | "unban_user";

type ModerationActionPayload = {
  userId?: string;
  action?: ModerationAction;
  reportId?: string;
  messageId?: string;
  chatId?: string;
  targetUserId?: string;
  reason?: string;
  resolutionNote?: string;
  durationHours?: number;
};

type ModerationSnapshot = {
  reports: Array<{
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
  }>;
  sanctions: Array<{
    userId: string;
    name: string;
    username: string;
    mutedUntil: number;
    bannedUntil: number;
    reason: string;
    updatedAt: number;
  }>;
  auditLogs: Array<{
    id: string;
    action: StoredModerationAuditAction;
    actorUserId: string;
    actorName: string;
    targetUserId: string;
    targetName: string;
    reportId: string;
    messageId: string;
    reason: string;
    createdAt: number;
  }>;
};

const MAX_AUDIT_LOGS = 500;
const MAX_REPORTS = 400;
const MUTE_DURATION_MIN_HOURS = 1;
const MUTE_DURATION_MAX_HOURS = 24 * 14;
const BAN_DURATION_MIN_HOURS = 1;
const BAN_DURATION_MAX_HOURS = 24 * 365;

function normalizeDurationHours(
  rawValue: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const candidate =
    typeof rawValue === "number" && Number.isFinite(rawValue)
      ? Math.trunc(rawValue)
      : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function clampReason(value: string): string {
  return value.trim().slice(0, 400);
}

function resolveReport(
  report: StoredModerationReport,
  actorUserId: string,
  now: number,
  note: string
): void {
  report.status = "resolved";
  report.resolvedAt = now;
  report.resolvedByUserId = actorUserId;
  report.resolutionNote = note.trim().slice(0, 400);
}

function appendAuditLog(
  store: StoreData,
  entry: Omit<StoredModerationAuditLog, "id" | "createdAt">
): void {
  const created: StoredModerationAuditLog = {
    id: createEntityId("audit"),
    actorUserId: entry.actorUserId,
    action: entry.action,
    targetUserId: entry.targetUserId,
    reportId: entry.reportId,
    messageId: entry.messageId,
    reason: clampReason(entry.reason),
    createdAt: Date.now(),
  };
  store.moderationAuditLogs = [created, ...store.moderationAuditLogs].slice(
    0,
    MAX_AUDIT_LOGS
  );
}

function getOrCreateSanction(store: StoreData, userId: string): StoredUserSanction {
  const existing = store.userSanctions[userId];
  if (existing) {
    return {
      mutedUntil: Math.max(0, Math.trunc(existing.mutedUntil)),
      bannedUntil: Math.max(0, Math.trunc(existing.bannedUntil)),
      reason: existing.reason.trim().slice(0, 300),
      updatedAt: Math.max(0, Math.trunc(existing.updatedAt)),
    };
  }
  return {
    mutedUntil: 0,
    bannedUntil: 0,
    reason: "",
    updatedAt: 0,
  };
}

function commitSanction(
  store: StoreData,
  userId: string,
  sanction: StoredUserSanction,
  now: number
): void {
  if (sanction.mutedUntil <= now && sanction.bannedUntil <= now) {
    delete store.userSanctions[userId];
    return;
  }

  store.userSanctions[userId] = {
    mutedUntil: sanction.mutedUntil,
    bannedUntil: sanction.bannedUntil,
    reason: sanction.reason.trim().slice(0, 300),
    updatedAt: now,
  };
}

function buildModerationSnapshot(store: StoreData): ModerationSnapshot {
  const usersById = new Map(store.users.map((user) => [user.id, user]));
  const threadsById = new Map(store.threads.map((thread) => [thread.id, thread]));
  const messagesById = new Map(store.messages.map((message) => [message.id, message]));
  const now = Date.now();

  const reports = [...store.moderationReports]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_REPORTS)
    .map((report) => {
      const reporter = usersById.get(report.reporterUserId);
      const target = usersById.get(report.targetUserId);
      const resolver = usersById.get(report.resolvedByUserId);
      const thread = threadsById.get(report.chatId);
      const message =
        messagesById.get(report.messageId)?.chatId === report.chatId
          ? messagesById.get(report.messageId)
          : null;
      const chatTitle =
        thread?.threadType === "group"
          ? thread.title.trim() || "Group chat"
          : "Direct chat";
      const messagePreview = message
        ? message.text.trim() ||
          (message.attachments.length > 0 ? "[Attachment]" : "[Empty message]")
        : "[Message deleted]";

      return {
        id: report.id,
        status: report.status,
        chatId: report.chatId,
        chatTitle,
        messageId: report.messageId,
        messagePreview: messagePreview.slice(0, 240),
        messageCreatedAt: message?.createdAt ?? 0,
        reporterUserId: report.reporterUserId,
        reporterName: reporter?.name ?? "Unknown",
        reporterUsername: reporter?.username ?? "unknown",
        targetUserId: report.targetUserId,
        targetName: target?.name ?? "Unknown",
        targetUsername: target?.username ?? "unknown",
        reason: report.reason,
        details: report.details,
        createdAt: report.createdAt,
        resolvedAt: report.resolvedAt,
        resolvedByUserId: report.resolvedByUserId,
        resolvedByName: resolver?.name ?? "",
        resolutionNote: report.resolutionNote,
      };
    });

  const sanctions = Object.entries(store.userSanctions)
    .map(([userId, sanction]) => {
      const target = usersById.get(userId);
      return {
        userId,
        name: target?.name ?? "Unknown",
        username: target?.username ?? "unknown",
        mutedUntil: Math.max(0, sanction.mutedUntil),
        bannedUntil: Math.max(0, sanction.bannedUntil),
        reason: sanction.reason,
        updatedAt: sanction.updatedAt,
      };
    })
    .filter((sanction) => sanction.mutedUntil > now || sanction.bannedUntil > now)
    .sort(
      (a, b) =>
        Math.max(b.bannedUntil, b.mutedUntil) - Math.max(a.bannedUntil, a.mutedUntil)
    );

  const auditLogs = [...store.moderationAuditLogs]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 120)
    .map((log) => {
      const actor = usersById.get(log.actorUserId);
      const target = usersById.get(log.targetUserId);
      return {
        id: log.id,
        action: log.action,
        actorUserId: log.actorUserId,
        actorName: actor?.name ?? "Unknown",
        targetUserId: log.targetUserId,
        targetName: target?.name ?? "",
        reportId: log.reportId,
        messageId: log.messageId,
        reason: log.reason,
        createdAt: log.createdAt,
      };
    });

  return {
    reports,
    sanctions,
    auditLogs,
  };
}

function getErrorStatus(message: string): number {
  if (
    message === "Missing userId." ||
    message === "Missing action." ||
    message === "Missing reportId."
  ) {
    return 400;
  }
  if (message === "Forbidden.") {
    return 403;
  }
  if (
    message === "User not found." ||
    message === "Report not found." ||
    message === "Message not found." ||
    message === "Target user not found."
  ) {
    return 404;
  }
  return 400;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const store = await getStore();
    requireAdminUser(store, userId);
    return NextResponse.json({ snapshot: buildModerationSnapshot(store) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load moderation.";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ModerationActionPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const action = body?.action;
  const reportId = body?.reportId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const messageId = body?.messageId?.trim() ?? "";
  const targetUserId = body?.targetUserId?.trim() ?? "";
  const reason = clampReason(body?.reason ?? "");
  const resolutionNote = clampReason(body?.resolutionNote ?? "");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  try {
    const snapshot = await updateStore<ModerationSnapshot>((store) => {
      const actor = requireAdminUser(store, userId);
      const now = Date.now();

      const report = reportId
        ? (store.moderationReports.find((candidate) => candidate.id === reportId) ?? null)
        : null;
      if (reportId && !report) {
        throw new Error("Report not found.");
      }

      const resolveIfNeeded = (candidate: StoredModerationReport | null) => {
        if (!candidate || candidate.status === "resolved") {
          return;
        }
        resolveReport(candidate, actor.id, now, resolutionNote || reason || candidate.reason);
      };

      switch (action) {
        case "resolve_report": {
          if (!report) {
            throw new Error("Missing reportId.");
          }
          resolveIfNeeded(report);
          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "report_resolved",
            targetUserId: report.targetUserId,
            reportId: report.id,
            messageId: report.messageId,
            reason: reason || report.reason,
          });
          break;
        }
        case "delete_message": {
          const effectiveMessageId = messageId || report?.messageId || "";
          const effectiveChatId = chatId || report?.chatId || "";
          if (!effectiveMessageId || !effectiveChatId) {
            throw new Error("Message not found.");
          }

          const targetMessage = store.messages.find(
            (candidate) =>
              candidate.id === effectiveMessageId && candidate.chatId === effectiveChatId
          );
          if (!targetMessage) {
            throw new Error("Message not found.");
          }

          store.messages = store.messages.filter(
            (candidate) => candidate.id !== targetMessage.id
          );

          const thread = store.threads.find(
            (candidate) => candidate.id === targetMessage.chatId
          );
          if (thread) {
            const lastChatMessage = store.messages
              .filter((candidate) => candidate.chatId === targetMessage.chatId)
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            thread.updatedAt = lastChatMessage?.createdAt ?? thread.createdAt;
          }

          resolveIfNeeded(report);
          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "message_deleted",
            targetUserId: targetMessage.authorId,
            reportId: report?.id ?? "",
            messageId: targetMessage.id,
            reason: reason || report?.reason || "Message removed by moderator.",
          });
          break;
        }
        case "mute_user": {
          const effectiveTargetUserId = targetUserId || report?.targetUserId || "";
          if (!effectiveTargetUserId) {
            throw new Error("Target user not found.");
          }
          if (effectiveTargetUserId === actor.id) {
            throw new Error("You cannot moderate your own account.");
          }

          const targetUser = store.users.find(
            (candidate) => candidate.id === effectiveTargetUserId
          );
          if (!targetUser) {
            throw new Error("Target user not found.");
          }

          const durationHours = normalizeDurationHours(
            body?.durationHours,
            24,
            MUTE_DURATION_MIN_HOURS,
            MUTE_DURATION_MAX_HOURS
          );
          const sanction = getOrCreateSanction(store, targetUser.id);
          sanction.mutedUntil = now + durationHours * 60 * 60 * 1000;
          sanction.reason = reason || report?.reason || sanction.reason;
          sanction.updatedAt = now;
          commitSanction(store, targetUser.id, sanction, now);
          resolveIfNeeded(report);

          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "user_muted",
            targetUserId: targetUser.id,
            reportId: report?.id ?? "",
            messageId: report?.messageId ?? "",
            reason: sanction.reason || "User muted by moderator.",
          });
          break;
        }
        case "unmute_user": {
          const effectiveTargetUserId = targetUserId || report?.targetUserId || "";
          if (!effectiveTargetUserId) {
            throw new Error("Target user not found.");
          }
          if (effectiveTargetUserId === actor.id) {
            throw new Error("You cannot moderate your own account.");
          }

          const targetUser = store.users.find(
            (candidate) => candidate.id === effectiveTargetUserId
          );
          if (!targetUser) {
            throw new Error("Target user not found.");
          }

          const sanction = getOrCreateSanction(store, targetUser.id);
          sanction.mutedUntil = 0;
          sanction.updatedAt = now;
          if (!sanction.reason) {
            sanction.reason = reason;
          }
          commitSanction(store, targetUser.id, sanction, now);
          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "user_unmuted",
            targetUserId: targetUser.id,
            reportId: report?.id ?? "",
            messageId: report?.messageId ?? "",
            reason: reason || "Mute removed by moderator.",
          });
          break;
        }
        case "ban_user": {
          const effectiveTargetUserId = targetUserId || report?.targetUserId || "";
          if (!effectiveTargetUserId) {
            throw new Error("Target user not found.");
          }
          if (effectiveTargetUserId === actor.id) {
            throw new Error("You cannot moderate your own account.");
          }

          const targetUser = store.users.find(
            (candidate) => candidate.id === effectiveTargetUserId
          );
          if (!targetUser) {
            throw new Error("Target user not found.");
          }

          const durationHours = normalizeDurationHours(
            body?.durationHours,
            24 * 7,
            BAN_DURATION_MIN_HOURS,
            BAN_DURATION_MAX_HOURS
          );
          const sanction = getOrCreateSanction(store, targetUser.id);
          sanction.bannedUntil = now + durationHours * 60 * 60 * 1000;
          sanction.reason = reason || report?.reason || sanction.reason;
          sanction.updatedAt = now;
          commitSanction(store, targetUser.id, sanction, now);
          resolveIfNeeded(report);

          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "user_banned",
            targetUserId: targetUser.id,
            reportId: report?.id ?? "",
            messageId: report?.messageId ?? "",
            reason: sanction.reason || "User banned by moderator.",
          });
          break;
        }
        case "unban_user": {
          const effectiveTargetUserId = targetUserId || report?.targetUserId || "";
          if (!effectiveTargetUserId) {
            throw new Error("Target user not found.");
          }
          if (effectiveTargetUserId === actor.id) {
            throw new Error("You cannot moderate your own account.");
          }

          const targetUser = store.users.find(
            (candidate) => candidate.id === effectiveTargetUserId
          );
          if (!targetUser) {
            throw new Error("Target user not found.");
          }

          const sanction = getOrCreateSanction(store, targetUser.id);
          sanction.bannedUntil = 0;
          sanction.updatedAt = now;
          if (!sanction.reason) {
            sanction.reason = reason;
          }
          commitSanction(store, targetUser.id, sanction, now);
          appendAuditLog(store, {
            actorUserId: actor.id,
            action: "user_unbanned",
            targetUserId: targetUser.id,
            reportId: report?.id ?? "",
            messageId: report?.messageId ?? "",
            reason: reason || "Ban removed by moderator.",
          });
          break;
        }
        default: {
          const _: never = action;
          throw new Error(`Unsupported action: ${String(_)}`);
        }
      }

      return buildModerationSnapshot(store);
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply moderation action.";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
