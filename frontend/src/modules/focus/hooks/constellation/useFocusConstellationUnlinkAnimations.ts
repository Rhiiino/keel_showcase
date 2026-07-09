// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationUnlinkAnimations.ts

// Tracks unlink break waves for constellation nodes and edges.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import {
  isUnlinkWaveActive,
  FOCUS_CONSTELLATION_UNLINK_BREAK_MS,
  resolveUnlinkEdgeVisual,
  resolveUnlinkNodeVisual,
  settledNodeVisual,
  type EdgeVisualState,
  type NodeVisualState,
  type UnlinkWave,
} from "../../lib/constellation/animation";
import type {
  ConstellationEdge,
  ConstellationGraphIndexes,
  ConstellationLayoutNode,
} from "../../lib/constellation/graph";
import { listNodeId } from "../../lib/constellation/graph/ids";
import {
  synthesizeAppearingUnlinkLayoutNode,
  type PendingUnlinkLayoutPromotion,
} from "../../lib/constellation/interaction";

export function buildUnlinkWaveFromNode(
  node: FocusConstellationFlowNode,
  edges: readonly ConstellationEdge[],
): UnlinkWave | null {
  const parentId = node.data.parentId;
  if (!parentId) {
    return null;
  }

  const edge = edges.find(
    (candidate) => candidate.source === parentId && candidate.target === node.id,
  );
  if (!edge) {
    return null;
  }

  const appearingNodeId =
    node.data.linkedListId != null ? listNodeId(node.data.linkedListId) : null;

  return {
    startedAt: performance.now(),
    parentId,
    detachedNodeId: node.id,
    appearingNodeId,
    edgeId: edge.id,
  };
}

export type PendingUnlink = PendingUnlinkLayoutPromotion;

type BeginUnlinkCallbacks = {
  onComplete?: () => void;
  onPromote?: (pending: PendingUnlink) => void;
};

export function useFocusConstellationUnlinkAnimations(
  layoutNodes: readonly ConstellationLayoutNode[],
  edges: readonly ConstellationEdge[],
  indexes: ConstellationGraphIndexes | null,
) {
  const wavesRef = useRef<UnlinkWave[]>([]);
  const collapsingNodesRef = useRef<Map<string, ConstellationLayoutNode>>(new Map());
  const collapsingEdgesRef = useRef<Map<string, ConstellationEdge>>(new Map());
  const pendingUnlinksRef = useRef<Map<string, PendingUnlink>>(new Map());
  const onWaveCompleteRef = useRef<(() => void) | null>(null);
  const [frameTime, setFrameTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsingLayoutNodes, setCollapsingLayoutNodes] = useState<
    ConstellationLayoutNode[]
  >([]);
  const [collapsingEdges, setCollapsingEdges] = useState<ConstellationEdge[]>([]);
  const [pendingUnlinkEdgeIds, setPendingUnlinkEdgeIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const layoutById = useMemo(
    () => new Map(layoutNodes.map((node) => [node.id, node] as const)),
    [layoutNodes],
  );

  const syncCollapsingSnapshots = useCallback(() => {
    setCollapsingLayoutNodes([...collapsingNodesRef.current.values()]);
    setCollapsingEdges([...collapsingEdgesRef.current.values()]);
  }, []);

  const syncPendingUnlinkEdgeIds = useCallback(() => {
    setPendingUnlinkEdgeIds(
      new Set([...pendingUnlinksRef.current.values()].map((entry) => entry.edgeId)),
    );
  }, []);

  const runWaveComplete = useCallback(() => {
    const onComplete = onWaveCompleteRef.current;
    onWaveCompleteRef.current = null;
    onComplete?.();
  }, []);

  const registerPendingUnlink = useCallback(
    (wave: UnlinkWave) => {
      pendingUnlinksRef.current.set(wave.detachedNodeId, {
        edgeId: wave.edgeId,
        detachedNodeId: wave.detachedNodeId,
        appearingNodeId: wave.appearingNodeId,
      });
      syncPendingUnlinkEdgeIds();
    },
    [syncPendingUnlinkEdgeIds],
  );

  const pruneInactiveSnapshots = useCallback((now: number) => {
    const activeNodeIds = new Set<string>();
    const activeEdgeIds = new Set<string>();

    for (const wave of wavesRef.current) {
      if (!isUnlinkWaveActive(wave, now)) {
        continue;
      }
      activeNodeIds.add(wave.detachedNodeId);
      if (wave.appearingNodeId) {
        activeNodeIds.add(wave.appearingNodeId);
      }
      activeEdgeIds.add(wave.edgeId);
    }

    let changed = false;
    for (const wave of wavesRef.current) {
      if (!isUnlinkWaveActive(wave, now)) {
        continue;
      }
      if (
        wave.appearingNodeId &&
        now - wave.startedAt >= FOCUS_CONSTELLATION_UNLINK_BREAK_MS &&
        collapsingNodesRef.current.delete(wave.detachedNodeId)
      ) {
        changed = true;
      }
    }

    for (const nodeId of collapsingNodesRef.current.keys()) {
      if (!activeNodeIds.has(nodeId)) {
        collapsingNodesRef.current.delete(nodeId);
        changed = true;
      }
    }
    for (const edgeId of collapsingEdgesRef.current.keys()) {
      if (!activeEdgeIds.has(edgeId)) {
        collapsingEdgesRef.current.delete(edgeId);
        changed = true;
      }
    }

    if (changed) {
      syncCollapsingSnapshots();
    }
  }, [syncCollapsingSnapshots]);

  const startUnlinkWave = useCallback(
    (wave: UnlinkWave) => {
      const detachedLayout = layoutById.get(wave.detachedNodeId);
      const edge = edges.find((candidate) => candidate.id === wave.edgeId);
      if (detachedLayout) {
        collapsingNodesRef.current.set(wave.detachedNodeId, detachedLayout);
      }
      if (edge) {
        collapsingEdgesRef.current.set(edge.id, edge);
      }
      if (wave.appearingNodeId && detachedLayout) {
        const appearingLayout =
          layoutById.get(wave.appearingNodeId) ??
          (indexes
            ? synthesizeAppearingUnlinkLayoutNode(
                wave.appearingNodeId,
                detachedLayout,
                indexes,
              )
            : null);
        if (appearingLayout) {
          collapsingNodesRef.current.set(wave.appearingNodeId, appearingLayout);
        }
      }

      wavesRef.current = [...wavesRef.current, wave];
      registerPendingUnlink(wave);
      syncCollapsingSnapshots();
      setIsAnimating(true);
      setFrameTime(performance.now());
    },
    [edges, indexes, layoutById, registerPendingUnlink, syncCollapsingSnapshots],
  );

  const beginUnlink = useCallback(
    (
      node: FocusConstellationFlowNode,
      callbacks?: BeginUnlinkCallbacks,
    ) => {
      const wave = buildUnlinkWaveFromNode(node, edges);
      if (!wave) {
        callbacks?.onComplete?.();
        return false;
      }

      const now = performance.now();
      const activeWave = wavesRef.current.find(
        (candidate) =>
          candidate.detachedNodeId === node.id && isUnlinkWaveActive(candidate, now),
      );
      const pending = pendingUnlinksRef.current.get(node.id);

      if (activeWave) {
        registerPendingUnlink(activeWave);
        if (callbacks?.onComplete || callbacks?.onPromote) {
          const previous = onWaveCompleteRef.current;
          onWaveCompleteRef.current = () => {
            previous?.();
            const promotion = pendingUnlinksRef.current.get(node.id);
            if (promotion) {
              callbacks?.onPromote?.(promotion);
            }
            callbacks?.onComplete?.();
          };
        }
        return true;
      }

      if (pending) {
        callbacks?.onPromote?.(pending);
        callbacks?.onComplete?.();
        return true;
      }

      if (callbacks?.onComplete || callbacks?.onPromote) {
        onWaveCompleteRef.current = () => {
          const promotion = pendingUnlinksRef.current.get(node.id);
          if (promotion) {
            callbacks?.onPromote?.(promotion);
          }
          callbacks?.onComplete?.();
        };
      }
      startUnlinkWave(wave);
      return true;
    },
    [edges, registerPendingUnlink, startUnlinkWave],
  );

  const cancelUnlinkForNode = useCallback(
    (nodeId: string) => {
      const pending = pendingUnlinksRef.current.get(nodeId);
      if (!pending) {
        return;
      }

      pendingUnlinksRef.current.delete(nodeId);
      syncPendingUnlinkEdgeIds();
      wavesRef.current = wavesRef.current.filter((wave) => wave.detachedNodeId !== nodeId);
      collapsingNodesRef.current.delete(nodeId);
      if (pending.appearingNodeId) {
        collapsingNodesRef.current.delete(pending.appearingNodeId);
      }
      collapsingEdgesRef.current.delete(pending.edgeId);
      syncCollapsingSnapshots();

      if (wavesRef.current.length === 0) {
        setIsAnimating(false);
        onWaveCompleteRef.current = null;
      }
    },
    [syncCollapsingSnapshots, syncPendingUnlinkEdgeIds],
  );

  const commitPendingUnlinks = useCallback(
    (
      currentEdges: readonly ConstellationEdge[],
      currentLayoutNodes: readonly ConstellationLayoutNode[],
    ) => {
      let changed = false;
      for (const [detachedNodeId, pending] of pendingUnlinksRef.current.entries()) {
        const edgeStillExists = currentEdges.some((edge) => edge.id === pending.edgeId);
        const detachedStillExists = currentLayoutNodes.some(
          (node) => node.id === pending.detachedNodeId,
        );
        const appearingExists =
          pending.appearingNodeId !== null &&
          currentLayoutNodes.some((node) => node.id === pending.appearingNodeId);
        const detachedStandalone = currentLayoutNodes.some(
          (node) => node.id === pending.detachedNodeId && node.parentId === null,
        );

        const isComplete =
          !edgeStillExists &&
          (appearingExists ||
            detachedStandalone ||
            (!detachedStillExists && pending.appearingNodeId === null));

        if (isComplete) {
          pendingUnlinksRef.current.delete(detachedNodeId);
          changed = true;
        }
      }

      if (changed) {
        syncPendingUnlinkEdgeIds();
      }
    },
    [syncPendingUnlinkEdgeIds],
  );

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      setFrameTime(now);
      wavesRef.current = wavesRef.current.filter((wave) => isUnlinkWaveActive(wave, now));
      pruneInactiveSnapshots(now);

      if (wavesRef.current.length > 0) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      setIsAnimating(false);
      runWaveComplete();
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isAnimating, pruneInactiveSnapshots, runWaveComplete]);

  const getActiveWaves = useCallback((now: number) => {
    return wavesRef.current.filter((wave) => isUnlinkWaveActive(wave, now));
  }, []);

  const getUnlinkNodeVisual = useCallback(
    (nodeId: string): NodeVisualState | null => {
      const now = frameTime > 0 ? frameTime : performance.now();
      const activeWaves = getActiveWaves(now);
      if (activeWaves.length > 0) {
        const activeVisual = resolveUnlinkNodeVisual(nodeId, activeWaves);
        if (activeVisual) {
          return activeVisual;
        }
      }

      for (const pending of pendingUnlinksRef.current.values()) {
        if (pending.detachedNodeId === nodeId || pending.appearingNodeId === nodeId) {
          return settledNodeVisual();
        }
      }

      return null;
    },
    [frameTime, getActiveWaves],
  );

  const getUnlinkEdgeVisual = useCallback(
    (edgeId: string): EdgeVisualState | null => {
      const now = frameTime > 0 ? frameTime : performance.now();
      const activeWaves = getActiveWaves(now);
      if (activeWaves.length > 0) {
        const activeVisual = resolveUnlinkEdgeVisual(edgeId, activeWaves, now);
        if (activeVisual) {
          return activeVisual;
        }
      }

      for (const pending of pendingUnlinksRef.current.values()) {
        if (pending.edgeId === edgeId) {
          return { visible: false, drawProgress: 0 };
        }
      }

      return null;
    },
    [frameTime, getActiveWaves],
  );

  return {
    beginUnlink,
    cancelUnlinkForNode,
    commitPendingUnlinks,
    isAnimating,
    collapsingLayoutNodes,
    collapsingEdges,
    pendingUnlinkEdgeIds,
    getUnlinkNodeVisual,
    getUnlinkEdgeVisual,
  };
}
