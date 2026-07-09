// src/modules/focus/components/constellation/node/FocusConstellationWorkOrderBadge.tsx

import type { RefObject } from "react";

type FocusConstellationWorkOrderBadgeProps = {
  workOrder: number;
  badgeRef: RefObject<HTMLDivElement>;
  badgeOffset: { x: number; y: number };
  onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export function FocusConstellationWorkOrderBadge({
  workOrder,
  badgeRef,
  badgeOffset,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: FocusConstellationWorkOrderBadgeProps) {
  return (
    <div
      ref={badgeRef}
      data-focus-work-order-badge="true"
      className="nodrag nopan group absolute left-1/2 top-1/2 z-30 cursor-grab touch-none active:cursor-grabbing"
      style={{
        transform: `translate(calc(-50% + ${badgeOffset.x}px), calc(-50% + ${badgeOffset.y}px))`,
      }}
      aria-label={`Work order ${workOrder}`}
      title={`Work order ${workOrder}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/45 bg-[#111827] text-sm font-bold tabular-nums text-amber-100 shadow-[0_0_0_2px_rgba(5,7,10,0.9),0_0_16px_rgba(251,191,36,0.35)] transition duration-150 group-hover:scale-110 group-hover:border-amber-200 group-hover:bg-[#1f2937] group-hover:text-amber-50 group-hover:shadow-[0_0_0_3px_rgba(251,191,36,0.22),0_0_22px_rgba(251,191,36,0.58)]">
        {workOrder}
      </span>
    </div>
  );
}
