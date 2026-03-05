type ApiErrorResponse = {
  error?: string;
};

let _authToken: string | null = null;

export function setAuthToken(token: string): void {
  _authToken = token;
}

export async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const authHeaders: Record<string, string> = _authToken
    ? { Authorization: `Bearer ${_authToken}` }
    : {};

  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as (T & ApiErrorResponse) | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  if (!payload) {
    throw new Error("Empty response.");
  }

  return payload as T;
}

export async function createYookassaPayment(payload: {
  userId: string;
  product: "prime" | "avatar_decoration" | "prime_gift";
  recipientUserId?: string;
  avatarDecoration?: string;
}): Promise<{ paymentId: string; confirmationUrl: string; status: string; product: string }> {
  return requestJson("/api/payments/yookassa/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
