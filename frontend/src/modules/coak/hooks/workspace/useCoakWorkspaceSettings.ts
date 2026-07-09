// keel_web/src/modules/coak/hooks/workspace/useCoakWorkspaceSettings.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  coakQueryKeys,
  fetchCoakWorkspaceSettings,
  updateCoakWorkspaceSettings,
  type CoakPanelRect,
  type CoakWorkspaceSettings,
  type CoakWorkspaceSettingsPayload,
  type CoakWorkspaceTabId,
} from "../../api";
import {
  bringWindowToFrontInLayout,
  layoutToWorkspaceSettingsPayload,
  mergeWindowsInLayout,
  moveTabBetweenWindowsInLayout,
  normalizeCoakWorkspaceLayout,
  reorderTabInLayout,
  setActiveTabInLayout,
  setWindowRectInLayout,
  tearOutTabInLayout,
  type CoakWorkspaceLayout,
} from "../../lib/panels/coakWindowLayout";

const SAVE_DEBOUNCE_MS = 400;

function toPayload(layout: CoakWorkspaceLayout): CoakWorkspaceSettingsPayload {
  return layoutToWorkspaceSettingsPayload(layout);
}

function stableSerialize(layout: CoakWorkspaceLayout): string {
  return JSON.stringify(toPayload(layout));
}

function layoutFromSettings(settings: CoakWorkspaceSettings): CoakWorkspaceLayout {
  return normalizeCoakWorkspaceLayout(settings);
}

export function useCoakWorkspaceSettings(recordId: number) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: coakQueryKeys.workspaceSettings(recordId),
    queryFn: () => fetchCoakWorkspaceSettings(recordId),
    refetchOnMount: "always",
  });

  const [layout, setLayout] = useState<CoakWorkspaceLayout>(() => layoutFromSettings({
    persisted: false,
  }));
  const [hydrated, setHydrated] = useState(false);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const hydratedRef = useRef(hydrated);
  hydratedRef.current = hydrated;
  const lastSavedRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const flushSave = useCallback(
    (next: CoakWorkspaceLayout) => {
      const payload = toPayload(next);
      if (payload.windows.length === 0) {
        return;
      }

      const serialized = stableSerialize(next);
      if (serialized === lastSavedRef.current) {
        return;
      }

      void updateCoakWorkspaceSettings(recordId, payload)
        .then((saved) => {
          lastSavedRef.current = stableSerialize(layoutFromSettings(saved));
          queryClient.setQueryData(coakQueryKeys.workspaceSettings(recordId), saved);
        })
        .catch(() => {
          // Keep local state; a later edit will retry.
        });
    },
    [queryClient, recordId],
  );

  const scheduleSave = useCallback(
    (next: CoakWorkspaceLayout) => {
      if (!hydratedRef.current) {
        return;
      }

      clearSaveTimer();
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        flushSave(next);
      }, SAVE_DEBOUNCE_MS);
    },
    [clearSaveTimer, flushSave],
  );

  useEffect(() => {
    if (!query.data || hydrated) {
      return;
    }

    clearSaveTimer();
    const next = layoutFromSettings(query.data);
    setLayout(next);
    layoutRef.current = next;
    lastSavedRef.current = stableSerialize(next);
    setHydrated(true);
  }, [clearSaveTimer, hydrated, query.data]);

  useEffect(() => {
    return () => {
      clearSaveTimer();
      if (hydratedRef.current) {
        flushSave(layoutRef.current);
      }
    };
  }, [clearSaveTimer, flushSave]);

  const commitLayout = useCallback(
    (updater: (current: CoakWorkspaceLayout) => CoakWorkspaceLayout) => {
      setLayout((current) => {
        const next = updater(current);
        layoutRef.current = next;
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const setWindowRect = useCallback(
    (windowId: string, rect: CoakPanelRect) => {
      commitLayout((current) => setWindowRectInLayout(current, windowId, rect));
    },
    [commitLayout],
  );

  const bringWindowToFront = useCallback(
    (windowId: string) => {
      commitLayout((current) => bringWindowToFrontInLayout(current, windowId));
    },
    [commitLayout],
  );

  const getWindowZIndex = useCallback(
    (windowId: string) => {
      const index = layout.window_order.indexOf(windowId);
      return index >= 0 ? index + 1 : 1;
    },
    [layout.window_order],
  );

  const setActiveTab = useCallback(
    (windowId: string, tabId: CoakWorkspaceTabId) => {
      commitLayout((current) => setActiveTabInLayout(current, windowId, tabId));
    },
    [commitLayout],
  );

  const reorderTab = useCallback(
    (windowId: string, tabId: CoakWorkspaceTabId, targetIndex: number) => {
      commitLayout((current) => reorderTabInLayout(current, windowId, tabId, targetIndex));
    },
    [commitLayout],
  );

  const moveTabBetweenWindows = useCallback(
    (
      tabId: CoakWorkspaceTabId,
      sourceWindowId: string,
      targetWindowId: string,
      targetIndex: number,
    ) => {
      commitLayout((current) =>
        moveTabBetweenWindowsInLayout(
          current,
          tabId,
          sourceWindowId,
          targetWindowId,
          targetIndex,
        ),
      );
    },
    [commitLayout],
  );

  const tearOutTab = useCallback(
    (tabId: CoakWorkspaceTabId, sourceWindowId: string, rect: CoakPanelRect) => {
      commitLayout((current) => tearOutTabInLayout(current, tabId, sourceWindowId, rect));
    },
    [commitLayout],
  );

  const mergeWindows = useCallback(
    (sourceWindowId: string, targetWindowId: string) => {
      commitLayout((current) => mergeWindowsInLayout(current, sourceWindowId, targetWindowId));
    },
    [commitLayout],
  );

  return {
    workspaceLayout: layout,
    workspaceSettingsHydrated: hydrated && !query.isLoading,
    setWindowRect,
    bringWindowToFront,
    getWindowZIndex,
    setActiveTab,
    reorderTab,
    moveTabBetweenWindows,
    tearOutTab,
    mergeWindows,
    isLoading: query.isLoading,
  };
}
