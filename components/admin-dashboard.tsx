"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestJson } from "@/components/messenger/api";
import { type AuthUser } from "@/components/messenger/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PANEL_USERNAME } from "@/lib/shared/admin";

type SessionData = {
  userId: string;
};

type DashboardUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  lastSeenAt: number;
  threadsCount: number;
  messagesCount: number;
  mutedUntil: number;
  bannedUntil: number;
  sanctionReason: string;
};

type DashboardThreadMember = {
  id: string;
  name: string;
  username: string;
};

type DashboardThread = {
  id: string;
  threadType: "direct" | "group";
  title: string;
  memberIds: string[];
  members: DashboardThreadMember[];
  updatedAt: number;
  createdAt: number;
  messageCount: number;
  lastMessageAt: number;
  lastMessagePreview: string;
  likelyActiveCall: boolean;
  likelyActiveCallParticipantUserIds: string[];
};

type DashboardThreadMessage = {
  id: string;
  chatId: string;
  authorUserId: string;
  authorName: string;
  authorUsername: string;
  text: string;
  attachmentsCount: number;
  createdAt: number;
};

type DashboardSelectedThread = {
  id: string;
  threadType: "direct" | "group";
  title: string;
  members: DashboardThreadMember[];
  messages: DashboardThreadMessage[];
};

type DashboardActiveCall = {
  chatId: string;
  threadTitle: string;
  threadType: "direct" | "group";
  participantUserIds: string[];
  participants: DashboardThreadMember[];
  startedAt: number;
  lastSignalAt: number;
  signalsCount: number;
};

type DashboardSnapshot = {
  generatedAt: number;
  users: DashboardUser[];
  threads: DashboardThread[];
  activeCalls: DashboardActiveCall[];
  selectedThread: DashboardSelectedThread | null;
};

type DashboardResponse = {
  snapshot: DashboardSnapshot;
};

type AuthResponse = {
  user?: AuthUser;
  error?: string;
};

const SESSION_STORAGE_KEY = "clore_auth_session_v1";
const AUTO_REFRESH_INTERVAL_MS = 10_000;

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function formatDateTime(timestamp: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "-";
  }
  return new Date(timestamp).toLocaleString();
}

export function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [threadQuery, setThreadQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const openMessenger = useCallback(
    (threadId?: string, joinCall = false, targetUserIds: string[] = []) => {
      if (typeof window === "undefined") {
        return;
      }
      const search = new URLSearchParams();
      if (threadId) {
        search.set("adminThreadId", threadId);
      }
      if (joinCall) {
        search.set("adminJoinCall", "1");
      }
      const normalizedTargetIds = [
        ...new Set(
          targetUserIds
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        ),
      ];
      if (normalizedTargetIds.length > 0) {
        search.set("adminCallTargets", normalizedTargetIds.join(","));
      }
      const nextPath = search.toString().length > 0 ? `/?${search.toString()}` : "/";
      window.location.href = nextPath;
    },
    []
  );

  const loadSnapshot = useCallback(
    async (userId: string, threadId?: string, silent = false) => {
      if (!silent) {
        setIsRefreshing(true);
      }
      const params = new URLSearchParams();
      params.set("userId", userId);
      if (threadId && threadId.trim().length > 0) {
        params.set("threadId", threadId.trim());
      }
      const payload = await requestJson<DashboardResponse>(
        `/api/admin/dashboard?${params.toString()}`
      );
      setSnapshot(payload.snapshot);
      if (payload.snapshot.selectedThread) {
        setSelectedThreadId(payload.snapshot.selectedThread.id);
      }
      if (!silent) {
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const sessionRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionRaw) {
          throw new Error("Session not found. Sign in first.");
        }

        const session = JSON.parse(sessionRaw) as SessionData;
        if (!session?.userId || typeof session.userId !== "string") {
          throw new Error("Invalid session. Sign in again.");
        }

        const authPayload = (await requestJson<AuthResponse>(
          `/api/auth/user?userId=${encodeURIComponent(session.userId)}`
        )) as AuthResponse;
        if (!authPayload.user) {
          throw new Error("Unable to read current user.");
        }

        if (normalizeUsername(authPayload.user.username) !== ADMIN_PANEL_USERNAME) {
          throw new Error("Only @laywood can access this page.");
        }

        if (cancelled) {
          return;
        }

        setCurrentUser(authPayload.user);
        await loadSnapshot(authPayload.user.id);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        const message =
          caught instanceof Error && caught.message.trim().length > 0
            ? caught.message
            : "Unable to load admin dashboard.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadSnapshot]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void loadSnapshot(currentUser.id, selectedThreadId, true).catch(() => undefined);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, loadSnapshot, selectedThreadId]);

  const filteredUsers = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const query = userQuery.trim().toLowerCase();
    if (!query) {
      return snapshot.users;
    }
    return snapshot.users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [snapshot, userQuery]);

  const filteredThreads = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const query = threadQuery.trim().toLowerCase();
    if (!query) {
      return snapshot.threads;
    }
    return snapshot.threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(query) ||
        thread.members.some(
          (member) =>
            member.name.toLowerCase().includes(query) ||
            member.username.toLowerCase().includes(query)
        )
    );
  }, [snapshot, threadQuery]);

  const selectedThread = snapshot?.selectedThread ?? null;

  if (isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-200">
        Loading admin dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-6 text-zinc-200">
        <div className="w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 p-6">
          <h1 className="text-xl font-semibold text-zinc-100">Admin access error</h1>
          <p className="mt-3 text-sm text-zinc-300">{error}</p>
          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={() => (window.location.href = "/")}>
              Back to Messenger
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser || !snapshot) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-200">
        Admin dashboard unavailable.
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-zinc-950 px-4 pb-6 pt-5 text-zinc-100 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Clore Admin
          </p>
          <h1 className="text-lg font-semibold text-zinc-100">
            Admin Dashboard (@{currentUser.username})
          </h1>
          <p className="text-xs text-zinc-400">
            Updated: {formatDateTime(snapshot.generatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => openMessenger()}>
            Back to Messenger
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadSnapshot(currentUser.id, selectedThreadId)}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-xs text-zinc-400">Users</p>
          <p className="mt-1 text-2xl font-semibold">{snapshot.users.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-xs text-zinc-400">Threads</p>
          <p className="mt-1 text-2xl font-semibold">{snapshot.threads.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-xs text-zinc-400">Likely Active Calls</p>
          <p className="mt-1 text-2xl font-semibold">{snapshot.activeCalls.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-xs text-zinc-400">Selected Thread Messages</p>
          <p className="mt-1 text-2xl font-semibold">
            {selectedThread ? selectedThread.messages.length : 0}
          </p>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Likely Active Calls</h2>
          <span className="text-xs text-zinc-400">{snapshot.activeCalls.length}</span>
        </div>
        {snapshot.activeCalls.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-400">
            No active call signals right now.
          </p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {snapshot.activeCalls.map((call) => (
              <div
                key={`active-call-${call.chatId}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
              >
                <p className="text-sm font-medium text-zinc-100">{call.threadTitle}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {call.threadType === "group" ? "Group" : "Direct"} | participants:{" "}
                  {call.participants.map((participant) => `@${participant.username}`).join(", ")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Last signal: {formatDateTime(call.lastSignalAt)}
                </p>
                <div className="mt-2">
                  <Button
                    type="button"
                    className="h-8 px-3 text-xs"
                    onClick={() =>
                      openMessenger(
                        call.chatId,
                        true,
                        call.participantUserIds.filter((userId) => userId !== currentUser.id)
                      )
                    }
                  >
                    Join Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid min-h-[70dvh] gap-4 xl:grid-cols-[300px_minmax(420px,1fr)_minmax(420px,1fr)]">
        <div className="flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Users</h2>
            <span className="text-xs text-zinc-400">{filteredUsers.length}</span>
          </div>
          <Input
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Search users"
            className="mb-3 h-9 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
          />
          <div className="min-h-0 space-y-2 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={`admin-user-${user.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
              >
                <p className="text-sm font-medium text-zinc-100">
                  {user.name} (@{user.username})
                </p>
                <p className="text-xs text-zinc-400">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Threads: {user.threadsCount} | Messages: {user.messagesCount}
                </p>
                <p className="text-xs text-zinc-500">
                  Last seen: {formatDateTime(user.lastSeenAt)}
                </p>
                {user.bannedUntil > 0 || user.mutedUntil > 0 ? (
                  <p className="mt-1 text-xs text-amber-300">
                    {user.bannedUntil > 0
                      ? `Banned until ${formatDateTime(user.bannedUntil)}`
                      : `Muted until ${formatDateTime(user.mutedUntil)}`}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Threads</h2>
            <span className="text-xs text-zinc-400">{filteredThreads.length}</span>
          </div>
          <Input
            value={threadQuery}
            onChange={(event) => setThreadQuery(event.target.value)}
            placeholder="Search threads"
            className="mb-3 h-9 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
          />
          <div className="min-h-0 space-y-2 overflow-y-auto">
            {filteredThreads.map((thread) => {
              const selected = selectedThreadId === thread.id;
              return (
                <div
                  key={`admin-thread-${thread.id}`}
                  className={`rounded-lg border px-3 py-2 ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-zinc-800 bg-zinc-950/70"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => void loadSnapshot(currentUser.id, thread.id)}
                  >
                    <p className="text-sm font-medium text-zinc-100">{thread.title}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {thread.threadType === "group" ? "Group" : "Direct"} | members:{" "}
                      {thread.members.map((member) => `@${member.username}`).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Messages: {thread.messageCount} | Updated: {formatDateTime(thread.updatedAt)}
                    </p>
                    {thread.lastMessagePreview ? (
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {thread.lastMessagePreview}
                      </p>
                    ) : null}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-8 px-3 text-xs"
                      onClick={() => openMessenger(thread.id)}
                    >
                      Open in Messenger
                    </Button>
                    {thread.likelyActiveCall ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          openMessenger(
                            thread.id,
                            true,
                            thread.likelyActiveCallParticipantUserIds.filter(
                              (userId) => userId !== currentUser.id
                            )
                          )
                        }
                      >
                        Join Call
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">
              {selectedThread ? `Messages: ${selectedThread.title}` : "Messages"}
            </h2>
            <span className="text-xs text-zinc-400">
              {selectedThread ? selectedThread.messages.length : 0}
            </span>
          </div>
          {!selectedThread ? (
            <p className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-400">
              Select a thread to inspect conversation history.
            </p>
          ) : (
            <div className="min-h-0 space-y-2 overflow-y-auto">
              {selectedThread.messages.map((message) => (
                <div
                  key={`admin-message-${message.id}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                >
                  <p className="text-xs text-zinc-400">
                    {message.authorName} (@{message.authorUsername})
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">
                    {message.text.length > 0 ? message.text : "[Attachment only]"}
                  </p>
                  {message.attachmentsCount > 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Attachments: {message.attachmentsCount}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
