// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationAlignAnimations.ts

// Combined subtree animation when distributing children evenly around a parent node.

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import {
  FOCUS_CONSTELLATION_ALIGN_MOVE_MS,
  resolveAlignNodeVisualOffset,
  type AlignSubtreeMove,
} from "../../lib/constellation/animation";
import { computeEvenChildTargets } from "../../lib/constellation/childAlignment";
import {
  collectGraphDescendantNodeIds,
  positionKeyForNode,
  resolveConstellationNodePosition,
  resolveGraphNodeByIndexes,
  type ConstellationEdge,
  type ConstellationGraphIndexes,
  type ConstellationLayoutNode,
} from "../../lib/constellation/graph";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import type { useFocusConstellation } from "./useFocusConstellation";

type PendingAlignMove = Omit<AlignSubtreeMove, "startedAt">;

export function useFocusConstellationAlignAnimations({
  layoutNodes,
  edges,
  indexes,
  nodePositions,
  nodesRef,
  setNodes,
  setNodePositionsBatch,
  skipExpandAnimations,
}: {
  layoutNodes: ConstellationLayoutNode[];
  edges: readonly ConstellationEdge[];
  indexes: ConstellationGraphIndexes | null;
  nodePositions: ReadonlyMap<string, ConstellationPoint>;
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  setNodes: React.Dispatch<React.SetStateAction<FocusConstellationFlowNode[]>>;
  setNodePositionsBatch: ReturnType<typeof useFocusConstellation>["setNodePositionsBatch"];
  skipExpandAnimations: () => void;
}) {
  const pendingMovesRef = useRef<PendingAlignMove[]>([]);
  const layoutByIdRef = useRef(new Map<string, ConstellationLayoutNode>());
  layoutByIdRef.current = new Map(layoutNodes.map((node) => [node.id, node] as const));

  const [currentMove, setCurrentMove] = useState<AlignSubtreeMove | null>(null);
  const [frameTime, setFrameTime] = useState(0);
  const [isAlignAnimating, setIsAlignAnimating] = useState(false);

  const bakeSubtreeMove = useCallback(
    (move: PendingAlignMove) => {
      if (!indexes) {
        return;
      }

      const layoutById = layoutByIdRef.current;
      const updates = move.nodeIds.flatMap((nodeId) => {
        const targetPosition = move.toByNodeId.get(nodeId);
        if (!targetPosition) {
          return [];
        }

        const layoutNode = layoutById.get(nodeId);
        const graphNode = layoutNode ?? resolveGraphNodeByIndexes(nodeId, indexes);
        if (!graphNode) {
          return [];
        }

        return [
          {
            positionKey: positionKeyForNode(graphNode),
            position: targetPosition,
          },
        ];
      });

      if (updates.length === 0) {
        return;
      }

      const targetByNodeId = move.toByNodeId;
      setNodes((current) =>
        current.map((node) => {
          const targetPosition = targetByNodeId.get(node.id);
          return targetPosition ? { ...node, position: targetPosition } : node;
        }),
      );
      setNodePositionsBatch(updates);
    },
    [indexes, setNodePositionsBatch, setNodes],
  );

  const startNextMove = useCallback(() => {
    const nextMove = pendingMovesRef.current.shift();
    if (!nextMove) {
      setCurrentMove(null);
      setIsAlignAnimating(false);
      return;
    }

    setCurrentMove({
      ...nextMove,
      startedAt: performance.now(),
    });
    setFrameTime(performance.now());
    setIsAlignAnimating(true);
  }, []);

  const finishCurrentMove = useCallback(() => {
    if (!currentMove) {
      return;
    }
    bakeSubtreeMove(currentMove);
    startNextMove();
  }, [bakeSubtreeMove, currentMove, startNextMove]);

  useEffect(() => {
    if (!isAlignAnimating || !currentMove) {
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      setFrameTime(now);
      const elapsed = now - currentMove.startedAt;
      if (elapsed >= FOCUS_CONSTELLATION_ALIGN_MOVE_MS) {
        finishCurrentMove();
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [currentMove, finishCurrentMove, isAlignAnimating]);

  const alignChildrenAround = useCallback(
    (parentNodeId: string) => {
      if (!indexes || isAlignAnimating || pendingMovesRef.current.length > 0) {
        return;
      }

      skipExpandAnimations();

      const layoutById = layoutByIdRef.current;
      const parentLayout = layoutById.get(parentNodeId);
      if (!parentLayout) {
        return;
      }

      const liveById = new Map(
        nodesRef.current.map((node) => [node.id, node.position] as const),
      );
      const parentPosition =
        liveById.get(parentNodeId) ?? parentLayout.position;

      const childIds = edges
        .filter((edge) => edge.source === parentNodeId)
        .map((edge) => edge.target);

      const children = childIds.flatMap((childId) => {
        const layoutNode = layoutById.get(childId);
        const position = resolveConstellationNodePosition(
          childId,
          indexes,
          nodePositions,
          liveById,
        );
        if (!layoutNode || !position) {
          return [];
        }
        return [{ id: childId, position, workOrder: layoutNode.workOrder }];
      });

      if (children.length < 2) {
        return;
      }

      const targets = computeEvenChildTargets(parentPosition, children);
      const sortedChildren = [...children].sort(
        (left, right) => (left.workOrder ?? 0) - (right.workOrder ?? 0),
      );

      const fromByNodeId = new Map<string, ConstellationPoint>();
      const toByNodeId = new Map<string, ConstellationPoint>();

      for (const child of sortedChildren) {
        const targetPosition = targets.get(child.id);
        if (!targetPosition) {
          continue;
        }

        const delta: ConstellationPoint = {
          x: targetPosition.x - child.position.x,
          y: targetPosition.y - child.position.y,
        };
        if (Math.hypot(delta.x, delta.y) < 0.5) {
          continue;
        }

        const subtreeIds = [
          child.id,
          ...collectGraphDescendantNodeIds(child.id, indexes),
        ];

        for (const nodeId of subtreeIds) {
          if (fromByNodeId.has(nodeId)) {
            continue;
          }

          const fromPosition = resolveConstellationNodePosition(
            nodeId,
            indexes,
            nodePositions,
            liveById,
          );
          if (!fromPosition) {
            continue;
          }

          fromByNodeId.set(nodeId, fromPosition);
          toByNodeId.set(nodeId, {
            x: fromPosition.x + delta.x,
            y: fromPosition.y + delta.y,
          });
        }
      }

      if (fromByNodeId.size === 0) {
        return;
      }

      pendingMovesRef.current = [
        {
          nodeIds: [...fromByNodeId.keys()],
          fromByNodeId,
          toByNodeId,
        },
      ];
      startNextMove();
    },
    [
      edges,
      indexes,
      isAlignAnimating,
      nodePositions,
      nodesRef,
      skipExpandAnimations,
      startNextMove,
    ],
  );

  const getAlignNodeVisualOffset = useCallback(
    (nodeId: string) => resolveAlignNodeVisualOffset(nodeId, currentMove, frameTime),
    [currentMove, frameTime],
  );

  return {
    alignChildrenAround,
    getAlignNodeVisualOffset,
    isAlignAnimating,
  };
}
