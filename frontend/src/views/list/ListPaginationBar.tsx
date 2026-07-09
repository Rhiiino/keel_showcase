// keel_web/src/views/list/ListPaginationBar.tsx

// Header pagination controls for list views.
// Named ListPaginationBar to avoid case-insensitive import clashes with listPagination.ts.

import { useEffect, useState } from "react";

import { clampListPageSize, DEFAULT_LIST_PAGE_SIZE } from "./listPagination";

type ListPaginationBarProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
};

export function ListPagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: ListPaginationBarProps) {
  const [pageSizeDraft, setPageSizeDraft] = useState(String(pageSize));

  useEffect(() => {
    setPageSizeDraft(String(pageSize));
  }, [pageSize]);

  const commitPageSize = () => {
    const parsed = Number.parseInt(pageSizeDraft, 10);
    const next = clampListPageSize(parsed);
    setPageSizeDraft(String(next));
    if (next !== pageSize) {
      onPageSizeChange(next);
    }
  };

  const canGoPrevious = !disabled && page > 1;
  const canGoNext = !disabled && page < totalPages;

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-stone-400">
      <label className="flex items-center gap-1.5 whitespace-nowrap">
        <span>Show</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pageSizeDraft}
          disabled={disabled}
          aria-label="Records per page"
          onChange={(event) => setPageSizeDraft(event.target.value)}
          onBlur={commitPageSize}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitPageSize();
              (event.target as HTMLInputElement).blur();
            }
          }}
          className="w-10 rounded-md border border-stone-700 bg-stone-900 px-1.5 py-1 text-center text-stone-100 outline-none transition focus:border-sky-500/50 disabled:opacity-50"
        />
      </label>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canGoPrevious}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          className="rounded-md px-1.5 py-1 text-sm text-stone-300 transition hover:bg-stone-900 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ←
        </button>
        <span className="min-w-[3.5rem] text-center tabular-nums text-stone-300">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!canGoNext}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          className="rounded-md px-1.5 py-1 text-sm text-stone-300 transition hover:bg-stone-900 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_LIST_PAGE_SIZE };
