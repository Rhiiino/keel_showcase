// keel_web/src/modules/games/games/tower-of-hanoi/components/PegColumn.tsx

import type { PointerEvent } from "react";

import { Disk, DISK_GAP_PX, shaftHeightPx } from "./Disk";

type PegColumnProps = {
  pegIndex: number;
  disks: number[];
  maxDisk: number;
  /** Fixed board capacity (highest level disk count) — peg/column height never shrinks. */
  boardCapacity: number;
  highlighted: boolean;
  draggingDisk: { pegIndex: number; disk: number } | null;
  /** null = show all; otherwise only the largest N disks (deal-in). */
  dealRevealCount: number | null;
  onPointerDownTopDisk: (pegIndex: number, event: PointerEvent<HTMLDivElement>) => void;
};

/** Height of the platform block; disk bottoms sit flush on its top edge. */
const PLATFORM_HEIGHT_PX = 18;
/** Space below the platform inside the column. */
const PLATFORM_BOTTOM_PX = 10;

function isDiskRevealed(disk: number, maxDisk: number, dealRevealCount: number | null): boolean {
  if (dealRevealCount === null) {
    return true;
  }
  return disk > maxDisk - dealRevealCount;
}

export function PegColumn({
  pegIndex,
  disks,
  maxDisk,
  boardCapacity,
  highlighted,
  draggingDisk,
  dealRevealCount,
  onPointerDownTopDisk,
}: PegColumnProps) {
  const visibleDisks = [...disks].reverse().filter((disk) =>
    isDiskRevealed(disk, maxDisk, dealRevealCount),
  );
  const topDisk = disks[0] ?? null;
  const topIsRevealed = topDisk !== null && isDiskRevealed(topDisk, maxDisk, dealRevealCount);
  const isDraggingFromHere =
    draggingDisk !== null &&
    draggingDisk.pegIndex === pegIndex &&
    draggingDisk.disk === topDisk &&
    topIsRevealed;

  const platformTopFromBottom = PLATFORM_BOTTOM_PX + PLATFORM_HEIGHT_PX;
  const shaftHeight = shaftHeightPx(boardCapacity);
  const columnHeight = shaftHeight + platformTopFromBottom + 40;
  const latestDealtDisk =
    dealRevealCount !== null && dealRevealCount > 0 ? maxDisk - dealRevealCount + 1 : null;
  const canGrab = topIsRevealed && !isDraggingFromHere;

  return (
    <div
      data-peg-index={pegIndex}
      className={[
        "relative flex flex-1 flex-col items-center",
        "rounded-2xl border px-2 pt-8 select-none",
        "transition-[border-color,background-color] duration-150 ease-out",
        canGrab ? "cursor-grab active:cursor-grabbing touch-none" : "",
        highlighted
          ? "border-lime-500/45 bg-lime-500/[0.06] shadow-[inset_0_0_40px_rgba(132,204,22,0.08)]"
          : "border-stone-800/50 bg-stone-950/20 hover:border-stone-700/80 hover:bg-stone-900/35",
      ].join(" ")}
      style={{
        paddingBottom: platformTopFromBottom,
        height: columnHeight,
      }}
      onPointerDown={
        canGrab
          ? (event) => {
              event.preventDefault();
              onPointerDownTopDisk(pegIndex, event);
            }
          : undefined
      }
    >
      {/* Peg shaft — tall enough to peek above a full stack */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 w-[14px] -translate-x-1/2"
        style={{
          bottom: platformTopFromBottom,
          height: shaftHeight,
        }}
        aria-hidden
      >
        <div
          className={[
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r from-stone-500 via-stone-300 to-stone-600",
            "shadow-[inset_2px_0_3px_rgba(255,255,255,0.35),inset_-2px_0_4px_rgba(0,0,0,0.45),0_0_12px_rgba(0,0,0,0.25)]",
          ].join(" ")}
        />
        <div className="absolute -top-1.5 left-1/2 h-3 w-5 -translate-x-1/2 rounded-full bg-gradient-to-b from-stone-200 to-stone-500 shadow-sm" />
      </div>

      {/* Platform / base */}
      <div
        className="pointer-events-none absolute left-1/2 z-0 w-[92%] max-w-none -translate-x-1/2"
        style={{
          bottom: PLATFORM_BOTTOM_PX,
          height: PLATFORM_HEIGHT_PX,
        }}
        aria-hidden
      >
        <div
          className={[
            "h-full w-full rounded-md",
            "bg-gradient-to-b from-stone-500 via-stone-600 to-stone-800",
            "shadow-[0_4px_0_#1c1917,0_8px_16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]",
            "ring-1 ring-stone-900/80",
          ].join(" ")}
        />
        <div className="absolute inset-x-2 top-0.5 h-px rounded-full bg-white/25" />
      </div>

      {/* Disk stack — bottom of lowest disk sits on platform top */}
      <div
        className="relative z-10 mt-auto flex w-full flex-col-reverse items-center"
        style={{ gap: DISK_GAP_PX }}
      >
        {visibleDisks.map((disk) => {
          const isTop = disk === topDisk && topIsRevealed;
          const hidden = isTop && isDraggingFromHere;
          const justDealt = disk === latestDealtDisk;
          return (
            <div
              key={`${pegIndex}-${disk}`}
              className={[
                "pointer-events-none flex w-full justify-center",
                hidden ? "opacity-0" : "",
                justDealt ? "animate-[toh-disk-drop_280ms_ease-out]" : "",
              ].join(" ")}
            >
              <Disk size={disk} maxDisk={maxDisk} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
