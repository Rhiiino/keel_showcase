// Box-to-box edge snapping on the workspace canvas.

import type { Node } from "@xyflow/react";

import { boxSideCenter } from "../node/workspaceNodeShape";
import {
  areParallelCardinalSides,
  considerSnapPair,
  WORKSPACE_SIDES,
  WORKSPACE_SNAP_THRESHOLD_PX,
  workspaceNodeContainerShape,
  type WorkspaceSnapCandidate,
} from "./workspaceSnapShared";

export function isBoxWorkspaceNode(node: Node): boolean {
  return workspaceNodeContainerShape(node) === "box";
}

/**
 * Best parallel edge snap for a dragged box, if any side pair is within threshold.
 */
export function findBoxSnapCandidate(
  draggedNode: Node,
  nodes: Node[],
  thresholdPx = WORKSPACE_SNAP_THRESHOLD_PX,
): WorkspaceSnapCandidate | null {
  if (!isBoxWorkspaceNode(draggedNode)) {
    return null;
  }

  let best: WorkspaceSnapCandidate | null = null;

  for (const targetNode of nodes) {
    if (targetNode.id === draggedNode.id || !isBoxWorkspaceNode(targetNode)) {
      continue;
    }

    for (const draggedSide of WORKSPACE_SIDES) {
      for (const targetSide of WORKSPACE_SIDES) {
        if (!areParallelCardinalSides(draggedSide, targetSide)) {
          continue;
        }

        best = considerSnapPair(
          "box",
          draggedNode,
          targetNode,
          (width, height) => boxSideCenter(draggedSide, width, height),
          (width, height) => boxSideCenter(targetSide, width, height),
          thresholdPx,
          best,
        );
      }
    }
  }

  return best;
}
