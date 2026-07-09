// keel_web/src/modules/media/hooks/useMediaPanelViewportHeight.ts

// Drag-to-resize viewport height for a media panel grid shell.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  readPanelViewportHeight,
  writePanelViewportHeight,
} from "../lib/panelViewportHeight";

type UseMediaPanelViewportHeightOptions = {
  panelId: string;
  minHeightPx: number;
  contentHeightPx: number;
};

function lockDocumentPointer() {
  document.body.style.userSelect = "none";
  document.body.style.touchAction = "none";
}

function unlockDocumentPointer() {
  document.body.style.userSelect = "";
  document.body.style.touchAction = "";
}

export function useMediaPanelViewportHeight({
  panelId,
  minHeightPx,
  contentHeightPx,
}: UseMediaPanelViewportHeightOptions) {
  const defaultHeightPx = Math.max(contentHeightPx, minHeightPx);

  const [heightPx, setHeightPx] = useState(() => {
    const stored = readPanelViewportHeight(panelId);
    if (stored !== null) {
      return Math.max(stored, minHeightPx);
    }
    return defaultHeightPx;
  });
  const [isResizing, setIsResizing] = useState(false);
  const heightRef = useRef(heightPx);

  useEffect(() => {
    heightRef.current = heightPx;
  }, [heightPx]);

  useEffect(() => {
    setHeightPx((current) => Math.max(current, minHeightPx));
  }, [minHeightPx]);

  useEffect(() => {
    const stored = readPanelViewportHeight(panelId);
    if (stored !== null) {
      setHeightPx(Math.max(stored, minHeightPx));
      return;
    }
    setHeightPx(Math.max(contentHeightPx, minHeightPx));
  }, [panelId]);

  const startResize = useCallback(
    (clientY: number, pointerId: number) => {
      const startHeight = heightRef.current;
      const startClientY = clientY;
      setIsResizing(true);
      lockDocumentPointer();

      const finish = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) {
          return;
        }
        setIsResizing(false);
        unlockDocumentPointer();
        setHeightPx((current) => {
          writePanelViewportHeight(panelId, current);
          return current;
        });
        try {
          if (document.body.hasPointerCapture(pointerId)) {
            document.body.releasePointerCapture(pointerId);
          }
        } catch {
          // Pointer capture may already be released.
        }
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) {
          return;
        }
        event.preventDefault();
        const deltaY = event.clientY - startClientY;
        const nextHeight = Math.max(minHeightPx, startHeight + deltaY);
        setHeightPx(nextHeight);
      };

      try {
        document.body.setPointerCapture(pointerId);
      } catch {
        // Some environments reject capture on body; window listeners still handle the drag.
      }
      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    },
    [minHeightPx, panelId],
  );

  return {
    heightPx,
    isResizing,
    startResize,
  };
}
