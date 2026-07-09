// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationScopedGraph.ts

import { useMemo } from "react";

import { resolveCanvasNodeIdFromIndexes } from "../../lib/automation/panToNode";
import {
  buildScopedVisibleGraph,
  filterLayoutNodesToScope,
  resolveGraphNodeByIndexes,
} from "../../lib/constellation/graph";
import { focusNodeIdFromScopeCanvasId } from "../../lib/constellation/scope";
import type { useFocusConstellation } from "./useFocusConstellation";

function resolveEffectiveScopeRootCanvasId(
  scopeRootCanvasId: string,
  indexes: NonNullable<ReturnType<typeof useFocusConstellation>["indexes"]>,
): string {
  const focusNodeId = focusNodeIdFromScopeCanvasId(scopeRootCanvasId);
  if (focusNodeId === null) {
    return scopeRootCanvasId;
  }

  return resolveCanvasNodeIdFromIndexes(focusNodeId, indexes) ?? scopeRootCanvasId;
}

export function useFocusConstellationScopedGraph(
  constellation: ReturnType<typeof useFocusConstellation>,
  scopeRootCanvasId: string | null,
) {
  const { layoutNodes, edges, indexes, expandedIds } = constellation;

  return useMemo(() => {
    if (!scopeRootCanvasId || !indexes) {
      return {
        layoutNodes,
        edges,
        isScoped: false,
        scopeRootTitle: null as string | null,
        scopeRootCanvasId: null as string | null,
      };
    }

    const effectiveScopeRootId = resolveEffectiveScopeRootCanvasId(
      scopeRootCanvasId,
      indexes,
    );

    const scoped = buildScopedVisibleGraph(effectiveScopeRootId, indexes, expandedIds);
    if (!scoped) {
      return {
        layoutNodes,
        edges,
        isScoped: false,
        scopeRootTitle: null as string | null,
        scopeRootCanvasId: null as string | null,
      };
    }

    const scopedNodeIds = new Set(scoped.nodesById.keys());
    const scopeRoot =
      scoped.nodesById.get(effectiveScopeRootId) ??
      resolveGraphNodeByIndexes(effectiveScopeRootId, indexes);

    return {
      layoutNodes: filterLayoutNodesToScope(layoutNodes, scopedNodeIds),
      edges: scoped.edges,
      isScoped: true,
      scopeRootTitle: scopeRoot?.title ?? null,
      scopeRootCanvasId: effectiveScopeRootId,
    };
  }, [edges, expandedIds, indexes, layoutNodes, scopeRootCanvasId]);
}
