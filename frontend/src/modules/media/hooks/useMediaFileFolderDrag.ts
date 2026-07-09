// keel_web/src/modules/media/hooks/useMediaFileFolderDrag.ts

// Drag state for moving media files and folders onto folder rows, carousel cards, and breadcrumb targets.

import { useCallback, useEffect, useState } from "react";

const MEDIA_ROOT_DROP_TARGET_KEY = "media-root";

type MediaDragItem = {
  type: "media" | "folder";
  id: string;
};

export function mediaFolderDropTargetKey(folderId: string | null): string {
  return folderId ?? MEDIA_ROOT_DROP_TARGET_KEY;
}

export function useMediaFileFolderDrag() {
  const [draggingItem, setDraggingItem] = useState<MediaDragItem | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const handleDragStart = useCallback((mediaId: string) => {
    setDraggingItem({ type: "media", id: mediaId });
  }, []);

  const handleFolderDragStart = useCallback((folderId: string) => {
    setDraggingItem({ type: "folder", id: folderId });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingItem(null);
    setDropTargetKey(null);
  }, []);

  const handleDragEnterFolder = useCallback((folderId: string | null) => {
    setDropTargetKey(mediaFolderDropTargetKey(folderId));
  }, []);

  const handleDragLeaveFolder = useCallback((folderId: string | null) => {
    const targetKey = mediaFolderDropTargetKey(folderId);
    setDropTargetKey((current) => (current === targetKey ? null : current));
  }, []);

  const clearDropTarget = useCallback(() => {
    setDropTargetKey(null);
    setDraggingItem(null);
  }, []);

  useEffect(() => {
    if (!draggingItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearDropTarget();
      }
    };

    const handleDragEnd = () => {
      clearDropTarget();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("dragend", handleDragEnd, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("dragend", handleDragEnd, true);
    };
  }, [clearDropTarget, draggingItem]);

  return {
    draggingItem,
    draggingMediaId: draggingItem?.type === "media" ? draggingItem.id : null,
    draggingFolderId: draggingItem?.type === "folder" ? draggingItem.id : null,
    dropTargetKey,
    handleDragStart,
    handleFolderDragStart,
    handleDragEnd,
    handleDragEnterFolder,
    handleDragLeaveFolder,
    clearDropTarget,
  };
}
