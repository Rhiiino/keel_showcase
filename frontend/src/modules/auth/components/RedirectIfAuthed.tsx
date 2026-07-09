// stack_sandbox/frontend_web/src/modules/auth/components/RedirectIfAuthed.tsx

// Inverse guard for /login. Sends already-authenticated users to home
// instead of showing the login page again.

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
} from "../api";

type RedirectIfAuthedProps = {
  children: ReactNode;
};

export function RedirectIfAuthed({ children }: RedirectIfAuthedProps) {
  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  // Render login immediately; session check runs in the background.
  return children;
}
