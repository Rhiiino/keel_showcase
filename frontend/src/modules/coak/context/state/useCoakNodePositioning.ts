// keel_web/src/modules/coak/context/state/useCoakNodePositioning.ts

import { useCallback, useEffect, useRef } from "react";

import { COAK_ORIGIN_NODE_ID, parseCoakItemNodeId } from "../../api";
import { COAK_CHILD_ORBIT_RADIUS } from "../../lib/tabs/constellation/coakGraphConstants";
import {
  buildAutoOptimizeTreePositionMap,
  buildCoakTreeStructureSignature,
  buildDirectChildrenAngledOptimizePositionMap,
  buildDirectChildrenInlineOptimizePositionMap,
  buildDirectChildrenPlanePositionMap,
  shortestDirectChildConnectionDistance,
  type CoakOptimizeLayoutMode,
} from "../../lib/tabs/constellation/coakNodeLayout";
import { clampCoakNodePosition } from "../../lib/tabs/constellation/coakNodePosition";
import { collectCoakDescendantItemIds } from "../../lib/tabs/directory/coakTree";
import { COAK_ORIGIN_POSITION } from "../coakWorkspaceTypes";
import type { CoakGraphSessions } from "./useCoakGraphSessions";
import type { CoakWorkspaceData } from "./useCoakWorkspaceData";

type UseCoakNodePositioningParams = Pick<
  CoakWorkspaceData,
  | "items"
  | "graphNodes"
  | "positionMap"
  | "positionMapRef"
  | "autoOptimizeLayoutEnabledRef"
  | "autoOptimizeLayoutEnabled"
  | "autoOptimizeConnectionDistance"
  | "autoOptimizeConnectionAngle"
  | "nodeSphereRadius"
  | "configurationSettingsHydrated"
  | "workspaceHydrated"
  | "setNodePosition"
  | "setNodePositions"
> & {
  closeChildRevolve: CoakGraphSessions["closeChildRevolve"];
  closeNodeRevolve: CoakGraphSessions["closeNodeRevolve"];
};

export function useCoakNodePositioning({
  items,
  graphNodes,
  positionMap,
  positionMapRef,
  autoOptimizeLayoutEnabledRef,
  autoOptimizeLayoutEnabled,
  autoOptimizeConnectionDistance,
  autoOptimizeConnectionAngle,
  nodeSphereRadius,
  configurationSettingsHydrated,
  workspaceHydrated,
  setNodePosition,
  setNodePositions,
  closeChildRevolve,
  closeNodeRevolve,
}: UseCoakNodePositioningParams) {
  const updateNodePosition = useCallback(
    (nodeId: string, position: [number, number, number]) => {
      if (autoOptimizeLayoutEnabledRef.current) {
        return;
      }

      const itemId = nodeId.startsWith("item:") ? Number.parseInt(nodeId.slice(5), 10) : null;
      if (!itemId || !Number.isFinite(itemId)) {
        return;
      }

      const currentPosition = positionMapRef.current.get(itemId);
      if (!currentPosition) {
        setNodePosition(itemId, position);
        return;
      }

      const delta: [number, number, number] = [
        position[0] - currentPosition[0],
        position[1] - currentPosition[1],
        position[2] - currentPosition[2],
      ];

      if (delta[0] === 0 && delta[1] === 0 && delta[2] === 0) {
        return;
      }

      const itemIdsToMove = [itemId, ...collectCoakDescendantItemIds(items, itemId)];
      const updates = new Map<number, [number, number, number]>();

      for (const id of itemIdsToMove) {
        const resolved = positionMapRef.current.get(id);
        if (!resolved) {
          continue;
        }

        updates.set(
          id,
          clampCoakNodePosition(
            [
            resolved[0] + delta[0],
            resolved[1] + delta[1],
            resolved[2] + delta[2],
            ],
            nodeSphereRadius,
          ),
        );
      }

      setNodePositions(updates);
    },
    [autoOptimizeLayoutEnabledRef, items, nodeSphereRadius, positionMapRef, setNodePosition, setNodePositions],
  );

  const resolveNodePosition = useCallback(
    (nodeId: string): [number, number, number] => {
      if (nodeId === COAK_ORIGIN_NODE_ID) {
        return COAK_ORIGIN_POSITION;
      }

      const graphNode = graphNodes.find((node) => node.id === nodeId);
      if (graphNode) {
        return graphNode.position;
      }

      const itemId = parseCoakItemNodeId(nodeId);
      if (itemId != null) {
        return positionMap.get(itemId) ?? COAK_ORIGIN_POSITION;
      }

      return COAK_ORIGIN_POSITION;
    },
    [graphNodes, positionMap],
  );

  const optimizeNodeChildren = useCallback(
    (nodeId: string, layoutMode: CoakOptimizeLayoutMode = 90) => {
      if (autoOptimizeLayoutEnabledRef.current) {
        return;
      }

      const rootPosition = resolveNodePosition(nodeId);
      const parentItemId =
        nodeId === COAK_ORIGIN_NODE_ID
          ? null
          : Number.parseInt(nodeId.slice(5), 10);

      if (nodeId !== COAK_ORIGIN_NODE_ID && !Number.isFinite(parentItemId)) {
        return;
      }

      const shortestDistance = shortestDirectChildConnectionDistance(
        items,
        parentItemId,
        rootPosition,
        positionMapRef.current,
      );
      const orbitRadius =
        shortestDistance != null && shortestDistance > 0
          ? shortestDistance
          : COAK_CHILD_ORBIT_RADIUS;

      let directChildPositions: Map<number, [number, number, number]>;

      if (nodeId === COAK_ORIGIN_NODE_ID) {
        directChildPositions = buildDirectChildrenPlanePositionMap(
          items,
          parentItemId,
          rootPosition,
          orbitRadius,
        );
      } else {
        const parentItem = items.find((item) => item.id === parentItemId);
        if (!parentItem) {
          return;
        }

        const grandparentPosition =
          parentItem.parent_id == null
            ? COAK_ORIGIN_POSITION
            : positionMapRef.current.get(parentItem.parent_id) ?? COAK_ORIGIN_POSITION;

        directChildPositions =
          typeof layoutMode === "object"
            ? buildDirectChildrenInlineOptimizePositionMap(
                items,
                parentItemId,
                rootPosition,
                grandparentPosition,
                layoutMode.inline,
                orbitRadius,
              )
            : buildDirectChildrenAngledOptimizePositionMap(
                items,
                parentItemId,
                rootPosition,
                grandparentPosition,
                layoutMode,
                orbitRadius,
              );
      }

      if (directChildPositions.size === 0) {
        return;
      }

      const updates = new Map<number, [number, number, number]>();

      for (const [childItemId, nextPosition] of directChildPositions) {
        const currentPosition = positionMapRef.current.get(childItemId);
        if (!currentPosition) {
          continue;
        }

        const delta: [number, number, number] = [
          nextPosition[0] - currentPosition[0],
          nextPosition[1] - currentPosition[1],
          nextPosition[2] - currentPosition[2],
        ];

        if (delta[0] === 0 && delta[1] === 0 && delta[2] === 0) {
          continue;
        }

        const itemIdsToMove = [
          childItemId,
          ...collectCoakDescendantItemIds(items, childItemId),
        ];

        for (const id of itemIdsToMove) {
          const resolved = positionMapRef.current.get(id);
          if (!resolved) {
            continue;
          }

          updates.set(
            id,
            clampCoakNodePosition(
              [
                resolved[0] + delta[0],
                resolved[1] + delta[1],
                resolved[2] + delta[2],
              ],
              nodeSphereRadius,
            ),
          );
        }
      }

      if (updates.size === 0) {
        return;
      }

      setNodePositions(updates);
    },
    [autoOptimizeLayoutEnabledRef, items, nodeSphereRadius, positionMapRef, resolveNodePosition, setNodePositions],
  );

  const applyAutoOptimizeLayout = useCallback(() => {
    if (items.length === 0) {
      return;
    }

    const nextPositions = buildAutoOptimizeTreePositionMap(
      items,
      autoOptimizeConnectionDistance,
      autoOptimizeConnectionAngle,
      nodeSphereRadius,
    );
    const updates = new Map<number, [number, number, number]>();

    for (const [itemId, nextPosition] of nextPositions) {
      const currentPosition = positionMapRef.current.get(itemId);
      if (
        !currentPosition ||
        currentPosition[0] !== nextPosition[0] ||
        currentPosition[1] !== nextPosition[1] ||
        currentPosition[2] !== nextPosition[2]
      ) {
        updates.set(itemId, nextPosition);
      }
    }

    if (updates.size > 0) {
      setNodePositions(updates);
    }

    closeChildRevolve();
    closeNodeRevolve();
  }, [
    autoOptimizeConnectionAngle,
    autoOptimizeConnectionDistance,
    closeChildRevolve,
    closeNodeRevolve,
    items,
    nodeSphereRadius,
    positionMapRef,
    setNodePositions,
  ]);

  const prevAutoOptimizeEnabledRef = useRef(false);
  const prevTreeStructureSignatureRef = useRef("");
  const prevAutoOptimizeConnectionDistanceRef = useRef(autoOptimizeConnectionDistance);
  const prevAutoOptimizeConnectionAngleRef = useRef(autoOptimizeConnectionAngle);

  useEffect(() => {
    if (!autoOptimizeLayoutEnabled) {
      prevAutoOptimizeEnabledRef.current = false;
      return;
    }

    if (!configurationSettingsHydrated || !workspaceHydrated) {
      return;
    }

    const enabledJustTurnedOn = autoOptimizeLayoutEnabled && !prevAutoOptimizeEnabledRef.current;
    const signature = buildCoakTreeStructureSignature(items);
    const structureChanged = signature !== prevTreeStructureSignatureRef.current;
    const connectionDistanceChanged =
      autoOptimizeConnectionDistance !== prevAutoOptimizeConnectionDistanceRef.current;
    const connectionAngleChanged =
      autoOptimizeConnectionAngle !== prevAutoOptimizeConnectionAngleRef.current;

    prevAutoOptimizeEnabledRef.current = autoOptimizeLayoutEnabled;
    prevTreeStructureSignatureRef.current = signature;
    prevAutoOptimizeConnectionDistanceRef.current = autoOptimizeConnectionDistance;
    prevAutoOptimizeConnectionAngleRef.current = autoOptimizeConnectionAngle;

    if (!enabledJustTurnedOn && !structureChanged && !connectionDistanceChanged && !connectionAngleChanged) {
      return;
    }

    applyAutoOptimizeLayout();
  }, [
    applyAutoOptimizeLayout,
    autoOptimizeConnectionAngle,
    autoOptimizeConnectionDistance,
    autoOptimizeLayoutEnabled,
    configurationSettingsHydrated,
    items,
    workspaceHydrated,
  ]);

  return {
    updateNodePosition,
    resolveNodePosition,
    optimizeNodeChildren,
    applyAutoOptimizeLayout,
  };
}

export type CoakNodePositioning = ReturnType<typeof useCoakNodePositioning>;
