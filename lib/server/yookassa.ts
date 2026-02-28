import { randomUUID } from "node:crypto";

const YOOKASSA_API_BASE = "https://api.yookassa.ru/v3";

export const PRIME_PLAN_CODE = "clore_prime";
export const AVATAR_DECORATION_PRODUCT_CODE = "avatar_decoration";
export const PRIME_SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type YooKassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled";

export type YooKassaPayment = {
  id: string;
  status: YooKassaPaymentStatus;
  paid: boolean;
  amount?: {
    value?: string;
    currency?: string;
  };
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, string>;
  payment_method?: {
    id?: string;
  };
};

type CreateYooKassaPaymentArgs = {
  userId: string;
  returnUrl?: string;
};

type CreateAvatarDecorationPaymentArgs = {
  userId: string;
  avatarDecoration: string;
  returnUrl?: string;
};

type YooKassaRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  body?: unknown;
  idempotenceKey?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getPrimePriceValue(): string {
  const raw = process.env.YOOKASSA_PRIME_PRICE_RUB?.trim() ?? "150.00";
  const normalized = raw.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("YOOKASSA_PRIME_PRICE_RUB must be a valid amount.");
  }
  const [whole, fraction = "00"] = normalized.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function getAvatarDecorationPriceValue(): string {
  const raw = process.env.YOOKASSA_AVATAR_DECORATION_PRICE_RUB?.trim() ?? "49.90";
  const normalized = raw.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("YOOKASSA_AVATAR_DECORATION_PRICE_RUB must be a valid amount.");
  }
  const [whole, fraction = "00"] = normalized.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function isRecurringEnabled(): boolean {
  const raw = process.env.YOOKASSA_ENABLE_RECURRING?.trim().toLowerCase() ?? "";
  return raw === "true" || raw === "1" || raw === "yes";
}

function getAuthHeader(): string {
  const shopId = getRequiredEnv("YOOKASSA_SHOP_ID");
  const secretKey = getRequiredEnv("YOOKASSA_SECRET_KEY");
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

async function yookassaRequest<T>({
  method = "GET",
  path,
  body,
  idempotenceKey,
}: YooKassaRequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json",
  };
  if (method === "POST") {
    headers["Idempotence-Key"] = idempotenceKey?.trim() || randomUUID();
  }

  const response = await fetch(`${YOOKASSA_API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T | { description?: string } | null;
  if (!response.ok || !payload) {
    const description =
      payload && typeof payload === "object" && "description" in payload
        ? payload.description
        : "YooKassa request failed.";
    throw new Error(typeof description === "string" && description.trim() ? description : "YooKassa request failed.");
  }

  return payload as T;
}

export function getPrimePriceRub(): string {
  return getPrimePriceValue();
}

export function getAvatarDecorationPriceRub(): string {
  return getAvatarDecorationPriceValue();
}

export function getYooKassaRecurringEnabled(): boolean {
  return isRecurringEnabled();
}

export function getPrimeReturnUrl(): string {
  const appUrl = getRequiredEnv("APP_URL").replace(/\/+$/, "");
  return `${appUrl}/prime?payment=return`;
}

export function getAvatarDecorationReturnUrl(avatarDecoration: string): string {
  const appUrl = getRequiredEnv("APP_URL").replace(/\/+$/, "");
  const searchParams = new URLSearchParams({
    payment: "return",
    decoration: avatarDecoration,
  });
  return `${appUrl}/avatar-gallery?${searchParams.toString()}`;
}

export async function createPrimePayment({
  userId,
  returnUrl,
}: CreateYooKassaPaymentArgs): Promise<YooKassaPayment> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("Missing userId.");
  }

  const payment = await yookassaRequest<YooKassaPayment>({
    method: "POST",
    path: "/payments",
    body: {
      amount: {
        value: getPrimePriceValue(),
        currency: "RUB",
      },
      capture: true,
      save_payment_method: isRecurringEnabled(),
      confirmation: {
        type: "redirect",
        return_url: returnUrl?.trim() || getPrimeReturnUrl(),
      },
      description: "Clore Prime monthly subscription",
      metadata: {
        plan: PRIME_PLAN_CODE,
        userId: normalizedUserId,
      },
    },
  });

  return payment;
}

export async function createAvatarDecorationPayment({
  userId,
  avatarDecoration,
  returnUrl,
}: CreateAvatarDecorationPaymentArgs): Promise<YooKassaPayment> {
  const normalizedUserId = userId.trim();
  const normalizedAvatarDecoration = avatarDecoration.trim();
  if (!normalizedUserId) {
    throw new Error("Missing userId.");
  }
  if (!normalizedAvatarDecoration) {
    throw new Error("Missing avatarDecoration.");
  }

  return yookassaRequest<YooKassaPayment>({
    method: "POST",
    path: "/payments",
    body: {
      amount: {
        value: getAvatarDecorationPriceValue(),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url:
          returnUrl?.trim() || getAvatarDecorationReturnUrl(normalizedAvatarDecoration),
      },
      description: `Clore avatar frame: ${normalizedAvatarDecoration}`,
      metadata: {
        product: AVATAR_DECORATION_PRODUCT_CODE,
        userId: normalizedUserId,
        avatarDecoration: normalizedAvatarDecoration,
      },
    },
  });
}

export async function getYooKassaPayment(paymentId: string): Promise<YooKassaPayment> {
  const normalizedPaymentId = paymentId.trim();
  if (!normalizedPaymentId) {
    throw new Error("Missing paymentId.");
  }
  return yookassaRequest<YooKassaPayment>({
    path: `/payments/${encodeURIComponent(normalizedPaymentId)}`,
  });
}
