// src/app/nav/components/AppNavSeparator.tsx

// Horizontal divider row in the app nav (draggable to reposition).

import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";

type AppNavSeparatorProps = {
  labelsOpen: boolean;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function AppNavSeparator({
  labelsOpen,
  isDragging,
  onDragStart,
  onDragEnd,
  onContextMenu,
}: AppNavSeparatorProps) {
  return (
    <div
      draggable
      aria-label="Drag to reposition section divider"
      title="Drag to reposition divider"
      aria-grabbed={isDragging}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      className={[
        "group/navseparator flex h-4 w-full shrink-0 touch-none items-center",
        labelsOpen ? "px-4" : "px-3",
        isDragging ? "cursor-grabbing opacity-40" : "cursor-grab",
      ].join(" ")}
    >
      <div className="h-px w-full rounded-full bg-stone-800/90 shadow-[0_0_0_1px_rgba(28,25,23,0.35)] transition group-hover/navseparator:bg-stone-700/90 group-hover/navseparator:shadow-[0_0_0_1px_rgba(68,64,60,0.5)]" />
    </div>
  );
}
