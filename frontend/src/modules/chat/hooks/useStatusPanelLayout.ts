// stack_sandbox/frontend_web/src/modules/chat/hooks/useStatusPanelLayout.ts

// Status panel width, side (left/right), resize, and drag-to-reposition.

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  STATUS_PANEL_DEFAULT_WIDTH,
  STATUS_PANEL_MAX_WIDTH,
  STATUS_PANEL_MIN_WIDTH,
  type StatusPanelSide,
} from "../lib/status";
import {
  readStoredStatusPanelLayout,
  writeStoredStatusPanelLayout,
} from "../lib/status";

const REPOSITION_DRAG_THRESHOLD_PX = 72;

function clampWidth(width: number): number {
  return Math.min(STATUS_PANEL_MAX_WIDTH, Math.max(STATUS_PANEL_MIN_WIDTH, width));
}

export function useStatusPanelLayout(
  initialWidth = STATUS_PANEL_DEFAULT_WIDTH,
  initialSide: StatusPanelSide = "left",
) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") {
      return initialWidth;
    }
    return readStoredStatusPanelLayout().width;
  });
  const [side, setSide] = useState<StatusPanelSide>(() => {
    if (typeof window === "undefined") {
      return initialSide;
    }
    return readStoredStatusPanelLayout().side;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const panelSide = side;

      setIsResizing(true);

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth =
          panelSide === "left" ? startWidth + delta : startWidth - delta;
        setWidth(clampWidth(nextWidth));
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [side, width],
  );

  const onRepositionPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startSide = side;

      setIsRepositioning(true);

      const handlePointerMove = () => {
        document.body.style.cursor = "grabbing";
      };

      const handlePointerUp = (upEvent: globalThis.PointerEvent) => {
        const delta = upEvent.clientX - startX;

        if (startSide === "left" && delta >= REPOSITION_DRAG_THRESHOLD_PX) {
          setSide("right");
        } else if (startSide === "right" && delta <= -REPOSITION_DRAG_THRESHOLD_PX) {
          setSide("left");
        }

        setIsRepositioning(false);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "grab";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [side],
  );

  useEffect(() => {
    writeStoredStatusPanelLayout({ side, width });
  }, [side, width]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return {
    width,
    side,
    isResizing,
    isRepositioning,
    onResizePointerDown,
    onRepositionPointerDown,
  };
}
