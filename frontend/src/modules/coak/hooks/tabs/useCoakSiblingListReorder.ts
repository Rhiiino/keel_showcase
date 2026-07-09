// keel_web/src/modules/coak/hooks/tabs/useCoakSiblingListReorder.ts

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../../../lib/listReorder";
import { COAK_ITEM_DRAG_MIME } from "../../lib/tabs/directory/coakSiblingSortOrder";

type UseCoakSiblingListReorderParams = {
  siblingIds: readonly number[];
  disabled?: boolean;
  onReorder: (itemId: number, insertIndex: number) => void | Promise<void>;
};

export function useCoakSiblingListReorder({
  siblingIds,
  disabled = false,
  onReorder,
}: UseCoakSiblingListReorderParams) {
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<number, HTMLLIElement>());

  const clearDragState = useCallback(() => {
    setDraggingItemId(null);
    setDropInsertIndex(null);
  }, []);

  const setRowRef = useCallback((itemId: number, node: HTMLLIElement | null) => {
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
      const startIndex = siblingIds.indexOf(itemId);
      setDropInsertIndex(startIndex === -1 ? 0 : startIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(COAK_ITEM_DRAG_MIME, String(itemId));
    },
    [disabled, siblingIds],
  );

  const handleListDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (draggingItemId === null) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rowRects = siblingIds.flatMap((itemId) => {
        const row = rowRefs.current.get(itemId);
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
    [draggingItemId, siblingIds],
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
