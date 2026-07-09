// keel_web/src/modules/coak/components/panels/CoakDraggablePanel.tsx

import { useCallback, type ReactNode, type RefObject } from "react";

import {
  COAK_DIRECTORY_PANEL_DEFAULT_HEIGHT_FRACTION,
  COAK_DIRECTORY_PANEL_DEFAULT_WIDTH_FRACTION,
  useCoakDraggablePanel,
  type CoakPanelAnchor,
} from "../../hooks/panels/useCoakDraggablePanel";
import type { CoakPanelBounds, CoakPanelRect as GeometryPanelRect } from "../../lib/panels/coakPanelGeometry";
import { CoakPanelResizeHandles } from "./CoakPanelResizeHandles";

type CoakDraggablePanelProps = {
  windowId: string;
  title: string;
  ariaLabel: string;
  boundsRef: RefObject<HTMLDivElement | null>;
  initialAnchor?: CoakPanelAnchor;
  defaultSizeForBounds: (bounds: CoakPanelBounds) => { width: number; height: number };
  children: ReactNode;
  headerContent?: ReactNode;
  initialRect?: GeometryPanelRect | null;
  onRectChange?: (rect: GeometryPanelRect) => void;
  onHeaderDragEnd?: (clientX: number, clientY: number) => void;
  bringWindowToFront: (windowId: string) => void;
  getWindowZIndex: (windowId: string) => number;
  isDockTarget?: boolean;
  enabled?: boolean;
};

function CoakPanelDragGrip() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
      <circle cx="9" cy="7" r="1.25" />
      <circle cx="15" cy="7" r="1.25" />
      <circle cx="9" cy="12" r="1.25" />
      <circle cx="15" cy="12" r="1.25" />
      <circle cx="9" cy="17" r="1.25" />
      <circle cx="15" cy="17" r="1.25" />
    </svg>
  );
}

export function defaultDirectoryPanelSize(bounds: CoakPanelBounds) {
  return {
    width: Math.round(bounds.width * COAK_DIRECTORY_PANEL_DEFAULT_WIDTH_FRACTION),
    height: Math.round(bounds.height * COAK_DIRECTORY_PANEL_DEFAULT_HEIGHT_FRACTION),
  };
}

export function CoakDraggablePanel({
  windowId,
  title,
  ariaLabel,
  boundsRef,
  initialAnchor = "top-left",
  defaultSizeForBounds,
  children,
  headerContent,
  initialRect = null,
  onRectChange,
  onHeaderDragEnd,
  bringWindowToFront,
  getWindowZIndex,
  isDockTarget = false,
  enabled = true,
}: CoakDraggablePanelProps) {
  const {
    panelRef,
    rect,
    isDraggingHeader,
    activeResizeHandle,
    resizeHandles,
    handleHeaderPointerDown,
    handleHeaderPointerMove,
    handleHeaderPointerUp,
    handleHeaderPointerCancel,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    handleResizePointerCancel,
  } = useCoakDraggablePanel({
    boundsRef,
    initialAnchor,
    defaultSizeForBounds,
    initialRect,
    onRectChange,
    onHeaderDragEnd,
    enabled,
  });

  const handlePanelPointerDown = useCallback(() => {
    bringWindowToFront(windowId);
  }, [bringWindowToFront, windowId]);

  const handleHeaderPointerDownWithRaise = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      bringWindowToFront(windowId);
      handleHeaderPointerDown(event);
    },
    [bringWindowToFront, handleHeaderPointerDown, windowId],
  );

  const handleResizePointerDownWithRaise = useCallback(
    (handle: Parameters<typeof handleResizePointerDown>[0], event: React.PointerEvent<HTMLDivElement>) => {
      bringWindowToFront(windowId);
      handleResizePointerDown(handle, event);
    },
    [bringWindowToFront, handleResizePointerDown, windowId],
  );

  return (
    <div
      ref={panelRef}
      data-coak-window-id={windowId}
      className={[
        "absolute flex flex-col overflow-hidden rounded-lg border bg-stone-900/95 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
        isDockTarget ? "border-lime-500/70 ring-1 ring-lime-500/30" : "border-stone-700/80",
      ].join(" ")}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width > 0 ? rect.width : undefined,
        height: rect.height > 0 ? rect.height : undefined,
        zIndex: getWindowZIndex(windowId),
      }}
      onPointerDown={handlePanelPointerDown}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        role="toolbar"
        aria-label={ariaLabel}
        data-coak-window-header
        data-coak-window-id={windowId}
        className={[
          "flex h-9 shrink-0 touch-none select-none items-center gap-2 border-b border-stone-700/80",
          "bg-stone-900/90 px-3 text-stone-500 transition",
          isDraggingHeader ? "cursor-grabbing text-lime-400/80" : "cursor-grab hover:text-stone-400",
        ].join(" ")}
        onPointerDown={handleHeaderPointerDownWithRaise}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerCancel}
      >
        <CoakPanelDragGrip />
        {headerContent ?? (
          <span className="text-xs font-medium tracking-wide text-stone-300">{title}</span>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      <CoakPanelResizeHandles
        handles={resizeHandles}
        activeHandle={activeResizeHandle}
        onPointerDown={handleResizePointerDownWithRaise}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerCancel}
      />
    </div>
  );
}
