// keel_web/src/modules/projects/lib/project/media/projectFileFolderDrag.ts

// Drag-and-drop MIME types and helpers for project file/folder cards.

import type { DragEvent as ReactDragEvent } from "react";

import type { ProjectFolder } from "../../../api";
import type { PendingProjectFolder } from "./projectFolderDraft";

export const PROJECT_ATTACHMENT_DRAG_MIME =
  "application/x-keel-project-attachment-id";
export const PROJECT_FOLDER_DRAG_MIME = "application/x-keel-project-folder-id";
export const PROJECT_PENDING_UPLOAD_DRAG_MIME =
  "application/x-keel-project-pending-upload-id";
export const PROJECT_PENDING_SELECTION_DRAG_MIME =
  "application/x-keel-project-pending-selection-id";
export const PROJECT_PENDING_FOLDER_DRAG_MIME =
  "application/x-keel-project-pending-folder-id";

export const PROJECT_FOLDER_DRAG_OPEN_DELAY_MS = 1000;

export type ProjectFolderTarget = {
  projectFolderId: string | null;
  pendingFolderClientId: string | null;
};

export type ProjectDragItem =
  | { type: "attachment"; id: string }
  | { type: "folder"; id: string }
  | { type: "pendingUpload"; id: string }
  | { type: "pendingSelection"; id: string }
  | { type: "pendingFolder"; id: string };

const PROJECT_ROOT_DROP_TARGET_KEY = "project-root";

export function projectFolderDropTargetKey(
  folderId: string | null,
  pendingFolderClientId: string | null = null,
): string {
  if (pendingFolderClientId) {
    return `pending:${pendingFolderClientId}`;
  }
  return folderId ?? PROJECT_ROOT_DROP_TARGET_KEY;
}

export function projectFolderTargetFromDropKey(
  dropKey: string,
): ProjectFolderTarget {
  if (dropKey === PROJECT_ROOT_DROP_TARGET_KEY) {
    return { projectFolderId: null, pendingFolderClientId: null };
  }
  if (dropKey.startsWith("pending:")) {
    return {
      projectFolderId: null,
      pendingFolderClientId: dropKey.slice("pending:".length),
    };
  }
  return { projectFolderId: dropKey, pendingFolderClientId: null };
}

export function hasProjectDragData(event: ReactDragEvent | DragEvent): boolean {
  const dataTransfer =
    "dataTransfer" in event ? event.dataTransfer : null;
  if (!dataTransfer) {
    return false;
  }
  const types = Array.from(dataTransfer.types);
  return (
    types.includes(PROJECT_ATTACHMENT_DRAG_MIME) ||
    types.includes(PROJECT_FOLDER_DRAG_MIME) ||
    types.includes(PROJECT_PENDING_UPLOAD_DRAG_MIME) ||
    types.includes(PROJECT_PENDING_SELECTION_DRAG_MIME) ||
    types.includes(PROJECT_PENDING_FOLDER_DRAG_MIME)
  );
}

/** True when the drag originated from the OS file system (not in-app card reorder). */
export function isOsFileDrag(event: ReactDragEvent | DragEvent): boolean {
  const dataTransfer =
    "dataTransfer" in event ? event.dataTransfer : null;
  if (!dataTransfer) {
    return false;
  }
  return Array.from(dataTransfer.types).includes("Files");
}

export function effectiveFolderParentTarget(
  folder: ProjectFolder,
  parentMoveDrafts: Record<string, ProjectFolderTarget>,
): ProjectFolderTarget {
  if (folder.id in parentMoveDrafts) {
    return parentMoveDrafts[folder.id];
  }
  return {
    projectFolderId: folder.parent_folder_id,
    pendingFolderClientId: null,
  };
}

export function folderTargetsEqual(
  left: ProjectFolderTarget,
  right: ProjectFolderTarget,
): boolean {
  return (
    left.projectFolderId === right.projectFolderId &&
    left.pendingFolderClientId === right.pendingFolderClientId
  );
}

export function isFolderDescendantOf(
  folderId: string,
  potentialAncestorId: string,
  folders: ProjectFolder[],
  parentMoveDrafts: Record<string, ProjectFolderTarget>,
): boolean {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  let currentId: string | null = potentialAncestorId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === folderId) {
      return true;
    }
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    const current = folderById.get(currentId);
    if (!current) {
      break;
    }
    currentId = effectiveFolderParentTarget(current, parentMoveDrafts).projectFolderId;
  }

  return false;
}

export function isPendingFolderDescendantOf(
  potentialDescendantClientId: string,
  ancestorClientId: string,
  pendingFolders: PendingProjectFolder[],
): boolean {
  const folderByClientId = new Map(
    pendingFolders.map((folder) => [folder.clientId, folder]),
  );
  let current = folderByClientId.get(potentialDescendantClientId);
  const visited = new Set<string>();

  while (current?.parentPendingClientId) {
    if (current.parentPendingClientId === ancestorClientId) {
      return true;
    }
    if (visited.has(current.parentPendingClientId)) {
      break;
    }
    visited.add(current.parentPendingClientId);
    current = folderByClientId.get(current.parentPendingClientId);
  }

  return false;
}
