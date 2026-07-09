// keel_web/src/views/list/primitives/ListSortableHeaderCell.tsx

import type { SortDirection } from "./listColumnSort";

type ListSortableHeaderCellProps = {
  label: string;
  column: string;
  activeColumn: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  className?: string;
};

export function ListSortableHeaderCell({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className = "",
}: ListSortableHeaderCellProps) {
  const isActive = activeColumn === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={[
        "flex items-center gap-1.5 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 transition hover:text-stone-300",
        className,
      ].join(" ")}
    >
      {label}
      {isActive ? (
        <span className="text-stone-400" aria-hidden>
          {direction === "desc" ? "↓" : "↑"}
        </span>
      ) : null}
    </button>
  );
}
