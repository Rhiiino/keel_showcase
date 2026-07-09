// src/modules/focus/components/shared/FocusInstantTooltip.tsx

import type { ReactNode } from "react";

const TOOLTIP_BASE_CLASS =
  "pointer-events-none absolute left-1/2 z-[110] -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[0.10] bg-stone-950/95 px-2 py-1 text-[11px] font-medium text-white/92 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.35)] group-hover/focus-instant-tooltip:opacity-100";

const PLACEMENT_CLASS = {
  above: "bottom-[calc(100%+0.35rem)]",
  below: "top-[calc(100%+0.35rem)]",
} as const;

type FocusInstantTooltipProps = {
  label: string;
  placement?: keyof typeof PLACEMENT_CLASS;
  className?: string;
  children: ReactNode;
};

export function FocusInstantTooltip({
  label,
  placement = "above",
  className = "",
  children,
}: FocusInstantTooltipProps) {
  return (
    <span
      className={["group/focus-instant-tooltip relative inline-flex", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className={`${TOOLTIP_BASE_CLASS} ${PLACEMENT_CLASS[placement]}`}
      >
        {label}
      </span>
    </span>
  );
}
