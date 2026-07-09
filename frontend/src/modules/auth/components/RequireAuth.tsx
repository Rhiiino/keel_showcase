// stack_sandbox/frontend_web/src/modules/auth/components/RequireAuth.tsx

// Route guard layout that verifies the session via GET /auth/me.
// Redirects to /login on 401 or renders Outlet for nested protected routes.

import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";

import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
} from "../api";

export function RequireAuth() {
  const { data: user, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-stone-400">
        <p className="font-mono text-sm uppercase tracking-[0.2em]">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Keep the shell mounted when a background refetch fails but we already have a session.
  if (isError) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app px-6 text-center text-stone-300">
        <p className="max-w-md text-sm">
          {timedOut
            ? "The server is taking too long to verify your session. Check that the dev API and Cloudflare tunnel are running, then retry."
            : "Could not verify your session. Try again later."}
        </p>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
          className="rounded-md bg-stone-800 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-700 disabled:opacity-50"
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </main>
    );
  }

  return <Outlet />;
}
