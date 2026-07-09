// keel_web/src/modules/focus/lib/constellation/scope.ts

import { resolveCanvasNodeIdFromIndexes } from "../automation/panToNode";
import type { FocusNodeKind } from "../focus";
import type { ConstellationGraphIndexes } from "./graph";
import { entryNodeId, listNodeId } from "./graph/ids";

export function canOpenScopedConstellation(
  nodeKind: FocusNodeKind,
  isOrigin: boolean,
): boolean {
  if (isOrigin) {
    return false;
  }
  return nodeKind === "list" || nodeKind === "record";
}

/** Focus node id encoded in a hub scope canvas id (`list:…` or `entry:…`). */
export function focusNodeIdFromScopeCanvasId(canvasNodeId: string): number | null {
  if (canvasNodeId.startsWith("list:")) {
    const listId = Number(canvasNodeId.slice("list:".length));
    return Number.isFinite(listId) ? listId : null;
  }

  if (canvasNodeId.startsWith("entry:")) {
    const entryId = Number(canvasNodeId.slice("entry:".length));
    return Number.isFinite(entryId) ? entryId : null;
  }

  return null;
}

export function canvasNodeIdForContainerFocusNode(
  focusNodeId: number,
  kind: "list" | "record",
  indexes: ConstellationGraphIndexes | null = null,
): string {
  if (indexes) {
    const resolved = resolveCanvasNodeIdFromIndexes(focusNodeId, indexes);
    if (resolved) {
      return resolved;
    }
  }

  return kind === "list" ? listNodeId(focusNodeId) : entryNodeId(focusNodeId);
}

export function shouldShowFocusFormConstellationAction(
  nodeKind: FocusNodeKind | undefined,
): boolean {
  if (!nodeKind) {
    return true;
  }
  return nodeKind === "list" || nodeKind === "record";
}
