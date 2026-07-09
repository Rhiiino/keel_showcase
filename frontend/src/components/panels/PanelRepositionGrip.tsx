// stack_sandbox/frontend_web/src/components/panels/PanelRepositionGrip.tsx

// Six-dot grip for dragging a side panel between left and right edges.

import type { PointerEvent as ReactPointerEvent } from "react";

export type PanelSide = "left" | "right";

type PanelRepositionGripProps = {
  side: PanelSide;
  isRepositioning: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function PanelRepositionGrip({
  side,
  isRepositioning,
  onPointerDown,
}: PanelRepositionGripProps) {
  const dragHint =
    side === "left"
      ? "Drag right to move panel to the right"
      : "Drag left to move panel to the left";

  return (
    <button
      type="button"
      aria-label={dragHint}
      title={dragHint}
      onPointerDown={onPointerDown}
      className={[
        "flex shrink-0 touch-none items-center justify-center px-1.5 py-3 text-stone-600 transition",
        "hover:text-stone-400 active:cursor-grabbing",
        isRepositioning ? "cursor-grabbing text-lime-400/80" : "cursor-grab",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <circle cx="9" cy="7" r="1.25" />
        <circle cx="15" cy="7" r="1.25" />
        <circle cx="9" cy="12" r="1.25" />
        <circle cx="15" cy="12" r="1.25" />
        <circle cx="9" cy="17" r="1.25" />
        <circle cx="15" cy="17" r="1.25" />
      </svg>
    </button>
  );
}
