// keel_web/src/modules/timeline/hooks/useTimelinePlanItemListReorder.ts

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../../lib/listReorder";

type UseTimelinePlanItemListReorderParams = {
  itemIds: readonly number[];
  disabled?: boolean;
  onReorder: (itemId: number, insertIndex: number) => void | Promise<void>;
};

export function useTimelinePlanItemListReorder({
  itemIds,
  disabled = false,
  onReorder,
}: UseTimelinePlanItemListReorderParams) {
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

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
    (itemId: number, event: DragEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      event.stopPropagation();
      setTransparentDragImage(event.dataTransfer);
      setDraggingItemId(itemId);
      const startIndex = itemIds.indexOf(itemId);
      setDropInsertIndex(startIndex === -1 ? 0 : startIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(itemId));
    },
    [disabled, itemIds],
  );

  const handleListDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (draggingItemId === null) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rowRects = itemIds.flatMap((id) => {
        const row = rowRefs.current.get(id);
        if (!row) {
          return [];
        }
        const rect = row.getBoundingClientRect();
        return [{ top: rect.top, bottom: rect.bottom }];
      });

      if (rowRects.length === 0) {
        return;
      }

      const nextIndex = resolveInsertIndexFromPointer(event.clientY, rowRects);
      setDropInsertIndex((current) => (current === nextIndex ? current : nextIndex));
    },
    [draggingItemId, itemIds],
  );

  const handleDrop = useCallback(() => {
    const draggedId = draggingItemId;
    const insertIndex = dropInsertIndex;
    clearDragState();

    if (draggedId === null || insertIndex === null) {
      return;
    }

    void onReorder(draggedId, insertIndex);
  }, [clearDragState, draggingItemId, dropInsertIndex, onReorder]);

  return {
    draggingItemId,
    dropInsertIndex,
    setRowRef,
    handleDragStart,
    handleListDragOver,
    handleDrop,
    handleDragEnd: clearDragState,
  };
}
