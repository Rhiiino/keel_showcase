// keel_web/src/modules/media/hooks/useMediaRowLongPressDrag.ts

// Require a brief hold before HTML5 row drag starts in the media list table.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";

const DEFAULT_LONG_PRESS_MS = 500;

export function shouldIgnoreMediaRowDragTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest("button, a, input, textarea, select, [data-no-row-drag]"));
}

type UseMediaRowLongPressDragOptions = {
  enabled?: boolean;
  longPressMs?: number;
  /** When false, drag starts on normal click-drag without holding. */
  requireLongPress?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export function useMediaRowLongPressDrag({
  enabled = true,
  longPressMs = DEFAULT_LONG_PRESS_MS,
  requireLongPress = true,
  onDragStart,
  onDragEnd,
}: UseMediaRowLongPressDragOptions) {
  const [isDragArmed, setIsDragArmed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  const immediateDragAllowedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const disarm = useCallback(() => {
    clearTimer();
    setIsDragArmed(false);
    dragStartedRef.current = false;
    immediateDragAllowedRef.current = false;
  }, [clearTimer]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !onDragStart || shouldIgnoreMediaRowDragTarget(event.target)) {
        immediateDragAllowedRef.current = false;
        return;
      }
      if (!requireLongPress) {
        immediateDragAllowedRef.current = true;
        dragStartedRef.current = false;
        setIsDragArmed(true);
        return;
      }
      clearTimer();
      dragStartedRef.current = false;
      timerRef.current = window.setTimeout(() => {
        setIsDragArmed(true);
      }, longPressMs);
    },
    [clearTimer, enabled, longPressMs, onDragStart, requireLongPress],
  );

  const handlePointerUp = useCallback(() => {
    if (!requireLongPress) {
      return;
    }
    clearTimer();
    if (!dragStartedRef.current) {
      window.setTimeout(() => {
        setIsDragArmed(false);
      }, 0);
    }
  }, [clearTimer, requireLongPress]);

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (requireLongPress) {
        if (!isDragArmed) {
          event.preventDefault();
          return;
        }
      } else if (
        !immediateDragAllowedRef.current ||
        shouldIgnoreMediaRowDragTarget(event.target)
      ) {
        event.preventDefault();
        return;
      }
      dragStartedRef.current = true;
      onDragStart?.();
    },
    [isDragArmed, onDragStart, requireLongPress],
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
    disarm();
  }, [disarm, onDragEnd]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    isDragArmed,
    isDraggable: requireLongPress
      ? Boolean(enabled && onDragStart && isDragArmed)
      : Boolean(enabled && onDragStart),
    rowDragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}
