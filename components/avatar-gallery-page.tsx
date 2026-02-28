"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Crown, Sparkles } from "lucide-react";

import { type AuthUser } from "@/components/messenger/types";
import { Button } from "@/components/ui/button";
import {
  AVATAR_DECORATION_OPTIONS,
  getAvatarDecorationFrameClassName,
  getAvatarDecorationOverlayClassName,
  getAvatarDecorationSurfaceClassName,
} from "@/lib/shared/avatar-decorations";

type SessionData = {
  userId: string;
};

type UserResponse = {
  user?: AuthUser;
  error?: string;
};

const SESSION_STORAGE_KEY = "clore_auth_session_v1";

export function AvatarGalleryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState<string>("");
  const [isPurchasingId, setIsPurchasingId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "return") {
      setNotice("Оплата получена. Обновляем доступные рамки.");
    }

    const sessionRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionRaw) {
      setError("Войдите в аккаунт, чтобы открыть галерею.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadUser = async () => {
      try {
        const session = JSON.parse(sessionRaw) as SessionData | null;
        const userId = session?.userId?.trim() ?? "";
        if (!userId) {
          throw new Error("Сессия не найдена.");
        }

        const response = await fetch(
          `/api/auth/user?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json().catch(() => null)) as UserResponse | null;

        if (!response.ok || !payload?.user) {
          throw new Error(payload?.error?.trim() || "Не удалось загрузить профиль.");
        }

        if (!cancelled) {
          setUser(payload.user);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    if (!user) {
      return "CL";
    }
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user]);

  const hasPrimeAccess =
    user?.primeStatus === "active" && user.primeExpiresAt > Date.now();
  const purchasedDecorationIds = useMemo(
    () => new Set(user?.purchasedAvatarDecorations ?? []),
    [user]
  );

  const applyDecoration = async (avatarDecoration: AuthUser["avatarDecoration"]) => {
    if (!user || isSavingId) {
      return;
    }

    setError("");
    setNotice("");
    setIsSavingId(avatarDecoration);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          username: user.username,
          bio: user.bio,
          birthday: user.birthday,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl,
          avatarDecoration,
        }),
      });
      const payload = (await response.json().catch(() => null)) as UserResponse | null;

      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error?.trim() || "Не удалось применить рамку.");
      }

      setUser(payload.user);
      setNotice("Рамка применена.");
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Не удалось применить рамку.");
    } finally {
      setIsSavingId("");
    }
  };

  const purchaseDecoration = async (avatarDecoration: AuthUser["avatarDecoration"]) => {
    if (!user || !avatarDecoration || avatarDecoration === "none" || isPurchasingId || isSavingId) {
      return;
    }

    setError("");
    setNotice("");
    setIsPurchasingId(avatarDecoration);

    try {
      const response = await fetch("/api/payments/yookassa/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          product: "avatar_decoration",
          avatarDecoration,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { confirmationUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.confirmationUrl) {
        throw new Error(payload?.error?.trim() || "Не удалось создать платеж.");
      }

      window.location.href = payload.confirmationUrl;
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error ? purchaseError.message : "Не удалось создать платеж."
      );
      setIsPurchasingId("");
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(251,191,36,0.1),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_22%),linear-gradient(160deg,#09090b_0%,#111114_50%,#17171b_100%)] text-zinc-100">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <ChevronLeft className="size-4" />
              Назад
            </Button>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
            <Sparkles className="size-3.5" />
            Все рамки временно бесплатны
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <aside className="rounded-3xl border border-zinc-800/90 bg-zinc-950/70 p-5 ring-1 ring-white/5 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Avatar Gallery
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
              Выбери рамку
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Отдельная страница с подборкой красивых рамок для профиля. Клик по карточке
              применяет оформление сразу.
            </p>

            {!isLoading && user && !hasPrimeAccess ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100 [&>p:first-child]:hidden">
                <p>Рамки доступны только с активной подпиской Clore Prime.</p>
                <p className="hidden mt-2 text-amber-100/90">
                  Можно купить любую отдельную рамку прямо из карточки за 49,90 ₽.
                </p>
                <Link href="/prime" className="mt-3 inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl border border-amber-200/20 bg-zinc-900/70 px-3 text-amber-100 hover:bg-zinc-800"
                  >
                    <Crown className="size-4" />
                    Clore Prime
                  </Button>
                </Link>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Preview</p>
              <div className="mt-5 flex justify-center">
                <span
                  className={`relative inline-flex rounded-full ${getAvatarDecorationFrameClassName(
                    user?.avatarDecoration ?? "none"
                  )}`}
                >
                  {user?.avatarUrl ? (
                    <span
                      className={`relative inline-flex size-28 rounded-full bg-zinc-800 bg-cover bg-center ${getAvatarDecorationSurfaceClassName(
                        user.avatarDecoration
                      )} ${getAvatarDecorationOverlayClassName(
                        user.avatarDecoration
                      )}`}
                      style={{ backgroundImage: `url(${user.avatarUrl})` }}
                    />
                  ) : (
                    <span
                      className={`relative inline-flex size-28 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-zinc-50 ${getAvatarDecorationSurfaceClassName(
                        user?.avatarDecoration ?? "none"
                      )} ${getAvatarDecorationOverlayClassName(
                        user?.avatarDecoration ?? "none"
                      )}`}
                    >
                      {initials}
                    </span>
                  )}
                </span>
              </div>
              <p className="mt-5 text-center text-sm font-medium text-zinc-100">
                {user?.name ?? "Профиль"}
              </p>
              <p className="mt-1 text-center text-xs text-zinc-500">
                {
                  AVATAR_DECORATION_OPTIONS.find(
                    (option) => option.id === (user?.avatarDecoration ?? "none")
                  )?.label
                }
              </p>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {notice}
              </div>
            ) : null}
          </aside>

          <section className="rounded-3xl border border-zinc-800/90 bg-zinc-950/65 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6">
            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-sm text-zinc-400">
                Загружаем галерею...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {AVATAR_DECORATION_OPTIONS.map((option) => {
                  const isActive = (user?.avatarDecoration ?? "none") === option.id;
                  const isSaving = isSavingId === option.id;
                  const isPurchasing = isPurchasingId === option.id;
                  const isPremiumOption = option.id !== "none";
                  const hasDecorationAccess =
                    option.id === "none" ||
                    hasPrimeAccess ||
                    purchasedDecorationIds.has(option.id);
                  const isLocked = isPremiumOption && !hasDecorationAccess;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          void purchaseDecoration(option.id);
                          return;
                        }
                        void applyDecoration(option.id);
                      }}
                      disabled={!user || Boolean(isSavingId) || Boolean(isPurchasingId)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        isLocked
                          ? "border-amber-300/20 bg-[linear-gradient(180deg,rgba(39,39,42,0.88),rgba(24,24,27,0.82))] opacity-95 hover:border-amber-300/35"
                          : isActive
                          ? "border-primary bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(39,39,42,0.82))] shadow-[0_18px_50px_-28px_rgba(59,130,246,0.38)]"
                          : "border-zinc-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.9),rgba(17,24,39,0.72))] hover:border-zinc-700 hover:bg-zinc-900"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-100">{option.label}</p>
                        {option.id !== "none" ? (
                          <Crown className="size-4 text-amber-300" />
                        ) : null}
                      </div>

                      <div className="mt-5 flex justify-center">
                        <span
                          className={`relative inline-flex rounded-full ${getAvatarDecorationFrameClassName(
                            option.id
                          )}`}
                        >
                          <span
                            className={`relative inline-flex size-24 items-center justify-center rounded-full bg-primary text-xl font-semibold text-zinc-50 ${getAvatarDecorationSurfaceClassName(
                              option.id
                            )} ${getAvatarDecorationOverlayClassName(
                              option.id
                            )}`}
                          >
                            {initials}
                          </span>
                        </span>
                      </div>

                      <p className="mt-5 text-xs leading-6 text-zinc-400">{option.description}</p>
                      {isLocked ? (
                        <div className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                          49,90 ₽ за эту рамку
                        </div>
                      ) : null}
                      <div className="mt-4 text-xs font-medium">
                        {isPurchasing ? (
                          <span className="text-amber-200">Переход к оплате...</span>
                        ) : isSaving ? (
                          <span className="text-zinc-300">Применяем...</span>
                        ) : isLocked ? (
                          <span className="text-amber-200">Требуется Clore Prime</span>
                        ) : isActive ? (
                          <span className="text-primary">Сейчас активна</span>
                        ) : (
                          <span className="text-zinc-500">Нажми, чтобы применить</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
