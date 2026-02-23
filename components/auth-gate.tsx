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

const LEGACY_USERS_STORAGE_KEY = "clore_auth_users_v1";
const SESSION_STORAGE_KEY = "clore_auth_session_v1";
const WebMessenger = dynamic(
  () => import("@/components/web-messenger").then((module) => module.WebMessenger),
  {
    ssr: false,
    loading: () => (
      <main className="flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center bg-zinc-900 pt-[env(safe-area-inset-top)] text-zinc-400">
        Loading messenger...
      </main>
    ),
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
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");

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
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const legacyUsers = readLegacyUsers();
        if (legacyUsers.length > 0) {
          await fetch("/api/auth/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ users: legacyUsers }),
          }).catch(() => undefined);
        }

        const sessionRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionRaw) {
          return;
        }

        const session = JSON.parse(sessionRaw) as SessionData;
        if (!session || typeof session.userId !== "string" || !session.userId) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        const response = await fetch(
          `/api/auth/user?userId=${encodeURIComponent(session.userId)}`,
          {
            cache: "no-store",
          }
        );
        const payload = await parseAuthResponse(response);
        if (!response.ok || !payload.user) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }

        if (!cancelled) {
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
  }, []);

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
    setLoginForm(emptyLoginForm);
  };

  const handleProfileUpdate = async (
    profile: Pick<AuthUser, "name" | "username" | "bio" | "birthday" | "avatarUrl" | "bannerUrl">
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
      | "lastSeenAllowedUserIds"
      | "avatarAllowedUserIds"
      | "bioAllowedUserIds"
      | "birthdayAllowedUserIds"
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
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center bg-zinc-900 pt-[env(safe-area-inset-top)] text-zinc-400">
        Loading...
      </main>
    );
  }

  if (currentUser) {
    return (
      <WebMessenger
        currentUser={currentUser}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        onPrivacyUpdate={handlePrivacyUpdate}
      />
    );
  }

  return (
    <main className="h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(139,92,246,0.16),transparent_34%),linear-gradient(160deg,#18181b_0%,#232326_60%,#2f2f35_100%)] pt-[env(safe-area-inset-top)] text-zinc-100">
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
                    ? "border-violet-500 bg-violet-500 text-zinc-50"
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
                    ? "border-violet-500 bg-violet-500 text-zinc-50"
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
                  className="h-11 w-full rounded-lg bg-violet-500 text-zinc-50 hover:bg-violet-400"
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
                  className="h-11 w-full rounded-lg bg-violet-500 text-zinc-50 hover:bg-violet-400"
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

