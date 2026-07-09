// keel_web/src/modules/coak/lib/tabs/directory/coakSiblingSortOrder.ts

import { moveIdToInsertIndex } from "../../../../../lib/listReorder";
import type { CoakItem, CoakItemKind } from "../../../api";
import { collectCoakDescendantItemIds } from "./coakTree";

export const COAK_ITEM_DRAG_MIME = "application/x-coak-item-id";

export type CoakSiblingSortOrderUpdate = {
  itemId: number;
  sortOrder: number;
};

export function collectCoakSiblingItemIds(
  items: CoakItem[],
  parentId: number | null,
): number[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id)
    .map((item) => item.id);
}

export function resolveCoakSiblingOrderAfterInsert(
  siblingIds: readonly number[],
  draggedId: number,
  insertIndex: number,
): number[] | null {
  const orderedIds = siblingIds.includes(draggedId)
    ? moveIdToInsertIndex(siblingIds, draggedId, insertIndex)
    : (() => {
        const nextIds = [...siblingIds];
        const clampedIndex = Math.max(0, Math.min(insertIndex, nextIds.length));
        nextIds.splice(clampedIndex, 0, draggedId);
        return nextIds;
      })();

  if (siblingIds.includes(draggedId) && orderedIds.join(",") === siblingIds.join(",")) {
    return null;
  }

  return orderedIds;
}

export function buildCoakSiblingSortOrderUpdatesForOrder(
  items: CoakItem[],
  orderedIds: readonly number[],
): CoakSiblingSortOrderUpdate[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const updates: CoakSiblingSortOrderUpdate[] = [];

  for (let index = 0; index < orderedIds.length; index += 1) {
    const itemId = orderedIds[index];
    const item = itemById.get(itemId);
    if (item != null && item.sort_order !== index) {
      updates.push({ itemId, sortOrder: index });
    }
  }

  return updates.sort((left, right) => right.sortOrder - left.sortOrder);
}

export function buildCoakSiblingSortOrderUpdates(
  items: CoakItem[],
  siblingIds: readonly number[],
  draggedId: number,
  insertIndex: number,
): CoakSiblingSortOrderUpdate[] {
  const orderedIds = resolveCoakSiblingOrderAfterInsert(siblingIds, draggedId, insertIndex);
  if (orderedIds == null) {
    return [];
  }

  return buildCoakSiblingSortOrderUpdatesForOrder(items, orderedIds);
}

export function canMoveCoakItemToParent(
  items: CoakItem[],
  itemId: number,
  targetParentId: number | null,
): boolean {
  if (targetParentId === itemId) {
    return false;
  }

  if (targetParentId != null) {
    const descendants = collectCoakDescendantItemIds(items, itemId);
    if (descendants.includes(targetParentId)) {
      return false;
    }
  }

  return true;
}

export type CoakVisibleDirectoryRow = {
  id: number;
  parentId: number | null;
  depth: number;
  kind: CoakItemKind;
};

export type CoakDirectoryDropTarget = {
  parentId: number | null;
  insertIndex: number;
};

export function resolveCoakDirectoryDropTarget(
  items: CoakItem[],
  visibleRows: CoakVisibleDirectoryRow[],
  flatInsertIndex: number,
): CoakDirectoryDropTarget {
  if (visibleRows.length === 0) {
    return { parentId: null, insertIndex: 0 };
  }

  const insertIndex = Math.max(0, Math.min(flatInsertIndex, visibleRows.length));

  if (insertIndex === 0) {
    return {
      parentId: visibleRows[0].parentId,
      insertIndex: 0,
    };
  }

  if (insertIndex >= visibleRows.length) {
    const last = visibleRows[visibleRows.length - 1];
    return {
      parentId: last.parentId,
      insertIndex: collectCoakSiblingItemIds(items, last.parentId).length,
    };
  }

  const next = visibleRows[insertIndex];
  const prev = visibleRows[insertIndex - 1];

  if (next.parentId === prev.id) {
    return { parentId: prev.id, insertIndex: 0 };
  }

  const siblingIds = collectCoakSiblingItemIds(items, next.parentId);
  const siblingIndex = siblingIds.indexOf(next.id);

  return {
    parentId: next.parentId,
    insertIndex: siblingIndex === -1 ? 0 : siblingIndex,
  };
}
