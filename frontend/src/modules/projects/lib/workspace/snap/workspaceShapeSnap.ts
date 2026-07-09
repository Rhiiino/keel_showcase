// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/snap/workspaceShapeSnap.ts

// Unified box/hexagon snap lookup for the workspace canvas.

import type { Node } from "@xyflow/react";

import { findBoxSnapCandidate } from "./workspaceBoxSnap";
import { findHexSnapCandidate } from "./workspaceHexagonSnap";
import {
  WORKSPACE_SNAP_THRESHOLD_PX,
  workspaceNodeContainerShape,
  type WorkspaceSnapCandidate,
} from "./workspaceSnapShared";

export {
  WORKSPACE_SNAP_THRESHOLD_PX,
  workspaceNodeContainerShape,
  workspaceNodeDimensions,
  type WorkspaceSnapCandidate,
} from "./workspaceSnapShared";

export function findWorkspaceSnapCandidate(
  draggedNode: Node,
  nodes: Node[],
  thresholdPx = WORKSPACE_SNAP_THRESHOLD_PX,
): WorkspaceSnapCandidate | null {
  const shape = workspaceNodeContainerShape(draggedNode);

  if (shape === "hexagon") {
    return findHexSnapCandidate(draggedNode, nodes, thresholdPx);
  }

  if (shape === "box") {
    return findBoxSnapCandidate(draggedNode, nodes, thresholdPx);
  }

  return null;
}
