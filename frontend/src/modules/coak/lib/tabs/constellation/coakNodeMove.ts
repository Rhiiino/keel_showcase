// keel_web/src/modules/coak/lib/tabs/constellation/coakNodeMove.ts

import { COAK_ORIGIN_NODE_ID, coakItemNodeId, type CoakItem } from "../../../api";
import { collectCoakDescendantItemIds } from "../directory/coakTree";

export function collectCoakNodeMoveTargetNodeIds(
  items: CoakItem[],
  sourceItemId: number,
): string[] {
  const sourceItem = items.find((item) => item.id === sourceItemId);
  const excludedItemIds = new Set([
    sourceItemId,
    ...collectCoakDescendantItemIds(items, sourceItemId),
  ]);

  const currentParentId = sourceItem?.parent_id ?? null;
  const targets: string[] = [COAK_ORIGIN_NODE_ID];

  for (const item of items) {
    if (item.kind !== "folder" || excludedItemIds.has(item.id)) {
      continue;
    }

    if (item.id === currentParentId) {
      continue;
    }

    targets.push(coakItemNodeId(item.id));
  }

  return targets;
}
