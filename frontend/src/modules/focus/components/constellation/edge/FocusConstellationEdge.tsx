// src/modules/focus/components/constellation/edge/FocusConstellationEdge.tsx

// Edge that snaps endpoints to the nearest point on each circular node.

import { getBezierPath, getStraightPath, useInternalNode, type EdgeProps } from "@xyflow/react";
import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  type FocusConstellationConnectionColor,
  type FocusConstellationConnectionStyle,
  type FocusConstellationNodeShape,
} from "../../../lib/focus";
import {
  FOCUS_CONSTELLATION_NODE_SIZE,
  connectionPosition,
  shapePerimeterPoint,
} from "../../../lib/constellation/layout";
import { useFocusConstellationAnimation } from "../canvas";

type EdgePoint = { x: number; y: number };

type FocusConstellationEdgeData = {
  shape?: FocusConstellationNodeShape;
  sourcePosition?: EdgePoint;
  targetPosition?: EdgePoint;
  connectionColor?: FocusConstellationConnectionColor;
  connectionStyle?: FocusConstellationConnectionStyle;
  nodeSize?: number;
  isPreview?: boolean;
  isPathHighlighted?: boolean;
  isPathDimmed?: boolean;
};

const CONNECTION_GRADIENT_SOURCE_OPACITY = 0.95;
const CONNECTION_GRADIENT_TARGET_OPACITY = 0.14;
const PATH_HIGHLIGHT_SOURCE_OPACITY = 1;
const PATH_HIGHLIGHT_TARGET_OPACITY = 0.72;
const PATH_DIMMED_OPACITY = 0.16;

function readNodeCenter(
  node: ReturnType<typeof useInternalNode>,
  visualOffset: { translateX: number; translateY: number },
  nodeSize: number,
  fallback?: EdgePoint,
): { x: number; y: number } {
  if (!node) {
    // The internal node store can briefly lack a node after a restructure; use
    // the authoritative layout position so the edge does not collapse.
    if (fallback) {
      return {
        x: fallback.x + nodeSize / 2 + visualOffset.translateX,
        y: fallback.y + nodeSize / 2 + visualOffset.translateY,
      };
    }
    return { x: 0, y: 0 };
  }

  const width = node.measured.width ?? nodeSize;
  const height = node.measured.height ?? nodeSize;
  return {
    x: node.internals.positionAbsolute.x + width / 2 + visualOffset.translateX,
    y: node.internals.positionAbsolute.y + height / 2 + visualOffset.translateY,
  };
}

function sanitizeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function FocusConstellationEdgeComponent({
  id,
  source,
  target,
  data,
  style,
}: EdgeProps & { data?: FocusConstellationEdgeData }) {
  const reactId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const { getNodeVisual, getEdgeVisual } = useFocusConstellationAnimation();
  const shape = data?.shape ?? "circle";
  const connectionColor = data?.connectionColor ?? FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT;
  const connectionStyle = data?.connectionStyle ?? "flexible";
  const isPreview = data?.isPreview ?? false;
  const isPathHighlighted = data?.isPathHighlighted ?? false;
  const isPathDimmed = data?.isPathDimmed ?? false;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const strokeColor = FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX[connectionColor];
  const gradientId = `focus-constellation-edge-gradient-${sanitizeSvgId(id)}-${sanitizeSvgId(reactId)}`;
  const sourceOpacity = isPathHighlighted
    ? PATH_HIGHLIGHT_SOURCE_OPACITY
    : CONNECTION_GRADIENT_SOURCE_OPACITY;
  const targetOpacity = isPathHighlighted
    ? PATH_HIGHLIGHT_TARGET_OPACITY
    : isPathDimmed
      ? PATH_DIMMED_OPACITY
      : CONNECTION_GRADIENT_TARGET_OPACITY;
  const strokeWidth = isPathHighlighted ? 2.35 : isPathDimmed ? 0.95 : 1.15;
  const edgeVisual = getEdgeVisual(id);

  const { edgePath, sourcePoint, targetPoint } = useMemo(() => {
    const nodeSize = data?.nodeSize ?? FOCUS_CONSTELLATION_NODE_SIZE;
    const nodeRadius = nodeSize / 2;
    const sourceCenter = readNodeCenter(
      sourceNode,
      getNodeVisual(source),
      nodeSize,
      data?.sourcePosition,
    );
    const targetCenter = readNodeCenter(
      targetNode,
      getNodeVisual(target),
      nodeSize,
      data?.targetPosition,
    );
    const sourcePoint = shapePerimeterPoint(
      shape,
      sourceCenter,
      targetCenter,
      nodeRadius,
    );
    const targetPoint = shapePerimeterPoint(
      shape,
      targetCenter,
      sourceCenter,
      nodeRadius,
    );

    const [path] =
      connectionStyle === "straight"
        ? getStraightPath({
            sourceX: sourcePoint.x,
            sourceY: sourcePoint.y,
            targetX: targetPoint.x,
            targetY: targetPoint.y,
          })
        : getBezierPath({
            sourceX: sourcePoint.x,
            sourceY: sourcePoint.y,
            targetX: targetPoint.x,
            targetY: targetPoint.y,
            sourcePosition: connectionPosition(sourceCenter, targetCenter),
            targetPosition: connectionPosition(targetCenter, sourceCenter),
          });
    return { edgePath: path, sourcePoint, targetPoint };
  }, [
    connectionStyle,
    data?.nodeSize,
    data?.sourcePosition,
    data?.targetPosition,
    getNodeVisual,
    shape,
    source,
    sourceNode,
    target,
    targetNode,
  ]);

  useLayoutEffect(() => {
    if (!pathRef.current) {
      return;
    }
    setPathLength(pathRef.current.getTotalLength());
  }, [edgePath, sourcePoint.x, sourcePoint.y, targetPoint.x, targetPoint.y]);

  if (!edgeVisual.visible) {
    return null;
  }

  const drawOffset =
    pathLength > 0
      ? pathLength *
        (1 - edgeVisual.drawProgress) *
        (edgeVisual.drawRecedeInto === "target" ? -1 : 1)
      : undefined;

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourcePoint.x}
          y1={sourcePoint.y}
          x2={targetPoint.x}
          y2={targetPoint.y}
        >
          <stop
            offset="0%"
            stopColor={strokeColor}
            stopOpacity={sourceOpacity}
          />
          <stop
            offset="100%"
            stopColor={strokeColor}
            stopOpacity={targetOpacity}
          />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        id={id}
        className={[
          "react-flow__edge-path focus-constellation-edge",
          isPathHighlighted ? "focus-constellation-edge--path-highlighted" : "",
          isPathDimmed ? "focus-constellation-edge--path-dimmed" : "",
        ].join(" ")}
        d={edgePath}
        fill="none"
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth,
          strokeLinecap: "round",
          strokeDasharray: drawOffset !== undefined ? pathLength : isPreview ? "6 7" : undefined,
          strokeDashoffset: drawOffset,
          transition: "stroke-width 150ms ease, opacity 150ms ease",
          ...style,
        }}
      />
    </>
  );
}

export const FocusConstellationEdge = memo(FocusConstellationEdgeComponent);
