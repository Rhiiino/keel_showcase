// keel_web/src/modules/games/games/tower-of-hanoi/components/Disk.tsx

import type { CSSProperties } from "react";

type DiskProps = {
  size: number;
  maxDisk: number;
  colorClassName?: string;
  style?: CSSProperties;
  className?: string;
};

const DISK_COLORS = [
  "bg-lime-400",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-violet-400",
  "bg-purple-400",
  "bg-fuchsia-400",
  "bg-pink-400",
  "bg-rose-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-300",
  "bg-emerald-300",
];

/** Tailwind h-7 — keep in sync with className on the disk. */
export const DISK_HEIGHT_PX = 28;
/** Tailwind gap-1 between stacked disks. */
export const DISK_GAP_PX = 4;
/** How far the peg shaft peeks above a full stack. */
export const PEG_PEEK_PX = 32;

export function stackHeightPx(count: number): number {
  if (count <= 0) {
    return 0;
  }
  return count * DISK_HEIGHT_PX + (count - 1) * DISK_GAP_PX;
}

export function shaftHeightPx(maxDisk: number): number {
  return stackHeightPx(maxDisk) + PEG_PEEK_PX;
}

/** Width as % of the peg column; largest stays under ~75% of the platform. */
function diskWidthPercent(size: number, maxDisk: number): number {
  const minWidth = 18;
  const maxWidth = 75;
  return minWidth + ((size - 1) / Math.max(maxDisk - 1, 1)) * (maxWidth - minWidth);
}

export function Disk({ size, maxDisk, colorClassName, style, className = "" }: DiskProps) {
  const widthPct = diskWidthPercent(size, maxDisk);
  const color = colorClassName ?? DISK_COLORS[(size - 1) % DISK_COLORS.length];

  return (
    <div
      className={[
        "relative flex h-7 items-center justify-center rounded-lg border border-black/25",
        "shadow-[0_2px_0_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.25)] ring-1 ring-white/15",
        color,
        className,
      ].join(" ")}
      style={{ width: `${widthPct}%`, ...style }}
    >
      <span
        className={[
          "pointer-events-none select-none font-bold leading-none text-stone-950/75",
          size >= 10 ? "text-[10px]" : "text-[11px]",
        ].join(" ")}
      >
        {size}
      </span>
    </div>
  );
}
