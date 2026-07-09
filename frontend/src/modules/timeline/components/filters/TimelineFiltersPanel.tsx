// keel_web/src/modules/timeline/components/filters/TimelineFiltersPanel.tsx

import type { ReactNode } from "react";

type TimelineFiltersPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  disabled?: boolean;
  onClearAll?: () => void;
  children: ReactNode;
};

export function TimelineFiltersPanel({
  open,
  onOpenChange,
  activeCount,
  disabled = false,
  onClearAll,
  children,
}: TimelineFiltersPanelProps) {
  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={[
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-300 ring-1 ring-stone-700 transition",
          disabled ? "cursor-not-allowed opacity-50" : "hover:bg-stone-900/60 hover:text-stone-100",
          open ? "bg-stone-900/60 text-stone-100" : "",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          className={["h-4 w-4 transition", open ? "rotate-180" : ""].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span>Filters</span>
        {activeCount > 0 ? (
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200 ring-1 ring-sky-400/40">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="mt-3 rounded-xl border border-stone-800/80 bg-stone-950/50 p-4 ring-1 ring-stone-800/60">
          {children}

          {activeCount > 0 && onClearAll ? (
            <div className="mt-4 flex justify-end border-t border-stone-800/60 pt-4">
              <button
                type="button"
                disabled={disabled}
                onClick={onClearAll}
                className="rounded-md px-3 py-1.5 text-xs text-stone-400 ring-1 ring-stone-700 transition hover:bg-stone-900/60 hover:text-stone-200 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
