"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type ModerationActionPayload,
  type ModerationPanelAuditLog,
  type ModerationPanelReport,
  type ModerationPanelSanction,
} from "@/components/messenger/moderation-types";

type AppLanguage = "en" | "ru";

type ModerationPanelProps = {
  isOpen: boolean;
  language: AppLanguage;
  isLoading: boolean;
  isActionPending: boolean;
  reports: ModerationPanelReport[];
  sanctions: ModerationPanelSanction[];
  auditLogs: ModerationPanelAuditLog[];
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
  onAction: (payload: ModerationActionPayload) => void | Promise<void>;
  formatDateTime: (timestamp: number, language: AppLanguage) => string;
};

function getModerationActionLabel(
  action: ModerationPanelAuditLog["action"],
  language: AppLanguage
): string {
  if (language === "ru") {
    if (action === "report_resolved") {
      return "Жалоба закрыта";
    }
    if (action === "message_deleted") {
      return "Сообщение удалено";
    }
    if (action === "user_muted") {
      return "Пользователь заглушен";
    }
    if (action === "user_unmuted") {
      return "Сняли mute";
    }
    if (action === "user_banned") {
      return "Пользователь заблокирован";
    }
    return "Сняли бан";
  }

  if (action === "report_resolved") {
    return "Report resolved";
  }
  if (action === "message_deleted") {
    return "Message deleted";
  }
  if (action === "user_muted") {
    return "User muted";
  }
  if (action === "user_unmuted") {
    return "User unmuted";
  }
  if (action === "user_banned") {
    return "User banned";
  }
  return "User unbanned";
}

export function ModerationPanel({
  isOpen,
  language,
  isLoading,
  isActionPending,
  reports,
  sanctions,
  auditLogs,
  onClose,
  onRefresh,
  onAction,
  formatDateTime,
}: ModerationPanelProps) {
  const openReports = useMemo(
    () => reports.filter((report) => report.status === "open"),
    [reports]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[124] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={
          language === "ru" ? "Закрыть модерацию" : "Close moderation panel"
        }
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 grid h-[min(92vh,880px)] w-[min(96vw,1180px)] grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/95 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
          <div>
            <p className="text-lg font-semibold text-zinc-100">
              {language === "ru" ? "Панель модерации" : "Moderation Panel"}
            </p>
            <p className="text-xs text-zinc-400">
              {language === "ru"
                ? "Только аккаунт @laywood"
                : "Only @laywood can access this panel"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isLoading || isActionPending}
              className="h-9 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {language === "ru" ? "Обновить" : "Refresh"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={language === "ru" ? "Закрыть" : "Close"}
              onClick={onClose}
              disabled={isActionPending}
              className="h-9 w-9 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid min-h-0 gap-3 overflow-hidden p-3 sm:grid-cols-[1.3fr_1fr] sm:p-4">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
              <p className="text-sm font-semibold text-zinc-100">
                {language === "ru" ? "Открытые жалобы" : "Open Reports"}
              </p>
              <span className="text-xs text-zinc-500">{openReports.length}</span>
            </div>
            <div className="min-h-0 space-y-2 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
              {isLoading ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-400">
                  {language === "ru" ? "Загрузка..." : "Loading..."}
                </p>
              ) : openReports.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-400">
                  {language === "ru" ? "Нет открытых жалоб." : "No open reports."}
                </p>
              ) : (
                openReports.map((report) => (
                  <div
                    key={`admin-report-${report.id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300">
                        {report.chatTitle}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formatDateTime(report.createdAt, language)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      {`@${report.reporterUsername} -> @${report.targetUsername}`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {report.reason}
                    </p>
                    <p className="mt-1 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-300">
                      {report.messagePreview}
                    </p>
                    {report.details ? (
                      <p className="mt-1 text-xs text-zinc-400">{report.details}</p>
                    ) : null}
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <Button
                        type="button"
                        disabled={isActionPending}
                        className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() =>
                          void onAction({
                            action: "resolve_report",
                            reportId: report.id,
                            resolutionNote: report.reason,
                          })
                        }
                      >
                        {language === "ru" ? "Закрыть" : "Resolve"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isActionPending}
                        className="h-8 rounded-md border border-red-500/60 bg-red-500/15 px-2 text-xs text-red-100 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() =>
                          void onAction({
                            action: "delete_message",
                            reportId: report.id,
                            chatId: report.chatId,
                            messageId: report.messageId,
                            reason: report.reason,
                          })
                        }
                      >
                        {language === "ru" ? "Удалить" : "Delete msg"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isActionPending}
                        className="h-8 rounded-md border border-amber-500/60 bg-amber-500/15 px-2 text-xs text-amber-100 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() =>
                          void onAction({
                            action: "mute_user",
                            reportId: report.id,
                            targetUserId: report.targetUserId,
                            durationHours: 24,
                            reason: report.reason,
                          })
                        }
                      >
                        {language === "ru" ? "Mute 24ч" : "Mute 24h"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isActionPending}
                        className="h-8 rounded-md border border-orange-500/60 bg-orange-500/15 px-2 text-xs text-orange-100 hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() =>
                          void onAction({
                            action: "ban_user",
                            reportId: report.id,
                            targetUserId: report.targetUserId,
                            durationHours: 24 * 7,
                            reason: report.reason,
                          })
                        }
                      >
                        {language === "ru" ? "Ban 7д" : "Ban 7d"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          <div className="grid min-h-0 gap-3 overflow-hidden">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
              <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
                <p className="text-sm font-semibold text-zinc-100">
                  {language === "ru" ? "Активные санкции" : "Active Sanctions"}
                </p>
                <span className="text-xs text-zinc-500">{sanctions.length}</span>
              </div>
              <div className="min-h-0 space-y-2 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                {sanctions.length === 0 ? (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-400">
                    {language === "ru"
                      ? "Нет активных санкций."
                      : "No active sanctions."}
                  </p>
                ) : (
                  sanctions.map((sanction) => {
                    const mutedActive = sanction.mutedUntil > 0;
                    const bannedActive = sanction.bannedUntil > 0;
                    return (
                      <div
                        key={`admin-sanction-${sanction.userId}`}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {`${sanction.name} (@${sanction.username})`}
                        </p>
                        {sanction.reason ? (
                          <p className="mt-1 text-xs text-zinc-400">{sanction.reason}</p>
                        ) : null}
                        {mutedActive ? (
                          <p className="mt-1 text-xs text-amber-200">
                            {`${language === "ru" ? "Mute до" : "Muted until"} ${formatDateTime(
                              sanction.mutedUntil,
                              language
                            )}`}
                          </p>
                        ) : null}
                        {bannedActive ? (
                          <p className="mt-1 text-xs text-orange-200">
                            {`${language === "ru" ? "Бан до" : "Banned until"} ${formatDateTime(
                              sanction.bannedUntil,
                              language
                            )}`}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {mutedActive ? (
                            <Button
                              type="button"
                              disabled={isActionPending}
                              className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() =>
                                void onAction({
                                  action: "unmute_user",
                                  targetUserId: sanction.userId,
                                })
                              }
                            >
                              {language === "ru" ? "Снять mute" : "Unmute"}
                            </Button>
                          ) : null}
                          {bannedActive ? (
                            <Button
                              type="button"
                              disabled={isActionPending}
                              className="h-8 rounded-md border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() =>
                                void onAction({
                                  action: "unban_user",
                                  targetUserId: sanction.userId,
                                })
                              }
                            >
                              {language === "ru" ? "Снять бан" : "Unban"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
              <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
                <p className="text-sm font-semibold text-zinc-100">
                  {language === "ru" ? "Аудит лог" : "Audit Log"}
                </p>
                <span className="text-xs text-zinc-500">{auditLogs.length}</span>
              </div>
              <div className="min-h-0 space-y-2 overflow-y-auto p-3 text-xs [scrollbar-width:thin] [scrollbar-color:#52525b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600">
                {auditLogs.length === 0 ? (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-zinc-400">
                    {language === "ru" ? "Пока пусто." : "No audit events yet."}
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={`admin-audit-${log.id}`}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                    >
                      <p className="font-medium text-zinc-100">
                        {getModerationActionLabel(log.action, language)}
                      </p>
                      <p className="mt-0.5 text-zinc-400">
                        {`${log.actorName}${log.targetName ? ` -> ${log.targetName}` : ""}`}
                      </p>
                      <p className="mt-0.5 text-zinc-500">
                        {formatDateTime(log.createdAt, language)}
                      </p>
                      {log.reason ? (
                        <p className="mt-1 text-zinc-300">{log.reason}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
