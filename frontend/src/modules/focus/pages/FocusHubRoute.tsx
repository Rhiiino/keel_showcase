// keel_web/src/modules/focus/pages/FocusHubRoute.tsx

// Thin route wrapper that switches between cards and constellation hub pages.

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import {
  FOCUS_HUB_VIEW_MODE_STORAGE_KEY,
  readFocusHubPendingScope,
  type FocusHubNavigationState,
  type FocusHubViewMode,
} from "../lib/focus";
import { FocusCardsPage } from "./FocusCardsPage";
import { FocusConstellationPage } from "./FocusConstellationPage";

function readStoredHubViewMode(): FocusHubViewMode {
  try {
    const stored = window.localStorage.getItem(FOCUS_HUB_VIEW_MODE_STORAGE_KEY);
    return stored === "constellation" ? "constellation" : "cards";
  } catch {
    return "cards";
  }
}

function resolvePendingScopeRootCanvasId(
  locationState: unknown,
): string | null {
  const navState = locationState as FocusHubNavigationState | null;
  if (typeof navState?.scopeRootCanvasId === "string") {
    return navState.scopeRootCanvasId;
  }
  return readFocusHubPendingScope();
}

export function FocusHubRoute() {
  const location = useLocation();
  const [hubViewMode, setHubViewMode] = useState<FocusHubViewMode>(() => {
    const pendingScope = resolvePendingScopeRootCanvasId(location.state);
    return pendingScope ? "constellation" : readStoredHubViewMode();
  });
  const [scopeRootCanvasId, setScopeRootCanvasId] = useState<string | null>(() =>
    resolvePendingScopeRootCanvasId(location.state),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(FOCUS_HUB_VIEW_MODE_STORAGE_KEY, hubViewMode);
    } catch {
      // Ignore storage failures.
    }
  }, [hubViewMode]);

  const openScopedConstellation = useCallback((canvasNodeId: string) => {
    setScopeRootCanvasId(canvasNodeId);
    setHubViewMode("constellation");
  }, []);

  const clearScopedConstellation = useCallback(() => {
    setScopeRootCanvasId(null);
  }, []);

  const handleViewModeChange = useCallback(
    (mode: FocusHubViewMode) => {
      if (mode === "cards") {
        setScopeRootCanvasId(null);
      }
      setHubViewMode(mode);
    },
    [],
  );

  if (hubViewMode === "constellation") {
    return (
      <>
        <div className="px-6 pt-4">
          <RouteNoticeBanner />
        </div>
        <FocusConstellationPage
          viewMode={hubViewMode}
          onViewModeChange={handleViewModeChange}
          scopeRootCanvasId={scopeRootCanvasId}
          onOpenScopedConstellation={openScopedConstellation}
          onClearScopedConstellation={clearScopedConstellation}
        />
      </>
    );
  }

  return (
    <FocusCardsPage
      viewMode={hubViewMode}
      onViewModeChange={handleViewModeChange}
      onOpenScopedConstellation={openScopedConstellation}
    />
  );
}
