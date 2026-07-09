// stack_sandbox/frontend_web/src/modules/projects/hooks/useWorkspacePanelLayout.ts

// Workspace files panel width, side (left/right), resize, and drag-to-reposition.

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  WORKSPACE_PANEL_DEFAULT_SIDE,
  WORKSPACE_PANEL_DEFAULT_WIDTH,
  WORKSPACE_PANEL_MAX_WIDTH,
  WORKSPACE_PANEL_MIN_WIDTH,
  type WorkspacePanelSide,
} from "../lib/workspace/panel";
import {
  readStoredWorkspacePanelLayout,
  writeStoredWorkspacePanelLayout,
} from "../lib/workspace/panel";

const REPOSITION_DRAG_THRESHOLD_PX = 72;

function clampWidth(width: number): number {
  return Math.min(
    WORKSPACE_PANEL_MAX_WIDTH,
    Math.max(WORKSPACE_PANEL_MIN_WIDTH, width),
  );
}

export function useWorkspacePanelLayout(
  initialWidth = WORKSPACE_PANEL_DEFAULT_WIDTH,
  initialSide: WorkspacePanelSide = WORKSPACE_PANEL_DEFAULT_SIDE,
) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") {
      return initialWidth;
    }
    return readStoredWorkspacePanelLayout().width;
  });
  const [side, setSide] = useState<WorkspacePanelSide>(() => {
    if (typeof window === "undefined") {
      return initialSide;
    }
    return readStoredWorkspacePanelLayout().side;
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
    writeStoredWorkspacePanelLayout({ side, width });
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
