// keel_web/src/modules/focus/hooks/constellation/useFocusScopedConstellationInit.ts

import { useEffect, useRef } from "react";

import { resolveCanvasNodeIdFromIndexes } from "../../lib/automation/panToNode";
import { focusNodeIdFromScopeCanvasId } from "../../lib/constellation/scope";
import type { useFocusConstellation } from "./useFocusConstellation";

/** Expand and normalize scope when opening from forms/cards (list id vs list-link entry id). */
export function useFocusScopedConstellationInit({
  scopeRootCanvasId,
  constellation,
  onOpenScopedConstellation,
}: {
  scopeRootCanvasId: string | null;
  constellation: ReturnType<typeof useFocusConstellation>;
  onOpenScopedConstellation: (canvasNodeId: string) => void;
}) {
  const initializedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scopeRootCanvasId) {
      initializedScopeRef.current = null;
    }
  }, [scopeRootCanvasId]);

  useEffect(() => {
    if (!scopeRootCanvasId || constellation.isLoading || !constellation.indexes) {
      return;
    }

    if (initializedScopeRef.current === scopeRootCanvasId) {
      return;
    }

    const focusNodeId = focusNodeIdFromScopeCanvasId(scopeRootCanvasId);
    if (focusNodeId === null) {
      return;
    }

    constellation.applyAutomationCanvasExpansion(focusNodeId, true);

    const resolvedCanvasId = resolveCanvasNodeIdFromIndexes(
      focusNodeId,
      constellation.indexes,
    );
    const effectiveScopeId = resolvedCanvasId ?? scopeRootCanvasId;
    initializedScopeRef.current = effectiveScopeId;

    if (resolvedCanvasId && resolvedCanvasId !== scopeRootCanvasId) {
      onOpenScopedConstellation(resolvedCanvasId);
    }
  }, [
    constellation.applyAutomationCanvasExpansion,
    constellation.indexes,
    constellation.isLoading,
    onOpenScopedConstellation,
    scopeRootCanvasId,
  ]);
}
