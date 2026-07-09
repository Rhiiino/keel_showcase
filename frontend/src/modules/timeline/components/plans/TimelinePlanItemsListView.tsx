// keel_web/src/modules/timeline/components/plans/TimelinePlanItemsListView.tsx

import { useCallback, useMemo } from "react";

import type { TimelinePlanItem, TimelinePlanItemUpdatePayload } from "../../api";
import { useTimelinePlanItemListReorder } from "../../hooks/useTimelinePlanItemListReorder";
import { sortTimelinePlanItems } from "../../lib/timelinePlanItemSortOrder";
import { TimelinePlanItemAddRow } from "./TimelinePlanItemAddRow";
import {
  TIMELINE_PLAN_ITEM_CELL_HEADER,
  TIMELINE_PLAN_ITEM_CELL_SCHEDULE,
  TIMELINE_PLAN_ITEM_CELL_STATUS,
  TIMELINE_PLAN_ITEM_CELL_TAGS,
  TIMELINE_PLAN_ITEM_CELL_TITLE,
  TIMELINE_PLAN_ITEM_LIST_GRID_CLASS,
  TimelinePlanItemListRow,
} from "./TimelinePlanItemListRow";

type TimelinePlanItemsListViewProps = {
  items: TimelinePlanItem[];
  planStartDate: string;
  planEndDate: string;
  onCreateItem?: () => void | Promise<void>;
  onUpdateItem?: (
    itemId: number,
    payload: TimelinePlanItemUpdatePayload,
  ) => void | Promise<void>;
  onRowClick?: (item: TimelinePlanItem) => void;
  onDelete?: (itemId: number) => void;
  onReorder?: (itemId: number, insertIndex: number) => void | Promise<void>;
  createDisabled?: boolean;
  updateDisabled?: boolean;
  deleteDisabled?: boolean;
  reorderDisabled?: boolean;
  autoEditTitleItemId?: number | null;
  onAutoEditTitleHandled?: () => void;
  /** When true, list caps at viewport height and scrolls internally when content exceeds it. */
  fillHeight?: boolean;
};

export function TimelinePlanItemsListView({
  items,
  planStartDate,
  planEndDate,
  onCreateItem,
  onUpdateItem,
  onRowClick,
  onDelete,
  onReorder,
  createDisabled = false,
  updateDisabled = false,
  deleteDisabled = false,
  reorderDisabled = false,
  autoEditTitleItemId = null,
  onAutoEditTitleHandled,
  fillHeight = false,
}: TimelinePlanItemsListViewProps) {
  const sortedItems = useMemo(() => sortTimelinePlanItems(items), [items]);
  const itemIds = useMemo(() => sortedItems.map((item) => item.id), [sortedItems]);
  const reorderEnabled = onReorder != null && !reorderDisabled;

  const handleReorder = useCallback(
    (itemId: number, insertIndex: number) => onReorder?.(itemId, insertIndex),
    [onReorder],
  );

  const {
    draggingItemId,
    dropInsertIndex,
    setRowRef,
    handleDragStart,
    handleListDragOver,
    handleDrop,
    handleDragEnd,
  } = useTimelinePlanItemListReorder({
    itemIds,
    disabled: !reorderEnabled,
    onReorder: handleReorder,
  });

  return (
    <section
      className={
        fillHeight ? "flex w-full min-h-0 max-h-full flex-col gap-4" : "space-y-4"
      }
    >
      <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-stone-400">
        Plan items
      </h2>

      <div
        className={[
          "rounded-xl ring-1 ring-stone-800/80",
          fillHeight
            ? "flex max-h-full min-h-0 w-full flex-col overflow-hidden"
            : "overflow-x-auto overflow-y-hidden",
        ].join(" ")}
      >
        <div
          className={[
            TIMELINE_PLAN_ITEM_LIST_GRID_CLASS,
            "shrink-0 border-b border-stone-800 bg-stone-950/60",
          ].join(" ")}
        >
          <div className="py-3" aria-hidden />
          <div className={[TIMELINE_PLAN_ITEM_CELL_HEADER, TIMELINE_PLAN_ITEM_CELL_SCHEDULE].join(" ")}>
            Schedule
          </div>
          <div className={[TIMELINE_PLAN_ITEM_CELL_HEADER, TIMELINE_PLAN_ITEM_CELL_TITLE].join(" ")}>
            Title
          </div>
          <div className={[TIMELINE_PLAN_ITEM_CELL_HEADER, TIMELINE_PLAN_ITEM_CELL_TAGS].join(" ")}>
            Tags
          </div>
          <div className={[TIMELINE_PLAN_ITEM_CELL_HEADER, TIMELINE_PLAN_ITEM_CELL_STATUS].join(" ")}>
            Status
          </div>
          <div className={[TIMELINE_PLAN_ITEM_CELL_HEADER, "px-0.5 py-3 text-center"].join(" ")}>
            Event
          </div>
          <div className="py-3" aria-hidden />
        </div>

        <div
          className={fillHeight ? "min-h-0 flex-1 overflow-x-auto overflow-y-auto" : undefined}
          onDragOver={handleListDragOver}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop();
          }}
        >
          {sortedItems.map((item, index) => (
            <TimelinePlanItemListRow
              key={item.id}
              item={item}
              planStartDate={planStartDate}
              planEndDate={planEndDate}
              onRowClick={onRowClick}
              onUpdateItem={onUpdateItem}
              onDelete={onDelete}
              deleteDisabled={deleteDisabled}
              updateDisabled={updateDisabled}
              reorderable={reorderEnabled}
              isDragging={draggingItemId === item.id}
              showInsertTop={draggingItemId !== null && dropInsertIndex === index}
              showInsertBottom={
                draggingItemId !== null &&
                dropInsertIndex === sortedItems.length &&
                index === sortedItems.length - 1
              }
              autoEditTitle={autoEditTitleItemId === item.id}
              onAutoEditTitleHandled={onAutoEditTitleHandled}
              rowRef={(node) => setRowRef(item.id, node)}
              onDragStart={(event) => handleDragStart(item.id, event)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {onCreateItem ? (
            <TimelinePlanItemAddRow onAdd={onCreateItem} disabled={createDisabled} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
