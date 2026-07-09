// stack_sandbox/frontend_web/src/components/panels/PanelResizeHandle.tsx

// Vertical col-resize separator on the inner edge of a side panel.

import type { PointerEvent as ReactPointerEvent } from "react";

import type { PanelSide } from "./PanelRepositionGrip";

type PanelResizeHandleProps = {
  side: PanelSide;
  isResizing: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function PanelResizeHandle({
  side,
  isResizing,
  onPointerDown,
}: PanelResizeHandleProps) {
  const positionClass = side === "left" ? "inset-y-0 -right-1" : "inset-y-0 -left-1";

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      onPointerDown={onPointerDown}
      className={[
        "absolute z-10 w-2 cursor-col-resize touch-none",
        positionClass,
        isResizing ? "bg-lime-400/25" : "bg-transparent hover:bg-lime-400/15",
      ].join(" ")}
    />
  );
}
