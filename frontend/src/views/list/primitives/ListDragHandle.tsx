// keel_web/src/views/list/primitives/ListDragHandle.tsx

// Six-dot grip for reordering items in a list.

import type { DragEvent } from "react";

type ListDragHandleProps = {
  isDragging: boolean;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  tone?: "muted" | "lime";
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

const TONE_CLASS: Record<
  NonNullable<ListDragHandleProps["tone"]>,
  { rest: string; dragging: string }
> = {
  muted: {
    rest: "text-stone-500 hover:text-stone-400",
    dragging: "text-stone-300",
  },
  lime: {
    rest: "text-lime-500/80 hover:text-lime-300",
    dragging: "text-lime-300",
  },
};

export function ListDragHandle({
  isDragging,
  disabled = false,
  ariaLabel,
  className = "",
  tone = "muted",
  onDragStart,
  onDragEnd,
}: ListDragHandleProps) {
  const toneClass = TONE_CLASS[tone];

  return (
    <button
      type="button"
      draggable={!disabled}
      aria-label={ariaLabel}
      title="Drag to reorder"
      disabled={disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        "flex shrink-0 touch-none items-center justify-center rounded px-0.5 py-2 transition",
        "active:cursor-grabbing",
        disabled ? "cursor-not-allowed opacity-30" : "cursor-grab",
        isDragging
          ? ["cursor-grabbing", toneClass.dragging].join(" ")
          : toneClass.rest,
        className,
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
