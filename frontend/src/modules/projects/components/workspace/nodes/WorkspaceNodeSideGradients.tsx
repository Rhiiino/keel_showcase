// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeSideGradients.tsx

// Partial edge accents on connected sides when full card chrome is hidden.

import { useId } from "react";

import type { WorkspaceNodeSide } from "../../../hooks/useWorkspaceNodeConnectedSides";
import {
  resolveContainerShape,
  shapeHandlePerimeterPoint,
  shapeSideStrokeSegments,
  type Point2,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";

const GRADIENT_PEAK_OPACITY = 0.85;
/** How far along each connected side the accent runs from the handle (each direction). */
const GRADIENT_SIDE_REACH_FRACTION = 0.5;
const GRADIENT_ENDPOINT_FADE_PCT = 4;

type WorkspaceNodeSideGradientsProps = {
  connectedSides: Set<WorkspaceNodeSide>;
  color: string;
  shape?: WorkspaceContainerShape;
  width: number;
  height: number;
};

const SIDE_GRADIENTS: Record<
  WorkspaceNodeSide,
  { className: string; gradient: (color: string) => string }
> = {
  top: {
    className: "left-1/2 top-0 h-[2px] w-1/2 -translate-x-1/2",
    gradient: (color) =>
      `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
  },
  bottom: {
    className: "bottom-0 left-1/2 h-[2px] w-1/2 -translate-x-1/2",
    gradient: (color) =>
      `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
  },
  left: {
    className: "left-0 top-1/2 h-1/2 w-[2px] -translate-y-1/2",
    gradient: (color) =>
      `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)`,
  },
  right: {
    className: "right-0 top-1/2 h-1/2 w-[2px] -translate-y-1/2",
    gradient: (color) =>
      `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)`,
  },
};

function BoxSideGradients({
  connectedSides,
  color,
}: {
  connectedSides: Set<WorkspaceNodeSide>;
  color: string;
}) {
  return (
    <>
      {([...connectedSides] as WorkspaceNodeSide[]).map((side) => {
        const spec = SIDE_GRADIENTS[side];
        return (
          <div
            key={side}
            aria-hidden
            className={["pointer-events-none absolute z-[2]", spec.className].join(" ")}
            style={{ background: spec.gradient(color) }}
          />
        );
      })}
    </>
  );
}

function parsePathEndpoints(path: string): {
  from: Point2;
  to: Point2;
} {
  const numbers = path.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  return {
    from: { x: numbers[0] ?? 0, y: numbers[1] ?? 0 },
    to: {
      x: numbers[numbers.length - 2] ?? 0,
      y: numbers[numbers.length - 1] ?? 0,
    },
  };
}

function segmentLength(from: Point2, to: Point2): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function sidePerimeterLength(paths: string[]): number {
  return paths.reduce((total, path) => {
    const { from, to } = parsePathEndpoints(path);
    return total + segmentLength(from, to);
  }, 0);
}

/** Where along the segment (0–100%) the connection anchor sits. */
function connectionPeakPercent(from: Point2, to: Point2, anchor: Point2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-6) {
    return 50;
  }
  const t = ((anchor.x - from.x) * dx + (anchor.y - from.y) * dy) / lenSq;
  return Math.max(0, Math.min(100, t * 100));
}

/** Fade length along this segment toward each endpoint (percent of segment). */
function gradientSpreadPercentsOnSegment(
  peakPercent: number,
  segmentLen: number,
  sideTotalLen: number,
): { towardStart: number; towardEnd: number } {
  if (segmentLen <= 1e-6 || sideTotalLen <= 1e-6) {
    return { towardStart: 50, towardEnd: 50 };
  }

  const reachPx = GRADIENT_SIDE_REACH_FRACTION * sideTotalLen;
  const distToStartPx = (peakPercent / 100) * segmentLen;
  const distToEndPx = ((100 - peakPercent) / 100) * segmentLen;

  return {
    towardStart: (Math.min(reachPx, distToStartPx) / segmentLen) * 100,
    towardEnd: (Math.min(reachPx, distToEndPx) / segmentLen) * 100,
  };
}

/** Strongest at the connection point, fading along the side toward each direction. */
function gradientStopsAtConnectionPeak(
  peakPercent: number,
  color: string,
  spreadTowardStart: number,
  spreadTowardEnd: number,
): { offset: string; stopColor: string; stopOpacity: number }[] {
  const fadeStart = Math.max(0, peakPercent - spreadTowardStart);
  const fadeEnd = Math.min(100, peakPercent + spreadTowardEnd);
  const endpointFade = GRADIENT_ENDPOINT_FADE_PCT;

  return [
    { offset: "0%", stopColor: color, stopOpacity: 0 },
    { offset: `${Math.min(fadeStart + endpointFade, peakPercent)}%`, stopColor: color, stopOpacity: 0 },
    { offset: `${peakPercent}%`, stopColor: color, stopOpacity: GRADIENT_PEAK_OPACITY },
    { offset: `${Math.max(fadeEnd - endpointFade, peakPercent)}%`, stopColor: color, stopOpacity: 0 },
    { offset: "100%", stopColor: color, stopOpacity: 0 },
  ];
}

function ShapedSideGradients({
  shape,
  connectedSides,
  color,
  width,
  height,
}: {
  shape: WorkspaceContainerShape;
  connectedSides: Set<WorkspaceNodeSide>;
  color: string;
  width: number;
  height: number;
}) {
  const gradientPrefix = useId().replace(/:/g, "");

  const strokeItems = ([...connectedSides] as WorkspaceNodeSide[]).flatMap((side) => {
    const anchor = shapeHandlePerimeterPoint(side, shape, width, height);
    if (!anchor) {
      return [];
    }

    const paths = shapeSideStrokeSegments(side, shape, width, height);
    const sideTotalLen = sidePerimeterLength(paths);

    return paths.map((path, segmentIndex) => ({
      side,
      segmentIndex,
      path,
      anchor,
      sideTotalLen,
      gradientId: `${gradientPrefix}-${shape}-${side}-${segmentIndex}`,
    }));
  });

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <defs>
        {strokeItems.map(({ path, gradientId, anchor, sideTotalLen }) => {
          const { from, to } = parsePathEndpoints(path);
          const peakPercent = connectionPeakPercent(from, to, anchor);
          const len = segmentLength(from, to);
          const { towardStart, towardEnd } = gradientSpreadPercentsOnSegment(
            peakPercent,
            len,
            sideTotalLen,
          );
          const stops = gradientStopsAtConnectionPeak(
            peakPercent,
            color,
            towardStart,
            towardEnd,
          );

          return (
            <linearGradient
              key={gradientId}
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              {stops.map((stop) => (
                <stop
                  key={`${gradientId}-${stop.offset}`}
                  offset={stop.offset}
                  stopColor={stop.stopColor}
                  stopOpacity={stop.stopOpacity}
                />
              ))}
            </linearGradient>
          );
        })}
      </defs>
      {strokeItems.map(({ path, gradientId, side, segmentIndex }) => (
        <path
          key={`${side}-${segmentIndex}`}
          d={path}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export function WorkspaceNodeSideGradients({
  connectedSides,
  color,
  shape: shapeProp,
  width,
  height,
}: WorkspaceNodeSideGradientsProps) {
  if (connectedSides.size === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const shape = resolveContainerShape(shapeProp);

  if (shape === "box") {
    return <BoxSideGradients connectedSides={connectedSides} color={color} />;
  }

  return (
    <ShapedSideGradients
      shape={shape}
      connectedSides={connectedSides}
      color={color}
      width={width}
      height={height}
    />
  );
}
