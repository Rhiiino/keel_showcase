// keel_web/src/modules/coak/lib/tabs/constellation/coakNodeLineage.ts

import {
  COAK_ORIGIN_NODE_ID,
  coakItemNodeId,
  parseCoakItemNodeId,
  type CoakItem,
} from "../../../api";

export type CoakNodeLineageCrumb = {
  nodeId: string;
  label: string;
};

/** Ancestor chain from the origin node through the target node (inclusive). */
export function buildCoakNodeLineagePath(
  items: CoakItem[],
  targetNodeId: string,
  originLabel: string,
): CoakNodeLineageCrumb[] {
  if (targetNodeId === COAK_ORIGIN_NODE_ID) {
    return [{ nodeId: COAK_ORIGIN_NODE_ID, label: originLabel }];
  }

  const path: CoakNodeLineageCrumb[] = [];
  let currentNodeId = targetNodeId;

  while (currentNodeId !== COAK_ORIGIN_NODE_ID) {
    const itemId = parseCoakItemNodeId(currentNodeId);
    if (itemId == null) {
      return [];
    }

    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return [];
    }

    path.unshift({ nodeId: currentNodeId, label: item.name });

    currentNodeId =
      item.parent_id == null ? COAK_ORIGIN_NODE_ID : coakItemNodeId(item.parent_id);
  }

  path.unshift({ nodeId: COAK_ORIGIN_NODE_ID, label: originLabel });
  return path;
}
