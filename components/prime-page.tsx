"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Crown, Lock, Sparkles, Zap } from "lucide-react";

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

const includedFeatures = [
  {
    icon: Crown,
    title: "Prime status in your profile",
    description: "Your premium account is visually marked inside Clore.",
  },
  {
    icon: Lock,
    title: "Future privacy upgrades",
    description: "Reserved for advanced archive, visibility, and personal security tools.",
  },
  {
    icon: Zap,
    title: "Future premium tools",
    description: "A dedicated premium lane for new Clore upgrades and account perks.",
  },
];

const plannedPerks = [
  "Priority access to new premium features",
  "Prime-only profile styling and account status",
  "Early rollout for new messenger upgrades",
  "One clear subscription without multiple tiers",
];

function formatPrimeDate(timestamp: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "Not active yet";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getStatusLabel(status: PrimeStatusResponse["status"]): string {
  if (status === "active") {
    return "Active";
  }
  if (status === "pending") {
    return "Pending payment";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  return "Inactive";
}

function getActionLabel(status: PrimeStatusResponse["status"], isSubmitting: boolean): string {
  if (isSubmitting) {
    return "Redirecting to YooKassa...";
  }
  if (status === "active") {
    return "Extend Prime";
  }
  if (status === "pending") {
    return "Open payment";
  }
  return "Buy Prime";
}

export function PrimePage() {
  const [sessionUserId, setSessionUserId] = useState("");
  const [status, setStatus] = useState<PrimeStatusResponse | null>(null);
  const [statusError, setStatusError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPrimeStatusResponse = (
    payload: PrimeStatusResponse | PrimeStatusErrorResponse | null
  ): payload is PrimeStatusResponse => {
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
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "return") {
      setNotice("Payment return detected. Subscription status will update after YooKassa webhook confirmation.");
    }

    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        setStatusError("Log in to purchase Clore Prime.");
        setIsStatusLoading(false);
        return;
      }

      const parsed = JSON.parse(raw) as SessionData | null;
      const userId = parsed?.userId?.trim() ?? "";
      if (!userId) {
        setStatusError("Log in to purchase Clore Prime.");
        setIsStatusLoading(false);
        return;
      }

      setSessionUserId(userId);
    } catch {
      setStatusError("Unable to read the current session.");
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
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json().catch(() => null)) as
          | PrimeStatusResponse
          | PrimeStatusErrorResponse
          | null;

        if (!response.ok || !isPrimeStatusResponse(payload)) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Unable to load Prime status."
          );
        }

        if (!cancelled) {
          setStatus(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusError(
            error instanceof Error ? error.message : "Unable to load Prime status."
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

  const priceLabel = status ? `${status.priceRub} ₽` : "150 ₽";
  const statusLabel = useMemo(() => getStatusLabel(status?.status ?? "inactive"), [status]);
  const actionLabel = useMemo(
    () => getActionLabel(status?.status ?? "inactive", isSubmitting),
    [isSubmitting, status]
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
        throw new Error(
          payload?.error?.trim() || "Unable to create YooKassa payment."
        );
      }

      window.location.href = payload.confirmationUrl;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to create YooKassa payment."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.14),transparent_24%),linear-gradient(160deg,#09090b_0%,#111114_52%,#17171c_100%)] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <ChevronLeft className="size-4" />
              Back to Clore
            </Button>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            <Crown className="size-3.5" />
            Clore Prime
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-amber-300/15 bg-zinc-950/70 p-5 shadow-[0_30px_80px_-40px_rgba(245,158,11,0.28)] ring-1 ring-white/5 backdrop-blur-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                <Sparkles className="size-3.5" />
                Premium subscription
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                Clore Prime
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                A single premium plan for users who want a cleaner identity, earlier access,
                and a production-ready payment flow through YooKassa.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {includedFeatures.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
                    >
                      <div className="inline-flex rounded-xl border border-amber-300/20 bg-amber-300/10 p-2 text-amber-100">
                        <Icon className="size-4" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-zinc-100">{feature.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-300/20 bg-[linear-gradient(160deg,rgba(245,158,11,0.14),rgba(24,24,27,0.98)_32%,rgba(24,24,27,0.98)_100%)] p-5 ring-1 ring-amber-200/5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-amber-100">Current plan</p>
                <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                  {isStatusLoading ? "Loading..." : statusLabel}
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-zinc-50">
                  {priceLabel}
                </span>
                <span className="pb-1 text-sm text-zinc-400">per month</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                The purchase button below creates a real YooKassa payment and redirects the
                user to checkout. Subscription activation happens after webhook confirmation.
              </p>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Subscription state
                </p>
                <div className="mt-3 space-y-2 text-sm text-zinc-300">
                  <p>Expires: {expiresLabel}</p>
                  <p>Auto-renew: {status?.autoRenew ? "Enabled" : "Not enabled yet"}</p>
                  <p>
                    Pending payment: {status?.pendingPaymentId?.trim() ? status.pendingPaymentId : "None"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Included
                </p>
                <div className="mt-3 space-y-3">
                  {plannedPerks.map((perk) => (
                    <div key={perk} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex rounded-full bg-emerald-400/10 p-1 text-emerald-300">
                        <Check className="size-3.5" />
                      </span>
                      <p className="text-sm text-zinc-300">{perk}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Billing mode
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  The current setup uses a one-time YooKassa payment for each 30-day Prime
                  period. Auto-renew should be enabled only after YooKassa approves recurring
                  payments for your store.
                </p>
              </div>

              {notice ? (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {notice}
                </div>
              ) : null}
              {statusError ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {statusError}
                </div>
              ) : null}
              {actionError ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {actionError}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={() => void handlePurchase()}
                disabled={!sessionUserId || isSubmitting}
                className="mt-5 h-11 w-full rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/65 p-5 ring-1 ring-white/5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-zinc-100">YooKassa setup required</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Before payments work in production, set <code>YOOKASSA_SHOP_ID</code>,
              <code>YOOKASSA_SECRET_KEY</code>, and <code>APP_URL</code>. Then register the
              webhook URL in your YooKassa dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/65 p-5 ring-1 ring-white/5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-zinc-100">What is already wired</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Create-payment, webhook processing, Prime subscription state in the user store,
              and redirect from the in-app Prime button are already connected.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
