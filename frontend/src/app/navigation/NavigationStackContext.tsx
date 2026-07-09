// stack_sandbox/frontend_web/src/app/navigation/NavigationStackContext.tsx

// Tracks recent in-app locations (length from user prefs), captures page UI state
// on leave, and restores it when the user clicks a breadcrumb entry.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { buildNavigationLabelContext } from "./buildNavigationLabelContext";
import {
  useNavigationBreadcrumbMaxEntries,
  useNavigationBreadcrumbMaxEntriesRefValue,
} from "./useNavigationBreadcrumbMaxEntries";
import {
  locationKey,
  resolveNavigationLabel,
  resolvePageKey,
} from "./resolveNavigationLabel";
import type {
  NavigationStackEntry,
  NavigationStateHandlers,
  NavigationUiState,
} from "./navigationStackTypes";

type NavigationStackContextValue = {
  stack: NavigationStackEntry[];
  navigateTo: (to: string, options?: { replace?: boolean }) => void;
  restoreToIndex: (index: number) => void;
  registerNavigationState: (
    pageKey: string,
    handlers: NavigationStateHandlers | null,
  ) => void;
  syncEntryState: (pageKey: string, uiState: NavigationUiState | null) => void;
  refreshCurrentLabel: () => void;
};

const NavigationStackContext = createContext<NavigationStackContextValue | null>(
  null,
);

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildEntry(
  pathname: string,
  search: string,
  hash: string,
  label: string,
): NavigationStackEntry {
  return {
    id: createEntryId(),
    pathname,
    search,
    hash,
    label,
    uiState: null,
    pageKey: resolvePageKey(pathname),
  };
}

function uiStateEqual(
  left: NavigationUiState | null,
  right: NavigationUiState | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function entryLocation(entry: NavigationStackEntry): string {
  return `${entry.pathname}${entry.search}${entry.hash}`;
}

type NavigationStackProviderProps = {
  children: ReactNode;
};

export function NavigationStackProvider({ children }: NavigationStackProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const maxEntries = useNavigationBreadcrumbMaxEntries();
  const readMaxEntries = useNavigationBreadcrumbMaxEntriesRefValue();

  const [stack, setStack] = useState<NavigationStackEntry[]>(() => [
    buildEntry(location.pathname, location.search, location.hash, "…"),
  ]);

  const handlersRef = useRef<Map<string, NavigationStateHandlers>>(new Map());
  const isRestoringRef = useRef(false);
  const pendingRestoreRef = useRef<{
    pageKey: string | null;
    uiState: NavigationUiState | null;
  } | null>(null);
  const initializedRef = useRef(false);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const resolveLabel = useCallback(
    (pathname: string, search: string) =>
      resolveNavigationLabel(
        pathname,
        search,
        buildNavigationLabelContext(queryClient),
      ),
    [queryClient],
  );

  const captureForPageKey = useCallback((pageKey: string | null) => {
    if (!pageKey) {
      return null;
    }
    return handlersRef.current.get(pageKey)?.capture() ?? null;
  }, []);

  const restoreForPageKey = useCallback(
    (pageKey: string | null, uiState: NavigationUiState | null) => {
      if (!pageKey) {
        return;
      }
      handlersRef.current.get(pageKey)?.restore(uiState);
    },
    [],
  );

  const registerNavigationState = useCallback(
    (pageKey: string, handlers: NavigationStateHandlers | null) => {
      if (handlers) {
        handlersRef.current.set(pageKey, handlers);
      } else {
        handlersRef.current.delete(pageKey);
      }
    },
    [],
  );

  const syncEntryState = useCallback(
    (pageKey: string, uiState: NavigationUiState | null) => {
      setStack((previous) => {
        if (previous.length === 0) {
          return previous;
        }
        const lastIndex = previous.length - 1;
        const last = previous[lastIndex];
        if (!last || last.pageKey !== pageKey) {
          return previous;
        }
        if (uiStateEqual(last.uiState, uiState)) {
          return previous;
        }
        const next = [...previous];
        next[lastIndex] = { ...last, uiState };
        return next;
      });
    },
    [],
  );

  const refreshCurrentLabel = useCallback(() => {
    setStack((previous) => {
      if (previous.length === 0) {
        return previous;
      }
      const lastIndex = previous.length - 1;
      const current = previous[lastIndex];
      const label = resolveLabel(current.pathname, current.search);
      if (label === current.label) {
        return previous;
      }
      const next = [...previous];
      next[lastIndex] = { ...current, label };
      return next;
    });
  }, [resolveLabel]);

  useEffect(() => {
    refreshCurrentLabel();
  }, [refreshCurrentLabel]);

  useEffect(() => {
    setStack((previous) => {
      if (previous.length <= maxEntries) {
        return previous;
      }
      return previous.slice(-maxEntries);
    });
  }, [maxEntries]);

  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;
    const nextKey = locationKey(pathname, search);

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      const pending = pendingRestoreRef.current;
      pendingRestoreRef.current = null;
      if (pending) {
        requestAnimationFrame(() => {
          restoreForPageKey(pending.pageKey, pending.uiState);
        });
      }
      initializedRef.current = true;
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      setStack([
        buildEntry(pathname, search, hash, resolveLabel(pathname, search)),
      ]);
      return;
    }

    const previousStack = stackRef.current;
    const currentEntry = previousStack[previousStack.length - 1];
    if (!currentEntry) {
      return;
    }

    const currentKey = locationKey(currentEntry.pathname, currentEntry.search);
    if (currentKey === nextKey) {
      return;
    }

    const leavingPageKey = currentEntry.pageKey;
    const capturedState =
      currentEntry.uiState ?? captureForPageKey(leavingPageKey);
    const label = resolveLabel(pathname, search);
    const pageKey = resolvePageKey(pathname);

    setStack((previous) => {
      const updated = [...previous];
      const lastIndex = updated.length - 1;
      const last = updated[lastIndex];
      if (!last) {
        return [buildEntry(pathname, search, hash, label)];
      }

      if (capturedState !== null) {
        updated[lastIndex] = {
          ...last,
          uiState: capturedState,
        };
      }

      const pathnameChanged = last.pathname !== pathname;

      if (pathnameChanged) {
        const nextEntry = buildEntry(pathname, search, hash, label);
        nextEntry.pageKey = pageKey;
        updated.push(nextEntry);
        return updated.slice(-readMaxEntries());
      }

      updated[lastIndex] = {
        ...updated[lastIndex],
        search,
        hash,
        label,
        pageKey,
      };
      return updated;
    });
  }, [
    location.pathname,
    location.search,
    location.hash,
    captureForPageKey,
    maxEntries,
    readMaxEntries,
    resolveLabel,
    restoreForPageKey,
  ]);

  const navigateTo = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const current = stackRef.current[stackRef.current.length - 1];
      if (current?.pageKey) {
        const captured = captureForPageKey(current.pageKey);
        if (captured !== null) {
          syncEntryState(current.pageKey, captured);
        }
      }
      navigate(to, { replace: options?.replace ?? false });
    },
    [navigate, captureForPageKey, syncEntryState],
  );

  const restoreToIndex = useCallback(
    (index: number) => {
      const entry = stackRef.current[index];
      if (!entry) {
        return;
      }

      const lastIndex = stackRef.current.length - 1;
      if (index === lastIndex) {
        return;
      }

      isRestoringRef.current = true;
      pendingRestoreRef.current = {
        pageKey: entry.pageKey,
        uiState: entry.uiState,
      };

      setStack((previous) => previous.slice(0, index + 1));
      navigate(entryLocation(entry));
    },
    [navigate],
  );

  const value = useMemo(
    () => ({
      stack,
      navigateTo,
      restoreToIndex,
      registerNavigationState,
      syncEntryState,
      refreshCurrentLabel,
    }),
    [
      stack,
      navigateTo,
      restoreToIndex,
      registerNavigationState,
      syncEntryState,
      refreshCurrentLabel,
    ],
  );

  return (
    <NavigationStackContext.Provider value={value}>
      {children}
    </NavigationStackContext.Provider>
  );
}

export function useNavigationStack(): NavigationStackContextValue {
  const context = useContext(NavigationStackContext);
  if (!context) {
    throw new Error("useNavigationStack must be used within NavigationStackProvider");
  }
  return context;
}

export function useOptionalNavigationStack(): NavigationStackContextValue | null {
  return useContext(NavigationStackContext);
}
