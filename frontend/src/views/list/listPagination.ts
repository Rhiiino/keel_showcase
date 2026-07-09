// keel_web/src/views/list/listPagination.ts

// Client-side pagination helpers for list views.

import { useEffect, useState } from "react";

export const DEFAULT_LIST_PAGE_SIZE = 20;
export const MIN_LIST_PAGE_SIZE = 1;
export const MAX_LIST_PAGE_SIZE = 200;

export function clampListPageSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LIST_PAGE_SIZE;
  }
  return Math.min(
    MAX_LIST_PAGE_SIZE,
    Math.max(MIN_LIST_PAGE_SIZE, Math.floor(value)),
  );
}

export function getListTotalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function paginateListItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function useListPagination(itemCount: number, resetWhen: unknown) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_LIST_PAGE_SIZE);
  const totalPages = getListTotalPages(itemCount, pageSize);

  useEffect(() => {
    setPage(1);
  }, [resetWhen]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const setPageSize = (next: number) => {
    setPageSizeState(clampListPageSize(next));
    setPage(1);
  };

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
  };
}
