// stack_sandbox/frontend_web/src/app/nav/useAppNavLayout.ts

// App nav open/closed state and expanded-width drag-resize (mirrors chat status panel).

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  APP_NAV_MAX_WIDTH,
  APP_NAV_MIN_WIDTH,
} from "./appNavConfig";
import { readStoredNavLayout, writeStoredNavLayout } from "./appNavStorage";

function clampWidth(width: number): number {
  return Math.min(APP_NAV_MAX_WIDTH, Math.max(APP_NAV_MIN_WIDTH, width));
}

export function useAppNavLayout(defaultOpen = true) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") {
      return defaultOpen;
    }
    return readStoredNavLayout(defaultOpen).open;
  });
  const [width, setWidth] = useState(() => readStoredNavLayout(defaultOpen).width);
  const [isResizing, setIsResizing] = useState(false);

  const onToggleLabels = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      setIsResizing(true);

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        setWidth(clampWidth(startWidth + delta));
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
    [width],
  );

  useEffect(() => {
    writeStoredNavLayout({ open, width });
  }, [open, width]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return {
    open,
    width,
    isResizing,
    onToggleLabels,
    onResizePointerDown,
  };
}
