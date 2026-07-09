// stack_sandbox/frontend_web/src/modules/auth/api.ts

// Auth module API layer: CurrentUser type, TanStack Query keys, and fetch helpers
// for session check (GET /auth/me), logout, and Google login URL.

import { apiFetch } from "../../lib/api";

export type CurrentUser = {
  id: number;
  provider: string;
  email: string;
  display_name: string;
  picture_url: string | null;
  contact_id: number | null;
};

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

const AUTH_ME_TIMEOUT_MS = 15_000;

/** Session checks stay fresh for several minutes; the cookie is the source of truth. */
export const CURRENT_USER_STALE_TIME_MS = 5 * 60 * 1000;

export function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me", { credentials: "include", signal });
}

/** Session check with a hard timeout so the auth gate cannot spin forever. */
export function fetchCurrentUserWithTimeout(signal?: AbortSignal): Promise<CurrentUser> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_ME_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return fetchCurrentUser(controller.signal).finally(() => {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  });
}

export type UpdateCurrentUserPayload = {
  display_name?: string;
  picture_url?: string | null;
};

export function patchCurrentUser(
  payload: UpdateCurrentUserPayload,
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me", {
    method: "PATCH",
    credentials: "include",
    body: payload,
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function enterShowcase(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/showcase/login", {
    method: "POST",
    credentials: "include",
  });
}
