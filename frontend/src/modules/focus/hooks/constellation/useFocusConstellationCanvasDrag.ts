// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasDrag.ts

import { applyNodeChanges, type NodeChange, type OnNodeDrag } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";

import type { FocusConstellationDragSession } from "../../components/constellation/canvas";
import type { FocusConstellationOptimisticRelink } from "../../components/constellation/canvas";
import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import type { useFocusConstellationUnlinkAnimations } from "./useFocusConstellationUnlinkAnimations";
import {
  collectGraphDescendantNodeIds,
  positionKeyForNode,
  resolveGraphNodeByIndexes,
  type ConstellationGraphIndexes,
} from "../../lib/constellation/graph";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import {
  applyConstellationDragDelta,
  canConstellationDragDetach,
  resolveStickyPreviewTarget,
  snapshotConstellationNodePositions,
  snapshotConstellationSubtreePositions,
} from "../../lib/constellation/interaction";
import type { ManualOrbitState } from "./useFocusConstellationOrbitAnimation";
import type { useFocusConstellation } from "./useFocusConstellation";



// ----- Node drag and relink
export function useFocusConstellationCanvasDrag({
  nodesLockedRef,
  manualOrbitRef,
  nodesRef,
  setNodes,
  nodes,
  indexes,
  nodePositions,
  selectedNodeIdsRef,
  unlinkDistance,
  previewTouchDistance,
  runRelationshipMutation,
  setNodePositionsBatch,
  preserveExpansionOnRelink,
  onReparentNode,
  onDetachNode,
  onConnectStandaloneList,
  beginUnlink,
  cancelUnlinkForNode,
  onIsNodeDraggingChange,
}: {
  nodesLockedRef: RefObject<boolean>;
  manualOrbitRef: React.RefObject<ManualOrbitState | null>;
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  setNodes: React.Dispatch<React.SetStateAction<FocusConstellationFlowNode[]>>;
  nodes: FocusConstellationFlowNode[];
  indexes: ConstellationGraphIndexes | null;
  nodePositions: ReadonlyMap<string, ConstellationPoint>;
  selectedNodeIdsRef: MutableRefObject<ReadonlySet<string>>;
  unlinkDistance: number;
  previewTouchDistance: number;
  runRelationshipMutation: (
    operation: () => Promise<void>,
    relink?: FocusConstellationOptimisticRelink,
    animation?: {
      start: (completeAnimation: () => void) => boolean;
    },
  ) => void;
  setNodePositionsBatch: ReturnType<typeof useFocusConstellation>["setNodePositionsBatch"];
  preserveExpansionOnRelink: ReturnType<typeof useFocusConstellation>["preserveExpansionOnRelink"];
  onReparentNode: (nodeId: number, parentId: number) => Promise<void>;
  onDetachNode: (nodeId: number) => Promise<void>;
  onConnectStandaloneList: (listId: number, targetContainerId: number) => Promise<void>;
  beginUnlink: (
    node: FocusConstellationFlowNode,
    callbacks?: {
      onComplete?: () => void;
      onPromote?: (pending: import("../../lib/constellation/interaction").PendingUnlinkLayoutPromotion) => void;
    },
  ) => boolean;
  cancelUnlinkForNode: ReturnType<
    typeof useFocusConstellationUnlinkAnimations
  >["cancelUnlinkForNode"];
  onIsNodeDraggingChange?: (isDragging: boolean) => void;
}) {
  const dragSessionRef = useRef<FocusConstellationDragSession | null>(null);
  const [previewConnection, setPreviewConnection] = useState<{
    source: string;
    target: string;
  } | null>(null);
  const [isNodeDragging, setIsNodeDragging] = useState(false);

  const clearDragPreviewState = useCallback(() => {
    setPreviewConnection(null);
  }, []);

  const finishDragSession = useCallback(() => {
    setIsNodeDragging(false);
    onIsNodeDraggingChange?.(false);
  }, [onIsNodeDraggingChange]);

  const restoreDragSession = useCallback(
    (session: FocusConstellationDragSession) => {
      if (session.unlinkStarted) {
        cancelUnlinkForNode(session.nodeId);
      }
      setNodes((current) =>
        current.map((node) => {
          if (session.mode === "multi") {
            const selectedStart = session.selectedStartPositions.get(node.id);
            return selectedStart ? { ...node, position: selectedStart } : node;
          }

          if (node.id === session.nodeId) {
            return { ...node, position: session.startPosition };
          }
          const descendantStart = session.descendantStartPositions.get(node.id);
          if (session.descendantIds.includes(node.id) && descendantStart) {
            return { ...node, position: descendantStart };
          }
          return node;
        }),
      );
    },
    [cancelUnlinkForNode, setNodes],
  );

  const distanceFromParent = useCallback(
    (node: FocusConstellationFlowNode): number | null => {
      const parentNode = nodes.find((candidate) => candidate.id === node.data.parentId);
      if (!parentNode) {
        return null;
      }
      return Math.hypot(
        parentNode.position.x - node.position.x,
        parentNode.position.y - node.position.y,
      );
    },
    [nodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<FocusConstellationFlowNode>[]) => {
      const session = dragSessionRef.current;
      const customSelectionChanges = changes.filter((change) => change.type !== "select");
      const filteredChanges =
        session?.cancelled
          ? customSelectionChanges.filter(
              (change) =>
                change.type !== "position" ||
                (change.id !== session.nodeId &&
                  !session.descendantIds.includes(change.id) &&
                  !session.selectedNodeIds.includes(change.id)),
            )
          : customSelectionChanges;

      setNodes((current) => {
        let next = applyNodeChanges(filteredChanges, current);
        const positionChange = changes.find(
          (change): change is NodeChange<FocusConstellationFlowNode> & {
            type: "position";
            position: { x: number; y: number };
          } =>
            change.type === "position" &&
            change.dragging === true &&
            change.position !== undefined,
        );

        if (
          positionChange &&
          session &&
          !session.cancelled &&
          positionChange.id === session.nodeId
        ) {
          const draggedNode = next.find((node) => node.id === session.nodeId);
          if (draggedNode) {
            const dragDelta = {
              x: draggedNode.position.x - session.startPosition.x,
              y: draggedNode.position.y - session.startPosition.y,
            };
            if (dragDelta.x !== 0 || dragDelta.y !== 0) {
              if (session.mode === "multi") {
                next = applyConstellationDragDelta(
                  next,
                  session.selectedStartPositions,
                  dragDelta,
                );
              } else {
                next = applyConstellationDragDelta(
                  next,
                  session.descendantStartPositions,
                  dragDelta,
                );
              }
              session.lastPosition = { ...draggedNode.position };
            }
          }
        }

        return next;
      });
    },
    [setNodes],
  );

  const onNodeDragStart = useCallback<OnNodeDrag<FocusConstellationFlowNode>>(
    (_event, node) => {
      if (nodesLockedRef.current || manualOrbitRef.current) {
        return;
      }

      const liveNodes = nodesRef.current;
      const liveNodeIds = new Set(liveNodes.map((candidate) => candidate.id));
      const selectedIds = Array.from(selectedNodeIdsRef.current).filter((id) =>
        liveNodeIds.has(id),
      );
      const isMultiDrag = selectedIds.length > 1 && selectedIds.includes(node.id);

      if (isMultiDrag) {
        dragSessionRef.current = {
          nodeId: node.id,
          mode: "multi",
          startPosition: { ...node.position },
          lastPosition: { ...node.position },
          descendantIds: [],
          descendantStartPositions: new Map(),
          selectedNodeIds: selectedIds,
          selectedStartPositions: snapshotConstellationNodePositions(
            selectedIds,
            liveNodes,
          ),
          latchedTargetId: null,
          cancelled: false,
          detached: false,
          unlinkStarted: false,
        };
      } else {
        const subtreeStartPositions = indexes
          ? snapshotConstellationSubtreePositions({
              rootId: node.id,
              indexes,
              liveNodes,
              storedPositions: nodePositions,
            })
          : new Map([[node.id, { ...node.position }]]);
        const descendantIds = indexes
          ? collectGraphDescendantNodeIds(node.id, indexes)
          : [];
        const descendantStartPositions = new Map(
          [...subtreeStartPositions.entries()].filter(([nodeId]) => nodeId !== node.id),
        );

        dragSessionRef.current = {
          nodeId: node.id,
          mode: "single",
          startPosition: { ...node.position },
          lastPosition: { ...node.position },
          descendantIds,
          descendantStartPositions,
          subtreeStartPositions,
          selectedNodeIds: [],
          selectedStartPositions: new Map(),
          latchedTargetId: null,
          cancelled: false,
          detached: false,
          unlinkStarted: false,
        };
      }

      setIsNodeDragging(true);
      onIsNodeDraggingChange?.(true);
      setPreviewConnection(null);
    },
    [indexes, manualOrbitRef, nodePositions, nodesLockedRef, nodesRef, onIsNodeDraggingChange, selectedNodeIdsRef],
  );

  const onNodeDrag = useCallback<OnNodeDrag<FocusConstellationFlowNode>>(
    (_event, node) => {
      if (nodesLockedRef.current) {
        return;
      }
      if (dragSessionRef.current?.cancelled) {
        setPreviewConnection(null);
        return;
      }
      const session = dragSessionRef.current;
      if (session?.mode === "multi") {
        setPreviewConnection(null);
        return;
      }
      const { target, latchedTargetId } = resolveStickyPreviewTarget(
        node,
        session?.latchedTargetId ?? null,
        nodesRef.current,
        unlinkDistance,
        previewTouchDistance,
      );
      if (session?.nodeId === node.id) {
        session.latchedTargetId = latchedTargetId;
      }
      const shouldDetach =
        canConstellationDragDetach(node.data.nodeKind) &&
        node.data.parentId !== null &&
        !target &&
        (distanceFromParent(node) ?? 0) > unlinkDistance;
      if (session?.nodeId === node.id) {
        session.detached = shouldDetach;
        if (shouldDetach && !session.unlinkStarted) {
          beginUnlink(node);
          session.unlinkStarted = true;
        } else if (!shouldDetach && session.unlinkStarted) {
          cancelUnlinkForNode(node.id);
          session.unlinkStarted = false;
        }
      }
      setPreviewConnection(
        target ? { source: target.id, target: node.id } : null,
      );
    },
    [
      beginUnlink,
      cancelUnlinkForNode,
      distanceFromParent,
      nodesLockedRef,
      nodesRef,
      previewTouchDistance,
      unlinkDistance,
    ],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<FocusConstellationFlowNode>>(
    (_event, node) => {
      const session = dragSessionRef.current;
      dragSessionRef.current = null;
      const wasDetached = session?.detached ?? false;
      clearDragPreviewState();

      if (nodesLockedRef.current) {
        if (session && !session.cancelled) {
          restoreDragSession(session);
        }
        finishDragSession();
        return;
      }

      if (session?.cancelled) {
        restoreDragSession(session);
        finishDragSession();
        return;
      }

      if (!session || node.data.isOrigin) {
        finishDragSession();
        return;
      }

      const liveNodes = nodesRef.current;
      if (session.mode === "multi") {
        setNodePositionsBatch(
          session.selectedNodeIds
            .map((nodeId) => liveNodes.find((candidate) => candidate.id === nodeId))
            .filter(
              (candidate): candidate is FocusConstellationFlowNode => candidate !== undefined,
            )
            .map((candidate) => ({
              positionKey: positionKeyForNode(candidate.data),
              position: candidate.position,
            })),
        );
        finishDragSession();
        return;
      }

      const movedNodeIds = [
        node.id,
        ...(session.descendantIds ?? (indexes ? collectGraphDescendantNodeIds(node.id, indexes) : [])),
      ];
      const dragDelta = {
        x: node.position.x - session.startPosition.x,
        y: node.position.y - session.startPosition.y,
      };

      if (indexes) {
        setNodePositionsBatch(
          movedNodeIds.flatMap((nodeId) => {
            const startPosition =
              session.subtreeStartPositions?.get(nodeId) ??
              (nodeId === node.id ? session.startPosition : session.descendantStartPositions.get(nodeId));
            if (!startPosition) {
              return [];
            }

            const graphNode = resolveGraphNodeByIndexes(nodeId, indexes);
            if (!graphNode) {
              return [];
            }

            return [
              {
                positionKey: positionKeyForNode(graphNode),
                position: {
                  x: startPosition.x + dragDelta.x,
                  y: startPosition.y + dragDelta.y,
                },
              },
            ];
          }),
        );
      } else {
        setNodePositionsBatch(
          movedNodeIds
            .map((nodeId) => liveNodes.find((candidate) => candidate.id === nodeId))
            .filter(
              (candidate): candidate is FocusConstellationFlowNode => candidate !== undefined,
            )
            .map((candidate) => ({
              positionKey: positionKeyForNode(candidate.data),
              position: candidate.position,
            })),
        );
      }

      const latchedTargetId = session?.latchedTargetId ?? null;
      const target = latchedTargetId
        ? nodesRef.current.find((candidate) => candidate.id === latchedTargetId) ?? null
        : null;
      if (target?.data.targetContainerId !== null && target?.data.targetContainerId !== undefined) {
        if (session.unlinkStarted) {
          cancelUnlinkForNode(node.id);
        }
        const targetContainerId = target.data.targetContainerId;
        preserveExpansionOnRelink(targetContainerId);
        runRelationshipMutation(
          () => {
            if (node.data.nodeKind === "list" && node.data.parentId === null) {
              return onConnectStandaloneList(node.data.entityId, targetContainerId);
            }
            return onReparentNode(node.data.entityId, targetContainerId);
          },
          {
            draggedNodeId: node.id,
            newSourceId: target.id,
            oldSourceId: node.data.parentId,
          },
        );
        finishDragSession();
        return;
      }

      if (
        canConstellationDragDetach(node.data.nodeKind) &&
        node.data.parentId !== null &&
        wasDetached
      ) {
        runRelationshipMutation(
          () => onDetachNode(node.data.entityId),
          undefined,
          {
            start: (completeAnimation) =>
              beginUnlink(node, { onComplete: completeAnimation }),
          },
        );
        finishDragSession();
        return;
      }

      if (session.unlinkStarted) {
        cancelUnlinkForNode(node.id);
      }
      finishDragSession();
    },
    [
      beginUnlink,
      cancelUnlinkForNode,
      clearDragPreviewState,
      finishDragSession,
      indexes,
      nodesLockedRef,
      nodesRef,
      onConnectStandaloneList,
      onDetachNode,
      onReparentNode,
      preserveExpansionOnRelink,
      restoreDragSession,
      runRelationshipMutation,
      setNodePositionsBatch,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !dragSessionRef.current) {
        return;
      }
      const session = dragSessionRef.current;
      session.cancelled = true;
      restoreDragSession(session);
      dragSessionRef.current = null;
      clearDragPreviewState();
      finishDragSession();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearDragPreviewState, finishDragSession, restoreDragSession]);

  return {
    isNodeDragging,
    previewConnection,
    onNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  };
}
