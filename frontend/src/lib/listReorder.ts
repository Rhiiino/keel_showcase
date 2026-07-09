// stack_sandbox/frontend_web/src/lib/listReorder.ts

// Shared helpers for manual list reordering via HTML drag-and-drop.

/** Map pointer Y to a list insertion slot using stable row geometry. */
export function resolveInsertIndexFromPointer(
  clientY: number,
  rowRects: Array<{ top: number; bottom: number }>,
): number {
  for (let index = 0; index < rowRects.length; index += 1) {
    const rect = rowRects[index];
    const midpoint = rect.top + (rect.bottom - rect.top) / 2;
    if (clientY < midpoint) {
      return index;
    }
  }
  return rowRects.length;
}

export function moveIdToInsertIndex<TId>(
  ids: readonly TId[],
  draggedId: TId,
  insertIndex: number,
): TId[] {
  const fromIndex = ids.indexOf(draggedId);
  if (fromIndex === -1) {
    return [...ids];
  }

  const next = [...ids];
  const [removed] = next.splice(fromIndex, 1);

  let targetIndex = insertIndex;
  if (fromIndex < insertIndex) {
    targetIndex -= 1;
  }
  targetIndex = Math.max(0, Math.min(targetIndex, next.length));

  if (fromIndex === targetIndex) {
    return [...ids];
  }

  next.splice(targetIndex, 0, removed);
  return next;
}

export function setTransparentDragImage(
  dataTransfer: DataTransfer | null,
): void {
  if (!dataTransfer) {
    return;
  }

  const node = document.createElement("div");
  node.style.width = "1px";
  node.style.height = "1px";
  node.style.opacity = "0";
  node.style.position = "fixed";
  node.style.top = "0";
  node.style.left = "0";
  node.style.pointerEvents = "none";
  document.body.appendChild(node);
  dataTransfer.setDragImage(node, 0, 0);
  window.requestAnimationFrame(() => {
    node.remove();
  });
}
