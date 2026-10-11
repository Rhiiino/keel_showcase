// keel_web/src/views/list/ListView.tsx

import { Fragment, type ReactNode } from "react";

import { ListPagination } from "./ListPaginationBar";
import { ListSortableHeaderCell } from "./primitives/ListSortableHeaderCell";
import type { ListViewProps } from "./types";
import { useListViewState } from "./useListViewState";

export function ListView<TItem, TColumn extends string>({
  items,
  columns,
  getSortValue,
  defaultSort,
  gridClassName,
  tableWidthClassName = "w-full",
  renderRow,
  emptyMessage = "No records yet.",
  pagination = true,
  paginationResetKey,
  headerSlot,
  afterHeader,
  beforeRows,
  afterRows,
  suppressEmptyState = false,
  fitToContent = false,
  getRowKey,
}: ListViewProps<TItem, TColumn>) {
  const { sort, toggleColumn, sortedItems, visibleItems, paginationState } = useListViewState({
    items,
    defaultSort,
    getSortValue,
    pagination,
    paginationResetKey,
  });

  return (
    <div
      className={[
        "relative rounded-xl border border-stone-800 bg-stone-950/40",
        fitToContent ? "w-fit max-w-full" : "w-full",
      ].join(" ")}
    >
      {headerSlot}

      <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div className={tableWidthClassName}>
          {pagination ? (
            <div className="flex items-center justify-end gap-3 border-b border-stone-800 px-4 py-2.5">
              <ListPagination
                page={paginationState.page}
                totalPages={paginationState.totalPages}
                pageSize={paginationState.pageSize}
                onPageChange={paginationState.setPage}
                onPageSizeChange={paginationState.setPageSize}
                disabled={sortedItems.length === 0}
              />
            </div>
          ) : null}

          <div
            className={[
              "border-b border-stone-800",
              gridClassName,
            ].join(" ")}
          >
            {columns.map((column) => {
              const sortable = column.sortable !== false;

              if (!sortable) {
                return (
                  <div
                    key={column.id}
                    className={[
                      "flex items-center py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500",
                      column.headerClassName ?? column.className ?? "px-4",
                    ].join(" ")}
                  >
                    {column.label}
                  </div>
                );
              }

              return (
                <ListSortableHeaderCell
                  key={column.id}
                  label={column.label}
                  column={column.id}
                  activeColumn={sort.column}
                  direction={sort.direction}
                  onSort={(nextColumn) => toggleColumn(nextColumn as TColumn)}
                  className={column.headerClassName ?? column.className}
                />
              );
            })}
          </div>

          {afterHeader}
          {beforeRows}

          {sortedItems.length === 0 && !suppressEmptyState ? (
            <p className="px-4 py-10 text-sm text-stone-500">{emptyMessage}</p>
          ) : sortedItems.length === 0 ? null : (
            visibleItems.map((item) => (
              <Fragment key={getRowKey(item)}>{renderRow(item)}</Fragment>
            ))
          )}
          {afterRows}
        </div>
      </div>
    </div>
  );
}

type ListViewSectionProps<TItem, TColumn extends string> = ListViewProps<TItem, TColumn> & {
  sectionTitle?: ReactNode;
};

/** Renders a titled section wrapping a ListView (Shop status groups). */
export function ListViewSection<TItem, TColumn extends string>({
  sectionTitle,
  ...listProps
}: ListViewSectionProps<TItem, TColumn>) {
  if (sectionTitle) {
    return (
      <section className="space-y-3">
        {sectionTitle}
        <ListView {...listProps} />
      </section>
    );
  }

  return <ListView {...listProps} />;
}
