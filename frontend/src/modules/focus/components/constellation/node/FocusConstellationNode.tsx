// src/modules/focus/components/constellation/node/FocusConstellationNode.tsx

// Circular node for the focus constellation canvas.

import { Fragment, memo, useEffect, useRef, useState } from "react";
import { Handle, type NodeProps } from "@xyflow/react";

import { projectTitleFontStyle } from "../../../../projects/lib/project/appearance";
import { resolveFocusConstellationNodeLabelFont } from "../../../lib/focus";
import { isFocusConstellationListNode } from "../../../lib/constellation/listNodeStyle";
import { resolveFocusConstellationNodeSurfaceStyles } from "../../../lib/constellation/nodeSurfaceStyle";
import { useFocusConstellationNodeHoverZIndex } from "../../../hooks/useFocusConstellationNodeHoverZIndex";
import { useFocusConstellationWorkOrderBadge } from "../../../hooks/useFocusConstellationWorkOrderBadge";
import { useFocusNodeTimer } from "../../../hooks/useFocusNodeTimer";
import {
  FOCUS_NODE_TIMER_PILL_SURFACE_CLASS,
  formatElapsedTime,
} from "../../forms/timer";
import { useFocusConstellationAnimation } from "../canvas";
import { useFocusConstellationNodeHover } from "./FocusConstellationNodeHoverContext";
import {
  CONNECTION_SIDES,
  HEXAGON_CLIP_PATH,
  ORIGIN_PULSE_KEYFRAMES,
} from "./FocusConstellationNode.constants";
import { FocusConstellationNodeStatusGlow } from "./FocusConstellationNodeStatusGlow";
import { FocusConstellationOrbitHandle } from "./FocusConstellationOrbitHandle";
import { FocusConstellationWorkOrderBadge } from "./FocusConstellationWorkOrderBadge";
import { FocusConstellationNodeMediaContent } from "./FocusConstellationNodeMediaContent";
import { FocusReferenceTypeIcon } from "../references";
import { FocusReferencePropertyInspector } from "../references";
import type { FocusConstellationFlowNode } from "./FocusConstellationNode.types";

export type {
  FocusConstellationFlowNode,
  FocusConstellationNodeData,
} from "./FocusConstellationNode.types";

function FocusConstellationNodeTimerPill({ nodeId }: { nodeId: number }) {
  const timer = useFocusNodeTimer({
    nodeId,
    historyEnabled: false,
  });
  const activeEntry = timer.activeEntry;

  if (!activeEntry) {
    return null;
  }

  const isPaused = activeEntry.status === "paused";

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
      <span
        className={[
          FOCUS_NODE_TIMER_PILL_SURFACE_CLASS,
          "block min-w-[5.6rem] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.45)]",
        ].join(" ")}
        style={{
          backgroundColor: isPaused ? "rgb(180 83 9)" : "rgb(4 120 87)",
          borderColor: isPaused ? "rgb(252 211 77 / 0.72)" : "rgb(110 231 183 / 0.72)",
        }}
        title={isPaused ? "Timer paused" : "Timer running"}
      >
        {formatElapsedTime(timer.elapsedSeconds)}
      </span>
    </div>
  );
}

function FocusConstellationNodeComponent({
  id,
  data,
}: NodeProps<FocusConstellationFlowNode>) {
  const shellRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const referenceIconRef = useRef<HTMLButtonElement>(null);
  const [isNodeHovered, setIsNodeHovered] = useState(false);
  const [isOrbitZoneHovered, setIsOrbitZoneHovered] = useState(false);
  const [isReferenceIconHovered, setIsReferenceIconHovered] = useState(false);
  const [referenceInspectorOpen, setReferenceInspectorOpen] = useState(false);
  const {
    getNodeVisual,
    showOrbitHandle,
    activeOrbitHandleNodeId,
    onOrbitHandleDragStart,
  } = useFocusConstellationAnimation();
  const { reportNodeHover } = useFocusConstellationNodeHover();
  const isOrbitHandleActive = activeOrbitHandleNodeId === id;
  const visual = getNodeVisual(id);
  const isListNode = isFocusConstellationListNode(data);
  const isTaskLeafNode =
    data.kind === "entry" && data.entryKind === "task" && !data.canExpand;
  const nodeLabelFont = resolveFocusConstellationNodeLabelFont(
    data.labelFontKey,
    data.titleFontKey,
  );
  const visualNodeSize = data.isOrigin ? data.nodeSize * 1.18 : data.nodeSize;

  const {
    badgeRef,
    badgeOffset,
    isBadgeHovered,
    setIsBadgeHovered,
    handleBadgePointerDown,
    handleBadgePointerMove,
    handleBadgePointerUp,
    handleBadgePointerCancel,
  } = useFocusConstellationWorkOrderBadge({
    workOrder: data.workOrder,
    workOrderBadgeAngle: data.workOrderBadgeAngle,
    onWorkOrderChange: data.onWorkOrderChange,
    onWorkOrderBadgeAngleChange: data.onWorkOrderBadgeAngleChange,
    nodeRef,
    visualNodeSize,
    shape: data.shape,
    setIsNodeHovered,
  });

  const isNodeSurfaceHovered =
    isNodeHovered && !isBadgeHovered && !isReferenceIconHovered;
  const showHandle =
    data.hasOrbitHandle && (isOrbitZoneHovered || isOrbitHandleActive) && showOrbitHandle;
  const canInspectReference =
    data.nodeKind === "record" &&
    data.referenceTargetType !== null &&
    data.referenceTargetId !== null;
  const showReferenceMediaContent =
    data.referenceTargetType === "media_object" &&
    data.showReferenceContent &&
    !data.referenceIsMissing &&
    data.referenceTargetId !== null;
  const { surfaceStyle, hexStrokeColor, originAccentRgb, statusBackGlow } =
    resolveFocusConstellationNodeSurfaceStyles({
      colorHex: data.colorHex,
      listNodeStyle: data.listNodeStyle,
      shape: data.shape,
      status: data.status,
      isOrigin: data.isOrigin,
      isSelected: data.isSelected,
      isOnHighlightedPath: data.isOnHighlightedPath,
      isAutomationHighlighted: data.isAutomationHighlighted,
      isListNode,
      isNodeSurfaceHovered,
      isTaskLeafNode,
    });

  useFocusConstellationNodeHoverZIndex(
    shellRef,
    isNodeSurfaceHovered,
    isBadgeHovered || isReferenceIconHovered,
  );

  useEffect(() => {
    if (!isNodeSurfaceHovered) {
      reportNodeHover(id, null);
      return;
    }
    reportNodeHover(id, {
      title: data.title,
      notes: data.notes,
      status: data.status,
      workOrder: data.workOrder,
      tags: data.tags,
      timerNodeId: data.timerNodeId,
      referenceTargetType: data.referenceTargetType,
      referenceTargetId: data.referenceTargetId,
      referenceIsMissing: data.referenceIsMissing,
    });
  }, [
    data.notes,
    data.referenceIsMissing,
    data.referenceTargetId,
    data.referenceTargetType,
    data.status,
    data.tags,
    data.timerNodeId,
    data.title,
    data.workOrder,
    id,
    isNodeSurfaceHovered,
    reportNodeHover,
  ]);

  return (
    <div
      ref={shellRef}
      className={[
        "focus-constellation-node-shell nokey",
        data.isOrigin ? "focus-constellation-node-shell--origin" : "",
        data.isSelected ? "focus-constellation-node-shell--selected" : "",
        !visual.visible ? "pointer-events-none" : "",
      ].join(" ")}
      onPointerDownCapture={data.onSelectionPointerDown}
      style={{
        position: "relative",
        visibility: visual.visible ? "visible" : "hidden",
        zIndex: isNodeSurfaceHovered || isBadgeHovered || isReferenceIconHovered ? 20 : undefined,
      }}
    >
      <div
        className="focus-constellation-node__visual"
        style={{
          opacity: visual.opacity,
          transform: `translate(${visual.translateX}px, ${visual.translateY}px) scale(${visual.scale})`,
        }}
      >
        {data.isOrigin ? <style>{ORIGIN_PULSE_KEYFRAMES}</style> : null}
        <div
          className="focus-constellation-node__orbit-zone"
          style={{ position: "relative", width: visualNodeSize, height: visualNodeSize }}
          onPointerEnter={() => setIsOrbitZoneHovered(true)}
          onPointerLeave={(event) => {
            const nextTarget = event.relatedTarget;
            if (
              nextTarget instanceof Element &&
              event.currentTarget.contains(nextTarget)
            ) {
              return;
            }
            setIsOrbitZoneHovered(false);
          }}
        >
          {statusBackGlow ? (
            <FocusConstellationNodeStatusGlow
              statusBackGlow={statusBackGlow}
              visualNodeSize={visualNodeSize}
              shape={data.shape}
            />
          ) : null}
          <div
            ref={nodeRef}
            role={data.canExpand ? "button" : undefined}
            tabIndex={data.canExpand ? 0 : undefined}
            onPointerEnter={() => setIsNodeHovered(true)}
            onPointerLeave={() => setIsNodeHovered(false)}
            onFocus={() => setIsNodeHovered(true)}
            onBlur={() => setIsNodeHovered(false)}
            onKeyDown={(event) => {
              if (!data.canExpand) {
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                data.onToggle();
              }
            }}
            className={[
              "focus-constellation-node nopan relative z-10 flex items-center justify-center text-center",
              data.shape === "circle"
                ? "focus-constellation-node--circle rounded-full"
                : "focus-constellation-node--hexagon",
              data.isOrigin ? "focus-constellation-node--origin" : "",
              data.isExpanded ? "focus-constellation-node--expanded" : "",
              isNodeSurfaceHovered ? "focus-constellation-node--hovered" : "",
              data.isOrigin
                ? data.canExpand
                  ? "cursor-pointer"
                  : "cursor-default"
                : "cursor-grab active:cursor-grabbing",
            ].join(" ")}
            style={{
              width: visualNodeSize,
              height: visualNodeSize,
              clipPath: data.shape === "hexagon" ? HEXAGON_CLIP_PATH : undefined,
              ...surfaceStyle,
            }}
            aria-label={data.title}
            aria-expanded={data.canExpand ? data.isExpanded : undefined}
          >
            {showReferenceMediaContent ? (
              <FocusConstellationNodeMediaContent
                mediaId={data.referenceTargetId!}
                mimeType={data.referenceMimeType}
                mediaKind={data.referenceMediaKind}
                title={data.title}
                contentUpdatedAt={data.referenceContentUpdatedAt}
                shape={data.shape}
              />
            ) : null}
            {data.isOrigin ? (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{
                  width: visualNodeSize,
                  height: visualNodeSize,
                  border: `2px solid rgba(${originAccentRgb}, 0.72)`,
                  borderRadius: data.shape === "circle" ? "9999px" : undefined,
                  clipPath: data.shape === "hexagon" ? HEXAGON_CLIP_PATH : undefined,
                  animation: "focus-origin-pulse 4.8s ease-out infinite",
                }}
                aria-hidden
              />
            ) : null}
            {data.shape === "hexagon" ? (
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden
              >
                <polygon
                  points="25,7 75,7 99,50 75,93 25,93 1,50"
                  fill="none"
                  stroke={hexStrokeColor}
                  strokeWidth={
                    data.isOrigin
                      ? isNodeSurfaceHovered
                        ? "3"
                        : "2.4"
                      : data.isSelected
                        ? "2.6"
                        : isNodeSurfaceHovered
                          ? "2"
                          : "1.4"
                  }
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
            {data.workOrder !== null ? (
              <FocusConstellationWorkOrderBadge
                workOrder={data.workOrder}
                badgeRef={badgeRef}
                badgeOffset={badgeOffset}
                onPointerEnter={(event) => {
                  event.stopPropagation();
                  setIsBadgeHovered(true);
                }}
                onPointerLeave={(event) => {
                  event.stopPropagation();
                  setIsBadgeHovered(false);
                }}
                onPointerDown={handleBadgePointerDown}
                onPointerMove={handleBadgePointerMove}
                onPointerUp={handleBadgePointerUp}
                onPointerCancel={handleBadgePointerCancel}
              />
            ) : null}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-2.5">
              {data.isOrigin ? (
                <span
                  className="rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                  style={{
                    borderColor: `rgba(${originAccentRgb}, 0.66)`,
                    backgroundColor: `rgba(${originAccentRgb}, 0.22)`,
                  }}
                >
                  Origin
                </span>
              ) : null}
              {showReferenceMediaContent ? null : (
                <span
                  className={[
                    "focus-constellation-node__label text-[11px] font-semibold leading-tight tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-150",
                    isNodeSurfaceHovered ? "text-white" : "text-white/95",
                  ].join(" ")}
                  style={{
                    ...projectTitleFontStyle(nodeLabelFont),
                    display: "-webkit-box",
                    fontSize: data.titleSizePx,
                    maxWidth: Math.max(44, visualNodeSize * 0.72),
                    overflow: "hidden",
                    overflowWrap: "anywhere",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: data.isOrigin ? 2 : 3,
                  }}
                >
                  {data.title}
                </span>
              )}
            </div>
            {CONNECTION_SIDES.map((side) => (
              <Fragment key={side.id}>
                <Handle
                  type="source"
                  id={side.id}
                  position={side.position}
                  className="!pointer-events-none !h-1 !w-1 !min-w-0 !border-0 !bg-transparent !opacity-0"
                />
                <Handle
                  type="target"
                  id={side.id}
                  position={side.position}
                  className="!pointer-events-none !h-1 !w-1 !min-w-0 !border-0 !bg-transparent !opacity-0"
                />
              </Fragment>
            ))}
          </div>
          <FocusConstellationNodeTimerPill nodeId={data.timerNodeId} />
          {canInspectReference ? (
            <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2">
              <button
                ref={referenceIconRef}
                type="button"
                data-focus-reference-icon="true"
                className={[
                  "nodrag nopan group cursor-pointer rounded-full touch-none transition duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
                  isReferenceIconHovered ? "scale-110" : "",
                ].join(" ")}
                aria-label="View reference properties"
                aria-expanded={referenceInspectorOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setReferenceInspectorOpen((current) => !current);
                }}
                onPointerEnter={(event) => {
                  event.stopPropagation();
                  setIsReferenceIconHovered(true);
                }}
                onPointerLeave={(event) => {
                  event.stopPropagation();
                  setIsReferenceIconHovered(false);
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsNodeHovered(false);
                }}
              >
                <FocusReferenceTypeIcon
                  targetType={data.referenceTargetType!}
                  hovered={isReferenceIconHovered}
                />
              </button>
              <FocusReferencePropertyInspector
                open={referenceInspectorOpen}
                anchorRef={referenceIconRef}
                targetType={data.referenceTargetType!}
                targetId={data.referenceTargetId!}
                onClose={() => setReferenceInspectorOpen(false)}
              />
            </div>
          ) : null}
          {showHandle ? (
            <FocusConstellationOrbitHandle
              nodeSize={visualNodeSize}
              shape={data.shape}
              visible
              dragging={isOrbitHandleActive}
              onDragStart={(clientX, clientY) => onOrbitHandleDragStart(id, clientX, clientY)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const FocusConstellationNode = memo(FocusConstellationNodeComponent);
