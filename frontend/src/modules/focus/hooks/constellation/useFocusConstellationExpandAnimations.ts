// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationExpandAnimations.ts

// Tracks expand/collapse waves and resolves per-node / per-edge animation state.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import {
  collapsedHiddenEdgeVisual,
  collapsedHiddenNodeVisual,
  isWaveActive,
  resolveEdgeVisualState,
  resolveNodeVisualState,
  settledEdgeVisual,
  settledNodeVisual,
  type EdgeVisualState,
  type ExpandWave,
  type NodeVisualState,
} from "../../lib/constellation/animation";
import type { ConstellationEdge, ConstellationLayoutNode } from "../../lib/constellation/graph";



function expandedIdsEqual(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const id of left) {
    if (!right.has(id)) {
      return false;
    }
  }
  return true;
}



function hasActiveExpandReveal(
  id: string,
  waves: readonly ExpandWave[],
  now: number,
  kind: "node" | "edge",
): boolean {
  for (const wave of waves) {
    if (wave.direction !== "expand" || !isWaveActive(wave, now)) {
      continue;
    }
    const ids = kind === "node" ? wave.childIds : wave.edgeIds;
    if (ids.includes(id)) {
      return true;
    }
  }
  return false;
}



function syncExpandCollapseWaves({
  expandedIds,
  layoutNodes,
  edges,
  wavesRef,
  collapsingNodesRef,
  collapsingEdgesRef,
  revealingChildIdsRef,
  revealingEdgeIdsRef,
  prevExpandedRef,
  prevLayoutNodesRef,
  prevEdgesRef,
}: {
  expandedIds: ReadonlySet<string>;
  layoutNodes: readonly ConstellationLayoutNode[];
  edges: readonly ConstellationEdge[];
  wavesRef: MutableRefObject<ExpandWave[]>;
  collapsingNodesRef: MutableRefObject<Map<string, ConstellationLayoutNode>>;
  collapsingEdgesRef: MutableRefObject<Map<string, ConstellationEdge>>;
  revealingChildIdsRef: MutableRefObject<Set<string>>;
  revealingEdgeIdsRef: MutableRefObject<Set<string>>;
  prevExpandedRef: MutableRefObject<Set<string>>;
  prevLayoutNodesRef: MutableRefObject<readonly ConstellationLayoutNode[]>;
  prevEdgesRef: MutableRefObject<readonly ConstellationEdge[]>;
}): boolean {
  const previous = prevExpandedRef.current;
  const previousLayout = prevLayoutNodesRef.current;
  const previousEdges = prevEdgesRef.current;
  const newlyExpanded = [...expandedIds].filter((id) => !previous.has(id));
  const collapsed = [...previous].filter((id) => !expandedIds.has(id));
  let startedAnimation = false;
  const startedAt = performance.now();

  if (collapsed.length > 0) {
    wavesRef.current = wavesRef.current.filter((wave) => expandedIds.has(wave.expanderId));

    const currentNodeIds = new Set(layoutNodes.map((node) => node.id));
    const currentEdgeIds = new Set(edges.map((edge) => edge.id));

    for (const expanderId of collapsed) {
      const previousExpander = previousLayout.find((node) => node.id === expanderId);
      const currentExpander = layoutNodes.find((node) => node.id === expanderId);
      if (!previousExpander) {
        continue;
      }

      const disappearingNodes = previousLayout.filter((node) => !currentNodeIds.has(node.id));
      const disappearingEdges = previousEdges.filter((edge) => !currentEdgeIds.has(edge.id));
      if (disappearingNodes.length === 0 && disappearingEdges.length === 0) {
        continue;
      }

      for (const node of disappearingNodes) {
        collapsingNodesRef.current.set(node.id, node);
      }
      for (const edge of disappearingEdges) {
        collapsingEdgesRef.current.set(edge.id, edge);
      }

      const pushFrom =
        previousExpander.collapsedPosition !== null ? previousExpander.position : null;
      const pushTo =
        currentExpander?.collapsedPosition ??
        currentExpander?.position ??
        previousExpander.collapsedPosition ??
        previousExpander.position;

      wavesRef.current.push({
        direction: "collapse",
        expanderId,
        startedAt,
        pushFrom,
        pushTo,
        childIds: disappearingNodes.map((node) => node.id),
        edgeIds: disappearingEdges.map((edge) => edge.id),
      });
      startedAnimation = true;
    }
  }

  for (const expanderId of newlyExpanded) {
    const expander = layoutNodes.find((node) => node.id === expanderId);
    if (!expander) {
      continue;
    }

    const childEdges = edges.filter((edge) => edge.source === expanderId);
    const childIds = childEdges.map((edge) => edge.target);
    const edgeIds = childEdges.map((edge) => edge.id);
    for (const childId of childIds) {
      revealingChildIdsRef.current.add(childId);
    }
    for (const edgeId of edgeIds) {
      revealingEdgeIdsRef.current.add(edgeId);
    }
    wavesRef.current.push({
      direction: "expand",
      expanderId,
      startedAt,
      pushFrom: expander.collapsedPosition,
      pushTo: expander.position,
      childIds,
      edgeIds,
    });
    startedAnimation = true;
  }

  prevExpandedRef.current = new Set(expandedIds);
  prevLayoutNodesRef.current = layoutNodes;
  prevEdgesRef.current = edges;

  return startedAnimation;
}



export function useFocusConstellationExpandAnimations(
  expandedIds: ReadonlySet<string>,
  layoutNodes: readonly ConstellationLayoutNode[],
  edges: readonly ConstellationEdge[],
  suppressAnimations = false,
) {
  const wavesRef = useRef<ExpandWave[]>([]);
  const prevExpandedRef = useRef<Set<string>>(new Set());
  const prevLayoutNodesRef = useRef<readonly ConstellationLayoutNode[]>([]);
  const prevEdgesRef = useRef<readonly ConstellationEdge[]>([]);
  const collapsingNodesRef = useRef<Map<string, ConstellationLayoutNode>>(new Map());
  const collapsingEdgesRef = useRef<Map<string, ConstellationEdge>>(new Map());
  const revealingChildIdsRef = useRef<Set<string>>(new Set());
  const revealingEdgeIdsRef = useRef<Set<string>>(new Set());
  const skipNextExpandAnimationRef = useRef(false);
  const pendingAnimationStartRef = useRef(false);
  const hasInitializedGraphRef = useRef(false);
  const [frameTime, setFrameTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsingRevision, setCollapsingRevision] = useState(0);

  const graphInputsChanged =
    !expandedIdsEqual(prevExpandedRef.current, expandedIds) ||
    prevLayoutNodesRef.current !== layoutNodes ||
    prevEdgesRef.current !== edges;

  if (!skipNextExpandAnimationRef.current && graphInputsChanged) {
    if (!hasInitializedGraphRef.current) {
      hasInitializedGraphRef.current = true;
      prevExpandedRef.current = new Set(expandedIds);
      prevLayoutNodesRef.current = layoutNodes;
      prevEdgesRef.current = edges;
    } else if (
      syncExpandCollapseWaves({
        expandedIds,
        layoutNodes,
        edges,
        wavesRef,
        collapsingNodesRef,
        collapsingEdgesRef,
        revealingChildIdsRef,
        revealingEdgeIdsRef,
        prevExpandedRef,
        prevLayoutNodesRef,
        prevEdgesRef,
      })
    ) {
      pendingAnimationStartRef.current = true;
    }
  }

  const collapsingLayoutNodes = useMemo(
    () => [...collapsingNodesRef.current.values()],
    [collapsingRevision, edges, expandedIds, layoutNodes],
  );

  const collapsingEdges = useMemo(
    () => [...collapsingEdgesRef.current.values()],
    [collapsingRevision, edges, expandedIds, layoutNodes],
  );

  const positionsById = useMemo(() => {
    const positions = new Map(layoutNodes.map((node) => [node.id, node.position] as const));
    for (const node of collapsingLayoutNodes) {
      positions.set(node.id, node.position);
    }
    return positions;
  }, [collapsingLayoutNodes, layoutNodes]);

  const bumpCollapsingRevision = useCallback(() => {
    setCollapsingRevision((current) => current + 1);
  }, []);

  const clearCollapsingSnapshots = useCallback(() => {
    if (
      collapsingNodesRef.current.size === 0 &&
      collapsingEdgesRef.current.size === 0
    ) {
      return;
    }
    collapsingNodesRef.current.clear();
    collapsingEdgesRef.current.clear();
    bumpCollapsingRevision();
  }, [bumpCollapsingRevision]);

  useLayoutEffect(() => {
    if (skipNextExpandAnimationRef.current) {
      skipNextExpandAnimationRef.current = false;
      prevExpandedRef.current = new Set(expandedIds);
      prevLayoutNodesRef.current = layoutNodes;
      prevEdgesRef.current = edges;
      return;
    }

    if (!pendingAnimationStartRef.current) {
      return;
    }

    pendingAnimationStartRef.current = false;
    bumpCollapsingRevision();
    setIsAnimating(true);
    setFrameTime(performance.now());
  }, [bumpCollapsingRevision, edges, expandedIds, layoutNodes]);

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      setFrameTime(now);
      wavesRef.current = wavesRef.current.filter((wave) => isWaveActive(wave, now));
      const activeChildIds = new Set<string>();
      const activeEdgeIds = new Set<string>();
      for (const wave of wavesRef.current) {
        if (wave.direction !== "expand") {
          continue;
        }
        for (const childId of wave.childIds) {
          activeChildIds.add(childId);
        }
        for (const edgeId of wave.edgeIds) {
          activeEdgeIds.add(edgeId);
        }
      }
      for (const childId of revealingChildIdsRef.current) {
        if (!activeChildIds.has(childId)) {
          revealingChildIdsRef.current.delete(childId);
        }
      }
      for (const edgeId of revealingEdgeIdsRef.current) {
        if (!activeEdgeIds.has(edgeId)) {
          revealingEdgeIdsRef.current.delete(edgeId);
        }
      }
      const stillActive = wavesRef.current.length > 0;
      if (stillActive) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }
      setIsAnimating(false);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isAnimating]);

  useLayoutEffect(() => {
    if (isAnimating) {
      return;
    }
    clearCollapsingSnapshots();
  }, [clearCollapsingSnapshots, isAnimating]);

  const getActiveWaves = useCallback((now: number) => {
    return wavesRef.current.filter((wave) => isWaveActive(wave, now));
  }, []);

  const getNodeVisual = useCallback(
    (nodeId: string): NodeVisualState => {
      if (suppressAnimations) {
        return settledNodeVisual();
      }

      const now = performance.now();
      const activeWaves = getActiveWaves(now);
      const isNodeInActiveWave = activeWaves.some((wave) => {
        if (wave.expanderId === nodeId && wave.pushFrom) {
          return true;
        }
        return wave.childIds.includes(nodeId);
      });

      if (isNodeInActiveWave) {
        return resolveNodeVisualState(nodeId, activeWaves, now, positionsById);
      }

      if (revealingChildIdsRef.current.has(nodeId)) {
        if (hasActiveExpandReveal(nodeId, wavesRef.current, now, "node")) {
          return collapsedHiddenNodeVisual();
        }
        revealingChildIdsRef.current.delete(nodeId);
      }

      if (collapsingNodesRef.current.has(nodeId)) {
        return collapsedHiddenNodeVisual();
      }

      return settledNodeVisual();
    },
    [getActiveWaves, positionsById, suppressAnimations],
  );

  const getEdgeVisual = useCallback(
    (edgeId: string): EdgeVisualState => {
      if (suppressAnimations) {
        return settledEdgeVisual();
      }

      const now = performance.now();
      const activeWaves = getActiveWaves(now);
      const isEdgeInActiveWave = activeWaves.some((wave) =>
        wave.edgeIds.includes(edgeId),
      );

      if (isEdgeInActiveWave) {
        return resolveEdgeVisualState(edgeId, activeWaves, now);
      }

      if (revealingEdgeIdsRef.current.has(edgeId)) {
        if (hasActiveExpandReveal(edgeId, wavesRef.current, now, "edge")) {
          return collapsedHiddenEdgeVisual();
        }
        revealingEdgeIdsRef.current.delete(edgeId);
      }

      if (collapsingEdgesRef.current.has(edgeId)) {
        return collapsedHiddenEdgeVisual();
      }

      return settledEdgeVisual();
    },
    [getActiveWaves, suppressAnimations],
  );

  const skipExpandAnimations = useCallback(() => {
    skipNextExpandAnimationRef.current = true;
    pendingAnimationStartRef.current = false;
    wavesRef.current = [];
    collapsingNodesRef.current.clear();
    collapsingEdgesRef.current.clear();
    revealingChildIdsRef.current.clear();
    revealingEdgeIdsRef.current.clear();
    bumpCollapsingRevision();
    setIsAnimating(false);
  }, [bumpCollapsingRevision]);

  return {
    getNodeVisual,
    getEdgeVisual,
    isAnimating,
    frameTime,
    skipExpandAnimations,
    collapsingLayoutNodes,
    collapsingEdges,
  };
}
