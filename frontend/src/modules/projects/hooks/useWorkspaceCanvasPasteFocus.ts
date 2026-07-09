// keel_web/src/modules/projects/hooks/useWorkspaceCanvasPasteFocus.ts

// Capture-phase pointer tracking so React Flow pane clicks count as canvas paste targets.

import { useLayoutEffect, useRef, type RefObject } from "react";

import { setWorkspaceCanvasPasteTarget } from "../lib/workspace/canvas";

type UseWorkspaceCanvasPasteFocusOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  onPointerPosition?: (position: { x: number; y: number }) => void;
};

export function useWorkspaceCanvasPasteFocus({
  containerRef,
  onPointerPosition,
}: UseWorkspaceCanvasPasteFocusOptions): void {
  const onPointerPositionRef = useRef(onPointerPosition);

  useLayoutEffect(() => {
    onPointerPositionRef.current = onPointerPosition;
  }, [onPointerPosition]);

  useLayoutEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const target = event.target;
      if (!(target instanceof globalThis.Node)) {
        return;
      }

      const isCanvasTarget = container.contains(target);
      setWorkspaceCanvasPasteTarget(isCanvasTarget);

      if (isCanvasTarget) {
        onPointerPositionRef.current?.({ x: event.clientX, y: event.clientY });
      }
    };

    document.addEventListener("mousedown", onDocumentPointerDown, true);
    return () => {
      document.removeEventListener("mousedown", onDocumentPointerDown, true);
      setWorkspaceCanvasPasteTarget(false);
    };
  }, [containerRef]);
}
