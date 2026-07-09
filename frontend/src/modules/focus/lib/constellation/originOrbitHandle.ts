// keel_web/src/modules/focus/lib/constellation/originOrbitHandle.ts

// SVG stroke paths for the origin-node manual orbit drag handle.

import type { FocusConstellationNodeShape } from "../focus";

const OUTER_OFFSET_PX = 11;
const CIRCLE_ARC_CENTER_DEGREES = 0;
const CIRCLE_ARC_SPAN_DEGREES = 90;

type Point2 = { x: number; y: number };

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number): Point2 {
  const radians = degToRad(degrees);
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function offsetFromCenter(
  point: Point2,
  center: Point2,
  offset: number,
): Point2 {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) {
    return point;
  }
  return {
    x: point.x + (dx / length) * offset,
    y: point.y + (dy / length) * offset,
  };
}

function circleArcPath(
  cx: number,
  cy: number,
  radius: number,
  startDegrees: number,
  endDegrees: number,
): string {
  const from = polarPoint(cx, cy, radius, startDegrees);
  const to = polarPoint(cx, cy, radius, endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

/** Flat-top hex vertices in a square nodeSize box (matches constellation clip-path). */
function hexagonVertices(nodeSize: number): Point2[] {
  return [
    { x: nodeSize * 0.25, y: nodeSize * 0.067 },
    { x: nodeSize * 0.75, y: nodeSize * 0.067 },
    { x: nodeSize, y: nodeSize * 0.5 },
    { x: nodeSize * 0.75, y: nodeSize * 0.933 },
    { x: nodeSize * 0.25, y: nodeSize * 0.933 },
    { x: 0, y: nodeSize * 0.5 },
  ];
}

function hexagonRightQuarterPath(
  nodeSize: number,
  center: Point2,
  offset: number,
): string[] {
  const vertices = hexagonVertices(nodeSize).map((point) =>
    offsetFromCenter(point, center, offset),
  );
  const topRight = vertices[1];
  const right = vertices[2];
  const bottomRight = vertices[3];
  return [
    `M ${topRight.x} ${topRight.y} L ${right.x} ${right.y} L ${bottomRight.x} ${bottomRight.y}`,
  ];
}

/** One or more stroke paths tracing ~one quarter of the origin perimeter, just outside the node. */
export function originOrbitHandleStrokePaths(
  shape: FocusConstellationNodeShape,
  nodeSize: number,
): string[] {
  const cx = nodeSize / 2;
  const cy = nodeSize / 2;
  const outerRadius = nodeSize / 2 + OUTER_OFFSET_PX;

  if (shape === "circle") {
    const halfSpan = CIRCLE_ARC_SPAN_DEGREES / 2;
    return [
      circleArcPath(
        cx,
        cy,
        outerRadius,
        CIRCLE_ARC_CENTER_DEGREES - halfSpan,
        CIRCLE_ARC_CENTER_DEGREES + halfSpan,
      ),
    ];
  }

  return hexagonRightQuarterPath(nodeSize, { x: cx, y: cy }, OUTER_OFFSET_PX);
}
