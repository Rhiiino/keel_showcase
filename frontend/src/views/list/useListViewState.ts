// keel_web/src/views/list/useListViewState.ts

import { useMemo } from "react";

import {
  paginateListItems,
  useListPagination,
} from "./listPagination";
import {
  type ListColumnSortState,
  type ListSortAccessor,
  useListColumnSort,
} from "./primitives/listColumnSort";

type UseListViewStateOptions<TItem, TColumn extends string> = {
  items: readonly TItem[];
  defaultSort: ListColumnSortState<TColumn>;
  getSortValue: ListSortAccessor<TItem, TColumn>;
  pagination?: boolean;
  paginationResetKey?: unknown;
};

export function useListViewState<TItem, TColumn extends string>({
  items,
  defaultSort,
  getSortValue,
  pagination = true,
  paginationResetKey,
}: UseListViewStateOptions<TItem, TColumn>) {
  const { sort, toggleColumn, sortItems } = useListColumnSort(defaultSort);

  const sortedItems = useMemo(
    () => sortItems(items, getSortValue),
    [items, getSortValue, sortItems],
  );

  const resetKey = paginationResetKey ?? `${sortedItems.length}:${sort.column}:${sort.direction}`;

  const paginationState = useListPagination(
    sortedItems.length,
    pagination ? resetKey : sortedItems.length,
  );

  const visibleItems = useMemo(() => {
    if (!pagination) {
      return sortedItems;
    }
    return paginateListItems(sortedItems, paginationState.page, paginationState.pageSize);
  }, [pagination, sortedItems, paginationState.page, paginationState.pageSize]);

  return {
    sort,
    toggleColumn,
    sortedItems,
    visibleItems,
    paginationState,
  };
}
