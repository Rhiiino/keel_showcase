// keel_web/src/lib/api.ts

// Shared HTTP helpers for the Keel API. Exposes getApiBaseUrl, apiFetch,
// and ApiError for typed JSON requests against VITE_API_BASE_URL.

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiFetchOptions = {
  method?: string;
  credentials?: RequestCredentials;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/** Keel API origin from `VITE_API_BASE_URL`. */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:9092";
}

/** GET (or other) `path` against the sandbox API; parses JSON or throws {@link ApiError}. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...options.headers };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    credentials: options.credentials,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body,
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      `API ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
