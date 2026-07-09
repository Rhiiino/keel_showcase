// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeShapeOutline.tsx

// SVG stroke outline for workspace container shapes (box, circle, hexagon).

import {
  getInscribedCircleGeometry,
  shapeOutlinePath,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";
import { WORKSPACE_FILES_PANEL_GLOW_STROKE } from "../../../lib/workspace/node";

const BOX_OUTLINE_RADIUS_PX = 8;

type WorkspaceNodeShapeOutlineProps = {
  shape: WorkspaceContainerShape;
  width: number;
  height: number;
  borderColor: string;
  borderWidth?: number;
  selected: boolean;
  /** Draw the normal 2px border stroke (off when hideChrome is on). */
  showBaseOutline?: boolean;
  filesPanelHighlighted?: boolean;
};

function FilesPanelShapeGlow({
  shape,
  width,
  height,
}: {
  shape: WorkspaceContainerShape;
  width: number;
  height: number;
}) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const glowProps = {
    fill: "none" as const,
    stroke: WORKSPACE_FILES_PANEL_GLOW_STROKE,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "circle") {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    return (
      <>
        <circle cx={cx} cy={cy} r={r} {...glowProps} strokeWidth={12} opacity={0.35} />
        <circle cx={cx} cy={cy} r={r} {...glowProps} strokeWidth={7} opacity={0.85} />
      </>
    );
  }

  if (shape === "box") {
    return (
      <>
        <rect
          x={1}
          y={1}
          width={Math.max(width - 2, 0)}
          height={Math.max(height - 2, 0)}
          rx={BOX_OUTLINE_RADIUS_PX}
          ry={BOX_OUTLINE_RADIUS_PX}
          {...glowProps}
          strokeWidth={12}
          opacity={0.35}
        />
        <rect
          x={1}
          y={1}
          width={Math.max(width - 2, 0)}
          height={Math.max(height - 2, 0)}
          rx={BOX_OUTLINE_RADIUS_PX}
          ry={BOX_OUTLINE_RADIUS_PX}
          {...glowProps}
          strokeWidth={7}
          opacity={0.85}
        />
      </>
    );
  }

  const path = shapeOutlinePath(shape, width, height);
  if (!path) {
    return null;
  }

  return (
    <>
      <path d={path} {...glowProps} strokeWidth={12} opacity={0.35} />
      <path d={path} {...glowProps} strokeWidth={7} opacity={0.85} />
    </>
  );
}

export function WorkspaceNodeShapeOutline({
  shape,
  width,
  height,
  borderColor,
  borderWidth = 2,
  selected,
  showBaseOutline = true,
  filesPanelHighlighted = false,
}: WorkspaceNodeShapeOutlineProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  if (shape === "circle") {
    const { cx, cy, r } = getInscribedCircleGeometry(width, height);
    return (
      <svg
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        {showBaseOutline && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {filesPanelHighlighted && (
          <FilesPanelShapeGlow shape={shape} width={width} height={height} />
        )}
        {selected && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth={4}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    );
  }

  if (shape === "box") {
    return (
      <svg
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        {showBaseOutline && (
          <rect
            x={1}
            y={1}
            width={Math.max(width - 2, 0)}
            height={Math.max(height - 2, 0)}
            rx={BOX_OUTLINE_RADIUS_PX}
            ry={BOX_OUTLINE_RADIUS_PX}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {filesPanelHighlighted && (
          <FilesPanelShapeGlow shape={shape} width={width} height={height} />
        )}
        {selected && (
          <rect
            x={1}
            y={1}
            width={Math.max(width - 2, 0)}
            height={Math.max(height - 2, 0)}
            rx={BOX_OUTLINE_RADIUS_PX}
            ry={BOX_OUTLINE_RADIUS_PX}
            fill="none"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth={4}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    );
  }

  const path = shapeOutlinePath(shape, width, height);
  if (!path) {
    return null;
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {showBaseOutline && (
        <path
          d={path}
          fill="none"
          stroke={borderColor}
          strokeWidth={borderWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {filesPanelHighlighted && (
        <FilesPanelShapeGlow shape={shape} width={width} height={height} />
      )}
      {selected && (
        <path
          d={path}
          fill="none"
          stroke="rgba(56, 189, 248, 0.45)"
          strokeWidth={4}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
