// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationDraggablePanel.ts

import { useCallback, useEffect, useRef } from "react";

import { clampFocusConstellationPanelPosition } from "../../lib/constellation/draggablePanel";
import type { FocusConstellationConfigPanelPosition } from "../../lib/focus";

const DRAG_THRESHOLD_PX = 4;



type UseFocusConstellationDraggablePanelParams = {
  position: FocusConstellationConfigPanelPosition;
  onPositionChange: (position: FocusConstellationConfigPanelPosition) => void;
  enabled?: boolean;
};



export function useFocusConstellationDraggablePanel({
  position,
  onPositionChange,
  enabled = true,
}: UseFocusConstellationDraggablePanelParams) {
  const boundsRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const measureAndClamp = useCallback((candidate: FocusConstellationConfigPanelPosition) => {
    const bounds = boundsRef.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (!bounds || !panel) {
      return candidate;
    }
    return clampFocusConstellationPanelPosition(
      candidate,
      panel.width,
      panel.height,
      bounds.width,
      bounds.height,
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleResize = () => {
      const clamped = measureAndClamp(position);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        onPositionChange(clamped);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [enabled, measureAndClamp, onPositionChange, position]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const clamped = measureAndClamp(position);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        onPositionChange(clamped);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [enabled, measureAndClamp, onPositionChange, position]);

  const finishDragSession = useCallback(() => {
    dragSessionRef.current = null;
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      dragSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: position.x,
        originY: position.y,
        moved: false,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
    },
    [position.x, position.y],
  );

  const handleHeaderPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
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
      event.stopPropagation();

      onPositionChange(
        measureAndClamp({
          x: session.originX + deltaX,
          y: session.originY + deltaY,
        }),
      );
    },
    [measureAndClamp, onPositionChange],
  );

  const handleHeaderPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        onPositionChange(
          measureAndClamp({
            x: session.originX + (event.clientX - session.startClientX),
            y: session.originY + (event.clientY - session.startClientY),
          }),
        );
      }

      finishDragSession();
      event.stopPropagation();
    },
    [finishDragSession, measureAndClamp, onPositionChange],
  );

  const handleHeaderPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        onPositionChange(
          measureAndClamp({
            x: session.originX,
            y: session.originY,
          }),
        );
      }

      finishDragSession();
      event.stopPropagation();
    },
    [finishDragSession, measureAndClamp, onPositionChange],
  );

  return {
    boundsRef,
    panelRef,
    handleHeaderPointerDown,
    handleHeaderPointerMove,
    handleHeaderPointerUp,
    handleHeaderPointerCancel,
  };
}
