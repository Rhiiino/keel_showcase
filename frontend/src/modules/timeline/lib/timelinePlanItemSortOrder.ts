// keel_web/src/modules/timeline/lib/timelinePlanItemSortOrder.ts

import { moveIdToInsertIndex } from "../../../lib/listReorder";
import type { TimelinePlanItem } from "../api";

export function compareTimelinePlanItemsBySortOrder(
  left: TimelinePlanItem,
  right: TimelinePlanItem,
): number {
  return left.sort_order - right.sort_order || left.id - right.id;
}

export function sortTimelinePlanItems(items: readonly TimelinePlanItem[]): TimelinePlanItem[] {
  return [...items].sort(compareTimelinePlanItemsBySortOrder);
}

export function collectTimelinePlanItemIds(items: readonly TimelinePlanItem[]): number[] {
  return sortTimelinePlanItems(items).map((item) => item.id);
}

export function resolveTimelinePlanItemOrderAfterInsert(
  itemIds: readonly number[],
  draggedId: number,
  insertIndex: number,
): number[] | null {
  const orderedIds = moveIdToInsertIndex(itemIds, draggedId, insertIndex);
  if (orderedIds.join(",") === itemIds.join(",")) {
    return null;
  }
  return orderedIds;
}

export function resolveTimelinePlanItemSortOrderAfterInsert(
  itemIds: readonly number[],
  draggedId: number,
  insertIndex: number,
): number | null {
  const orderedIds = resolveTimelinePlanItemOrderAfterInsert(itemIds, draggedId, insertIndex);
  if (orderedIds == null) {
    return null;
  }
  return orderedIds.indexOf(draggedId);
}
