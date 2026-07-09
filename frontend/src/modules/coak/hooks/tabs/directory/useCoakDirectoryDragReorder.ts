// keel_web/src/modules/coak/hooks/tabs/directory/useCoakDirectoryDragReorder.ts

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../../../../lib/listReorder";
import type { CoakItem } from "../../../api";
import {
  COAK_ITEM_DRAG_MIME,
  canMoveCoakItemToParent,
  resolveCoakDirectoryDropTarget,
  type CoakVisibleDirectoryRow,
} from "../../../lib/tabs/directory/coakSiblingSortOrder";
import { isCoakFolderExpanded, type CoakTreeNode } from "../../../lib/tabs/directory/coakTree";

function flattenVisibleCoakDirectoryRows(
  nodes: CoakTreeNode[],
  isFolderExpanded: (folderId: number) => boolean,
): CoakVisibleDirectoryRow[] {
  const rows: CoakVisibleDirectoryRow[] = [];

  const visit = (nodeList: CoakTreeNode[], depth: number) => {
    for (const node of nodeList) {
      rows.push({
        id: node.id,
        parentId: node.parent_id,
        depth,
        kind: node.kind,
      });

      if (node.kind === "folder" && isFolderExpanded(node.id)) {
        visit(node.children, depth + 1);
      }
    }
  };

  visit(nodes, 0);
  return rows;
}

type UseCoakDirectoryDragReorderParams = {
  items: CoakItem[];
  tree: CoakTreeNode[];
  expandedFolderIds: number[];
  searchExpandedFolderIds: Set<number>;
  disabled?: boolean;
  reorderSiblings: (
    parentId: number | null,
    draggedId: number,
    insertIndex: number,
  ) => Promise<void>;
};

export function useCoakDirectoryDragReorder({
  items,
  tree,
  expandedFolderIds,
  searchExpandedFolderIds,
  disabled = false,
  reorderSiblings,
}: UseCoakDirectoryDragReorderParams) {
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

  const isFolderExpanded = useCallback(
    (folderId: number) =>
      isCoakFolderExpanded(expandedFolderIds, folderId) ||
      searchExpandedFolderIds.has(folderId),
    [expandedFolderIds, searchExpandedFolderIds],
  );

  const visibleRows = useMemo(
    () => flattenVisibleCoakDirectoryRows(tree, isFolderExpanded),
    [isFolderExpanded, tree],
  );

  const visibleIndexById = useMemo(
    () => new Map(visibleRows.map((row, index) => [row.id, index])),
    [visibleRows],
  );

  const clearDragState = useCallback(() => {
    setDraggingItemId(null);
    setDropInsertIndex(null);
  }, []);

  const setRowRef = useCallback((itemId: number, node: HTMLDivElement | null) => {
    if (node) {
      rowRefs.current.set(itemId, node);
      return;
    }
    rowRefs.current.delete(itemId);
  }, []);

  const handleDragStart = useCallback(
    (itemId: number, event: DragEvent<HTMLElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement ||
        (event.target instanceof HTMLElement &&
          (event.target.closest("input") != null || event.target.closest("button") != null))
      ) {
        event.preventDefault();
        return;
      }

      setTransparentDragImage(event.dataTransfer);
      setDraggingItemId(itemId);
      const startIndex = visibleIndexById.get(itemId) ?? 0;
      setDropInsertIndex(startIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(COAK_ITEM_DRAG_MIME, String(itemId));
    },
    [disabled, visibleIndexById],
  );

  const handleListDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (draggingItemId === null) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rowRects = visibleRows.flatMap((row) => {
        const element = rowRefs.current.get(row.id);
        if (!element) {
          return [];
        }
        const rect = element.getBoundingClientRect();
        return [{ top: rect.top, bottom: rect.bottom }];
      });

      if (rowRects.length === 0) {
        return;
      }

      const nextIndex = resolveInsertIndexFromPointer(event.clientY, rowRects);
      setDropInsertIndex((current) => (current === nextIndex ? current : nextIndex));
    },
    [draggingItemId, visibleRows],
  );

  const handleDrop = useCallback(() => {
    const draggedId = draggingItemId;
    const flatInsertIndex = dropInsertIndex;
    clearDragState();

    if (draggedId === null || flatInsertIndex === null) {
      return;
    }

    const dropTarget = resolveCoakDirectoryDropTarget(items, visibleRows, flatInsertIndex);
    if (!canMoveCoakItemToParent(items, draggedId, dropTarget.parentId)) {
      return;
    }

    void reorderSiblings(dropTarget.parentId, draggedId, dropTarget.insertIndex);
  }, [
    clearDragState,
    draggingItemId,
    dropInsertIndex,
    items,
    reorderSiblings,
    visibleRows,
  ]);

  return {
    draggingItemId,
    dropInsertIndex,
    visibleRows,
    visibleIndexById,
    setRowRef,
    handleDragStart,
    handleListDragOver,
    handleDrop,
    handleDragEnd: clearDragState,
  };
}
