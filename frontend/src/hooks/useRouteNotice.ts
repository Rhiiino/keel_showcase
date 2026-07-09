// keel_web/src/hooks/useRouteNotice.ts

import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { RecordNotFoundRedirectState } from "./useRecordNotFoundRedirect";

export function useRouteNotice(): {
  notice: string | null;
  dismissNotice: () => void;
} {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as RecordNotFoundRedirectState | null;
  const notice = state?.notice ?? null;

  const dismissNotice = useCallback(() => {
    if (!notice) {
      return;
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, navigate, notice]);

  return { notice, dismissNotice };
}
