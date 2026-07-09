// stack_sandbox/frontend_web/src/app/navigation/usePageNavigationState.ts

// Registers capture/restore handlers and keeps the current stack entry in sync.

import { useEffect, useLayoutEffect, useRef } from "react";

import { useNavigationStack } from "./NavigationStackContext";
import type { NavigationUiState } from "./navigationStackTypes";

type PageNavigationStateConfig = {
  capture: () => NavigationUiState | null;
  restore: (state: NavigationUiState | null) => void;
};

export function usePageNavigationState(
  pageKey: string,
  config: PageNavigationStateConfig,
): void {
  const { registerNavigationState, syncEntryState } = useNavigationStack();
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    registerNavigationState(pageKey, {
      capture: () => configRef.current.capture(),
      restore: (state) => configRef.current.restore(state),
    });
    return () => registerNavigationState(pageKey, null);
  }, [pageKey, registerNavigationState]);

  useLayoutEffect(() => {
    syncEntryState(pageKey, configRef.current.capture());
  });
}
