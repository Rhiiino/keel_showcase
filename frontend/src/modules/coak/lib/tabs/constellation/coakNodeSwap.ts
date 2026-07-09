// keel_web/src/modules/coak/lib/tabs/constellation/coakNodeSwap.ts

import { COAK_ORIGIN_NODE_ID, coakItemNodeId, type CoakItem } from "../../../api";
import { COAK_NODE_SPHERE_RADIUS } from "./coakGraphConstants";
import { clampCoakNodePosition } from "./coakNodePosition";
import {
  collectCoakDescendantItemIds,
  collectCoakDirectChildItemIds,
} from "../directory/coakTree";

export function collectCoakNodeSwapTargetNodeIds(
  items: CoakItem[],
  sourceItemId: number,
): string[] {
  const sourceItem = items.find((item) => item.id === sourceItemId);
  if (!sourceItem) {
    return [];
  }

  const parentNodeId =
    sourceItem.parent_id == null ? COAK_ORIGIN_NODE_ID : coakItemNodeId(sourceItem.parent_id);

  return collectCoakDirectChildItemIds(items, parentNodeId)
    .filter((itemId) => itemId !== sourceItemId)
    .map((itemId) => coakItemNodeId(itemId));
}

export function coakNodeHasSiblings(items: CoakItem[], sourceItemId: number): boolean {
  return collectCoakNodeSwapTargetNodeIds(items, sourceItemId).length > 0;
}

export function buildCoakNodeSwapPositionUpdates(
  items: CoakItem[],
  sourceItemId: number,
  targetItemId: number,
  positionMap: Map<number, [number, number, number]>,
  nodeSphereRadius: number = COAK_NODE_SPHERE_RADIUS,
): Map<number, [number, number, number]> {
  const sourcePosition = positionMap.get(sourceItemId);
  const targetPosition = positionMap.get(targetItemId);

  if (!sourcePosition || !targetPosition) {
    return new Map();
  }

  const deltaSourceToTarget: [number, number, number] = [
    targetPosition[0] - sourcePosition[0],
    targetPosition[1] - sourcePosition[1],
    targetPosition[2] - sourcePosition[2],
  ];
  const deltaTargetToSource: [number, number, number] = [
    -deltaSourceToTarget[0],
    -deltaSourceToTarget[1],
    -deltaSourceToTarget[2],
  ];

  const updates = new Map<number, [number, number, number]>();

  for (const itemId of [sourceItemId, ...collectCoakDescendantItemIds(items, sourceItemId)]) {
    const currentPosition = positionMap.get(itemId);
    if (!currentPosition) {
      continue;
    }

    updates.set(
      itemId,
      clampCoakNodePosition(
        [
        currentPosition[0] + deltaSourceToTarget[0],
        currentPosition[1] + deltaSourceToTarget[1],
        currentPosition[2] + deltaSourceToTarget[2],
        ],
        nodeSphereRadius,
      ),
    );
  }

  for (const itemId of [targetItemId, ...collectCoakDescendantItemIds(items, targetItemId)]) {
    const currentPosition = positionMap.get(itemId);
    if (!currentPosition) {
      continue;
    }

    updates.set(
      itemId,
      clampCoakNodePosition(
        [
        currentPosition[0] + deltaTargetToSource[0],
        currentPosition[1] + deltaTargetToSource[1],
        currentPosition[2] + deltaTargetToSource[2],
        ],
        nodeSphereRadius,
      ),
    );
  }

  return updates;
}
