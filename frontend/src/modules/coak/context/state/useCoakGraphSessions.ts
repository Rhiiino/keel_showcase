// keel_web/src/modules/coak/context/state/useCoakGraphSessions.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { COAK_ORIGIN_NODE_ID, parseCoakItemNodeId } from "../../api";
import {
  collectCoakChildRevolveTargetItemIds,
  computeCoakChildRevolveRailRadius,
  resolveCoakChildRevolvePivot,
  rotateCoakPositionAroundAxis,
} from "../../lib/tabs/constellation/coakChildRevolve";
import {
  collectCoakNodeRevolveTargetItemIds,
  captureCoakNodeRevolveBaselinePositions,
  computeCoakNodeRevolveConnectionAxis,
  resolveCoakNodeRevolveParentNodeId,
  resolveCoakNodeRevolveParentPosition,
  rotateCoakPositionAroundArbitraryAxis,
} from "../../lib/tabs/constellation/coakNodeRevolve";
import { collectCoakNodeMoveTargetNodeIds } from "../../lib/tabs/constellation/coakNodeMove";
import {
  buildCoakNodeSwapPositionUpdates,
  collectCoakNodeSwapTargetNodeIds,
} from "../../lib/tabs/constellation/coakNodeSwap";
import { clampCoakNodePosition } from "../../lib/tabs/constellation/coakNodePosition";
import type { CoakWorldAxis } from "../../lib/tabs/constellation/coakNodePosition";
import {
  COAK_ORIGIN_POSITION,
  type CoakChildRevolveSession,
  type CoakGraphCanvasContextMenuState,
  type CoakGraphNodeContextMenuState,
  type CoakNodeMoveSession,
  type CoakNodeRevolveSession,
  type CoakNodeSwapSession,
} from "../coakWorkspaceTypes";
import type { CoakItemMutations } from "./useCoakItemMutations";
import type { CoakWorkspaceData } from "./useCoakWorkspaceData";

type UseCoakGraphSessionsParams = Pick<
  CoakWorkspaceData,
  | "items"
  | "positionMapRef"
  | "autoOptimizeLayoutEnabledRef"
  | "setNodePositions"
  | "autoOptimizeLayoutEnabled"
  | "nodeSphereRadius"
  | "originNodeRadius"
> & {
  moveItem: (itemId: number, parentId: number | null, sortOrder?: number) => Promise<void>;
  updateItemMutation: CoakItemMutations["updateItemMutation"];
  onCloseChildRevolveForAutoOptimize?: () => void;
};

export function useCoakGraphSessions({
  items,
  positionMapRef,
  autoOptimizeLayoutEnabledRef,
  autoOptimizeLayoutEnabled,
  setNodePositions,
  moveItem,
  updateItemMutation,
  nodeSphereRadius,
  originNodeRadius,
}: UseCoakGraphSessionsParams) {
  const [graphNodeContextMenu, setGraphNodeContextMenu] =
    useState<CoakGraphNodeContextMenuState | null>(null);
  const [graphCanvasContextMenu, setGraphCanvasContextMenu] =
    useState<CoakGraphCanvasContextMenuState | null>(null);
  const [childRevolveSession, setChildRevolveSession] =
    useState<CoakChildRevolveSession | null>(null);
  const [childRevolveDragActive, setChildRevolveDragActive] = useState(false);
  const [nodeRevolveSession, setNodeRevolveSession] =
    useState<CoakNodeRevolveSession | null>(null);
  const [nodeMoveSession, setNodeMoveSession] = useState<CoakNodeMoveSession | null>(null);
  const [nodeSwapSession, setNodeSwapSession] = useState<CoakNodeSwapSession | null>(null);
  const nodeRevolveSessionRef = useRef(nodeRevolveSession);
  nodeRevolveSessionRef.current = nodeRevolveSession;

  const openGraphNodeContextMenu = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      setGraphCanvasContextMenu(null);
      setGraphNodeContextMenu({ nodeId, clientX, clientY });
    },
    [],
  );

  const closeGraphNodeContextMenu = useCallback(() => {
    setGraphNodeContextMenu(null);
  }, []);

  const openGraphCanvasContextMenu = useCallback((clientX: number, clientY: number) => {
    setGraphNodeContextMenu(null);
    setGraphCanvasContextMenu({ clientX, clientY });
  }, []);

  const closeGraphCanvasContextMenu = useCallback(() => {
    setGraphCanvasContextMenu(null);
  }, []);

  const closeChildRevolve = useCallback(() => {
    setChildRevolveSession(null);
    setChildRevolveDragActive(false);
  }, []);

  const closeNodeRevolve = useCallback((): Map<number, [number, number, number]> | null => {
    const session = nodeRevolveSessionRef.current;
    if (session && session.baselinePositions.size > 0) {
      const restored = new Map(session.baselinePositions);
      setNodePositions(restored);
      setNodeRevolveSession(null);
      return restored;
    }

    setNodeRevolveSession(null);
    return null;
  }, [setNodePositions]);

  const closeNodeMove = useCallback(() => {
    setNodeMoveSession(null);
  }, []);

  const closeNodeSwap = useCallback(() => {
    setNodeSwapSession(null);
  }, []);

  const beginNodeMove = useCallback(
    (nodeId: string) => {
      const sourceItemId = parseCoakItemNodeId(nodeId);
      if (sourceItemId == null) {
        return;
      }

      closeGraphNodeContextMenu();
      closeChildRevolve();
      closeNodeRevolve();
      closeNodeSwap();

      const validTargetNodeIds = new Set(
        collectCoakNodeMoveTargetNodeIds(items, sourceItemId),
      );

      setNodeMoveSession({
        sourceNodeId: nodeId,
        sourceItemId,
        validTargetNodeIds,
      });
    },
    [closeChildRevolve, closeGraphNodeContextMenu, closeNodeRevolve, closeNodeSwap, items],
  );

  const isNodeMoveTarget = useCallback(
    (nodeId: string) => nodeMoveSession?.validTargetNodeIds.has(nodeId) ?? false,
    [nodeMoveSession],
  );

  const beginNodeSwap = useCallback(
    (nodeId: string) => {
      const sourceItemId = parseCoakItemNodeId(nodeId);
      if (sourceItemId == null) {
        return;
      }

      closeGraphNodeContextMenu();
      closeChildRevolve();
      closeNodeRevolve();
      closeNodeMove();

      const validTargetNodeIds = new Set(
        collectCoakNodeSwapTargetNodeIds(items, sourceItemId),
      );

      if (validTargetNodeIds.size === 0) {
        return;
      }

      setNodeSwapSession({
        sourceNodeId: nodeId,
        sourceItemId,
        validTargetNodeIds,
      });
    },
    [closeChildRevolve, closeGraphNodeContextMenu, closeNodeMove, closeNodeRevolve, items],
  );

  const isNodeSwapTarget = useCallback(
    (nodeId: string) => nodeSwapSession?.validTargetNodeIds.has(nodeId) ?? false,
    [nodeSwapSession],
  );

  const beginChildRevolve = useCallback(
    (nodeId: string) => {
      if (autoOptimizeLayoutEnabledRef.current) {
        return;
      }

      const pivot = resolveCoakChildRevolvePivot(nodeId, (parentNodeId) => {
        if (parentNodeId === COAK_ORIGIN_NODE_ID) {
          return COAK_ORIGIN_POSITION;
        }

        const itemId = Number.parseInt(parentNodeId.slice(5), 10);
        if (!Number.isFinite(itemId)) {
          return COAK_ORIGIN_POSITION;
        }

        return positionMapRef.current.get(itemId) ?? COAK_ORIGIN_POSITION;
      });
      const targetItemIds = collectCoakChildRevolveTargetItemIds(items, nodeId);

      if (targetItemIds.length === 0) {
        return;
      }

      closeNodeRevolve();

      const railRadius = computeCoakChildRevolveRailRadius(
        nodeId,
        nodeSphereRadius,
        originNodeRadius,
      );

      setChildRevolveSession({
        parentNodeId: nodeId,
        pivot,
        railRadius,
        targetItemIds,
      });
      setChildRevolveDragActive(false);
    },
    [autoOptimizeLayoutEnabledRef, closeNodeRevolve, items, nodeSphereRadius, originNodeRadius, positionMapRef],
  );

  const beginNodeRevolve = useCallback(
    (nodeId: string) => {
      const sourceItemId = parseCoakItemNodeId(nodeId);
      if (sourceItemId == null) {
        return;
      }

      const item = items.find((entry) => entry.id === sourceItemId);
      if (!item) {
        return;
      }

      const nodePosition = positionMapRef.current.get(sourceItemId);
      if (!nodePosition) {
        return;
      }

      const parentNodeId = resolveCoakNodeRevolveParentNodeId(item);
      const parentPosition = resolveCoakNodeRevolveParentPosition(parentNodeId, (parentId) => {
        if (parentId === COAK_ORIGIN_NODE_ID) {
          return COAK_ORIGIN_POSITION;
        }

        const parentItemId = parseCoakItemNodeId(parentId);
        if (parentItemId == null) {
          return COAK_ORIGIN_POSITION;
        }

        return positionMapRef.current.get(parentItemId) ?? COAK_ORIGIN_POSITION;
      });
      const rotationAxis = computeCoakNodeRevolveConnectionAxis(nodePosition, parentPosition);
      if (!rotationAxis) {
        return;
      }

      const restoredPositions = closeNodeRevolve();
      closeGraphNodeContextMenu();
      closeChildRevolve();
      closeNodeMove();
      closeNodeSwap();

      const targetItemIds = collectCoakNodeRevolveTargetItemIds(items, sourceItemId);
      const baselinePositions = captureCoakNodeRevolveBaselinePositions(
        targetItemIds,
        (itemId) => restoredPositions?.get(itemId) ?? positionMapRef.current.get(itemId),
      );

      setNodeRevolveSession({
        nodeId,
        sourceItemId,
        pivot: nodePosition,
        rotationAxis,
        targetItemIds,
        baselinePositions,
      });
    },
    [
      closeChildRevolve,
      closeGraphNodeContextMenu,
      closeNodeMove,
      closeNodeRevolve,
      closeNodeSwap,
      items,
      positionMapRef,
    ],
  );

  const applyNodeRevolveRotation = useCallback(
    (deltaAngle: number) => {
      const session = nodeRevolveSessionRef.current;
      if (!session || deltaAngle === 0) {
        return;
      }

      const updates = new Map<number, [number, number, number]>();

      for (const itemId of session.targetItemIds) {
        const currentPosition = positionMapRef.current.get(itemId);
        if (!currentPosition) {
          continue;
        }

        updates.set(
          itemId,
          clampCoakNodePosition(
            rotateCoakPositionAroundArbitraryAxis(
              currentPosition,
              session.pivot,
              session.rotationAxis,
              deltaAngle,
            ),
            nodeSphereRadius,
          ),
        );
      }

      if (updates.size > 0) {
        setNodePositions(updates);
      }
    },
    [nodeSphereRadius, positionMapRef, setNodePositions],
  );

  const childRevolveSessionRef = useRef(childRevolveSession);
  childRevolveSessionRef.current = childRevolveSession;

  const applyChildRevolveRotation = useCallback(
    (axis: CoakWorldAxis, deltaAngle: number) => {
      if (autoOptimizeLayoutEnabledRef.current) {
        return;
      }

      const session = childRevolveSessionRef.current;
      if (!session || deltaAngle === 0) {
        return;
      }

      const updates = new Map<number, [number, number, number]>();

      for (const itemId of session.targetItemIds) {
        const currentPosition = positionMapRef.current.get(itemId);
        if (!currentPosition) {
          continue;
        }

        updates.set(
          itemId,
          clampCoakNodePosition(
            rotateCoakPositionAroundAxis(
              currentPosition,
              session.pivot,
              axis,
              deltaAngle,
            ),
            nodeSphereRadius,
          ),
        );
      }

      if (updates.size > 0) {
        setNodePositions(updates);
      }
    },
    [autoOptimizeLayoutEnabledRef, nodeSphereRadius, positionMapRef, setNodePositions],
  );

  const commitNodeMove = useCallback(
    async (targetNodeId: string) => {
      const session = nodeMoveSession;
      if (!session || !session.validTargetNodeIds.has(targetNodeId)) {
        closeNodeMove();
        return;
      }

      const parentId =
        targetNodeId === COAK_ORIGIN_NODE_ID ? null : parseCoakItemNodeId(targetNodeId);

      if (parentId == null && targetNodeId !== COAK_ORIGIN_NODE_ID) {
        closeNodeMove();
        return;
      }

      try {
        await moveItem(session.sourceItemId, parentId);
      } finally {
        closeNodeMove();
      }
    },
    [closeNodeMove, moveItem, nodeMoveSession],
  );

  const commitNodeSwap = useCallback(
    async (targetNodeId: string) => {
      const session = nodeSwapSession;
      if (!session || !session.validTargetNodeIds.has(targetNodeId)) {
        closeNodeSwap();
        return;
      }

      const targetItemId = parseCoakItemNodeId(targetNodeId);
      if (targetItemId == null) {
        closeNodeSwap();
        return;
      }

      try {
        if (autoOptimizeLayoutEnabledRef.current) {
          const sourceItem = items.find((item) => item.id === session.sourceItemId);
          const targetItem = items.find((item) => item.id === targetItemId);
          if (!sourceItem || !targetItem) {
            return;
          }

          const sourceSortOrder = sourceItem.sort_order;
          const targetSortOrder = targetItem.sort_order;

          await updateItemMutation.mutateAsync({
            itemId: session.sourceItemId,
            payload: { sort_order: targetSortOrder },
          });
          await updateItemMutation.mutateAsync({
            itemId: targetItemId,
            payload: { sort_order: sourceSortOrder },
          });
        } else {
          const updates = buildCoakNodeSwapPositionUpdates(
            items,
            session.sourceItemId,
            targetItemId,
            positionMapRef.current,
            nodeSphereRadius,
          );

          if (updates.size > 0) {
            setNodePositions(updates);
          }
        }
      } finally {
        closeNodeSwap();
      }
    },
    [
      autoOptimizeLayoutEnabledRef,
      closeNodeSwap,
      items,
      nodeSwapSession,
      positionMapRef,
      setNodePositions,
      nodeSphereRadius,
      updateItemMutation,
    ],
  );

  useEffect(() => {
    if (autoOptimizeLayoutEnabled && childRevolveSession) {
      closeChildRevolve();
    }
  }, [autoOptimizeLayoutEnabled, childRevolveSession, closeChildRevolve]);

  return {
    graphNodeContextMenu,
    openGraphNodeContextMenu,
    closeGraphNodeContextMenu,
    graphCanvasContextMenu,
    openGraphCanvasContextMenu,
    closeGraphCanvasContextMenu,
    childRevolveSession,
    childRevolveDragActive,
    setChildRevolveDragActive,
    beginChildRevolve,
    closeChildRevolve,
    applyChildRevolveRotation,
    nodeRevolveSession,
    beginNodeRevolve,
    closeNodeRevolve,
    applyNodeRevolveRotation,
    nodeMoveSession,
    beginNodeMove,
    closeNodeMove,
    commitNodeMove,
    isNodeMoveTarget,
    nodeSwapSession,
    beginNodeSwap,
    closeNodeSwap,
    commitNodeSwap,
    isNodeSwapTarget,
  };
}

export type CoakGraphSessions = ReturnType<typeof useCoakGraphSessions>;
