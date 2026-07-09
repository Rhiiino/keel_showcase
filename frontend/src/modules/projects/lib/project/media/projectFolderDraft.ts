// keel_web/src/modules/projects/lib/project/media/projectFolderDraft.ts

// Draft helpers for project folder create/rename/delete on the detail display view.

import {
  createProjectFolder,
  deleteProjectFolder,
  updateProjectFolder,
  type ProjectFolder,
} from "../../../api";
import type { ProjectFolderTarget } from "./projectFileFolderDrag";

export type PendingProjectFolder = {
  clientId: string;
  name: string;
  parentFolderId: string | null;
  parentPendingClientId: string | null;
};

export function createPendingProjectFolder(
  parentFolderId: string | null,
  parentPendingClientId: string | null = null,
): PendingProjectFolder {
  return {
    clientId: crypto.randomUUID(),
    name: "New folder",
    parentFolderId,
    parentPendingClientId,
  };
}

export function buildFolderNameDrafts(
  folders: ProjectFolder[],
): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const folder of folders) {
    drafts[folder.id] = folder.name;
  }
  return drafts;
}

export function folderNameDraftsKey(folders: ProjectFolder[]): string {
  return folders
    .map((folder) => `${folder.id}:${folder.name}:${folder.updated_at}`)
    .join("|");
}

export function folderDisplayName(
  folder: ProjectFolder,
  nameDrafts: Record<string, string>,
): string {
  return nameDrafts[folder.id] ?? folder.name;
}

export function pendingFolderDisplayName(folder: PendingProjectFolder): string {
  return folder.name.trim() || "New folder";
}

export function isFolderPendingDelete(
  folderId: string,
  deleteDraftIds: string[],
): boolean {
  return deleteDraftIds.includes(folderId);
}

export function folderDraftIsDirty(
  folders: ProjectFolder[],
  nameDrafts: Record<string, string>,
  deleteDraftIds: string[],
  pendingFolders: PendingProjectFolder[],
  parentMoveDrafts: Record<string, ProjectFolderTarget> = {},
): boolean {
  if (pendingFolders.length > 0) {
    return true;
  }
  if (deleteDraftIds.length > 0) {
    return true;
  }
  if (Object.keys(parentMoveDrafts).length > 0) {
    return true;
  }
  return folders.some((folder) => {
    const draft = (nameDrafts[folder.id] ?? folder.name).trim();
    return draft.length > 0 && draft !== folder.name;
  });
}

export function movePendingFolderToTarget(
  folders: PendingProjectFolder[],
  clientId: string,
  target: {
    projectFolderId: string | null;
    pendingFolderClientId: string | null;
  },
): PendingProjectFolder[] {
  return folders.map((folder) =>
    folder.clientId === clientId
      ? {
          ...folder,
          parentFolderId: target.projectFolderId,
          parentPendingClientId: target.pendingFolderClientId,
        }
      : folder,
  );
}

function resolveParentFolderId(
  folder: PendingProjectFolder,
  pendingIdMap: Map<string, string>,
): string | null {
  if (folder.parentPendingClientId) {
    return pendingIdMap.get(folder.parentPendingClientId) ?? null;
  }
  return folder.parentFolderId;
}

function resolveMoveTargetFolderId(
  target: {
    projectFolderId: string | null;
    pendingFolderClientId: string | null;
  },
  pendingIdMap: Map<string, string>,
): string | null {
  if (target.pendingFolderClientId) {
    return pendingIdMap.get(target.pendingFolderClientId) ?? null;
  }
  return target.projectFolderId;
}

export async function syncFolderDraftChanges(
  projectId: number,
  folders: ProjectFolder[],
  nameDrafts: Record<string, string>,
  pendingFolders: PendingProjectFolder[],
  parentMoveDrafts: Record<string, ProjectFolderTarget> = {},
  skipFolderIds: string[] = [],
): Promise<Map<string, string>> {
  const pendingIdMap = new Map<string, string>();
  const skipFolderIdSet = new Set(skipFolderIds);
  const remainingPending = [...pendingFolders];

  while (remainingPending.length > 0) {
    const readyIndex = remainingPending.findIndex((folder) => {
      if (folder.parentPendingClientId) {
        return pendingIdMap.has(folder.parentPendingClientId);
      }
      return true;
    });
    if (readyIndex === -1) {
      break;
    }
    const [folder] = remainingPending.splice(readyIndex, 1);
    const created = await createProjectFolder(projectId, {
      name: pendingFolderDisplayName(folder),
      parent_folder_id: resolveParentFolderId(folder, pendingIdMap),
    });
    pendingIdMap.set(folder.clientId, created.id);
  }

  for (const folder of folders) {
    if (skipFolderIdSet.has(folder.id)) {
      continue;
    }
    const draft = (nameDrafts[folder.id] ?? folder.name).trim();
    const parentMove = parentMoveDrafts[folder.id];
    const payload: { name?: string; parent_folder_id?: string | null } = {};
    if (draft.length > 0 && draft !== folder.name) {
      payload.name = draft;
    }
    if (parentMove !== undefined) {
      const nextParentId = resolveMoveTargetFolderId(parentMove, pendingIdMap);
      if (nextParentId !== (folder.parent_folder_id ?? null)) {
        payload.parent_folder_id = nextParentId;
      }
    }
    if (Object.keys(payload).length > 0) {
      await updateProjectFolder(projectId, folder.id, payload);
    }
  }

  return pendingIdMap;
}

export async function deleteFolderDrafts(
  projectId: number,
  deleteDraftIds: string[],
): Promise<void> {
  for (const folderId of deleteDraftIds) {
    await deleteProjectFolder(projectId, folderId);
  }
}

export { resolveMoveTargetFolderId };
