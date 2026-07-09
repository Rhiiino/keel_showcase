// keel_web/src/modules/media/hooks/useHorizontalDragAutoScroll.ts

// Scroll a horizontal container in the direction of an active HTML drag gesture.

import { useCallback, useEffect, useRef, type DragEvent, type RefObject } from "react";

export function useHorizontalDragAutoScroll(
  scrollerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const lastClientXRef = useRef<number | null>(null);

  const resetDragScroll = useCallback(() => {
    lastClientXRef.current = null;
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }

      const scroller = scrollerRef.current;
      if (!scroller) {
        return;
      }

      const currentX = event.clientX;
      const lastX = lastClientXRef.current;
      lastClientXRef.current = currentX;

      if (lastX !== null) {
        const delta = currentX - lastX;
        if (delta !== 0) {
          scroller.scrollLeft += delta;
        }
      }
    },
    [scrollerRef],
  );

  useEffect(() => {
    if (!enabled) {
      resetDragScroll();
    }
  }, [enabled, resetDragScroll]);

  return {
    handleDragOver,
    resetDragScroll,
  };
}
