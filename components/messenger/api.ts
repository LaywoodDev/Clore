type ApiErrorResponse = {
  error?: string;
};

export async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
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
