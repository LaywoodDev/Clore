"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

type PrimeStatusResponse = {
  status: "inactive" | "pending" | "active" | "canceled";
  expiresAt: number;
  autoRenew: boolean;
  pendingPaymentId: string;
  priceRub: string;
  isActive: boolean;
};

type PrimeStatusErrorResponse = {
  error?: string;
};

type SessionData = {
  userId: string;
};

const SESSION_STORAGE_KEY = "clore_auth_session_v1";

const PRIME_PERKS = [
  "Премиум-статус в профиле",
  "Ранний доступ к новым функциям",
  "Будущие приватные и визуальные улучшения",
];

function formatPrimeDate(timestamp: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "Еще не активна";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getActionLabel(status: PrimeStatusResponse["status"], isSubmitting: boolean): string {
  if (isSubmitting) {
    return "Переход к оплате...";
  }
  if (status === "active") {
    return "Продлить Prime";
  }
  if (status === "pending") {
    return "Открыть оплату";
  }
  return "Подключить Prime";
}

function isPrimeStatusResponse(
  payload: PrimeStatusResponse | PrimeStatusErrorResponse | null
): payload is PrimeStatusResponse {
  if (!payload || typeof payload !== "object" || "error" in payload) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.status === "string" &&
    typeof candidate.expiresAt === "number" &&
    typeof candidate.autoRenew === "boolean" &&
    typeof candidate.pendingPaymentId === "string" &&
    typeof candidate.priceRub === "string" &&
    typeof candidate.isActive === "boolean"
  );
}

export function PrimePage() {
  const [sessionUserId, setSessionUserId] = useState("");
  const [status, setStatus] = useState<PrimeStatusResponse | null>(null);
  const [statusError, setStatusError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "return") {
      setNotice("Оплата получена. Обновляем статус подписки.");
    }

    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        setStatusError("Войдите в аккаунт, чтобы подключить Clore Prime.");
        setIsStatusLoading(false);
        return;
      }

      const parsed = JSON.parse(raw) as SessionData | null;
      const userId = parsed?.userId?.trim() ?? "";
      if (!userId) {
        setStatusError("Войдите в аккаунт, чтобы подключить Clore Prime.");
        setIsStatusLoading(false);
        return;
      }

      setSessionUserId(userId);
    } catch {
      setStatusError("Не удалось прочитать текущую сессию.");
      setIsStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      setIsStatusLoading(true);
      setStatusError("");

      try {
        const response = await fetch(
          `/api/payments/yookassa/status?userId=${encodeURIComponent(sessionUserId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json().catch(() => null)) as
          | PrimeStatusResponse
          | PrimeStatusErrorResponse
          | null;

        if (!response.ok || !isPrimeStatusResponse(payload)) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Не удалось загрузить статус Prime."
          );
        }

        if (!cancelled) {
          setStatus(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusError(
            error instanceof Error ? error.message : "Не удалось загрузить статус Prime."
          );
        }
      } finally {
        if (!cancelled) {
          setIsStatusLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const actionLabel = useMemo(
    () => getActionLabel(status?.status ?? "inactive", isSubmitting),
    [isSubmitting, status]
  );
  const priceLabel = useMemo(
    () => `${status?.priceRub ?? "150.00"} ₽`,
    [status]
  );
  const expiresLabel = useMemo(
    () => formatPrimeDate(status?.expiresAt ?? 0),
    [status]
  );

  const handlePurchase = async () => {
    if (!sessionUserId || isSubmitting) {
      return;
    }

    setActionError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments/yookassa/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: sessionUserId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { confirmationUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.confirmationUrl) {
        throw new Error(payload?.error?.trim() || "Не удалось создать платеж.");
      }

      window.location.href = payload.confirmationUrl;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось создать платеж.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.2),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(251,191,36,0.14),transparent_26%),linear-gradient(160deg,#08080a_0%,#111114_55%,#17171b_100%)] text-zinc-100">
      <section className="relative min-h-[100dvh]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.018)_50%,transparent_100%)] opacity-60" />

        <div className="relative grid min-h-[100dvh] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between border-b border-white/8 bg-zinc-950/52 px-5 py-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div>
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
              </div>

              <div className="mt-8 sm:mt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-200/85">
                  Clore Prime
                </p>
                <h1 className="mt-4 max-w-xl text-[clamp(2.5rem,13vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:max-w-2xl lg:text-7xl">
                  Один план.
                  <br />
                  Никакого лишнего.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300 sm:mt-5 sm:text-base sm:leading-7 lg:max-w-2xl lg:text-lg">
                  Премиум-подписка для тех, кто хочет чистый статус, ранний доступ и
                  аккуратный премиум-слой внутри Clore.
                </p>
              </div>

              <div className="mt-8 grid gap-2.5 sm:mt-10 sm:max-w-xl sm:gap-3 lg:max-w-2xl">
                {PRIME_PERKS.map((perk) => (
                  <div
                    key={perk}
                    className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-3 sm:px-4 lg:px-5 lg:py-4"
                  >
                    <span className="inline-flex shrink-0 rounded-full bg-emerald-400/10 p-1.5 text-emerald-300">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-sm leading-6 text-zinc-200 lg:text-base">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex min-h-full flex-col justify-start bg-[linear-gradient(180deg,rgba(245,158,11,0.07),rgba(10,10,12,0.82)_24%,rgba(10,10,12,0.96)_100%)] px-5 py-6 sm:p-8 lg:justify-center lg:p-12">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl sm:h-48 sm:w-48" />

            <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col justify-center">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-300">Текущий план</p>
              </div>

              <div className="mt-8 sm:mt-10">
                <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-end sm:gap-2">
                  <span className="break-words text-[clamp(2.75rem,16vw,4.5rem)] font-semibold tracking-[-0.06em] text-zinc-50 sm:text-7xl">
                    {priceLabel}
                  </span>
                  <span className="pb-2 text-sm text-zinc-400">/ месяц</span>
                </div>
                <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300 sm:mt-5 sm:text-base sm:leading-7">
                  Оплата через YooKassa. После успешного платежа Prime активируется
                  автоматически.
                </p>
              </div>

              <div className="mt-8 rounded-3xl border border-white/6 bg-white/[0.03] p-4 sm:mt-10 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="text-zinc-500">Действует до</span>
                  <span className="text-left text-zinc-200 sm:text-right">{expiresLabel}</span>
                </div>
              </div>

              {notice ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {notice}
                </div>
              ) : null}
              {statusError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {statusError}
                </div>
              ) : null}
              {actionError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {actionError}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={() => void handlePurchase()}
                disabled={!sessionUserId || isSubmitting}
                className="mt-6 h-12 w-full rounded-2xl bg-amber-400 text-base font-semibold text-zinc-950 shadow-[0_18px_45px_-22px_rgba(251,191,36,0.55)] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
