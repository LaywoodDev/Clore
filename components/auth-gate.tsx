"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { type AuthUser } from "@/components/messenger/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SessionData = {
  userId: string;
};

type AuthMode = "login" | "register";
type AuthUiTheme = "light" | "dark" | "obsidian" | "titanium";

type LegacyStoredUser = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
};

type AuthResponse = {
  user?: AuthUser;
  error?: string;
};

const SUPPORTED_UI_THEMES = ["light", "dark", "obsidian", "titanium"] as const;

function isSupportedUiTheme(value: string | null): value is AuthUiTheme {
  return SUPPORTED_UI_THEMES.includes(value as AuthUiTheme);
}

function getAuthThemeBackgroundClassName(uiTheme: AuthUiTheme): string {
  if (uiTheme === "light") {
    return "bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.14),transparent_36%),linear-gradient(160deg,#f8fbff_0%,#f1f6fd_58%,#ebf1fa_100%)]";
  }
  if (uiTheme === "obsidian") {
    return "bg-[radial-gradient(circle_at_14%_12%,rgba(56,189,248,0.12),transparent_34%),linear-gradient(160deg,#0b0f14_0%,#121820_58%,#1a232d_100%)]";
  }
  if (uiTheme === "titanium") {
    return "bg-[radial-gradient(circle_at_12%_10%,rgba(148,163,184,0.16),transparent_34%),linear-gradient(160deg,#1e232b_0%,#2a3038_58%,#39424d_100%)]";
  }
  return "bg-[radial-gradient(circle_at_12%_10%,rgba(139,92,246,0.16),transparent_34%),linear-gradient(160deg,#18181b_0%,#232326_60%,#2f2f35_100%)]";
}

function readStoredSessionUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const sessionRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionRaw) {
      return null;
    }

    const session = JSON.parse(sessionRaw) as SessionData;
    if (!session || typeof session.userId !== "string" || !session.userId.trim()) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session.userId;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`clore-skeleton ${className}`} aria-hidden="true" />;
}

function AppLoadingSkeleton({
  uiTheme,
}: {
  uiTheme: AuthUiTheme;
}) {
  return (
    <main
      className={`h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${getAuthThemeBackgroundClassName(uiTheme)} pt-[env(safe-area-inset-top)] text-zinc-100`}
    >
      <section className="grid h-full w-full md:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden border-r border-zinc-700/70 bg-zinc-900/40 p-10 md:flex md:flex-col md:justify-between">
          <div>
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-10 w-full max-w-xl rounded-2xl" />
              <SkeletonBlock className="h-10 w-4/5 max-w-lg rounded-2xl" />
            </div>
            <div className="mt-5 space-y-2">
              <SkeletonBlock className="h-3 w-48 rounded-full" />
              <SkeletonBlock className="h-3 w-40 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-3 w-36 rounded-full" />
        </div>

        <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-6 space-y-3 md:hidden">
              <SkeletonBlock className="h-3 w-14 rounded-full" />
              <SkeletonBlock className="h-8 w-40 rounded-2xl" />
            </div>

            <div className="rounded-3xl border border-zinc-700/70 bg-zinc-900/55 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
              <div className="mb-5 flex gap-2 rounded-xl bg-zinc-800/70 p-1">
                <SkeletonBlock className="h-10 flex-1 rounded-lg" />
                <SkeletonBlock className="h-10 flex-1 rounded-lg" />
              </div>

              <div className="space-y-3">
                <SkeletonBlock className="h-11 w-full rounded-lg" />
                <SkeletonBlock className="h-11 w-full rounded-lg" />
                <SkeletonBlock className="h-3 w-2/3 rounded-full" />
                <SkeletonBlock className="h-11 w-full rounded-lg" />
              </div>

              <div className="mt-4 space-y-3">
                <SkeletonBlock className="h-3 w-1/2 rounded-full" />
                <SkeletonBlock className="h-3 w-1/3 rounded-full md:hidden" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MessengerLoadingSkeleton() {
  return (
    <main className="flex h-[100dvh] min-h-[100dvh] w-full bg-zinc-950 pt-[env(safe-area-inset-top)] text-zinc-100">
      <aside className="hidden w-[84px] border-r border-zinc-800/90 bg-zinc-900/90 px-3 py-4 lg:flex lg:flex-col lg:items-center lg:gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
        <SkeletonBlock className="mt-auto h-11 w-11 rounded-2xl" />
      </aside>

      <aside className="hidden w-[320px] border-r border-zinc-800/90 bg-zinc-900/60 p-4 md:flex md:flex-col">
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          <SkeletonBlock className="h-[4.5rem] w-full rounded-2xl" />
          <SkeletonBlock className="h-[4.5rem] w-full rounded-2xl" />
          <SkeletonBlock className="h-[4.5rem] w-full rounded-2xl" />
          <SkeletonBlock className="h-[4.5rem] w-full rounded-2xl" />
          <SkeletonBlock className="h-[4.5rem] w-full rounded-2xl" />
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col bg-zinc-950/80 p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-3xl border border-zinc-800/90 bg-zinc-900/70 px-4 py-3">
          <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <SkeletonBlock className="h-3 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="h-10 w-10 rounded-2xl" />
        </div>

        <div className="flex-1 px-1 py-5">
          <div className="space-y-4">
            <SkeletonBlock className="h-[4.5rem] w-[72%] rounded-3xl" />
            <SkeletonBlock className="ml-auto h-16 w-[48%] rounded-3xl" />
            <SkeletonBlock className="h-24 w-[64%] rounded-3xl" />
            <SkeletonBlock className="ml-auto h-14 w-[38%] rounded-3xl" />
            <SkeletonBlock className="h-16 w-[44%] rounded-3xl" />
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 flex-1 rounded-2xl" />
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

const LEGACY_USERS_STORAGE_KEY = "clore_auth_users_v1";
const SESSION_STORAGE_KEY = "clore_auth_session_v1";
const UI_THEME_STORAGE_KEY = "clore_ui_theme_v1";
const WebMessenger = dynamic(
  () => import("@/components/web-messenger").then((module) => module.WebMessenger),
  {
    ssr: false,
    loading: () => <MessengerLoadingSkeleton />,
  }
);

const emptyLoginForm = {
  identifier: "",
  password: "",
};

const emptyRegisterForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUsername(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

function isSuspendedErrorMessage(value: string): boolean {
  return value.toLowerCase().includes("your account is suspended until");
}

function readLegacyUsers(): Array<Required<LegacyStoredUser>> {
  try {
    const raw = window.localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (user) =>
          user &&
          typeof user === "object" &&
          typeof (user as LegacyStoredUser).name === "string" &&
          typeof (user as LegacyStoredUser).username === "string" &&
          typeof (user as LegacyStoredUser).password === "string"
      )
      .map((user) => {
        const legacy = user as LegacyStoredUser;
        return {
          id:
            typeof legacy.id === "string" && legacy.id.trim()
              ? legacy.id.trim()
              : "",
          name: legacy.name!.trim(),
          username: normalizeUsername(legacy.username ?? ""),
          email: normalizeEmail(legacy.email ?? ""),
          password: legacy.password!,
        };
      })
      .filter((user) => user.name && user.username && user.password);
  } catch {
    return [];
  }
}

function writeLegacyUsers(users: Array<Required<LegacyStoredUser>>): void {
  try {
    window.localStorage.setItem(
      LEGACY_USERS_STORAGE_KEY,
      JSON.stringify(users.slice(0, 100))
    );
  } catch {
    // Ignore localStorage errors.
  }
}

function rememberLegacyUser(
  user: Pick<AuthUser, "id" | "name" | "username" | "email">,
  password: string
): void {
  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    return;
  }

  const nextEntry: Required<LegacyStoredUser> = {
    id: user.id.trim(),
    name: user.name.trim(),
    username: normalizeUsername(user.username),
    email: normalizeEmail(user.email),
    password: normalizedPassword,
  };
  if (!nextEntry.name || !nextEntry.username) {
    return;
  }

  const existing = readLegacyUsers();
  const deduplicated = existing.filter((candidate) => {
    if (nextEntry.id && candidate.id === nextEntry.id) {
      return false;
    }
    if (candidate.username === nextEntry.username) {
      return false;
    }
    if (nextEntry.email && candidate.email === nextEntry.email) {
      return false;
    }
    return true;
  });
  writeLegacyUsers([nextEntry, ...deduplicated]);
}

async function parseAuthResponse(response: Response): Promise<AuthResponse> {
  return (await response.json().catch(() => null)) as AuthResponse;
}

export function AuthGate() {
  const [storedSessionUserId] = useState<string | null>(() => readStoredSessionUserId());
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(() => storedSessionUserId !== null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [suspensionMessage, setSuspensionMessage] = useState("");
  const [uiTheme, setUiTheme] = useState<AuthUiTheme>("light");

  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);

  const loginIdentifier = loginForm.identifier.trim().toLowerCase();
  const loginPassword = loginForm.password;
  const isLoginValid = loginIdentifier.length > 0 && loginPassword.length > 0;

  const registerName = registerForm.name.trim();
  const registerUsername = normalizeUsername(registerForm.username);
  const registerEmail = normalizeEmail(registerForm.email);
  const registerPassword = registerForm.password;
  const registerConfirmPassword = registerForm.confirmPassword;

  const registerValidationHint = useMemo(() => {
    if (registerUsername.length > 0 && !isValidUsername(registerUsername)) {
      return "Username: 3-20 chars, latin letters, digits or underscore.";
    }
    if (registerEmail.length > 0 && !isValidEmail(registerEmail)) {
      return "Enter a valid email.";
    }
    if (registerPassword.length > 0 && registerPassword.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (
      registerConfirmPassword.length > 0 &&
      registerPassword !== registerConfirmPassword
    ) {
      return "Passwords do not match.";
    }
    return "";
  }, [
    registerConfirmPassword,
    registerEmail,
    registerPassword,
    registerUsername,
  ]);

  const isRegisterValid =
    registerName.length > 0 &&
    registerUsername.length > 0 &&
    registerEmail.length > 0 &&
    registerPassword.length >= 6 &&
    registerPassword === registerConfirmPassword &&
    isValidUsername(registerUsername) &&
    isValidEmail(registerEmail);

  useEffect(() => {
    const rootTheme = document.documentElement.getAttribute("data-clore-theme");
    if (isSupportedUiTheme(rootTheme)) {
      setUiTheme(rootTheme);
      return;
    }

    const stored = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    setUiTheme(isSupportedUiTheme(stored) ? stored : "light");
  }, []);

  useEffect(() => {
    const legacyUsers = readLegacyUsers();
    if (legacyUsers.length === 0) {
      return;
    }

    void fetch("/api/auth/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: legacyUsers }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!storedSessionUserId) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const response = await fetch(
          `/api/auth/user?userId=${encodeURIComponent(storedSessionUserId)}`,
          {
            cache: "no-store",
          }
        );
        const payload = await parseAuthResponse(response);
        if (!response.ok || !payload.user) {
          const message = payload.error ?? "";
          if (response.status === 403 && isSuspendedErrorMessage(message)) {
            if (!cancelled) {
              setSuspensionMessage(message);
            }
            return;
          }
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        if (!cancelled) {
          setSuspensionMessage("");
          setCurrentUser(payload.user);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [storedSessionUserId]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let cancelled = false;
    let isRequestRunning = false;

    const checkSuspensionStatus = async () => {
      if (isRequestRunning) {
        return;
      }
      isRequestRunning = true;
      try {
        const response = await fetch(
          `/api/auth/user?userId=${encodeURIComponent(currentUser.id)}`,
          {
            cache: "no-store",
          }
        );
        const payload = await parseAuthResponse(response);
        const message = payload.error ?? "";
        if (response.ok && payload.user) {
          if (!cancelled) {
            setSuspensionMessage("");
          }
          return;
        }
        if (response.status === 403 && isSuspendedErrorMessage(message)) {
          if (!cancelled) {
            setSuspensionMessage(message);
          }
        }
      } catch {
        // Ignore transient connectivity failures.
      } finally {
        isRequestRunning = false;
      }
    };

    void checkSuspensionStatus();
    const intervalId = window.setInterval(() => {
      void checkSuspensionStatus();
    }, 8_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentUser]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const identifier = loginIdentifier;
    const password = loginPassword;

    if (!identifier || !password) {
      setError("Enter username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });
      const payload = await parseAuthResponse(response);

      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Unable to sign in.");
        return;
      }

      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId: payload.user.id } satisfies SessionData)
      );
      rememberLegacyUser(payload.user, password);
      setSuspensionMessage("");
      setCurrentUser(payload.user);
      setLoginForm(emptyLoginForm);
    } catch {
      setError("Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const name = registerName;
    const username = registerUsername;
    const email = registerEmail;
    const password = registerPassword;
    const confirmPassword = registerConfirmPassword;

    if (!name || !username || !email || !password || !confirmPassword) {
      setError("Fill all fields.");
      return;
    }

    if (!isValidUsername(username)) {
      setError("Username: 3-20 chars, latin letters, digits or underscore.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
        }),
      });
      const payload = await parseAuthResponse(response);

      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Unable to create account.");
        return;
      }

      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId: payload.user.id } satisfies SessionData)
      );
      rememberLegacyUser(payload.user, password);

      setSuspensionMessage("");
      setCurrentUser(payload.user);
      setRegisterForm(emptyRegisterForm);
    } catch {
      setError("Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setMode("login");
    setError("");
    setSuspensionMessage("");
    setLoginForm(emptyLoginForm);
  };

  const handleProfileUpdate = async (
    profile: Pick<
      AuthUser,
      "name" | "username" | "bio" | "birthday" | "avatarUrl" | "bannerUrl" | "avatarDecoration"
    >
  ) => {
    const userId = currentUser?.id;
    if (!userId) {
      return;
    }

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            ...profile,
          }
        : prev
    );

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          birthday: profile.birthday,
          avatarUrl: profile.avatarUrl,
          bannerUrl: profile.bannerUrl,
          avatarDecoration: profile.avatarDecoration,
        }),
      });
      const payload = await parseAuthResponse(response);
      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Unable to update profile.");
        return;
      }
      setCurrentUser(payload.user);
    } catch {
      setError("Unable to update profile.");
    }
  };

  const handlePrivacyUpdate = async (
    privacy: Pick<
      AuthUser,
      | "lastSeenVisibility"
      | "avatarVisibility"
      | "bioVisibility"
      | "birthdayVisibility"
      | "callVisibility"
      | "forwardVisibility"
      | "groupAddVisibility"
      | "lastSeenAllowedUserIds"
      | "avatarAllowedUserIds"
      | "bioAllowedUserIds"
      | "birthdayAllowedUserIds"
      | "callAllowedUserIds"
      | "forwardAllowedUserIds"
      | "groupAddAllowedUserIds"
    >
  ) => {
    const userId = currentUser?.id;
    if (!userId) {
      return;
    }

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            ...privacy,
            showLastSeen: privacy.lastSeenVisibility !== "nobody",
          }
        : prev
    );

    try {
      const response = await fetch("/api/auth/privacy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...privacy,
        }),
      });
      const payload = await parseAuthResponse(response);
      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Unable to update privacy.");
        return;
      }
      setCurrentUser(payload.user);
    } catch {
      setError("Unable to update privacy.");
    }
  };

  if (loading) {
    return storedSessionUserId ? <MessengerLoadingSkeleton /> : <AppLoadingSkeleton uiTheme={uiTheme} />;
  }

  if (currentUser) {
    return (
      <div className="relative h-[100dvh] min-h-[100dvh] w-full">
        <WebMessenger
          currentUser={currentUser}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
          onPrivacyUpdate={handlePrivacyUpdate}
        />
        {suspensionMessage ? (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 px-5 pt-[env(safe-area-inset-top)]">
            <div className="w-full max-w-md rounded-2xl border border-red-400/50 bg-zinc-950 p-5 text-zinc-100 shadow-2xl">
              <h2 className="text-xl font-semibold text-red-200">Аккаунт заблокирован</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-200">{suspensionMessage}</p>
              <p className="mt-2 text-xs text-zinc-400">
                Это окно нельзя закрыть. Вы можете только выйти из аккаунта.
              </p>
              <Button
                type="button"
                className="mt-5 h-10 w-full rounded-lg border border-red-400 bg-red-600/20 text-red-100 hover:bg-red-500/30"
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (suspensionMessage) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center bg-zinc-950 px-5 pt-[env(safe-area-inset-top)] text-zinc-100">
        <div className="w-full max-w-md rounded-2xl border border-red-400/50 bg-zinc-900 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-red-200">Аккаунт заблокирован</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">{suspensionMessage}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Это окно нельзя закрыть. Вы можете только выйти из аккаунта.
          </p>
          <Button
            type="button"
            className="mt-5 h-10 w-full rounded-lg border border-red-400 bg-red-600/20 text-red-100 hover:bg-red-500/30"
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${getAuthThemeBackgroundClassName(uiTheme)} pt-[env(safe-area-inset-top)] text-zinc-100`}
    >
      <section className="grid h-full w-full md:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden border-r border-zinc-700/70 bg-zinc-900/40 p-10 md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Clore</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-zinc-100">
              Team messenger with clean workflow and focused communication.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-zinc-400">
              Register a new account or sign in to continue to chats.
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Data is stored on the server.
          </p>
        </div>

        <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-6 md:hidden">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Clore
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-zinc-100">
                Sign in to continue
              </h1>
            </div>

            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`h-10 flex-1 rounded-lg border text-sm font-medium ${
                  mode === "login"
                    ? "border-primary bg-primary text-zinc-50"
                    : "border-zinc-700 bg-zinc-700 text-zinc-200"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`h-10 flex-1 rounded-lg border text-sm font-medium ${
                  mode === "register"
                    ? "border-primary bg-primary text-zinc-50"
                    : "border-zinc-700 bg-zinc-700 text-zinc-200"
                }`}
              >
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form className="space-y-3" onSubmit={handleLogin}>
                <Input
                  value={loginForm.identifier}
                  onChange={(event) =>
                    setLoginForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        identifier: event.target.value,
                      };
                    })
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  placeholder="Email or username"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        password: event.target.value,
                      };
                    })
                  }
                  autoComplete="current-password"
                  placeholder="Password"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-primary text-zinc-50 hover:bg-primary/90"
                  disabled={submitting || !isLoginValid}
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleRegister}>
                <Input
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        name: event.target.value,
                      };
                    })
                  }
                  autoComplete="name"
                  autoFocus
                  placeholder="Name"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Input
                  value={registerForm.username}
                  onChange={(event) =>
                    setRegisterForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        username: event.target.value,
                      };
                    })
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Username"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        email: event.target.value,
                      };
                    })
                  }
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Email"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        password: event.target.value,
                      };
                    })
                  }
                  autoComplete="new-password"
                  placeholder="Password"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <Input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((prev) => {
                      setError("");
                      return {
                        ...prev,
                        confirmPassword: event.target.value,
                      };
                    })
                  }
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  className="h-11 rounded-lg border-zinc-600 bg-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
                <p className="text-xs text-zinc-400">
                  {registerValidationHint || "Use at least 6 characters for password."}
                </p>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-primary text-zinc-50 hover:bg-primary/90"
                  disabled={submitting || !isRegisterValid}
                >
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}

            {error ? (
              <p className="mt-3 text-sm text-red-300" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-zinc-500 md:hidden">
              Data is stored on the server.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


