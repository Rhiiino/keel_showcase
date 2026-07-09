// keel_web/src/modules/dev/lib/loadingIconGeometry.ts

import type { CanvasPoint } from "./canvasPointer";

export type PercentPoint = {
  x: number;
  y: number;
};

export const DEFAULT_KEEL_LOADING_ICON_SIZE_PX = 560;

export type KeelEyeDotSpec = {
  xPct: number;
  yPct: number;
  sizePx: number;
  color: string;
};

// Percent offsets tuned for keel.png — hollow centers of the top pentagons ("eyes").
export const KEEL_LEFT_EYE_DOT: KeelEyeDotSpec = {
  xPct: 31.8,
  yPct: 31.8,
  sizePx: 22,
  color: "hsl(178, 70%, 55%)",
};

export const KEEL_RIGHT_EYE_DOT: KeelEyeDotSpec = {
  xPct: 100 - KEEL_LEFT_EYE_DOT.xPct,
  yPct: KEEL_LEFT_EYE_DOT.yPct,
  sizePx: KEEL_LEFT_EYE_DOT.sizePx,
  color: "hsl(172, 70%, 55%)",
};

export const KEEL_EYE_DOTS = [KEEL_LEFT_EYE_DOT, KEEL_RIGHT_EYE_DOT] as const;

// Inner hole of the top-right pentagon — tuned to cover only the opening, not the green frame.
export const KEEL_RIGHT_EYE_OPENING_PCT: readonly PercentPoint[] = [
  { x: 58.9, y: 17.7 },
  { x: 71.3, y: 17.9 },
  { x: 81, y: 39.6 },
  { x: 70.4, y: 47.3 },
  { x: 58.9, y: 38.6 },
];

export const KEEL_LEFT_EYE_OPENING_PCT: readonly PercentPoint[] = mirrorPercentPointsHorizontally(
  KEEL_RIGHT_EYE_OPENING_PCT,
);

export const KEEL_MOUTH_OPENING_PCT: readonly PercentPoint[] = [
  { x: 50, y: 53.7 },
  { x: 62, y: 61.3 },
  { x: 55.6, y: 72.9 },
  { x: 44, y: 73 },
  { x: 37.9, y: 61.5 },
];

export const DEFAULT_KEEL_LINE_COLOR = "hsl(0, 0%, 95%)";

export type KeelLineSpec = {
  xPct: number;
  yPct: number;
  length: number;
  thickness: number;
  angle: number;
  color: string;
};

export const KEEL_LEFT_EYE_OUTLINE_LINES: readonly KeelLineSpec[] = [
  {
    xPct: 35.7,
    yPct: 12.9,
    length: 130,
    thickness: 3,
    angle: -180,
    color: "hsl(-80, 70%, 55%)",
  },
  {
    xPct: 18,
    yPct: 27.1,
    length: 174,
    thickness: 3,
    angle: 114,
    color: "hsl(-77, 70%, 55%)",
  },
  {
    xPct: 20.4,
    yPct: 48.5,
    length: 129,
    thickness: 3,
    angle: 39,
    color: "hsl(-77, 70%, 55%)",
  },
  {
    xPct: 38.6,
    yPct: 48.9,
    length: 127,
    thickness: 3,
    angle: -35,
    color: "hsl(-81, 70%, 55%)",
  },
  {
    xPct: 47.5,
    yPct: 27.6,
    length: 167,
    thickness: 3,
    angle: -90,
    color: "hsl(-74, 70%, 55%)",
  },
] as const;

export const KEEL_RIGHT_EYE_OUTLINE_LINES: readonly KeelLineSpec[] = [
  {
    xPct: 64.3,
    yPct: 12.9,
    length: 130,
    thickness: 3,
    angle: 0,
    color: "hsl(261, 70%, 55%)",
  },
  {
    xPct: 82,
    yPct: 27.1,
    length: 174,
    thickness: 3,
    angle: 66,
    color: "hsl(267, 70%, 55%)",
  },
  {
    xPct: 79.7,
    yPct: 48.2,
    length: 127,
    thickness: 3,
    angle: 141,
    color: "hsl(-83, 70%, 55%)",
  },
  {
    xPct: 61.8,
    yPct: 49.1,
    length: 125,
    thickness: 3,
    angle: -145,
    color: "hsl(-70, 70%, 55%)",
  },
  {
    xPct: 52.8,
    yPct: 27.8,
    length: 167,
    thickness: 3,
    angle: -90,
    color: "hsl(-71, 70%, 55%)",
  },
] as const;

export const KEEL_LEFT_INNER_EYE_OUTLINE_LINES: readonly KeelLineSpec[] = [
  {
    xPct: 35.2,
    yPct: 17.5,
    length: 75,
    thickness: 3,
    angle: 180,
    color: "hsl(14, 70%, 55%)",
  },
  {
    xPct: 23.5,
    yPct: 28.9,
    length: 140,
    thickness: 3,
    angle: 114,
    color: "hsl(-3, 70%, 55%)",
  },
  {
    xPct: 23.8,
    yPct: 43.8,
    length: 80,
    thickness: 3,
    angle: 37,
    color: "hsl(-30, 70%, 55%)",
  },
  {
    xPct: 35.5,
    yPct: 43.3,
    length: 89,
    thickness: 3,
    angle: -36,
    color: "hsl(-25, 70%, 55%)",
  },
  {
    xPct: 41.8,
    yPct: 27.9,
    length: 122,
    thickness: 3,
    angle: -90,
    color: "hsl(-22, 70%, 55%)",
  },
] as const;

export const KEEL_RIGHT_INNER_EYE_OUTLINE_LINES: readonly KeelLineSpec[] = [
  {
    xPct: 64.8,
    yPct: 17.4,
    length: 75,
    thickness: 3,
    angle: 0,
    color: "hsl(14, 70%, 55%)",
  },
  {
    xPct: 76.3,
    yPct: 28.4,
    length: 137,
    thickness: 3,
    angle: 65,
    color: "hsl(-3, 70%, 55%)",
  },
  {
    xPct: 76.2,
    yPct: 43.8,
    length: 80,
    thickness: 3,
    angle: 143,
    color: "hsl(-30, 70%, 55%)",
  },
  {
    xPct: 64.5,
    yPct: 43.3,
    length: 89,
    thickness: 3,
    angle: -144,
    color: "hsl(-25, 70%, 55%)",
  },
  {
    xPct: 58.2,
    yPct: 27.9,
    length: 122,
    thickness: 3,
    angle: -90,
    color: "hsl(-22, 70%, 55%)",
  },
] as const;

export type KeelNamedLinePreset = {
  name: string;
  spec: KeelLineSpec;
};

export const KEEL_MOUTH_LINE_PRESETS: readonly KeelNamedLinePreset[] = [
  {
    name: "mouth outer line 1",
    spec: {
      xPct: 39.8,
      yPct: 54.5,
      length: 131,
      thickness: 3,
      angle: -32,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth outer line 2",
    spec: {
      xPct: 59.7,
      yPct: 54.3,
      length: 132,
      thickness: 3,
      angle: 32,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth outer line 3",
    spec: {
      xPct: 64.3,
      yPct: 70,
      length: 121,
      thickness: 3,
      angle: 120,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth inner line 3",
    spec: {
      xPct: 59.3,
      yPct: 67.4,
      length: 76,
      thickness: 3,
      angle: 119,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth outer line 5",
    spec: {
      xPct: 35.8,
      yPct: 70.2,
      length: 121,
      thickness: 3,
      angle: -120,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth inner line 1",
    spec: {
      xPct: 43.6,
      yPct: 57.8,
      length: 82,
      thickness: 3,
      angle: -31,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth inner line 2",
    spec: {
      xPct: 56.1,
      yPct: 57.5,
      length: 81,
      thickness: 3,
      angle: 32,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth outer line 4",
    spec: {
      xPct: 49.8,
      yPct: 79.2,
      length: 105,
      thickness: 3,
      angle: -180,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth inner line 4",
    spec: {
      xPct: 50,
      yPct: 73.3,
      length: 67,
      thickness: 3,
      angle: -180,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
  {
    name: "mouth inner line 5",
    spec: {
      xPct: 40.9,
      yPct: 67.2,
      length: 80,
      thickness: 3,
      angle: -119,
      color: DEFAULT_KEEL_LINE_COLOR,
    },
  },
] as const;

const KEEL_EYE_GLOW_CORE = "rgba(190, 242, 100, 0.95)";
const KEEL_EYE_GLOW_MID = "rgba(132, 204, 22, 0.7)";
const KEEL_EYE_GLOW_OUTER = "rgba(74, 222, 128, 0.35)";

export function normalizeMirrorAngle(angle: number): number {
  let normalized = 180 - angle;

  while (normalized > 180) {
    normalized -= 360;
  }
  while (normalized <= -180) {
    normalized += 360;
  }

  return Math.round(normalized);
}

export function mirrorLineSpecHorizontally(spec: KeelLineSpec): KeelLineSpec {
  return {
    ...spec,
    xPct: Math.round((100 - spec.xPct) * 10) / 10,
    angle: normalizeMirrorAngle(spec.angle),
  };
}

export function mirrorPercentPointsHorizontally(
  points: readonly PercentPoint[],
): PercentPoint[] {
  return points.map((point) => ({
    x: Math.round((100 - point.x) * 10) / 10,
    y: point.y,
  }));
}

export function keelEyeDotSizePx(iconSizePx: number): number {
  return Math.max(6, Math.round(iconSizePx * 0.04));
}

export function keelEyeGlowStyle(): {
  backgroundColor: string;
  boxShadow: string;
} {
  return {
    backgroundColor: KEEL_EYE_GLOW_CORE,
    boxShadow: `0 0 6px 2px ${KEEL_EYE_GLOW_CORE}, 0 0 14px 4px ${KEEL_EYE_GLOW_MID}, 0 0 28px 8px ${KEEL_EYE_GLOW_OUTER}`,
  };
}

export function keelEyeOpeningSvgPath(points: readonly PercentPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`);
  return `M ${first.x} ${first.y} ${segments.join(" ")} Z`;
}

export function percentPointsToPixelCorners(
  points: readonly PercentPoint[],
  iconSizePx: number,
): CanvasPoint[] {
  return points.map((point) => ({
    x: (point.x / 100) * iconSizePx,
    y: (point.y / 100) * iconSizePx,
  }));
}

export function pixelCornersToPercentPoints(
  corners: readonly CanvasPoint[],
  iconSizePx: number,
): PercentPoint[] {
  return corners.map((corner) => ({
    x: Math.round((corner.x / iconSizePx) * 1000) / 10,
    y: Math.round((corner.y / iconSizePx) * 1000) / 10,
  }));
}

export function percentToPixel(valuePct: number, iconSizePx: number): number {
  return (valuePct / 100) * iconSizePx;
}

/** Preset pixel measurements (dots, lines, media) are authored at {@link DEFAULT_KEEL_LOADING_ICON_SIZE_PX}. */
export function scaleKeelPersonaDesignPx(valuePx: number, iconSizePx: number): number {
  return (valuePx / DEFAULT_KEEL_LOADING_ICON_SIZE_PX) * iconSizePx;
}

export const MIN_LOADING_ICON_LINE_LENGTH_PX = 12;

export type LoadingIconLinePose = {
  x: number;
  y: number;
  length: number;
  angle: number;
};

export function getLoadingIconLineAnchor(
  x: number,
  y: number,
  length: number,
  angle: number,
): CanvasPoint {
  const radians = (angle * Math.PI) / 180;
  const halfLength = length / 2;

  return {
    x: x - Math.cos(radians) * halfLength,
    y: y - Math.sin(radians) * halfLength,
  };
}

export function loadingIconLineFromAnchorAndDragEnd(
  anchorX: number,
  anchorY: number,
  dragEndX: number,
  dragEndY: number,
  minLength: number = MIN_LOADING_ICON_LINE_LENGTH_PX,
): LoadingIconLinePose {
  const dx = dragEndX - anchorX;
  const dy = dragEndY - anchorY;
  const length = Math.max(minLength, Math.hypot(dx, dy));

  return {
    x: (anchorX + dragEndX) / 2,
    y: (anchorY + dragEndY) / 2,
    length,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

export function formatKeelEyeOpeningPctForExport(points: readonly PercentPoint[]): string {
  const lines = points.map((point) => `  { x: ${point.x}, y: ${point.y} },`);
  return `export const KEEL_RIGHT_EYE_OPENING_PCT = [\n${lines.join("\n")}\n];`;
}
