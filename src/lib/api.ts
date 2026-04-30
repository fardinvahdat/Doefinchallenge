const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "https://ge4lct7761.execute-api.eu-west-1.amazonaws.com/prod"
).replace(/\/+$/, "");

const FETCH_TIMEOUT_MS = 10_000;

export async function apiFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${path}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}
