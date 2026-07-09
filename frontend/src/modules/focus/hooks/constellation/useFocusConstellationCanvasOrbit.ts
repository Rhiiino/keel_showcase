// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasOrbit.ts

import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import type {
  FocusConstellationManualOrbitSession,
  FocusConstellationRenderGraph,
} from "../../components/constellation/canvas";
import {
  bakeOrbitAngleIntoPositions,
  bakeSubtreeOrbitAngleFromSnapshot,
  bakeSubtreeOrbitAngleIntoPositions,
  composeNodeVisual,
} from "../../lib/constellation/animation";
import {
  collectDescendantNodeIds,
  collectGraphDescendantNodeIds,
  positionKeyForNode,
  resolveGraphNodeByIndexes,
  type ConstellationGraphIndexes,
} from "../../lib/constellation/graph";
import type { ConstellationLayoutNode } from "../../lib/constellation/graph";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import {
  snapshotConstellationSubtreePositions,
  type PendingUnlinkLayoutPromotion,
} from "../../lib/constellation/interaction";
import { useFocusConstellationExpandAnimations } from "./useFocusConstellationExpandAnimations";
import { useFocusConstellationUnlinkAnimations } from "./useFocusConstellationUnlinkAnimations";
import { useFocusConstellationAlignAnimations } from "./useFocusConstellationAlignAnimations";
import {
  useFocusConstellationOrbitAnimation,
  type ManualOrbitState,
} from "./useFocusConstellationOrbitAnimation";
import type { useFocusConstellation } from "./useFocusConstellation";



// ----- Manual orbit and animation
export function useFocusConstellationCanvasOrbit({
  renderGraph,
  layoutNodesForRender,
  expandedIds,
  graphEdges,
  relationshipMutationPending,
  indexes,
  nodePositions,
  orbitPlaying,
  isNodeDragging,
  automationLocked = false,
  nodesRef,
  setNodes,
  setNodePositionsBatch,
  closeAllContextMenus,
  suppressNodeClickRef,
  manualOrbitRef: externalManualOrbitRef,
  applyUnlinkPromotion,
}: {
  renderGraph: FocusConstellationRenderGraph;
  layoutNodesForRender: ConstellationLayoutNode[];
  expandedIds: ReadonlySet<string>;
  graphEdges: FocusConstellationRenderGraph["edges"];
  relationshipMutationPending: boolean;
  indexes: ConstellationGraphIndexes | null;
  nodePositions: ReadonlyMap<string, ConstellationPoint>;
  orbitPlaying: boolean;
  isNodeDragging: boolean;
  automationLocked?: boolean;
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  setNodes: React.Dispatch<React.SetStateAction<FocusConstellationFlowNode[]>>;
  setNodePositionsBatch: ReturnType<typeof useFocusConstellation>["setNodePositionsBatch"];
  closeAllContextMenus: () => void;
  suppressNodeClickRef: MutableRefObject<boolean>;
  manualOrbitRef: MutableRefObject<ManualOrbitState | null>;
  applyUnlinkPromotion: (pending: PendingUnlinkLayoutPromotion) => void;
}) {
  const [manualOrbitPivotId, setManualOrbitPivotId] = useState<string | null>(null);
  const manualOrbitRef = externalManualOrbitRef;
  const manualOrbitSessionRef = useRef<FocusConstellationManualOrbitSession | null>(null);
  const orbitWindowListenersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);
  const orbitPlayingRef = useRef(orbitPlaying);
  const { screenToFlowPosition } = useReactFlow();

  const {
    getNodeVisual: getExpandNodeVisual,
    getEdgeVisual: getExpandEdgeVisual,
    frameTime: expandFrameTime,
    skipExpandAnimations,
    collapsingLayoutNodes: expandCollapsingLayoutNodes,
    collapsingEdges: expandCollapsingEdges,
  } = useFocusConstellationExpandAnimations(
    relationshipMutationPending ? renderGraph.expandedIds : expandedIds,
    layoutNodesForRender,
    relationshipMutationPending ? renderGraph.edges : graphEdges,
    isNodeDragging,
  );

  const {
    beginUnlink,
    cancelUnlinkForNode,
    commitPendingUnlinks,
    isAnimating: isUnlinkAnimating,
    collapsingLayoutNodes: unlinkCollapsingLayoutNodes,
    collapsingEdges: unlinkCollapsingEdges,
    pendingUnlinkEdgeIds,
    getUnlinkNodeVisual,
    getUnlinkEdgeVisual,
  } = useFocusConstellationUnlinkAnimations(
    renderGraph.layoutNodes,
    renderGraph.edges,
    indexes,
  );

  const beginUnlinkWithPromotion = useCallback(
    (
      node: FocusConstellationFlowNode,
      callbacks?: {
        onComplete?: () => void;
        onPromote?: (pending: PendingUnlinkLayoutPromotion) => void;
      },
    ) => {
      return beginUnlink(node, {
        ...callbacks,
        onPromote: (pending) => {
          applyUnlinkPromotion(pending);
          callbacks?.onPromote?.(pending);
        },
      });
    },
    [applyUnlinkPromotion, beginUnlink],
  );

  const collapsingLayoutNodes = useMemo(() => {
    const layoutById = new Map<string, ConstellationLayoutNode>();
    for (const node of expandCollapsingLayoutNodes) {
      layoutById.set(node.id, node);
    }
    for (const node of unlinkCollapsingLayoutNodes) {
      if (!layoutById.has(node.id)) {
        layoutById.set(node.id, node);
      }
    }
    return [...layoutById.values()];
  }, [expandCollapsingLayoutNodes, unlinkCollapsingLayoutNodes]);

  const collapsingEdges = useMemo(() => {
    const edgeById = new Map<string, (typeof expandCollapsingEdges)[number]>();
    for (const edge of expandCollapsingEdges) {
      edgeById.set(edge.id, edge);
    }
    for (const edge of unlinkCollapsingEdges) {
      if (!edgeById.has(edge.id)) {
        edgeById.set(edge.id, edge);
      }
    }
    return [...edgeById.values()];
  }, [expandCollapsingEdges, unlinkCollapsingEdges]);

  const displayLayoutNodes = useMemo(() => {
    if (collapsingLayoutNodes.length === 0) {
      return layoutNodesForRender;
    }
    const layoutById = new Map(layoutNodesForRender.map((node) => [node.id, node] as const));
    for (const node of collapsingLayoutNodes) {
      if (!layoutById.has(node.id)) {
        layoutById.set(node.id, node);
      }
    }
    return [...layoutById.values()];
  }, [collapsingLayoutNodes, layoutNodesForRender]);

  const displayRenderGraph = useMemo(
    () => ({
      ...renderGraph,
      edges:
        collapsingEdges.length === 0
          ? renderGraph.edges
          : [
              ...renderGraph.edges,
              ...collapsingEdges.filter(
                (edge) => !renderGraph.edges.some((current) => current.id === edge.id),
              ),
            ],
    }),
    [collapsingEdges, renderGraph],
  );

  const {
    getOrbitNodeVisual,
    frameTime: orbitFrameTime,
    isAnimating: isOrbitAnimating,
    getOrbitAngleRadians,
    resetOrbitAngle,
    setManualOrbitAngle,
  } = useFocusConstellationOrbitAnimation({
    layoutNodes: layoutNodesForRender,
    isPlaying: orbitPlaying,
    isDragging: isNodeDragging,
    manualOrbitRef,
  });

  const {
    alignChildrenAround,
    getAlignNodeVisualOffset,
    isAlignAnimating,
  } = useFocusConstellationAlignAnimations({
    layoutNodes: layoutNodesForRender,
    edges: renderGraph.edges,
    indexes,
    nodePositions,
    nodesRef,
    setNodes,
    setNodePositionsBatch,
    skipExpandAnimations,
  });

  const nodesLocked =
    isOrbitAnimating ||
    isAlignAnimating ||
    (isUnlinkAnimating && !isNodeDragging) ||
    automationLocked;
  const activeOrbitHandleNodeId = manualOrbitPivotId;

  const applyBakedPositions = useCallback(
    (bakedPositions: Array<{ positionKey: string; position: { x: number; y: number } }>) => {
      if (bakedPositions.length === 0) {
        return;
      }

      const bakedByKey = new Map(
        bakedPositions.map((entry) => [entry.positionKey, entry.position] as const),
      );
      setNodes((current) =>
        current.map((node) => {
          const bakedPosition = bakedByKey.get(positionKeyForNode(node.data));
          return bakedPosition ? { ...node, position: bakedPosition } : node;
        }),
      );
      setNodePositionsBatch(bakedPositions);
    },
    [setNodePositionsBatch, setNodes],
  );

  const commitGlobalOrbitAngleToLayout = useCallback(() => {
    const angleRadians = getOrbitAngleRadians();
    const bakedPositions = bakeOrbitAngleIntoPositions(
      layoutNodesForRender,
      angleRadians,
      positionKeyForNode,
    );
    resetOrbitAngle();
    applyBakedPositions(bakedPositions);
  }, [
    applyBakedPositions,
    getOrbitAngleRadians,
    layoutNodesForRender,
    resetOrbitAngle,
  ]);

  const commitManualOrbitAngleToLayout = useCallback(
    (session: FocusConstellationManualOrbitSession) => {
      const angleRadians = getOrbitAngleRadians();
      const bakedPositions = indexes
        ? bakeSubtreeOrbitAngleFromSnapshot(
            session.pivotPosition,
            angleRadians,
            session.descendantIds,
            session.descendantStartPositions,
            (nodeId) => {
              const graphNode = resolveGraphNodeByIndexes(nodeId, indexes);
              return graphNode ? positionKeyForNode(graphNode) : null;
            },
          )
        : bakeSubtreeOrbitAngleIntoPositions(
            layoutNodesForRender,
            session.pivotNodeId,
            session.descendantIds,
            angleRadians,
            positionKeyForNode,
          );
      resetOrbitAngle();
      applyBakedPositions(bakedPositions);
    },
    [
      applyBakedPositions,
      getOrbitAngleRadians,
      indexes,
      layoutNodesForRender,
      resetOrbitAngle,
    ],
  );

  const pointerAngleFromClient = useCallback(
    (clientX: number, clientY: number, pivotCenter: { x: number; y: number }) => {
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      return Math.atan2(
        flowPosition.y - pivotCenter.y,
        flowPosition.x - pivotCenter.x,
      );
    },
    [screenToFlowPosition],
  );

  const detachOrbitWindowListeners = useCallback(() => {
    const listeners = orbitWindowListenersRef.current;
    if (!listeners) {
      return;
    }
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.up);
    orbitWindowListenersRef.current = null;
  }, []);

  const onOrbitHandleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      const session = manualOrbitSessionRef.current;
      if (!session) {
        return;
      }

      const pointerAngle = pointerAngleFromClient(
        clientX,
        clientY,
        session.pivotPosition,
      );
      let delta = pointerAngle - session.pointerStartAngle;
      while (delta > Math.PI) {
        delta -= Math.PI * 2;
      }
      while (delta < -Math.PI) {
        delta += Math.PI * 2;
      }
      setManualOrbitAngle(session.startAngle + delta);
    },
    [pointerAngleFromClient, setManualOrbitAngle],
  );

  const onOrbitHandleDragEnd = useCallback(() => {
    detachOrbitWindowListeners();
    const session = manualOrbitSessionRef.current;
    manualOrbitSessionRef.current = null;
    manualOrbitRef.current = null;
    setManualOrbitPivotId(null);
    suppressNodeClickRef.current = true;
    if (session) {
      commitManualOrbitAngleToLayout(session);
    }
  }, [commitManualOrbitAngleToLayout, detachOrbitWindowListeners, suppressNodeClickRef]);

  const onOrbitHandleDragStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const pivotNode = layoutNodesForRender.find((node) => node.id === nodeId);
      if (!pivotNode) {
        return;
      }

      const descendantIds = new Set(
        indexes
          ? collectGraphDescendantNodeIds(nodeId, indexes)
          : collectDescendantNodeIds(nodeId, nodesRef.current),
      );
      const pivotPosition = { ...pivotNode.position };
      const subtreeStartPositions = indexes
        ? snapshotConstellationSubtreePositions({
            rootId: nodeId,
            indexes,
            liveNodes: nodesRef.current,
            storedPositions: nodePositions,
          })
        : new Map([[nodeId, pivotPosition]]);
      const descendantStartPositions = indexes
        ? new Map(
            [...subtreeStartPositions.entries()].filter(([id]) => id !== nodeId),
          )
        : new Map(
            [...descendantIds]
              .map((id) => {
                const liveNode = nodesRef.current.find((node) => node.id === id);
                return liveNode ? ([id, { ...liveNode.position }] as const) : null;
              })
              .filter((entry): entry is readonly [string, { x: number; y: number }] => entry !== null),
          );
      const orbitState: ManualOrbitState = {
        pivotNodeId: nodeId,
        pivotPosition,
        descendantIds,
      };

      manualOrbitSessionRef.current = {
        pivotNodeId: nodeId,
        pivotPosition,
        descendantIds,
        descendantStartPositions,
        startAngle: getOrbitAngleRadians(),
        pointerStartAngle: pointerAngleFromClient(clientX, clientY, pivotPosition),
      };
      manualOrbitRef.current = orbitState;
      setManualOrbitPivotId(nodeId);
      setManualOrbitAngle(getOrbitAngleRadians());
      closeAllContextMenus();

      detachOrbitWindowListeners();
      const onMove = (event: PointerEvent) => {
        onOrbitHandleDragMove(event.clientX, event.clientY);
      };
      const onUp = (event: PointerEvent) => {
        event.preventDefault();
        onOrbitHandleDragEnd();
      };
      orbitWindowListenersRef.current = { move: onMove, up: onUp };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      closeAllContextMenus,
      detachOrbitWindowListeners,
      getOrbitAngleRadians,
      indexes,
      layoutNodesForRender,
      nodePositions,
      nodesRef,
      onOrbitHandleDragEnd,
      onOrbitHandleDragMove,
      pointerAngleFromClient,
      setManualOrbitAngle,
    ],
  );

  useEffect(() => () => detachOrbitWindowListeners(), [detachOrbitWindowListeners]);

  const getNodeVisual = useCallback(
    (nodeId: string) => {
      const expandOrbit = composeNodeVisual(
        getExpandNodeVisual(nodeId),
        getOrbitNodeVisual(nodeId),
      );
      const unlinkVisual = getUnlinkNodeVisual(nodeId);
      const base = unlinkVisual ?? expandOrbit;
      const alignOffset = getAlignNodeVisualOffset(nodeId);
      return {
        ...base,
        translateX: base.translateX + alignOffset.translateX,
        translateY: base.translateY + alignOffset.translateY,
      };
    },
    [
      getAlignNodeVisualOffset,
      getExpandNodeVisual,
      getOrbitNodeVisual,
      getUnlinkNodeVisual,
      expandFrameTime,
      orbitFrameTime,
    ],
  );

  const getEdgeVisual = useCallback(
    (edgeId: string) => {
      const unlinkVisual = getUnlinkEdgeVisual(edgeId);
      if (unlinkVisual) {
        return unlinkVisual;
      }
      return getExpandEdgeVisual(edgeId);
    },
    [expandFrameTime, getExpandEdgeVisual, getUnlinkEdgeVisual],
  );

  const animationValue = useMemo(
    () => ({
      getNodeVisual,
      getEdgeVisual,
      showOrbitHandle: !isOrbitAnimating,
      activeOrbitHandleNodeId,
      onOrbitHandleDragStart,
    }),
    [
      activeOrbitHandleNodeId,
      expandFrameTime,
      getEdgeVisual,
      getNodeVisual,
      isOrbitAnimating,
      onOrbitHandleDragStart,
      orbitFrameTime,
    ],
  );

  useLayoutEffect(() => {
    const wasPlaying = orbitPlayingRef.current;
    orbitPlayingRef.current = orbitPlaying;

    if (!wasPlaying || orbitPlaying) {
      return;
    }

    commitGlobalOrbitAngleToLayout();
  }, [commitGlobalOrbitAngleToLayout, orbitPlaying]);

  return {
    nodesLocked,
    animationValue,
    skipExpandAnimations,
    displayLayoutNodes,
    displayRenderGraph,
    alignChildrenAround,
    beginUnlink: beginUnlinkWithPromotion,
    cancelUnlinkForNode,
    commitPendingUnlinks,
    pendingUnlinkEdgeIds,
    unlinkCollapsingEdges,
  };
}
