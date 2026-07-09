// stack_sandbox/frontend_web/src/modules/auth/components/RedirectIfAuthed.tsx

// Inverse guard for /login. Sends already-authenticated users to home
// instead of showing the login page again.

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { authKeys, CURRENT_USER_STALE_TIME_MS, fetchCurrentUserWithTimeout } from "../api";

type RedirectIfAuthedProps = {
  children: ReactNode;
};

export function RedirectIfAuthed({ children }: RedirectIfAuthedProps) {
  const { isPending, isSuccess, isError, error } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchCurrentUserWithTimeout(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-stone-400">
        <p className="font-mono text-sm uppercase tracking-[0.2em]">Loading…</p>
      </main>
    );
  }

  if (isSuccess) {
    return <Navigate to="/" replace />;
  }

  if (isError && error instanceof ApiError && error.status === 401) {
    return children;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app px-6 text-center text-stone-300">
        <p className="max-w-md text-sm">Could not reach the server. Try again later.</p>
      </main>
    );
  }

  return children;
}
