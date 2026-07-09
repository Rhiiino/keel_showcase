// keel_web/src/modules/projects/components/workspace/edges/WorkspaceEdge.tsx

// Custom workspace edge with directional gradient stroke and editable label.

import {
  EdgeToolbar,
  getBezierPath,
  getSmoothStepPath,
  useStore,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { memo, useCallback, useId, useMemo } from "react";

import { type WorkspaceEdgeData, type WorkspaceEdgePathStyle } from "../../../lib/workspace";
import {
  resolveEdgePathStyle,
  resolveShapedEdgeEndpoints,
  WORKSPACE_EDGE_GRADIENT_SELECTED_SOURCE_OPACITY,
  WORKSPACE_EDGE_GRADIENT_SELECTED_TARGET_OPACITY,
  WORKSPACE_EDGE_GRADIENT_SOURCE_OPACITY,
  WORKSPACE_EDGE_GRADIENT_TARGET_OPACITY,
  sanitizeWorkspaceEdgeGradientId,
  workspaceEdgeInteractionWidth,
} from "../../../lib/workspace/edge";
import { noteColorToStored, resolveEdgeColor } from "../../../lib/workspace/node";
import {
  useWorkspaceConnectionStyle,
  useWorkspacePatchEdges,
} from "../context/WorkspaceCanvasContext";
import { WorkspaceEdgeToolbar } from "./WorkspaceEdgeToolbar";

function WorkspaceEdgeComponent({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<Edge<WorkspaceEdgeData>>) {
  const patchEdges = useWorkspacePatchEdges();
  const globalConnectionStyle = useWorkspaceConnectionStyle();
  const reactId = useId();

  const endpoints = useStore((state) =>
    resolveShapedEdgeEndpoints(
      source,
      target,
      sourceHandleId,
      targetHandleId,
      state.nodeLookup,
      { sourceX, sourceY, targetX, targetY },
    ),
  );

  const pathStyle = resolveEdgePathStyle(data, globalConnectionStyle);
  const strokeColor = resolveEdgeColor(data?.color);
  const interactionWidth = workspaceEdgeInteractionWidth({ data });
  const gradientId = `workspace-edge-gradient-${sanitizeWorkspaceEdgeGradientId(id)}-${sanitizeWorkspaceEdgeGradientId(reactId)}`;
  const sourceOpacity = selected
    ? WORKSPACE_EDGE_GRADIENT_SELECTED_SOURCE_OPACITY
    : WORKSPACE_EDGE_GRADIENT_SOURCE_OPACITY;
  const targetOpacity = selected
    ? WORKSPACE_EDGE_GRADIENT_SELECTED_TARGET_OPACITY
    : WORKSPACE_EDGE_GRADIENT_TARGET_OPACITY;
  const strokeWidth = selected ? 2 : 1.5;

  const [edgePath, labelX, labelY] = useMemo(() => {
    const params = {
      sourceX: endpoints.sourceX,
      sourceY: endpoints.sourceY,
      targetX: endpoints.targetX,
      targetY: endpoints.targetY,
      sourcePosition,
      targetPosition,
    };

    if (pathStyle === "straight") {
      const path = `M ${params.sourceX} ${params.sourceY} L ${params.targetX} ${params.targetY}`;
      return [
        path,
        (params.sourceX + params.targetX) / 2,
        (params.sourceY + params.targetY) / 2,
      ] as const;
    }

    if (pathStyle === "orthogonal") {
      return getSmoothStepPath({
        ...params,
        borderRadius: 0,
      });
    }

    return getBezierPath(params);
  }, [
    pathStyle,
    endpoints.sourceX,
    endpoints.sourceY,
    endpoints.targetX,
    endpoints.targetY,
    sourcePosition,
    targetPosition,
  ]);

  const handleTogglePathStyle = useCallback(() => {
    const nextStyle: WorkspaceEdgePathStyle =
      pathStyle === "smooth"
        ? "straight"
        : pathStyle === "straight"
          ? "orthogonal"
          : "smooth";

    patchEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, pathStyle: nextStyle } }
          : edge,
      ),
    );
  }, [id, pathStyle, patchEdges]);

  const handleSelectColor = useCallback(
    (hex: string) => {
      patchEdges((edges) =>
        edges.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, color: noteColorToStored(hex) } }
            : edge,
        ),
      );
    },
    [id, patchEdges],
  );

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={endpoints.sourceX}
          y1={endpoints.sourceY}
          x2={endpoints.targetX}
          y2={endpoints.targetY}
        >
          <stop offset="0%" stopColor={strokeColor} stopOpacity={sourceOpacity} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={targetOpacity} />
        </linearGradient>
      </defs>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth,
          strokeLinecap: "round",
          opacity: selected ? 1 : 0.85,
        }}
        pointerEvents="stroke"
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={interactionWidth}
        className="react-flow__edge-interaction"
      />
      <EdgeToolbar
        edgeId={id}
        x={labelX}
        y={labelY - 24}
        isVisible={selected}
        alignX="center"
        alignY="bottom"
        className="nodrag nopan"
      >
        <WorkspaceEdgeToolbar
          pathStyle={pathStyle}
          color={strokeColor}
          onTogglePathStyle={handleTogglePathStyle}
          onSelectColor={handleSelectColor}
        />
      </EdgeToolbar>
    </>
  );
}

export const WorkspaceEdge = memo(WorkspaceEdgeComponent);
