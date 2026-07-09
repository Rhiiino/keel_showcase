// keel_web/src/modules/coak/lib/tabs/constellation/coakNodePinMenu.ts

import type { CoakItem } from "../../../api";
import { collectCoakDirectChildNodeIds } from "../directory/coakTree";

export type CoakDirectChildPinPartition = {
  pinnedChildNodeIds: string[];
  unpinnedChildNodeIds: string[];
};

export function partitionCoakDirectChildNodeIdsByPinState(
  items: CoakItem[],
  parentNodeId: string,
  isNodePinned: (nodeId: string) => boolean,
): CoakDirectChildPinPartition {
  const childNodeIds = collectCoakDirectChildNodeIds(items, parentNodeId);
  const pinnedChildNodeIds: string[] = [];
  const unpinnedChildNodeIds: string[] = [];

  for (const childNodeId of childNodeIds) {
    if (isNodePinned(childNodeId)) {
      pinnedChildNodeIds.push(childNodeId);
    } else {
      unpinnedChildNodeIds.push(childNodeId);
    }
  }

  return { pinnedChildNodeIds, unpinnedChildNodeIds };
}
