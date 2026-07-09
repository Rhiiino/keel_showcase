// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/edge/workspaceEdgeGeometry.ts

// Shared edge path + label midpoint math for workspace connections.

import {
  getBezierPath,
  getSmoothStepPath,
  Position,
  type Edge,
  type Node,
} from "@xyflow/react";

import type { WorkspaceEdgeData, WorkspaceEdgePathStyle } from "../projectWorkspace";
import type { WorkspaceCanvasConnectionStyle } from "../panel/workspaceCanvasSettings";
import { resolveContainerShape, shapeConnectionPoint } from "../node/workspaceNodeShape";

export function resolveEdgePathStyle(
  data: WorkspaceEdgeData | undefined,
  globalStyle: WorkspaceCanvasConnectionStyle = "smooth",
): WorkspaceEdgePathStyle {
  const style = data?.pathStyle;
  if (style === "orthogonal") {
    return "orthogonal";
  }
  if (style === "straight") {
    return "straight";
  }
  return globalStyle === "straight" ? "straight" : "smooth";
}

function readNodeSize(node: Node): { width: number; height: number } {
  const style = node.style;
  const width =
    (typeof node.measured?.width === "number" ? node.measured.width : undefined) ??
    (style && typeof style.width === "number" ? style.width : undefined) ??
    (node.type === "media" ? 280 : 240);
  const height =
    (typeof node.measured?.height === "number" ? node.measured.height : undefined) ??
    (style && typeof style.height === "number" ? style.height : undefined) ??
    (node.type === "media" ? 220 : 160);
  return { width, height };
}

function resolveConnectionPoint(
  nodeId: string,
  handle: string | null | undefined,
  nodesById: Map<string, Node>,
): { x: number; y: number } | null {
  const node = nodesById.get(nodeId);
  if (!node) {
    return null;
  }

  const size = readNodeSize(node);
  const shape = resolveContainerShape(
    (node.data as { containerShape?: unknown } | undefined)?.containerShape,
  );

  return shapeConnectionPoint(handle, shape, size.width, size.height, node.position);
}

export type WorkspaceEdgeEndpoints = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

/** Snap edge endpoints to shaped perimeters when nodes are circle/hexagon. */
export function resolveShapedEdgeEndpoints(
  sourceId: string,
  targetId: string,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  nodesById: Map<string, Node>,
  fallback: WorkspaceEdgeEndpoints,
): WorkspaceEdgeEndpoints {
  const sourceNode = nodesById.get(sourceId);
  const targetNode = nodesById.get(targetId);
  if (!sourceNode || !targetNode) {
    return fallback;
  }

  const sourceSize = readNodeSize(sourceNode);
  const targetSize = readNodeSize(targetNode);
  const sourceShape = resolveContainerShape(
    (sourceNode.data as { containerShape?: unknown } | undefined)?.containerShape,
  );
  const targetShape = resolveContainerShape(
    (targetNode.data as { containerShape?: unknown } | undefined)?.containerShape,
  );

  let { sourceX, sourceY, targetX, targetY } = fallback;

  if (sourceShape !== "box") {
    const point = shapeConnectionPoint(
      sourceHandle,
      sourceShape,
      sourceSize.width,
      sourceSize.height,
      sourceNode.position,
    );
    sourceX = point.x;
    sourceY = point.y;
  }

  if (targetShape !== "box") {
    const point = shapeConnectionPoint(
      targetHandle,
      targetShape,
      targetSize.width,
      targetSize.height,
      targetNode.position,
    );
    targetX = point.x;
    targetY = point.y;
  }

  return { sourceX, sourceY, targetX, targetY };
}

export function getWorkspaceEdgeLabelPosition(
  edge: Edge,
  nodesById: Map<string, Node>,
  _edges: Edge[] = [],
  globalConnectionStyle: WorkspaceCanvasConnectionStyle = "smooth",
): { x: number; y: number } | null {
  const sourcePoint = resolveConnectionPoint(edge.source, edge.sourceHandle, nodesById);
  const targetPoint = resolveConnectionPoint(edge.target, edge.targetHandle, nodesById);
  if (!sourcePoint || !targetPoint) {
    return null;
  }

  const pathStyle = resolveEdgePathStyle(
    edge.data as WorkspaceEdgeData | undefined,
    globalConnectionStyle,
  );

  if (pathStyle === "straight") {
    return {
      x: (sourcePoint.x + targetPoint.x) / 2,
      y: (sourcePoint.y + targetPoint.y) / 2,
    };
  }

  const params = {
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    sourcePosition: edge.sourceHandle === "left"
      ? Position.Left
      : edge.sourceHandle === "right"
        ? Position.Right
        : edge.sourceHandle === "top"
          ? Position.Top
          : Position.Bottom,
    targetPosition: edge.targetHandle === "left"
      ? Position.Left
      : edge.targetHandle === "right"
        ? Position.Right
        : edge.targetHandle === "top"
          ? Position.Top
          : Position.Bottom,
  };

  if (pathStyle === "orthogonal") {
    const [, labelX, labelY] = getSmoothStepPath({ ...params, borderRadius: 0 });
    return { x: labelX, y: labelY };
  }

  const [, labelX, labelY] = getBezierPath(params);
  return { x: labelX, y: labelY };
}
