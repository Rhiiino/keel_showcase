// keel_web/src/modules/shop/components/FinanceViewToggle.tsx

// Segmented header control to switch between card grid and list table.

import type { ReactElement } from "react";

import type { FinanceViewMode } from "../lib/transactionView";

type FinanceViewToggleProps = {
  viewMode: FinanceViewMode;
  onChange: (viewMode: FinanceViewMode) => void;
  ariaLabel?: string;
};

function CardGridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

function ListRowsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
    </svg>
  );
}

const SEGMENTS: {
  id: FinanceViewMode;
  label: string;
  Icon: () => ReactElement;
}[] = [
  { id: "kanban", label: "Card view", Icon: CardGridIcon },
  { id: "list", label: "List view", Icon: ListRowsIcon },
];

export function FinanceViewToggle({
  viewMode,
  onChange,
  ariaLabel = "Finance view",
}: FinanceViewToggleProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex h-9 items-center rounded-lg p-0.5 ring-1 ring-stone-700"
    >
      {SEGMENTS.map((segment) => {
        const active = viewMode === segment.id;
        const { Icon } = segment;
        return (
          <button
            key={segment.id}
            type="button"
            onClick={() => onChange(segment.id)}
            aria-pressed={active}
            aria-label={segment.label}
            title={segment.label}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-md transition",
              active
                ? "bg-stone-900/50 text-stone-200"
                : "text-stone-400 hover:text-stone-200",
            ].join(" ")}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
