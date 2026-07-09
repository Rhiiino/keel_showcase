// keel_web/src/modules/projects/components/media/useProjectFilesDropHandlers.ts

// Drop handlers for moving project files and folders between folder targets.

import type { DragEvent } from "react";

import {
  consumeActiveProjectFileFolderDrag,
  getActiveProjectFileFolderDrag,
} from "../../lib/project/media/projectFileFolderDragSession";
import type { ProjectFolder } from "../../api";
import {
  folderTargetsEqual,
  isFolderDescendantOf,
  isPendingFolderDescendantOf,
  PROJECT_ATTACHMENT_DRAG_MIME,
  PROJECT_FOLDER_DRAG_MIME,
  PROJECT_PENDING_FOLDER_DRAG_MIME,
  PROJECT_PENDING_SELECTION_DRAG_MIME,
  PROJECT_PENDING_UPLOAD_DRAG_MIME,
  projectFolderTargetFromDropKey,
  type PendingProjectFolder,
  type ProjectFolderTarget,
} from "../../lib/project/media";

type UseProjectFilesDropHandlersOptions = {
  allFolders: ProjectFolder[];
  folderParentMoveDrafts: Record<string, ProjectFolderTarget>;
  onMoveAttachment: (attachmentId: number, target: ProjectFolderTarget) => void;
  onMoveFolder: (folderId: string, target: ProjectFolderTarget) => void;
  onMovePendingUpload: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingSelection: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingFolder: (clientId: string, target: ProjectFolderTarget) => void;
  onDropComplete?: () => void;
};

function crumbToTarget(crumb: { id: string | null }): ProjectFolderTarget {
  if (crumb.id?.startsWith("pending:")) {
    return {
      projectFolderId: null,
      pendingFolderClientId: crumb.id.slice("pending:".length),
    };
  }
  return {
    projectFolderId: crumb.id,
    pendingFolderClientId: null,
  };
}

export function useProjectFilesDropHandlers({
  allFolders,
  folderParentMoveDrafts,
  onMoveAttachment,
  onMoveFolder,
  onMovePendingUpload,
  onMovePendingSelection,
  onMovePendingFolder,
  onDropComplete,
}: UseProjectFilesDropHandlersOptions) {
  const canDropFolderOnTarget = (
    folderId: string,
    target: ProjectFolderTarget,
  ): boolean => {
    if (folderId === target.projectFolderId) {
      return false;
    }
    if (target.projectFolderId && isFolderDescendantOf(
      target.projectFolderId,
      folderId,
      allFolders,
      folderParentMoveDrafts,
    )) {
      return false;
    }
    return true;
  };

  const canDropPendingFolderOnTarget = (
    clientId: string,
    target: ProjectFolderTarget,
    pendingFolders: PendingProjectFolder[],
  ): boolean => {
    if (clientId === target.pendingFolderClientId) {
      return false;
    }
    if (
      target.pendingFolderClientId &&
      isPendingFolderDescendantOf(target.pendingFolderClientId, clientId, pendingFolders)
    ) {
      return false;
    }
    return true;
  };

  const handleDropOnTarget = (
    event: DragEvent<HTMLElement>,
    target: ProjectFolderTarget,
    pendingFolders: PendingProjectFolder[],
  ) => {
    const activeDrag = getActiveProjectFileFolderDrag();

    let attachmentId = event.dataTransfer.getData(PROJECT_ATTACHMENT_DRAG_MIME);
    if (!attachmentId && activeDrag?.type === "attachment") {
      attachmentId = activeDrag.id;
    }
    if (attachmentId) {
      onMoveAttachment(Number(attachmentId), target);
      consumeActiveProjectFileFolderDrag();
      onDropComplete?.();
      return;
    }

    let folderId = event.dataTransfer.getData(PROJECT_FOLDER_DRAG_MIME);
    if (!folderId && activeDrag?.type === "folder") {
      folderId = activeDrag.id;
    }
    if (folderId && canDropFolderOnTarget(folderId, target)) {
      onMoveFolder(folderId, target);
      consumeActiveProjectFileFolderDrag();
      onDropComplete?.();
      return;
    }

    const pendingUploadId = event.dataTransfer.getData(PROJECT_PENDING_UPLOAD_DRAG_MIME);
    if (pendingUploadId) {
      onMovePendingUpload(pendingUploadId, target);
      onDropComplete?.();
      return;
    }

    const pendingSelectionId = event.dataTransfer.getData(
      PROJECT_PENDING_SELECTION_DRAG_MIME,
    );
    if (pendingSelectionId) {
      onMovePendingSelection(pendingSelectionId, target);
      onDropComplete?.();
      return;
    }

    const pendingFolderId = event.dataTransfer.getData(PROJECT_PENDING_FOLDER_DRAG_MIME);
    if (
      pendingFolderId &&
      canDropPendingFolderOnTarget(pendingFolderId, target, pendingFolders)
    ) {
      onMovePendingFolder(pendingFolderId, target);
      onDropComplete?.();
    }
  };

  const handleDropOnDropKey = (
    event: DragEvent<HTMLElement>,
    dropKey: string,
    pendingFolders: PendingProjectFolder[],
  ) => {
    handleDropOnTarget(event, projectFolderTargetFromDropKey(dropKey), pendingFolders);
  };

  const handleDropOnCrumb = (
    event: DragEvent<HTMLElement>,
    crumb: { id: string | null },
    pendingFolders: PendingProjectFolder[],
  ) => {
    handleDropOnTarget(event, crumbToTarget(crumb), pendingFolders);
  };

  return {
    handleDropOnTarget,
    handleDropOnDropKey,
    handleDropOnCrumb,
    folderTargetsEqual,
  };
}
