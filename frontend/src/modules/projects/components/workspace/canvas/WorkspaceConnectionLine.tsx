// keel_web/src/modules/projects/components/workspace/canvas/WorkspaceConnectionLine.tsx

// Directional gradient preview while dragging a new workspace connection.

import {
  getBezierPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import { useId } from "react";

import { resolveEdgeColor } from "../../../lib/workspace/node";
import {
  WORKSPACE_EDGE_GRADIENT_SOURCE_OPACITY,
  WORKSPACE_EDGE_GRADIENT_TARGET_OPACITY,
  sanitizeWorkspaceEdgeGradientId,
} from "../../../lib/workspace/edge";
import { useWorkspaceConnectionStyle } from "../context/WorkspaceCanvasContext";

export function WorkspaceConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const reactId = useId();
  const connectionStyle = useWorkspaceConnectionStyle();
  const gradientId = `workspace-connection-line-gradient-${sanitizeWorkspaceEdgeGradientId(reactId)}`;
  const strokeColor = resolveEdgeColor(null);

  const path =
    connectionStyle === "straight"
      ? `M ${fromX} ${fromY} L ${toX} ${toY}`
      : getBezierPath({
          sourceX: fromX,
          sourceY: fromY,
          targetX: toX,
          targetY: toY,
          sourcePosition: fromPosition,
          targetPosition: toPosition,
        })[0];

  return (
    <g>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
        >
          <stop
            offset="0%"
            stopColor={strokeColor}
            stopOpacity={WORKSPACE_EDGE_GRADIENT_SOURCE_OPACITY}
          />
          <stop
            offset="100%"
            stopColor={strokeColor}
            stopOpacity={WORKSPACE_EDGE_GRADIENT_TARGET_OPACITY}
          />
        </linearGradient>
      </defs>
      <path
        className="react-flow__connection-path"
        fill="none"
        d={path}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: 1.5,
          strokeLinecap: "round",
        }}
      />
    </g>
  );
}
