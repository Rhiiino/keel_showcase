// keel_web/src/views/list/primitives/listColumnSort.ts

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export type ListColumnSortState<TColumn extends string> = {
  column: TColumn;
  direction: SortDirection;
};

export type ListSortAccessor<TItem, TColumn extends string> = (
  item: TItem,
  column: TColumn,
) => string | number | boolean | null | undefined;

function compareSortValues(
  left: string | number | boolean | null | undefined,
  right: string | number | boolean | null | undefined,
): number {
  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return 1;
  }
  if (right == null) {
    return -1;
  }
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
}

export function sortListByColumn<TItem, TColumn extends string>(
  items: readonly TItem[],
  sort: ListColumnSortState<TColumn>,
  accessor: ListSortAccessor<TItem, TColumn>,
): TItem[] {
  const sorted = [...items];
  sorted.sort((left, right) => {
    const comparison = compareSortValues(accessor(left, sort.column), accessor(right, sort.column));
    return sort.direction === "asc" ? comparison : -comparison;
  });
  return sorted;
}

export function useListColumnSort<TColumn extends string>(
  defaultSort: ListColumnSortState<TColumn>,
) {
  const [sort, setSort] = useState<ListColumnSortState<TColumn>>(defaultSort);

  const toggleColumn = useCallback((column: TColumn) => {
    setSort((current) => {
      if (current.column !== column) {
        return { column, direction: "asc" };
      }
      return {
        column,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  }, []);

  const sortItems = useCallback(
    <TItem,>(items: readonly TItem[], accessor: ListSortAccessor<TItem, TColumn>) =>
      sortListByColumn(items, sort, accessor),
    [sort],
  );

  return useMemo(
    () => ({
      sort,
      toggleColumn,
      sortItems,
    }),
    [sort, sortItems, toggleColumn],
  );
}
