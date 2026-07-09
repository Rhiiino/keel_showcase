// Container shape helpers for workspace canvas cards (box, circle, hexagon).

import type { CSSProperties } from "react";

import type { WorkspaceNodeSide } from "../../../hooks/useWorkspaceNodeConnectedSides";

export type WorkspaceContainerShape = "box" | "circle" | "hexagon";

export const WORKSPACE_CONTAINER_SHAPES: WorkspaceContainerShape[] = [
  "box",
  "circle",
  "hexagon",
];

export type Point2 = { x: number; y: number };

export function resolveContainerShape(value: unknown): WorkspaceContainerShape {
  if (value === "circle" || value === "hexagon") {
    return value;
  }
  return "box";
}

export function nextContainerShape(
  current: WorkspaceContainerShape,
): WorkspaceContainerShape {
  const index = WORKSPACE_CONTAINER_SHAPES.indexOf(current);
  const next = index < 0 ? 0 : (index + 1) % WORKSPACE_CONTAINER_SHAPES.length;
  return WORKSPACE_CONTAINER_SHAPES[next];
}

export function containerShapeLabel(shape: WorkspaceContainerShape): string {
  switch (shape) {
    case "circle":
      return "Circle";
    case "hexagon":
      return "Hexagon";
    default:
      return "Box";
  }
}

export function containerShapeShellClass(shape: WorkspaceContainerShape): string {
  return shape === "box" ? "rounded-lg" : "";
}

export type InscribedCircleGeometry = {
  cx: number;
  cy: number;
  r: number;
  width: number;
  height: number;
};

export const WORKSPACE_SHAPE_PERIMETER_HANDLE_CLASS = "workspace-shape-perimeter-handle";

export type ShapeContentFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ShapeContentLayout = "fill" | "media";

export type ShapeContentFrameOptions = {
  /** When true, media layout leaves room for the bottom filename strip. */
  reserveTitleBar?: boolean;
};

const MEDIA_TITLE_BAR_HEIGHT = 22;
const MEDIA_TITLE_INSET = 8;

/** Vertical space reserved at the bottom of box media cards for the filename label. */
export const WORKSPACE_MEDIA_TITLE_RESERVE =
  MEDIA_TITLE_BAR_HEIGHT + MEDIA_TITLE_INSET;

/** Regular flat-top hexagon with equal edge lengths, centered in the node bounds. */
export function regularHexagonPoints(width: number, height: number): Point2[] {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const side = Math.min(safeWidth / 2, safeHeight / Math.sqrt(3));
  const hexWidth = 2 * side;
  const hexHeight = side * Math.sqrt(3);
  const ox = (safeWidth - hexWidth) / 2;
  const oy = (safeHeight - hexHeight) / 2;
  const midY = oy + (Math.sqrt(3) / 2) * side;

  return [
    { x: ox + side / 2, y: oy },
    { x: ox + (3 * side) / 2, y: oy },
    { x: ox + hexWidth, y: midY },
    { x: ox + (3 * side) / 2, y: oy + hexHeight },
    { x: ox + side / 2, y: oy + hexHeight },
    { x: ox, y: midY },
  ];
}

export function hexagonPoints(width: number, height: number): Point2[] {
  return regularHexagonPoints(width, height);
}

export function hexagonClipPathValue(width: number, height: number): string {
  const points = hexagonPoints(width, height);
  return `polygon(${points.map((point) => `${point.x}px ${point.y}px`).join(", ")})`;
}

const HEX_EDGE_PAIRS_BY_SIDE: Record<WorkspaceNodeSide, [number, number][]> = {
  top: [[0, 1]],
  right: [[1, 2], [2, 3]],
  bottom: [[3, 4]],
  left: [[4, 5], [5, 0]],
};

export function hexagonHandleAnchors(
  width: number,
  height: number,
): Record<WorkspaceNodeSide, { left: number; top: number }> {
  const points = hexagonPoints(width, height);
  return {
    top: {
      left: (points[0].x + points[1].x) / 2,
      top: (points[0].y + points[1].y) / 2,
    },
    right: {
      left: points[2].x,
      top: points[2].y,
    },
    bottom: {
      left: (points[3].x + points[4].x) / 2,
      top: (points[3].y + points[4].y) / 2,
    },
    left: {
      left: points[5].x,
      top: points[5].y,
    },
  };
}

/** Center of a box edge in node-local coordinates. */
export function boxSideCenter(
  side: WorkspaceNodeSide,
  width: number,
  height: number,
): Point2 {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  switch (side) {
    case "top":
      return { x: safeWidth / 2, y: 0 };
    case "bottom":
      return { x: safeWidth / 2, y: safeHeight };
    case "left":
      return { x: 0, y: safeHeight / 2 };
    default:
      return { x: safeWidth, y: safeHeight / 2 };
  }
}

/** Center of a hexagon connection side in node-local coordinates. */
export function hexagonSideCenter(
  side: WorkspaceNodeSide,
  width: number,
  height: number,
): Point2 {
  const anchor = hexagonHandleAnchors(width, height)[side];
  return { x: anchor.left, y: anchor.top };
}

/** Flat-top hex slanted edges (not the horizontal top/bottom). */
export type HexagonDiagonalEdge = "upperRight" | "lowerRight" | "lowerLeft" | "upperLeft";

export const HEXAGON_DIAGONAL_EDGES: HexagonDiagonalEdge[] = [
  "upperRight",
  "lowerRight",
  "lowerLeft",
  "upperLeft",
];

const HEX_DIAGONAL_EDGE_VERTICES: Record<HexagonDiagonalEdge, [number, number]> = {
  upperRight: [1, 2],
  lowerRight: [2, 3],
  lowerLeft: [4, 5],
  upperLeft: [5, 0],
};

/** Midpoint of a slanted hex edge in node-local coordinates. */
export function hexagonDiagonalEdgeCenter(
  edge: HexagonDiagonalEdge,
  width: number,
  height: number,
): Point2 {
  const points = hexagonPoints(width, height);
  const [fromIndex, toIndex] = HEX_DIAGONAL_EDGE_VERTICES[edge];
  const from = points[fromIndex];
  const to = points[toIndex];
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

/** Unit direction along a slanted hex edge (vertex index order). */
export function hexagonDiagonalEdgeDirection(
  edge: HexagonDiagonalEdge,
  width: number,
  height: number,
): Point2 {
  const points = hexagonPoints(width, height);
  const [fromIndex, toIndex] = HEX_DIAGONAL_EDGE_VERTICES[edge];
  const from = points[fromIndex];
  const to = points[toIndex];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= 1e-6) {
    return { x: 1, y: 0 };
  }
  return { x: dx / len, y: dy / len };
}

export function getShapeContentFrame(
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
  layout: ShapeContentLayout = "fill",
  options: ShapeContentFrameOptions = {},
): ShapeContentFrame {
  if (width <= 0 || height <= 0) {
    return { left: 0, top: 0, width, height };
  }

  if (layout === "media") {
    if (shape === "box") {
      const titleReserve = options.reserveTitleBar
        ? WORKSPACE_MEDIA_TITLE_RESERVE
        : 0;
      return {
        left: 0,
        top: 0,
        width,
        height: Math.max(height - titleReserve, 0),
      };
    }

    const side = Math.min(width, height);
    return {
      left: (width - side) / 2,
      top: (height - side) / 2,
      width: side,
      height: side,
    };
  }

  if (shape === "circle") {
    const side = Math.min(width, height);
    return {
      left: (width - side) / 2,
      top: (height - side) / 2,
      width: side,
      height: side,
    };
  }

  if (shape === "hexagon") {
    const points = hexagonPoints(width, height);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  return { left: 0, top: 0, width, height };
}

/** Bottom filename strip inside the visible shape (box, circle, hexagon). */
export function getShapeMediaTitleFrame(
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): ShapeContentFrame {
  if (width <= 0 || height <= 0) {
    return { left: 0, top: 0, width, height };
  }

  const barHeight = MEDIA_TITLE_BAR_HEIGHT;

  if (shape === "hexagon") {
    const points = hexagonPoints(width, height);
    const bottomY = Math.max(points[3].y, points[4].y);
    const left = Math.min(points[3].x, points[4].x) + MEDIA_TITLE_INSET;
    const right = Math.max(points[3].x, points[4].x) - MEDIA_TITLE_INSET;
    return {
      left,
      top: bottomY - barHeight - MEDIA_TITLE_INSET,
      width: Math.max(right - left, 0),
      height: barHeight,
    };
  }

  if (shape === "circle") {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    const liftFromBottom = Math.max(MEDIA_TITLE_INSET * 3, r * 0.16);
    const centerY = cy + r - liftFromBottom;
    const top = centerY - barHeight / 2;
    const dy = centerY - cy;
    const chordHalfWidth = Math.sqrt(Math.max(r * r - dy * dy, 0));
    const horizontalInset = MEDIA_TITLE_INSET;
    return {
      left: cx - chordHalfWidth + horizontalInset,
      top,
      width: Math.max(2 * (chordHalfWidth - horizontalInset), 0),
      height: barHeight,
    };
  }

  return {
    left: MEDIA_TITLE_INSET,
    top: height - barHeight - MEDIA_TITLE_INSET,
    width: Math.max(width - 2 * MEDIA_TITLE_INSET, 0),
    height: barHeight,
  };
}

export function getInscribedCircleGeometry(
  width: number,
  height: number,
): InscribedCircleGeometry {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const r = Math.min(safeWidth, safeHeight) / 2;
  return {
    cx: safeWidth / 2,
    cy: safeHeight / 2,
    r,
    width: safeWidth,
    height: safeHeight,
  };
}

export function containerShapeClipStyle(
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): CSSProperties | undefined {
  if (shape === "circle" && width > 0 && height > 0) {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    return { clipPath: `circle(${r}px at ${cx}px ${cy}px)` };
  }
  if (shape === "hexagon" && width > 0 && height > 0) {
    return { clipPath: hexagonClipPathValue(width, height) };
  }
  return undefined;
}

/** Perimeter anchor in node-local coordinates (matches clip / outline). */
export function shapeHandlePerimeterPoint(
  side: WorkspaceNodeSide,
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): Point2 | null {
  if (shape === "box" || width <= 0 || height <= 0) {
    return null;
  }

  const world = shapeConnectionPoint(side, shape, width, height, { x: 0, y: 0 });
  return { x: world.x, y: world.y };
}

/** Absolute position for a shaped handle on the measured shell (see perimeter handle CSS). */
export function shapeHandleAbsoluteStyle(
  side: WorkspaceNodeSide,
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): CSSProperties | undefined {
  const point = shapeHandlePerimeterPoint(side, shape, width, height);
  if (!point) {
    return undefined;
  }

  return {
    left: point.x,
    top: point.y,
    right: "auto",
    bottom: "auto",
  };
}

export type ShapeResizeCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";

export type ShapeResizeCornerPoint = {
  corner: ShapeResizeCorner;
  x: number;
  y: number;
};

/**
 * Diagonal grab points on the visible circle/hexagon perimeter (the regions between
 * the cardinal connection nodes), used to place resize controls on the shape itself.
 */
export function shapeResizeCornerPoints(
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): ShapeResizeCornerPoint[] {
  if (shape === "box" || width <= 0 || height <= 0) {
    return [];
  }

  if (shape === "circle") {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    const d = r / Math.SQRT2;
    return [
      { corner: "top-left", x: cx - d, y: cy - d },
      { corner: "top-right", x: cx + d, y: cy - d },
      { corner: "bottom-right", x: cx + d, y: cy + d },
      { corner: "bottom-left", x: cx - d, y: cy + d },
    ];
  }

  const points = hexagonPoints(width, height);
  return [
    { corner: "top-left", x: points[0].x, y: points[0].y },
    { corner: "top-right", x: points[1].x, y: points[1].y },
    { corner: "bottom-right", x: points[3].x, y: points[3].y },
    { corner: "bottom-left", x: points[4].x, y: points[4].y },
  ];
}

function polarPoint(
  cx: number,
  cy: number,
  r: number,
  degrees: number,
): Point2 {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

/** Arc along the outer perimeter for one cardinal connection side. */
export function circleSideArcPath(
  side: WorkspaceNodeSide,
  geometry: InscribedCircleGeometry,
): string {
  const { cx, cy, r } = geometry;
  const ranges: Record<WorkspaceNodeSide, { start: number; end: number }> = {
    top: { start: -135, end: -45 },
    right: { start: -45, end: 45 },
    bottom: { start: 45, end: 135 },
    left: { start: 135, end: 225 },
  };
  const { start, end } = ranges[side];
  const from = polarPoint(cx, cy, r, start);
  const to = polarPoint(cx, cy, r, end);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 0 1 ${to.x} ${to.y}`;
}

function edgeSegmentPath(points: Point2[], fromIndex: number, toIndex: number): string {
  const from = points[fromIndex];
  const to = points[toIndex];
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

/** One or more stroke paths per connected side (hex corners use two edges). */
export function shapeSideStrokeSegments(
  side: WorkspaceNodeSide,
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): string[] {
  if (shape === "box" || width <= 0 || height <= 0) {
    return [];
  }

  if (shape === "circle") {
    return [circleSideArcPath(side, getInscribedCircleGeometry(width, height))];
  }

  const points = hexagonPoints(width, height);
  return HEX_EDGE_PAIRS_BY_SIDE[side].map(([fromIndex, toIndex]) =>
    edgeSegmentPath(points, fromIndex, toIndex),
  );
}

export function shapeOutlinePath(
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
): string | null {
  if (shape === "box" || width <= 0 || height <= 0) {
    return null;
  }

  if (shape === "circle") {
    return null;
  }

  const points = hexagonPoints(width, height);
  const start = points[0];
  const rest = points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(" ");
  return `M ${start.x} ${start.y} ${rest} Z`;
}

export function shapeConnectionPoint(
  side: string | null | undefined,
  shape: WorkspaceContainerShape,
  width: number,
  height: number,
  nodePosition: { x: number; y: number },
): { x: number; y: number } {
  const center = {
    x: nodePosition.x + width / 2,
    y: nodePosition.y + height / 2,
  };

  const resolvedSide: WorkspaceNodeSide =
    side === "top" || side === "right" || side === "bottom" || side === "left"
      ? side
      : "bottom";

  if (shape === "circle") {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    const offsets: Record<WorkspaceNodeSide, { x: number; y: number }> = {
      top: { x: cx, y: cy - r },
      right: { x: cx + r, y: cy },
      bottom: { x: cx, y: cy + r },
      left: { x: cx - r, y: cy },
    };
    const local = offsets[resolvedSide];
    return { x: nodePosition.x + local.x, y: nodePosition.y + local.y };
  }

  if (shape === "hexagon") {
    const anchors = hexagonHandleAnchors(width, height);
    const local = anchors[resolvedSide];
    return { x: nodePosition.x + local.left, y: nodePosition.y + local.top };
  }

  switch (resolvedSide) {
    case "top":
      return { x: center.x, y: nodePosition.y };
    case "right":
      return { x: nodePosition.x + width, y: center.y };
    case "left":
      return { x: nodePosition.x, y: center.y };
    default:
      return { x: center.x, y: nodePosition.y + height };
  }
}
