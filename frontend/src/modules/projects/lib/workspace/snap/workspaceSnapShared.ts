// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/snap/workspaceSnapShared.ts

// Shared helpers for workspace box/hexagon shape snapping.

import type { Node } from "@xyflow/react";

import type { WorkspaceNodeSide } from "../../../hooks/useWorkspaceNodeConnectedSides";
import { resolveContainerShape, type Point2, type WorkspaceContainerShape } from "../node/workspaceNodeShape";

/** Flow-space distance between anchor points before the snap thread appears. */
export const WORKSPACE_SNAP_THRESHOLD_PX = 96;

const WORKSPACE_SIDES: WorkspaceNodeSide[] = ["top", "right", "bottom", "left"];

/** Cardinal sides: top/bottom horizontal; left/right vertical. */
export const CARDINAL_SIDE_AXIS = {
  top: "horizontal",
  bottom: "horizontal",
  left: "vertical",
  right: "vertical",
} as const satisfies Record<WorkspaceNodeSide, "horizontal" | "vertical">;

export function areParallelCardinalSides(
  draggedSide: WorkspaceNodeSide,
  targetSide: WorkspaceNodeSide,
): boolean {
  return CARDINAL_SIDE_AXIS[draggedSide] === CARDINAL_SIDE_AXIS[targetSide];
}

export { WORKSPACE_SIDES };

export type WorkspaceSnapCandidate = {
  shape: "box" | "hexagon";
  draggedNodeId: string;
  targetNodeId: string;
  from: Point2;
  to: Point2;
  snappedPosition: { x: number; y: number };
  distance: number;
};

export function workspaceSnapCandidatesEqual(
  left: WorkspaceSnapCandidate | null,
  right: WorkspaceSnapCandidate | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null) {
    return false;
  }

  return (
    left.shape === right.shape &&
    left.draggedNodeId === right.draggedNodeId &&
    left.targetNodeId === right.targetNodeId &&
    left.from.x === right.from.x &&
    left.from.y === right.from.y &&
    left.to.x === right.to.x &&
    left.to.y === right.to.y &&
    left.snappedPosition.x === right.snappedPosition.x &&
    left.snappedPosition.y === right.snappedPosition.y
  );
}

export function workspaceNodeContainerShape(node: Node): WorkspaceContainerShape {
  return resolveContainerShape(
    (node.data as { containerShape?: unknown } | undefined)?.containerShape,
  );
}

export function workspaceNodeDimensions(node: Node): { width: number; height: number } {
  return {
    width: Math.max(node.measured?.width ?? node.width ?? 240, 1),
    height: Math.max(node.measured?.height ?? node.height ?? 160, 1),
  };
}

export function considerSnapPair(
  shape: WorkspaceSnapCandidate["shape"],
  draggedNode: Node,
  targetNode: Node,
  getDraggedLocal: (width: number, height: number) => Point2,
  getTargetLocal: (width: number, height: number) => Point2,
  thresholdPx: number,
  best: WorkspaceSnapCandidate | null,
): WorkspaceSnapCandidate | null {
  const draggedDims = workspaceNodeDimensions(draggedNode);
  const targetDims = workspaceNodeDimensions(targetNode);
  const draggedLocal = getDraggedLocal(draggedDims.width, draggedDims.height);
  const targetLocal = getTargetLocal(targetDims.width, targetDims.height);

  const from = {
    x: draggedNode.position.x + draggedLocal.x,
    y: draggedNode.position.y + draggedLocal.y,
  };
  const to = {
    x: targetNode.position.x + targetLocal.x,
    y: targetNode.position.y + targetLocal.y,
  };
  const distance = Math.hypot(to.x - from.x, to.y - from.y);

  if (distance > thresholdPx || (best && distance >= best.distance)) {
    return best;
  }

  return {
    shape,
    draggedNodeId: draggedNode.id,
    targetNodeId: targetNode.id,
    from,
    to,
    snappedPosition: {
      x: targetNode.position.x + targetLocal.x - draggedLocal.x,
      y: targetNode.position.y + targetLocal.y - draggedLocal.y,
    },
    distance,
  };
}
