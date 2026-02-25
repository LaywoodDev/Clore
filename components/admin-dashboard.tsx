"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestJson } from "@/components/messenger/api";
import { type AuthUser } from "@/components/messenger/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_PANEL_USERNAME } from "@/lib/shared/admin";

type SessionData = {
  userId: string;
};

type DashboardUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  avatarUrl: string;
  bannerUrl: string;
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

type EditableUserForm = {
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  avatarUrl: string;
  bannerUrl: string;
};

type AdminUserActionPayload =
  | {
      action: "update_user_profile";
      targetUserId: string;
      profile: EditableUserForm;
      reason?: string;
    }
  | {
      action: "set_user_blocked";
      targetUserId: string;
      blocked: boolean;
      durationHours?: number;
      reason?: string;
    }
  | {
      action: "delete_user";
      targetUserId: string;
      reason?: string;
    };

type AdminUserActionResponse = {
  ok: boolean;
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

function toEditableUserForm(user: DashboardUser): EditableUserForm {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    birthday: user.birthday,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  };
}

function parseDurationHours(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
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
  const [editingUserId, setEditingUserId] = useState("");
  const [editingUserForm, setEditingUserForm] = useState<EditableUserForm | null>(
    null
  );
  const [blockDurationByUserId, setBlockDurationByUserId] = useState<
    Record<string, string>
  >({});
  const [blockReasonByUserId, setBlockReasonByUserId] = useState<
    Record<string, string>
  >({});
  const [activeUserActionId, setActiveUserActionId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setBlockDurationByUserId((previous) => {
      const next: Record<string, string> = {};
      for (const user of snapshot.users) {
        next[user.id] = previous[user.id] ?? "720";
      }
      return next;
    });

    setBlockReasonByUserId((previous) => {
      const next: Record<string, string> = {};
      for (const user of snapshot.users) {
        next[user.id] = previous[user.id] ?? user.sanctionReason;
      }
      return next;
    });

    if (editingUserId) {
      const stillExists = snapshot.users.some((user) => user.id === editingUserId);
      if (!stillExists) {
        setEditingUserId("");
        setEditingUserForm(null);
      }
    }
  }, [editingUserId, snapshot]);

  const updateEditingUserField = useCallback(
    (field: keyof EditableUserForm, value: string) => {
      setEditingUserForm((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          [field]: value,
        };
      });
    },
    []
  );

  const updateBlockDuration = useCallback((targetUserId: string, value: string) => {
    setBlockDurationByUserId((previous) => ({
      ...previous,
      [targetUserId]: value,
    }));
  }, []);

  const updateBlockReason = useCallback((targetUserId: string, value: string) => {
    setBlockReasonByUserId((previous) => ({
      ...previous,
      [targetUserId]: value,
    }));
  }, []);

  const executeUserAction = useCallback(
    async (payload: AdminUserActionPayload, successMessage: string): Promise<boolean> => {
      if (!currentUser) {
        return false;
      }

      setActiveUserActionId(payload.targetUserId);
      setActionError("");
      setActionSuccess("");

      try {
        await requestJson<AdminUserActionResponse>("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser.id,
            ...payload,
          }),
        });

        await loadSnapshot(currentUser.id, selectedThreadId, true);
        setActionSuccess(successMessage);
        return true;
      } catch (caught) {
        const message =
          caught instanceof Error && caught.message.trim().length > 0
            ? caught.message
            : "Unable to apply user action.";
        setActionError(message);
        return false;
      } finally {
        setActiveUserActionId("");
      }
    },
    [currentUser, loadSnapshot, selectedThreadId]
  );

  const startEditingUser = useCallback((user: DashboardUser) => {
    setActionError("");
    setActionSuccess("");
    setEditingUserId(user.id);
    setEditingUserForm(toEditableUserForm(user));
  }, []);

  const cancelEditingUser = useCallback(() => {
    setEditingUserId("");
    setEditingUserForm(null);
  }, []);

  const saveEditedUser = useCallback(
    async (targetUserId: string) => {
      if (!editingUserForm || editingUserId !== targetUserId) {
        return;
      }

      const saved = await executeUserAction(
        {
          action: "update_user_profile",
          targetUserId,
          profile: editingUserForm,
        },
        "User profile updated."
      );

      if (saved) {
        setEditingUserId("");
        setEditingUserForm(null);
      }
    },
    [editingUserForm, editingUserId, executeUserAction]
  );

  const setUserBlocked = useCallback(
    async (user: DashboardUser, blocked: boolean) => {
      const reason = (blockReasonByUserId[user.id] ?? "").trim();

      if (blocked) {
        const durationRaw = blockDurationByUserId[user.id] ?? "";
        const durationHours = parseDurationHours(durationRaw);
        if (durationHours === null) {
          setActionError("Block duration must be a positive number of hours.");
          return;
        }
        await executeUserAction(
          {
            action: "set_user_blocked",
            targetUserId: user.id,
            blocked: true,
            durationHours,
            reason,
          },
          `@${user.username} blocked.`
        );
        return;
      }

      await executeUserAction(
        {
          action: "set_user_blocked",
          targetUserId: user.id,
          blocked: false,
          reason,
        },
        `@${user.username} unblocked.`
      );
    },
    [blockDurationByUserId, blockReasonByUserId, executeUserAction]
  );

  const deleteUser = useCallback(
    async (user: DashboardUser) => {
      if (typeof window === "undefined") {
        return;
      }

      const confirmation = window.prompt(
        `Type "${user.username}" to confirm deleting @${user.username}:`,
        ""
      );
      if (confirmation === null) {
        return;
      }
      if (normalizeUsername(confirmation) !== normalizeUsername(user.username)) {
        setActionError("Delete cancelled: username confirmation mismatch.");
        return;
      }

      const removed = await executeUserAction(
        {
          action: "delete_user",
          targetUserId: user.id,
          reason: "User deleted from admin dashboard.",
        },
        `@${user.username} deleted.`
      );

      if (removed && editingUserId === user.id) {
        setEditingUserId("");
        setEditingUserForm(null);
      }
    },
    [editingUserId, executeUserAction]
  );

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

      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      ) : null}

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
            {filteredUsers.map((user) => {
              const isEditing = editingUserId === user.id && editingUserForm !== null;
              const isPending = activeUserActionId === user.id;
              const isBlocked = user.bannedUntil > 0;
              const isMuted = user.mutedUntil > 0;
              const isProtectedAdmin =
                normalizeUsername(user.username) === ADMIN_PANEL_USERNAME;
              const blockDurationValue = blockDurationByUserId[user.id] ?? "720";
              const blockReasonValue = blockReasonByUserId[user.id] ?? "";
              const form = isEditing ? editingUserForm : null;

              return (
                <div
                  key={`admin-user-${user.id}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {user.name} (@{user.username})
                      </p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={isPending || isProtectedAdmin}
                      onClick={() =>
                        isEditing ? cancelEditingUser() : startEditingUser(user)
                      }
                    >
                      {isEditing ? "Close Edit" : "Edit"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Threads: {user.threadsCount} | Messages: {user.messagesCount}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Last seen: {formatDateTime(user.lastSeenAt)}
                  </p>
                  {isBlocked || isMuted ? (
                    <p className="mt-1 text-xs text-amber-300">
                      {isBlocked
                        ? `Blocked until ${formatDateTime(user.bannedUntil)}`
                        : `Muted until ${formatDateTime(user.mutedUntil)}`}
                    </p>
                  ) : null}
                  {user.sanctionReason ? (
                    <p className="mt-1 text-xs text-zinc-400">{user.sanctionReason}</p>
                  ) : null}

                  {form ? (
                    <div className="mt-2 space-y-2 rounded-md border border-zinc-700/70 bg-zinc-900/50 p-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                        Edit Profile
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={form.name}
                          onChange={(event) =>
                            updateEditingUserField("name", event.target.value)
                          }
                          placeholder="Name"
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                        <Input
                          value={form.username}
                          onChange={(event) =>
                            updateEditingUserField("username", event.target.value)
                          }
                          placeholder="Username"
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                        <Input
                          value={form.email}
                          onChange={(event) =>
                            updateEditingUserField("email", event.target.value)
                          }
                          placeholder="Email"
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                        <Input
                          type="date"
                          value={form.birthday}
                          onChange={(event) =>
                            updateEditingUserField("birthday", event.target.value)
                          }
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                        <Input
                          value={form.avatarUrl}
                          onChange={(event) =>
                            updateEditingUserField("avatarUrl", event.target.value)
                          }
                          placeholder="Avatar URL"
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                        <Input
                          value={form.bannerUrl}
                          onChange={(event) =>
                            updateEditingUserField("bannerUrl", event.target.value)
                          }
                          placeholder="Banner URL"
                          className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                        />
                      </div>
                      <Textarea
                        value={form.bio}
                        onChange={(event) =>
                          updateEditingUserField("bio", event.target.value)
                        }
                        placeholder="Bio"
                        className="min-h-20 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="h-8 px-3 text-xs"
                          disabled={isPending || isProtectedAdmin}
                          onClick={() => void saveEditedUser(user.id)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          disabled={isPending || isProtectedAdmin}
                          onClick={cancelEditingUser}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 rounded-md border border-zinc-700/70 bg-zinc-900/50 p-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                      Account Actions
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[140px_1fr]">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={blockDurationValue}
                        onChange={(event) =>
                          updateBlockDuration(user.id, event.target.value)
                        }
                        placeholder="Hours"
                        className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                      />
                      <Input
                        value={blockReasonValue}
                        onChange={(event) =>
                          updateBlockReason(user.id, event.target.value)
                        }
                        placeholder="Reason (optional)"
                        className="h-8 border-zinc-700 bg-zinc-950 text-xs text-zinc-100"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-8 px-3 text-xs"
                        disabled={isPending || isProtectedAdmin}
                        onClick={() => void setUserBlocked(user, true)}
                      >
                        {isBlocked ? "Extend Block" : "Block Account"}
                      </Button>
                      {isBlocked ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          disabled={isPending || isProtectedAdmin}
                          onClick={() => void setUserBlocked(user, false)}
                        >
                          Unblock
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        className="h-8 border border-red-500/70 bg-red-500/15 px-3 text-xs text-red-100 hover:bg-red-500/25"
                        disabled={isPending || isProtectedAdmin}
                        onClick={() => void deleteUser(user)}
                      >
                        Delete Account
                      </Button>
                    </div>
                    {isProtectedAdmin ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        Protected admin account.
                      </p>
                    ) : null}
                    {isPending ? (
                      <p className="mt-2 text-xs text-zinc-400">Applying action...</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
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
