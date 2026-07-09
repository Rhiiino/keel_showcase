// keel_web/src/modules/coak/hooks/modals/useAutoResizeTextarea.ts

import { useLayoutEffect, type RefObject } from "react";

export function measureAutoResizeTextarea(
  element: HTMLTextAreaElement,
  minHeightPx: number,
): number {
  element.style.height = "auto";
  const nextHeight = Math.max(element.scrollHeight, minHeightPx);
  element.style.height = `${nextHeight}px`;
  return nextHeight;
}

export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  minHeightPx = 72,
) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    measureAutoResizeTextarea(element, minHeightPx);
  }, [minHeightPx, ref, value]);
}
