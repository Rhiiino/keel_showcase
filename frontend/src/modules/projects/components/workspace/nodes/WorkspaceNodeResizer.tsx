// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeResizer.tsx

// Resize controls for workspace cards. Box uses the standard corner handles; circle
// and hexagon place grab controls on the visible perimeter's diagonal corners (the
// regions between connection nodes) so the shape itself can be dragged to resize.

import {
  NodeResizeControl,
  NodeResizer,
  type NodeResizerProps,
} from "@xyflow/react";

import {
  shapeResizeCornerPoints,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";

type WorkspaceNodeResizerProps = Pick<
  NodeResizerProps,
  "minWidth" | "minHeight" | "maxWidth" | "maxHeight" | "isVisible" | "keepAspectRatio"
> & {
  shape?: WorkspaceContainerShape;
  width?: number;
  height?: number;
  /** When false, resize controls stay mounted but ignore pointer events. */
  interactive?: boolean;
};

const HANDLE_SIZE = 24;
const HANDLE_MARGIN = -6;
const SHAPE_HANDLE_SIZE = 30;

export function WorkspaceNodeResizer({
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  isVisible,
  keepAspectRatio,
  shape = "box",
  width = 0,
  height = 0,
  interactive = true,
}: WorkspaceNodeResizerProps) {
  if (shape !== "box" && width > 0 && height > 0) {
    if (!isVisible) {
      return null;
    }

    const corners = shapeResizeCornerPoints(shape, width, height);
    return (
      <>
        {corners.map((point) => (
          <NodeResizeControl
            key={point.corner}
            position={point.corner}
            minWidth={minWidth}
            minHeight={minHeight}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            keepAspectRatio={keepAspectRatio}
            autoScale={false}
            style={{
              left: point.x,
              top: point.y,
              width: SHAPE_HANDLE_SIZE,
              height: SHAPE_HANDLE_SIZE,
              opacity: 0,
              border: "none",
              background: "transparent",
              pointerEvents: interactive ? "auto" : "none",
              zIndex: 21,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      isVisible={isVisible}
      keepAspectRatio={keepAspectRatio}
      autoScale={false}
      lineClassName="!border-transparent !opacity-0"
      lineStyle={{ opacity: 0, borderColor: "transparent", pointerEvents: interactive ? "auto" : "none" }}
      handleClassName="!border-0 !bg-transparent !opacity-0"
      handleStyle={{
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        margin: HANDLE_MARGIN,
        opacity: 0,
        border: "none",
        background: "transparent",
        pointerEvents: interactive ? "auto" : "none",
        zIndex: 20,
      }}
    />
  );
}
