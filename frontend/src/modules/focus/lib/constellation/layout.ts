// keel_web/src/modules/focus/lib/constellation/layout.ts

// Radial ring layout for focus constellation nodes.

import { Position } from "@xyflow/react";

import type { FocusConstellationNodeShape } from "../focus";

export const FOCUS_CONSTELLATION_NODE_SIZE = 88;
export const FOCUS_CONSTELLATION_NODE_RADIUS = FOCUS_CONSTELLATION_NODE_SIZE / 2;
export const FOCUS_CONSTELLATION_COLLAPSED_CHILD_RADIUS = 108;
export const FOCUS_CONSTELLATION_EXPANDED_CHILD_RADIUS = 196;
export const FOCUS_CONSTELLATION_NESTED_COLLAPSED_RADIUS = 118;
export const FOCUS_CONSTELLATION_NESTED_EXPANDED_RADIUS = 168;
export const FOCUS_CONSTELLATION_BASE_RING_RADIUS = 160;
export const FOCUS_CONSTELLATION_RING_RADIUS_STEP = 24;
export const FOCUS_CONSTELLATION_CAMERA_PADDING = 56;
export const FOCUS_CONSTELLATION_MIN_ZOOM = 0.15;
export const FOCUS_CONSTELLATION_MAX_ZOOM = 1.25;
export const FOCUS_CONSTELLATION_MIN_NODE_DISTANCE = 124;
export const FOCUS_CONSTELLATION_ORIGIN_CLEARANCE = 152;

export type ConstellationPoint = {
  x: number;
  y: number;
};

export function ringPosition(
  center: ConstellationPoint,
  index: number,
  total: number,
  radius: number,
): ConstellationPoint {
  if (total <= 0) {
    return center;
  }
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

export function arcPosition(
  center: ConstellationPoint,
  index: number,
  total: number,
  radius: number,
  centerAngle: number,
  arcRadians = Math.PI,
): ConstellationPoint {
  if (total <= 0) {
    return center;
  }
  if (total === 1) {
    return {
      x: center.x + radius * Math.cos(centerAngle),
      y: center.y + radius * Math.sin(centerAngle),
    };
  }

  const startAngle = centerAngle - arcRadians / 2;
  const angle = startAngle + (arcRadians * index) / (total - 1);
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

export function ringRadiusForDepth(depth: number): number {
  return FOCUS_CONSTELLATION_BASE_RING_RADIUS + depth * FOCUS_CONSTELLATION_RING_RADIUS_STEP;
}

export function angleBetween(from: ConstellationPoint, to: ConstellationPoint): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function computeOriginFitZoom(
  points: ConstellationPoint[],
  viewportWidth: number,
  viewportHeight: number,
): number {
  const padding = FOCUS_CONSTELLATION_CAMERA_PADDING;
  const nodePad = FOCUS_CONSTELLATION_NODE_RADIUS + padding;
  let maxExtent = nodePad;

  for (const point of points) {
    maxExtent = Math.max(
      maxExtent,
      Math.abs(point.x) + nodePad,
      Math.abs(point.y) + nodePad,
    );
  }

  const fitZoom = Math.min(viewportWidth, viewportHeight) / (2 * maxExtent);
  return Math.max(
    FOCUS_CONSTELLATION_MIN_ZOOM,
    Math.min(FOCUS_CONSTELLATION_MAX_ZOOM, fitZoom),
  );
}

export function computeBoundsFitCamera(
  points: ConstellationPoint[],
  viewportWidth: number,
  viewportHeight: number,
): { center: ConstellationPoint; zoom: number } | null {
  if (points.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const padding = FOCUS_CONSTELLATION_CAMERA_PADDING;
  const nodePad = FOCUS_CONSTELLATION_NODE_RADIUS + padding;
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const width = Math.max(maxX - minX + nodePad * 2, nodePad * 2);
  const height = Math.max(maxY - minY + nodePad * 2, nodePad * 2);
  const zoom = Math.min(viewportWidth / width, viewportHeight / height);
  const clampedZoom = Math.max(
    FOCUS_CONSTELLATION_MIN_ZOOM,
    Math.min(FOCUS_CONSTELLATION_MAX_ZOOM, zoom),
  );

  return {
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
    zoom: clampedZoom,
  };
}


/** Closest point on a node's circular perimeter toward another node center. */
export function circlePerimeterPoint(
  center: ConstellationPoint,
  toward: ConstellationPoint,
  radius = FOCUS_CONSTELLATION_NODE_RADIUS,
): ConstellationPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x: center.x, y: center.y + radius };
  }

  return {
    x: center.x + (dx / length) * radius,
    y: center.y + (dy / length) * radius,
  };
}

function hexagonPerimeterPoint(
  center: ConstellationPoint,
  toward: ConstellationPoint,
  radius = FOCUS_CONSTELLATION_NODE_RADIUS,
): ConstellationPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x: center.x + radius, y: center.y };
  }

  const unit = { x: dx / length, y: dy / length };
  const localPoints = [
    { x: -radius / 2, y: -radius * Math.sqrt(3) / 2 },
    { x: radius / 2, y: -radius * Math.sqrt(3) / 2 },
    { x: radius, y: 0 },
    { x: radius / 2, y: radius * Math.sqrt(3) / 2 },
    { x: -radius / 2, y: radius * Math.sqrt(3) / 2 },
    { x: -radius, y: 0 },
  ];

  let closestScale = radius;
  for (let i = 0; i < localPoints.length; i += 1) {
    const a = localPoints[i];
    const b = localPoints[(i + 1) % localPoints.length];
    const edge = { x: b.x - a.x, y: b.y - a.y };
    const denominator = unit.x * edge.y - unit.y * edge.x;
    if (Math.abs(denominator) < 0.0001) {
      continue;
    }

    const scale = (a.x * edge.y - a.y * edge.x) / denominator;
    const segmentPosition =
      (a.x * unit.y - a.y * unit.x) / denominator;
    if (scale >= 0 && segmentPosition >= 0 && segmentPosition <= 1) {
      closestScale = Math.min(closestScale, scale);
    }
  }

  return {
    x: center.x + unit.x * closestScale,
    y: center.y + unit.y * closestScale,
  };
}

export function shapePerimeterPoint(
  shape: FocusConstellationNodeShape,
  center: ConstellationPoint,
  toward: ConstellationPoint,
  radius = FOCUS_CONSTELLATION_NODE_RADIUS,
): ConstellationPoint {
  return shape === "hexagon"
    ? hexagonPerimeterPoint(center, toward, radius)
    : circlePerimeterPoint(center, toward, radius);
}

export function resolveFocusConstellationNodeSize(multiplier: number): number {
  return Math.round(FOCUS_CONSTELLATION_NODE_SIZE * multiplier);
}


/** Cardinal React Flow handle direction from one node center toward another. */
export function connectionPosition(
  from: ConstellationPoint,
  toward: ConstellationPoint,
): Position {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left;
  }
  return dy >= 0 ? Position.Bottom : Position.Top;
}


export function connectionHandleId(
  from: ConstellationPoint,
  toward: ConstellationPoint,
): "top" | "right" | "bottom" | "left" {
  switch (connectionPosition(from, toward)) {
    case Position.Top:
      return "top";
    case Position.Right:
      return "right";
    case Position.Bottom:
      return "bottom";
    default:
      return "left";
  }
}
