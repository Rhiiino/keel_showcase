// keel_web/src/modules/coak/hooks/panels/useCoakDraggablePanel.ts

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  applyFreeResize,
  clampPanelPosition,
  COAK_PANEL_MIN_HEIGHT,
  COAK_PANEL_MIN_WIDTH,
  resolveAnchorRect,
  type CoakPanelBounds,
  type CoakPanelRect,
  type CoakPanelSize,
  type CoakResizeHandle,
} from "../../lib/panels/coakPanelGeometry";

export type CoakPanelAnchor = "top-left" | "top-right";

const DRAG_THRESHOLD_PX = 4;

/** Default panel size as a fraction of the content bounds. */
export const COAK_CONSTELLATION_PANEL_DEFAULT_WIDTH_FRACTION = 0.5;
export const COAK_CONSTELLATION_PANEL_DEFAULT_HEIGHT_FRACTION = 0.45;
export const COAK_DIRECTORY_PANEL_DEFAULT_WIDTH_FRACTION = 0.34;
export const COAK_DIRECTORY_PANEL_DEFAULT_HEIGHT_FRACTION = 0.5;

const RESIZE_HANDLES: CoakResizeHandle[] = ["n", "s", "e", "w", "nw", "ne", "sw", "se"];

type UseCoakDraggablePanelOptions = {
  boundsRef: RefObject<HTMLDivElement | null>;
  initialAnchor?: CoakPanelAnchor;
  defaultSizeForBounds: (bounds: CoakPanelBounds) => CoakPanelSize;
  initialRect?: CoakPanelRect | null;
  onRectChange?: (rect: CoakPanelRect) => void;
  onHeaderDragEnd?: (clientX: number, clientY: number) => void;
  enabled?: boolean;
};

type DragSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type ResizeSession = {
  pointerId: number;
  handle: CoakResizeHandle;
  startClientX: number;
  startClientY: number;
  originRect: CoakPanelRect;
};

function getBounds(boundsRef: RefObject<HTMLDivElement | null>): CoakPanelBounds | null {
  const bounds = boundsRef.current?.getBoundingClientRect();
  if (!bounds) {
    return null;
  }

  return {
    width: bounds.width,
    height: bounds.height,
  };
}

export function useCoakDraggablePanel({
  boundsRef,
  initialAnchor = "top-left",
  defaultSizeForBounds,
  initialRect = null,
  onRectChange,
  onHeaderDragEnd,
  enabled = true,
}: UseCoakDraggablePanelOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasAppliedInitialLayoutRef = useRef(false);
  const hasPersistedInitialLayoutRef = useRef(false);
  const rectRef = useRef<CoakPanelRect>({ x: 0, y: 0, width: 0, height: 0 });
  const onRectChangeRef = useRef(onRectChange);
  onRectChangeRef.current = onRectChange;
  const onHeaderDragEndRef = useRef(onHeaderDragEnd);
  onHeaderDragEndRef.current = onHeaderDragEnd;
  const [rect, setRect] = useState<CoakPanelRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] = useState<CoakResizeHandle | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);

  const measureAndClampRect = useCallback(
    (candidate: CoakPanelRect) => {
      const bounds = getBounds(boundsRef);
      if (!bounds) {
        return candidate;
      }

      const width = Math.min(Math.max(COAK_PANEL_MIN_WIDTH, candidate.width), bounds.width);
      const height = Math.min(Math.max(COAK_PANEL_MIN_HEIGHT, candidate.height), bounds.height);
      const position = clampPanelPosition(
        { x: candidate.x, y: candidate.y },
        width,
        height,
        bounds.width,
        bounds.height,
      );

      return {
        ...position,
        width,
        height,
      };
    },
    [boundsRef],
  );

  const applyInitialLayout = useCallback(() => {
    const bounds = getBounds(boundsRef);
    if (!bounds) {
      return;
    }

    const savedRect =
      initialRect && initialRect.width > 0 && initialRect.height > 0 ? initialRect : null;
    const size = defaultSizeForBounds(bounds);
    const anchored = savedRect ?? resolveAnchorRect(initialAnchor, size, bounds);
    const nextRect = measureAndClampRect(anchored);
    setRect(nextRect);
    rectRef.current = nextRect;
    hasAppliedInitialLayoutRef.current = true;

    const needsPersistedRect =
      !savedRect || savedRect.width <= 0 || savedRect.height <= 0;
    if (
      onRectChangeRef.current &&
      !hasPersistedInitialLayoutRef.current &&
      needsPersistedRect &&
      nextRect.width > 0 &&
      nextRect.height > 0
    ) {
      hasPersistedInitialLayoutRef.current = true;
      onRectChangeRef.current(nextRect);
    }
  }, [boundsRef, defaultSizeForBounds, initialAnchor, initialRect, measureAndClampRect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    applyInitialLayout();
    const bounds = boundsRef.current;
    if (!bounds) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setRect((current) => {
        if (!hasAppliedInitialLayoutRef.current || current.width === 0 || current.height === 0) {
          return current;
        }

        return measureAndClampRect(current);
      });
    });
    observer.observe(bounds);
    return () => observer.disconnect();
  }, [applyInitialLayout, boundsRef, enabled, measureAndClampRect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handleResize = () => {
      setRect((current) => {
        if (!hasAppliedInitialLayoutRef.current || current.width === 0 || current.height === 0) {
          applyInitialLayout();
          return current;
        }

        return measureAndClampRect(current);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [applyInitialLayout, enabled, measureAndClampRect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      applyInitialLayout();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [applyInitialLayout, enabled]);

  useEffect(() => {
    if (!enabled || !initialRect || initialRect.width <= 0 || initialRect.height <= 0) {
      return;
    }

    setRect((current) => {
      const nextRect = measureAndClampRect(initialRect);
      if (
        current.x === nextRect.x &&
        current.y === nextRect.y &&
        current.width === nextRect.width &&
        current.height === nextRect.height
      ) {
        return current;
      }
      rectRef.current = nextRect;
      return nextRect;
    });
    hasAppliedInitialLayoutRef.current = true;
  }, [enabled, initialRect, measureAndClampRect]);

  const notifyRectChange = useCallback((nextRect: CoakPanelRect) => {
    rectRef.current = nextRect;
    onRectChangeRef.current?.(nextRect);
  }, []);

  const finishDragSession = useCallback(() => {
    dragSessionRef.current = null;
    setIsDraggingHeader(false);
  }, []);

  const finishResizeSession = useCallback(() => {
    resizeSessionRef.current = null;
    setActiveResizeHandle(null);
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || resizeSessionRef.current) {
        return;
      }

      dragSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: rect.x,
        originY: rect.y,
        moved: false,
      };
      setIsDraggingHeader(true);

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [rect.x, rect.y],
  );

  const handleHeaderPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const deltaX = event.clientX - session.startClientX;
      const deltaY = event.clientY - session.startClientY;
      if (!session.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      session.moved = true;
      event.preventDefault();

      setRect((current) =>
        measureAndClampRect({
          ...current,
          x: session.originX + deltaX,
          y: session.originY + deltaY,
        }),
      );
    },
    [measureAndClampRect],
  );

  const finishHeaderPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        setRect((current) => {
          const nextRect = measureAndClampRect({
            ...current,
            x: session.originX + (event.clientX - session.startClientX),
            y: session.originY + (event.clientY - session.startClientY),
          });
          notifyRectChange(nextRect);
          return nextRect;
        });
        onHeaderDragEndRef.current?.(event.clientX, event.clientY);
      }

      finishDragSession();
    },
    [finishDragSession, measureAndClampRect, notifyRectChange],
  );

  const handleResizePointerDown = useCallback(
    (handle: CoakResizeHandle, event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || dragSessionRef.current) {
        return;
      }

      event.stopPropagation();
      resizeSessionRef.current = {
        pointerId: event.pointerId,
        handle,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originRect: rect,
      };
      setActiveResizeHandle(handle);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [rect],
  );

  const handleResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const session = resizeSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      event.preventDefault();

      const bounds = getBounds(boundsRef);
      if (!bounds) {
        return;
      }

      const deltaX = event.clientX - session.startClientX;
      const deltaY = event.clientY - session.startClientY;

      const nextRect = applyFreeResize(
        session.originRect,
        session.handle,
        deltaX,
        deltaY,
        COAK_PANEL_MIN_WIDTH,
        COAK_PANEL_MIN_HEIGHT,
        bounds,
      );

      setRect(measureAndClampRect(nextRect));
    },
    [boundsRef, measureAndClampRect],
  );

  const finishResizePointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const session = resizeSessionRef.current;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setRect((current) => {
      notifyRectChange(current);
      return current;
    });
    finishResizeSession();
  }, [finishResizeSession, notifyRectChange]);

  return {
    panelRef,
    rect,
    isDraggingHeader,
    activeResizeHandle,
    resizeHandles: RESIZE_HANDLES,
    handleHeaderPointerDown,
    handleHeaderPointerMove,
    handleHeaderPointerUp: finishHeaderPointer,
    handleHeaderPointerCancel: finishHeaderPointer,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp: finishResizePointer,
    handleResizePointerCancel: finishResizePointer,
  };
}
