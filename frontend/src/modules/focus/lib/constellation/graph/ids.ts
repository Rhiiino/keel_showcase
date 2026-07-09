// keel_web/src/modules/focus/lib/constellation/graph/ids.ts

import type { PositionKeyInput } from "./types";

export function listNodeId(listId: number): string {
  return `list:${listId}`;
}

export function entryNodeId(entryId: number): string {
  return `entry:${entryId}`;
}

// Stable identity for a node's on-canvas position. A list-link child
// (entry:X -> list Y) and the standalone list (list:Y) are the same circle, so
// they share a position key. This keeps a node anchored in place across
// connect/disconnect (where the underlying node id changes).
export function positionKeyForNode(node: PositionKeyInput): string {
  if (node.kind === "list" && node.listId != null) {
    return `list:${node.listId}`;
  }
  if (node.entryKind === "list_link" && node.linkedListId != null) {
    return `list:${node.linkedListId}`;
  }
  if (node.entryKind === "record") {
    return `record:${node.entityId}`;
  }
  return `entry:${node.entityId}`;
}
