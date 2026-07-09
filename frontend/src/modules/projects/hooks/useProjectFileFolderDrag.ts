// keel_web/src/modules/projects/hooks/useProjectFileFolderDrag.ts

// Drag state for moving project files and folders between folder cards and breadcrumbs.

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  beginProjectFileFolderDrag,
  endProjectFileFolderDrag,
  getActiveProjectFileFolderDrag,
  getProjectFolderDropTargetKey,
  setProjectFolderDropTargetKey,
  subscribeProjectFileFolderDragSession,
} from "../lib/project/media/projectFileFolderDragSession";
import type { ProjectDragItem } from "../lib/project/media/projectFileFolderDrag";

export function useProjectFileFolderDrag() {
  const draggingItem = useSyncExternalStore(
    subscribeProjectFileFolderDragSession,
    getActiveProjectFileFolderDrag,
    () => null,
  );
  const dropTargetKey = useSyncExternalStore(
    subscribeProjectFileFolderDragSession,
    getProjectFolderDropTargetKey,
    () => null,
  );

  const handleAttachmentDragStart = useCallback((attachmentId: number) => {
    beginProjectFileFolderDrag({ type: "attachment", id: String(attachmentId) });
  }, []);

  const handleFolderDragStart = useCallback((folderId: string) => {
    beginProjectFileFolderDrag({ type: "folder", id: folderId });
  }, []);

  const handlePendingUploadDragStart = useCallback((clientId: string) => {
    beginProjectFileFolderDrag({ type: "pendingUpload", id: clientId });
  }, []);

  const handlePendingSelectionDragStart = useCallback((clientId: string) => {
    beginProjectFileFolderDrag({ type: "pendingSelection", id: clientId });
  }, []);

  const handlePendingFolderDragStart = useCallback((clientId: string) => {
    beginProjectFileFolderDrag({ type: "pendingFolder", id: clientId });
  }, []);

  const handleDragEnd = useCallback(() => {
    endProjectFileFolderDrag();
  }, []);

  const handleDragEnterFolder = useCallback((dropTargetKeyValue: string) => {
    setProjectFolderDropTargetKey(dropTargetKeyValue);
  }, []);

  const handleDragLeaveFolder = useCallback((dropTargetKeyValue: string) => {
    if (getProjectFolderDropTargetKey() === dropTargetKeyValue) {
      setProjectFolderDropTargetKey(null);
    }
  }, []);

  const clearDropTarget = useCallback(() => {
    endProjectFileFolderDrag();
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
      window.setTimeout(() => {
        clearDropTarget();
      }, 0);
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
    dropTargetKey,
    isDragging: Boolean(draggingItem),
    draggingAttachmentId:
      draggingItem?.type === "attachment" ? Number(draggingItem.id) : null,
    draggingFolderId: draggingItem?.type === "folder" ? draggingItem.id : null,
    draggingPendingUploadClientId:
      draggingItem?.type === "pendingUpload" ? draggingItem.id : null,
    draggingPendingSelectionClientId:
      draggingItem?.type === "pendingSelection" ? draggingItem.id : null,
    draggingPendingFolderClientId:
      draggingItem?.type === "pendingFolder" ? draggingItem.id : null,
    handleAttachmentDragStart,
    handleFolderDragStart,
    handlePendingUploadDragStart,
    handlePendingSelectionDragStart,
    handlePendingFolderDragStart,
    handleDragEnd,
    handleDragEnterFolder,
    handleDragLeaveFolder,
    clearDropTarget,
  };
}

export type { ProjectDragItem };
