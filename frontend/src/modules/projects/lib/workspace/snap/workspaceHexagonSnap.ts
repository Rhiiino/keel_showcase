// Hexagon-to-hexagon snapping on the workspace canvas.

import type { Node } from "@xyflow/react";

import type { WorkspaceNodeSide } from "../../../hooks/useWorkspaceNodeConnectedSides";
import {
  HEXAGON_DIAGONAL_EDGES,
  hexagonDiagonalEdgeCenter,
  hexagonDiagonalEdgeDirection,
  hexagonSideCenter,
  type HexagonDiagonalEdge,
  type Point2,
} from "../node/workspaceNodeShape";
import {
  areParallelCardinalSides,
  considerSnapPair,
  WORKSPACE_SIDES,
  WORKSPACE_SNAP_THRESHOLD_PX,
  workspaceNodeContainerShape,
  workspaceNodeDimensions,
  type WorkspaceSnapCandidate,
} from "./workspaceSnapShared";

const PARALLEL_EPSILON = 0.02;

export type HexSnapAnchor =
  | { kind: "cardinal"; side: WorkspaceNodeSide }
  | { kind: "diagonal"; edge: HexagonDiagonalEdge };

export function isHexagonWorkspaceNode(node: Node): boolean {
  return workspaceNodeContainerShape(node) === "hexagon";
}

function anchorLocal(
  anchor: HexSnapAnchor,
  width: number,
  height: number,
): Point2 {
  if (anchor.kind === "cardinal") {
    return hexagonSideCenter(anchor.side, width, height);
  }
  return hexagonDiagonalEdgeCenter(anchor.edge, width, height);
}

function areParallelDiagonalEdges(
  draggedEdge: HexagonDiagonalEdge,
  targetEdge: HexagonDiagonalEdge,
  draggedWidth: number,
  draggedHeight: number,
  targetWidth: number,
  targetHeight: number,
): boolean {
  const draggedDir = hexagonDiagonalEdgeDirection(
    draggedEdge,
    draggedWidth,
    draggedHeight,
  );
  const targetDir = hexagonDiagonalEdgeDirection(targetEdge, targetWidth, targetHeight);
  const cross = draggedDir.x * targetDir.y - draggedDir.y * targetDir.x;
  return Math.abs(cross) <= PARALLEL_EPSILON;
}

function considerHexAnchorPair(
  draggedNode: Node,
  targetNode: Node,
  draggedAnchor: HexSnapAnchor,
  targetAnchor: HexSnapAnchor,
  thresholdPx: number,
  best: WorkspaceSnapCandidate | null,
): WorkspaceSnapCandidate | null {
  return considerSnapPair(
    "hexagon",
    draggedNode,
    targetNode,
    (width, height) => anchorLocal(draggedAnchor, width, height),
    (width, height) => anchorLocal(targetAnchor, width, height),
    thresholdPx,
    best,
  );
}

/**
 * Best parallel snap for a dragged hexagon, if any anchor pair is within threshold.
 */
export function findHexSnapCandidate(
  draggedNode: Node,
  nodes: Node[],
  thresholdPx = WORKSPACE_SNAP_THRESHOLD_PX,
): WorkspaceSnapCandidate | null {
  if (!isHexagonWorkspaceNode(draggedNode)) {
    return null;
  }

  const draggedDims = workspaceNodeDimensions(draggedNode);
  let best: WorkspaceSnapCandidate | null = null;

  for (const targetNode of nodes) {
    if (targetNode.id === draggedNode.id || !isHexagonWorkspaceNode(targetNode)) {
      continue;
    }

    const targetDims = workspaceNodeDimensions(targetNode);

    for (const draggedSide of WORKSPACE_SIDES) {
      for (const targetSide of WORKSPACE_SIDES) {
        if (!areParallelCardinalSides(draggedSide, targetSide)) {
          continue;
        }

        best = considerHexAnchorPair(
          draggedNode,
          targetNode,
          { kind: "cardinal", side: draggedSide },
          { kind: "cardinal", side: targetSide },
          thresholdPx,
          best,
        );
      }
    }

    for (const draggedEdge of HEXAGON_DIAGONAL_EDGES) {
      for (const targetEdge of HEXAGON_DIAGONAL_EDGES) {
        if (
          !areParallelDiagonalEdges(
            draggedEdge,
            targetEdge,
            draggedDims.width,
            draggedDims.height,
            targetDims.width,
            targetDims.height,
          )
        ) {
          continue;
        }

        best = considerHexAnchorPair(
          draggedNode,
          targetNode,
          { kind: "diagonal", edge: draggedEdge },
          { kind: "diagonal", edge: targetEdge },
          thresholdPx,
          best,
        );
      }
    }
  }

  return best;
}
