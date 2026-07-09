// keel_web/src/modules/media/components/panels/MediaPanelViewportHandle.tsx

// Bottom-edge grip for resizing the panel grid viewport height.

import type { PointerEvent as ReactPointerEvent } from "react";

type MediaPanelViewportHandleProps = {
  active?: boolean;
  onPointerDown: (clientY: number, pointerId: number) => void;
};

export function MediaPanelViewportHandle({
  active = false,
  onPointerDown,
}: MediaPanelViewportHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize panel height"
      className={[
        "group/handle flex h-3 shrink-0 cursor-ns-resize items-center justify-center border-t border-white/[0.06] transition",
        active ? "bg-stone-900/80" : "bg-stone-950/40 hover:bg-stone-900/60",
      ].join(" ")}
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onPointerDown(event.clientY, event.pointerId);
      }}
    >
      <div
        className={[
          "h-1 w-12 rounded-full transition",
          active ? "bg-stone-400" : "bg-stone-700 group-hover/handle:bg-stone-500",
        ].join(" ")}
      />
    </div>
  );
}
