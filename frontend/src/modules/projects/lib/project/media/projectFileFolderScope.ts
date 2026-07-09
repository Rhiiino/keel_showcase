// keel_web/src/modules/projects/lib/project/media/projectFileFolderScope.ts

// Folder scope helpers shared by project file browsers.

import type { ProjectFolder } from "../../../api";
import {
  effectiveFolderParentTarget,
  type ProjectFolderTarget,
} from "./projectFileFolderDrag";

export function folderMatchesParent(
  folder: ProjectFolder,
  currentFolderId: string | null,
  deleteFolderIds: string[],
  parentMoveDrafts: Record<string, ProjectFolderTarget> = {},
): boolean {
  if (deleteFolderIds.includes(folder.id)) {
    return false;
  }
  const parent = effectiveFolderParentTarget(folder, parentMoveDrafts);
  return parent.projectFolderId === currentFolderId && !parent.pendingFolderClientId;
}

export function attachmentMatchesFolder(
  projectFolderId: string | null | undefined,
  currentFolderId: string | null,
): boolean {
  return (projectFolderId ?? null) === currentFolderId;
}

export type FolderNavCrumb = {
  id: string | null;
  name: string;
};

export const ROOT_FOLDER_CRUMB: FolderNavCrumb = { id: null, name: "Files" };
