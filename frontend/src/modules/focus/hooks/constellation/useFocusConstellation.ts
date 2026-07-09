// keel_web/src/modules/focus/hooks/constellation/useFocusConstellation.ts

// Loads focus data and manages constellation expand/sticky-position state.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import { fetchFocusConstellationLists, fetchFocusEntries, focusQueryKeys } from "../../api";
import {
  buildConstellationIndexes,
  buildVisibleGraph,
  canExpandNodeById,
  collectDescendantExpandedIds,
  collectLineageExpansionLevels,
  entryNodeId,
  layoutConstellationStable,
  listNodeId,
  resolveGraphNodeByIndexes,
  type ConstellationGraphIndexes,
  type ConstellationLayoutNode,
} from "../../lib/constellation/graph";
import {
  collectAncestorCanvasNodeIdsForExpansion,
  resolveCanvasNodeIdFromIndexes,
} from "../../lib/automation/panToNode";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import { useFocusConstellationPersistence } from "./useFocusConstellationPersistence";



// ----- Constellation hook
export function useFocusConstellation() {
  const listsQuery = useQuery({
    queryKey: focusQueryKeys.listsList({ constellation: "all" }),
    queryFn: () => fetchFocusConstellationLists(),
  });

  const entriesQuery = useQuery({
    queryKey: focusQueryKeys.entriesList({}),
    queryFn: () => fetchFocusEntries(),
  });

  const {
    expandedIds,
    setExpandedIds,
    nodePositions,
    setNodePositions,
    workOrderBadgeAngles,
    setWorkOrderBadgeAngles,
    viewport,
    persistViewport,
    flushSave,
    isDirty: isStateDirty,
    isSaving: isStateSaving,
    isStateLoading,
    isStateHydrated,
    isStateError,
  } = useFocusConstellationPersistence();

  const indexes = useMemo<ConstellationGraphIndexes | null>(() => {
    if (!listsQuery.data || !entriesQuery.data) {
      return null;
    }
    return buildConstellationIndexes(listsQuery.data, entriesQuery.data);
  }, [entriesQuery.data, listsQuery.data]);

  const layout = useMemo(() => {
    if (!indexes || !isStateHydrated) {
      return { nodes: [] as ConstellationLayoutNode[], assigned: new Map<string, ConstellationPoint>() };
    }
    return layoutConstellationStable(indexes, expandedIds, nodePositions);
  }, [expandedIds, indexes, isStateHydrated, nodePositions]);

  const layoutNodes = layout.nodes;

  const { edges } = useMemo(() => {
    if (!indexes || !isStateHydrated) {
      return { edges: [] };
    }
    return buildVisibleGraph(indexes, expandedIds);
  }, [expandedIds, indexes, isStateHydrated]);

  // Persist initial positions assigned to brand-new nodes so they become sticky
  // and never recompute when siblings are later added or removed.
  useEffect(() => {
    if (!isStateHydrated || layout.assigned.size === 0) {
      return;
    }
    setNodePositions((current) => {
      let changed = false;
      const next = new Map(current);
      for (const [key, point] of layout.assigned) {
        if (!next.has(key)) {
          next.set(key, point);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [isStateHydrated, layout.assigned, setNodePositions]);

  const toggleExpanded = useCallback(
    (nodeId: string) => {
      if (!indexes) {
        return;
      }

      setExpandedIds((current) => {
        const next = new Set(current);
        if (!canExpandNodeById(nodeId, indexes, current)) {
          return current;
        }
        const { nodesById } = buildVisibleGraph(indexes, current);

        if (next.has(nodeId)) {
          next.delete(nodeId);
          for (const descendantId of collectDescendantExpandedIds(
            nodeId,
            current,
            indexes,
            nodesById,
          )) {
            next.delete(descendantId);
          }
          return next;
        }

        next.add(nodeId);
        return next;
      });
    },
    [indexes, setExpandedIds],
  );

  const expandNode = useCallback(
    (nodeId: string) => {
      if (!indexes) {
        return;
      }

      setExpandedIds((current) => {
        if (current.has(nodeId) || !canExpandNodeById(nodeId, indexes, current)) {
          return current;
        }
        const next = new Set(current);
        next.add(nodeId);
        return next;
      });
    },
    [indexes, setExpandedIds],
  );

  // Fold/unfold a node from external automation. Resolves the canvas id from the
  // graph indexes (a list-link renders as `entry:{id}`, not `list:{id}`) and
  // ensures the origin + container ancestors are expanded so the target is visible.
  const applyAutomationCanvasExpansion = useCallback(
    (focusNodeId: number, expanded: boolean) => {
      if (!indexes) {
        return;
      }

      const canvasNodeId = resolveCanvasNodeIdFromIndexes(focusNodeId, indexes);
      if (!canvasNodeId) {
        return;
      }

      setExpandedIds((current) => {
        if (expanded) {
          const next = new Set(current);
          for (const ancestorId of collectAncestorCanvasNodeIdsForExpansion(
            canvasNodeId,
            indexes,
          )) {
            next.add(ancestorId);
          }
          next.add(canvasNodeId);

          const graphNode = resolveGraphNodeByIndexes(canvasNodeId, indexes);
          if (
            graphNode?.kind === "entry" &&
            graphNode.entryKind === "list_link" &&
            graphNode.linkedListId != null
          ) {
            next.delete(listNodeId(graphNode.linkedListId));
          }

          return next;
        }

        if (!current.has(canvasNodeId)) {
          return current;
        }

        const next = new Set(current);
        next.delete(canvasNodeId);
        const { nodesById } = buildVisibleGraph(indexes, current);
        for (const descendantId of collectDescendantExpandedIds(
          canvasNodeId,
          current,
          indexes,
          nodesById,
        )) {
          next.delete(descendantId);
        }
        return next;
      });
    },
    [indexes, setExpandedIds],
  );

  const expandLineage = useCallback(
    (rootId: string) => {
      if (!indexes) {
        return false;
      }

      const levels = collectLineageExpansionLevels(rootId, indexes, expandedIds);
      if (levels.length === 0) {
        return false;
      }

      setExpandedIds((current) => {
        const next = new Set(current);
        for (const level of levels) {
          for (const nodeId of level) {
            next.add(nodeId);
          }
        }
        return next;
      });
      return true;
    },
    [expandedIds, indexes, setExpandedIds],
  );

  const isExpanded = useCallback(
    (nodeId: string) => expandedIds.has(nodeId),
    [expandedIds],
  );

  const canExpand = useCallback(
    (nodeId: string) => {
      if (!indexes) {
        return false;
      }
      return canExpandNodeById(nodeId, indexes, expandedIds);
    },
    [expandedIds, indexes],
  );

  // Persist the absolute drop position for a node, keyed by its stable position
  // key so it stays put across connect/disconnect (where the node id changes).
  const setNodePosition = useCallback((positionKey: string, position: ConstellationPoint) => {
    setNodePositions((current) => {
      const existing = current.get(positionKey);
      if (existing && existing.x === position.x && existing.y === position.y) {
        return current;
      }
      const next = new Map(current);
      next.set(positionKey, { x: position.x, y: position.y });
      return next;
    });
  }, [setNodePositions]);

  const setNodePositionsBatch = useCallback(
    (updates: ReadonlyArray<{ positionKey: string; position: ConstellationPoint }>) => {
      if (updates.length === 0) {
        return;
      }
      setNodePositions((current) => {
        let changed = false;
        const next = new Map(current);
        for (const { positionKey, position } of updates) {
          const existing = next.get(positionKey);
          if (existing && existing.x === position.x && existing.y === position.y) {
            continue;
          }
          next.set(positionKey, { x: position.x, y: position.y });
          changed = true;
        }
        return changed ? next : current;
      });
    },
    [setNodePositions],
  );

  const setWorkOrderBadgeAngle = useCallback((positionKey: string, angle: number) => {
    setWorkOrderBadgeAngles((current) => {
      const existing = current.get(positionKey);
      if (existing === angle) {
        return current;
      }
      const next = new Map(current);
      next.set(positionKey, angle);
      return next;
    });
  }, [setWorkOrderBadgeAngles]);

  // When a list-link is disconnected, carry its expanded state onto the linked
  // list node so the freed island keeps showing the subtree the user was viewing.
  const detachListLink = useCallback((entryNodeId: string, linkedListId: number) => {
    const listNodeIdValue = listNodeId(linkedListId);
    setExpandedIds((current) => {
      const next = new Set(current);
      const wasExpanded = next.delete(entryNodeId);
      if (wasExpanded) {
        next.add(listNodeIdValue);
      }
      return next;
    });
  }, [setExpandedIds]);

  const preserveExpansionOnRelink = useCallback(
    (targetListId: number, entryId?: number) => {
      setExpandedIds((current) => {
        const next = new Set(current);
        next.add(listNodeId(targetListId));
        if (entryId !== undefined) {
          next.add(entryNodeId(entryId));
        }
        return next;
      });
    },
    [setExpandedIds],
  );

  const transferExpansionAfterStandaloneConnect = useCallback(
    (targetListId: number, linkedListId: number, newEntryId: number) => {
      setExpandedIds((current) => {
        const next = new Set(current);
        next.add(listNodeId(targetListId));
        const wasLinkedListExpanded = next.delete(listNodeId(linkedListId));
        if (wasLinkedListExpanded) {
          next.add(entryNodeId(newEntryId));
        }
        return next;
      });
    },
    [setExpandedIds],
  );

  return {
    indexes,
    layoutNodes,
    edges,
    expandedIds,
    viewport,
    nodePositions,
    workOrderBadgeAngles,
    persistViewport,
    flushSave,
    isStateDirty,
    isStateSaving,
    isLoading: listsQuery.isLoading || entriesQuery.isLoading || isStateLoading || !isStateHydrated,
    isError: listsQuery.isError || entriesQuery.isError || isStateError,
    errorMessage:
      listsQuery.error instanceof Error
        ? listsQuery.error.message
        : entriesQuery.error instanceof Error
          ? entriesQuery.error.message
          : null,
    toggleExpanded,
    expandNode,
    applyAutomationCanvasExpansion,
    expandLineage,
    isExpanded,
    canExpand,
    setNodePosition,
    setNodePositionsBatch,
    setWorkOrderBadgeAngle,
    detachListLink,
    preserveExpansionOnRelink,
    transferExpansionAfterStandaloneConnect,
  };
}
