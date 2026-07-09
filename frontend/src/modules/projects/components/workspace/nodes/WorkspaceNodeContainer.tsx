// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeContainer.tsx

// Shared clipped shell for workspace note and media cards.

import { useUpdateNodeInternals } from "@xyflow/react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { WorkspaceNodeSide } from "../../../hooks/useWorkspaceNodeConnectedSides";
import {
  containerShapeClipStyle,
  containerShapeShellClass,
  getShapeContentFrame,
  getShapeMediaTitleFrame,
  type ShapeContentLayout,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";
import {
  workspaceNodeShadowClass,
  workspaceFilesPanelGlowBoxShadow,
} from "../../../lib/workspace/node";
import { WorkspaceNodeShapeOutline } from "./WorkspaceNodeShapeOutline";
import { WorkspaceNodeSideGradients } from "./WorkspaceNodeSideGradients";

export type WorkspaceNodeMeasuredSize = {
  width: number;
  height: number;
};

type WorkspaceNodeContainerProps = {
  nodeId: string;
  shape: WorkspaceContainerShape;
  hideChrome: boolean;
  selected: boolean;
  filesPanelHighlighted?: boolean;
  connectedSides: Set<WorkspaceNodeSide>;
  accentColor: string;
  transparent?: boolean;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  chromeClassName?: string;
  contentLayout?: ShapeContentLayout;
  /** Filename or label rendered inside the shape near the bottom edge. */
  bottomLabel?: ReactNode;
  handles?: (size: WorkspaceNodeMeasuredSize) => ReactNode;
  children: ReactNode;
  onDoubleClick?: () => void;
  onSizeChange?: (size: WorkspaceNodeMeasuredSize) => void;
};

export function WorkspaceNodeContainer({
  nodeId,
  shape,
  hideChrome,
  selected,
  filesPanelHighlighted = false,
  connectedSides,
  accentColor,
  transparent = false,
  fillColor,
  borderColor,
  borderWidth = 2,
  chromeClassName,
  contentLayout = "fill",
  bottomLabel,
  handles,
  children,
  onDoubleClick,
  onSizeChange,
}: WorkspaceNodeContainerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = shellRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      // offsetWidth/Height are layout pixels unaffected by the canvas zoom
      // transform; getBoundingClientRect would be scaled and misplace handles/content.
      const next = {
        width: Math.max(node.offsetWidth, 1),
        height: Math.max(node.offsetHeight, 1),
      };
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
      onSizeChange?.(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onSizeChange]);

  useLayoutEffect(() => {
    if (size.width > 0 && size.height > 0) {
      updateNodeInternals(nodeId);
    }
  }, [nodeId, shape, size.width, size.height, updateNodeInternals]);

  const clipStyle = containerShapeClipStyle(shape, size.width, size.height);
  const contentFrame = getShapeContentFrame(
    shape,
    size.width,
    size.height,
    contentLayout,
    { reserveTitleBar: Boolean(bottomLabel) },
  );
  const isMediaLayout = contentLayout === "media";

  const showBoxBorder =
    !hideChrome && shape === "box" && borderColor && size.width > 0 && size.height > 0;

  const boxBorderGlow =
    filesPanelHighlighted && shape === "box" && showBoxBorder
      ? workspaceFilesPanelGlowBoxShadow()
      : undefined;

  const innerStyle: CSSProperties = {
    ...clipStyle,
    backgroundColor: transparent ? "transparent" : fillColor,
    ...(showBoxBorder
      ? {
          border: `2px solid ${borderColor}`,
          borderWidth,
          boxSizing: "border-box",
          borderRadius: "0.5rem",
          ...(boxBorderGlow ? { boxShadow: boxBorderGlow } : {}),
        }
      : {}),
  };

  const titleFrame =
    bottomLabel && !hideChrome && size.width > 0 && size.height > 0
      ? getShapeMediaTitleFrame(shape, size.width, size.height)
      : null;

  const showShapeOutline =
    borderColor &&
    size.width > 0 &&
    size.height > 0 &&
    (shape !== "box" || (hideChrome && filesPanelHighlighted)) &&
    (!hideChrome || filesPanelHighlighted);

  return (
    <div
      ref={shellRef}
      className={[
        "absolute inset-0 overflow-visible",
        containerShapeShellClass(shape),
        hideChrome ? "" : chromeClassName ?? "",
        shape === "box" ? workspaceNodeShadowClass(selected, hideChrome) : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDoubleClick={onDoubleClick}
    >
      {showShapeOutline && (
        <WorkspaceNodeShapeOutline
          shape={shape}
          width={size.width}
          height={size.height}
          borderColor={borderColor}
          borderWidth={borderWidth}
          selected={selected}
          showBaseOutline={!hideChrome}
          filesPanelHighlighted={filesPanelHighlighted}
        />
      )}

      <div className="absolute inset-0 overflow-hidden" style={innerStyle}>
        {hideChrome && size.width > 0 && size.height > 0 && (
          <WorkspaceNodeSideGradients
            shape={shape}
            connectedSides={connectedSides}
            color={accentColor}
            width={size.width}
            height={size.height}
          />
        )}

        <div
          className={[
            "absolute overflow-hidden",
            isMediaLayout ? "flex items-center justify-center" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            left: contentFrame.left,
            top: contentFrame.top,
            width: contentFrame.width,
            height: contentFrame.height,
          }}
        >
          {children}
        </div>

        {titleFrame && titleFrame.width > 0 && titleFrame.height > 0 ? (
          <div
            className="pointer-events-none absolute z-[4] flex items-center justify-center overflow-hidden"
            style={{
              left: titleFrame.left,
              top: titleFrame.top,
              width: titleFrame.width,
              height: titleFrame.height,
            }}
          >
            {bottomLabel}
          </div>
        ) : null}
      </div>

      {size.width > 0 && size.height > 0 && handles ? (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
          {handles(size)}
        </div>
      ) : null}
    </div>
  );
}
