// Draft helpers for inline project media edits on the detail display view.

import {
  updateMediaAttachment,
  type MediaObject,
} from "../../../../media/api";
import {
  attachProjectMediaFromLibrary,
  deleteProjectMedia,
  MAX_MEDIA_BYTES,
  updateProjectMedia,
  uploadProjectMedia,
  type ProjectMedia,
} from "../../../api";
import {
  deleteFolderDrafts,
  resolveMoveTargetFolderId,
  syncFolderDraftChanges,
  type PendingProjectFolder,
} from "./projectFolderDraft";
import type { ProjectFolderTarget } from "./projectFileFolderDrag";
import type { ProjectFolder } from "../../../api";
import {
  inferMediaKindFromFile,
  isAllowedProjectMediaFile,
  PROJECT_MEDIA_VALIDATION_ERROR,
} from "./projectMediaTypes";

export type PendingMediaUpload = {
  clientId: string;
  file: File;
  error?: string;
  projectFolderId?: string | null;
  pendingFolderClientId?: string | null;
};

export type PendingMediaSelection = {
  clientId: string;
  media: MediaObject;
  projectFolderId?: string | null;
  pendingFolderClientId?: string | null;
};

export function validatePendingMediaFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (!isAllowedProjectMediaFile(file)) {
    return {
      ok: false,
      error: PROJECT_MEDIA_VALIDATION_ERROR,
    };
  }

  if (file.size > MAX_MEDIA_BYTES) {
    return { ok: false, error: "File must be 100 MB or smaller." };
  }

  return { ok: true };
}

export function queuePendingMediaFiles(
  current: PendingMediaUpload[],
  files: FileList | File[],
  target?: {
    projectFolderId?: string | null;
    pendingFolderClientId?: string | null;
  },
): PendingMediaUpload[] {
  const next = [...current];

  for (const file of Array.from(files)) {
    const validation = validatePendingMediaFile(file);
    next.push({
      clientId: crypto.randomUUID(),
      file,
      error: validation.ok ? undefined : validation.error,
      projectFolderId: target?.projectFolderId ?? null,
      pendingFolderClientId: target?.pendingFolderClientId ?? null,
    });
  }

  return next;
}

export function queuePendingMediaSelections(
  current: PendingMediaSelection[],
  mediaObjects: MediaObject[],
  target?: {
    projectFolderId?: string | null;
    pendingFolderClientId?: string | null;
  },
): PendingMediaSelection[] {
  const next = [...current];
  for (const media of mediaObjects) {
    next.push({
      clientId: `${media.id}-${crypto.randomUUID()}`,
      media,
      projectFolderId: target?.projectFolderId ?? null,
      pendingFolderClientId: target?.pendingFolderClientId ?? null,
    });
  }
  return next;
}

export function pendingMediaUploadsDirty(
  pendingUploads: PendingMediaUpload[],
): boolean {
  return pendingUploads.some((item) => !item.error);
}

export function pendingMediaSelectionsDirty(
  pendingSelections: PendingMediaSelection[],
): boolean {
  return pendingSelections.length > 0;
}

export function buildMediaFilenameDrafts(
  media: ProjectMedia[],
): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const item of media) {
    drafts[item.mediaId] = item.original_filename;
  }
  return drafts;
}

export function mediaFilenameDraftsKey(media: ProjectMedia[]): string {
  return media
    .map((item) => `${item.mediaId}:${item.original_filename}:${item.updated_at}`)
    .join("|");
}

export function mediaDraftIsDirty(
  media: ProjectMedia[],
  filenameDrafts: Record<string, string>,
  deleteDraftIds: number[],
  pendingUploads: PendingMediaUpload[] = [],
  pendingSelections: PendingMediaSelection[] = [],
  folderMoveDrafts: Record<number, ProjectFolderTarget> = {},
): boolean {
  if (pendingMediaUploadsDirty(pendingUploads)) {
    return true;
  }
  if (pendingMediaSelectionsDirty(pendingSelections)) {
    return true;
  }

  if (deleteDraftIds.length > 0) {
    return true;
  }

  if (Object.keys(folderMoveDrafts).length > 0) {
    return true;
  }

  return media.some((item) => {
    const draft = (filenameDrafts[item.mediaId] ?? item.original_filename).trim();
    return draft.length > 0 && draft !== item.original_filename;
  });
}

export function effectiveAttachmentFolderTarget(
  item: ProjectMedia,
  folderMoveDrafts: Record<number, ProjectFolderTarget>,
): ProjectFolderTarget {
  if (item.id in folderMoveDrafts) {
    return folderMoveDrafts[item.id];
  }
  return {
    projectFolderId: item.project_folder_id,
    pendingFolderClientId: null,
  };
}

export function movePendingUploadToTarget(
  uploads: PendingMediaUpload[],
  clientId: string,
  target: ProjectFolderTarget,
): PendingMediaUpload[] {
  return uploads.map((item) =>
    item.clientId === clientId
      ? {
          ...item,
          projectFolderId: target.projectFolderId,
          pendingFolderClientId: target.pendingFolderClientId,
        }
      : item,
  );
}

export function movePendingSelectionToTarget(
  selections: PendingMediaSelection[],
  clientId: string,
  target: ProjectFolderTarget,
): PendingMediaSelection[] {
  return selections.map((item) =>
    item.clientId === clientId
      ? {
          ...item,
          projectFolderId: target.projectFolderId,
          pendingFolderClientId: target.pendingFolderClientId,
        }
      : item,
  );
}

export function mediaDisplayFilename(
  item: ProjectMedia,
  filenameDrafts: Record<string, string>,
): string {
  return filenameDrafts[item.mediaId] ?? item.original_filename;
}

export function isMediaPendingDelete(
  attachmentId: number,
  deleteDraftIds: number[],
): boolean {
  return deleteDraftIds.includes(attachmentId);
}

export { inferMediaKindFromFile } from "./projectMediaTypes";

export function isCoverEligiblePendingFile(file: File): boolean {
  const kind = inferMediaKindFromFile(file);
  return kind === "image" || kind === "model_3d";
}

function resolveAttachmentFolderId(
  item: {
    projectFolderId?: string | null;
    pendingFolderClientId?: string | null;
  },
  pendingIdMap: Map<string, string>,
): string | null {
  if (item.pendingFolderClientId) {
    return pendingIdMap.get(item.pendingFolderClientId) ?? null;
  }
  return item.projectFolderId ?? null;
}

export async function applyMediaDraftChanges(
  projectId: number,
  media: ProjectMedia[],
  filenameDrafts: Record<string, string>,
  deleteDraftIds: number[],
  pendingUploads: PendingMediaUpload[] = [],
  pendingSelections: PendingMediaSelection[] = [],
  folders: ProjectFolder[] = [],
  folderNameDrafts: Record<string, string> = {},
  folderDeleteDraftIds: string[] = [],
  pendingFolders: PendingProjectFolder[] = [],
  folderParentMoveDrafts: Record<string, ProjectFolderTarget> = {},
  mediaFolderMoveDrafts: Record<number, ProjectFolderTarget> = {},
): Promise<void> {
  const pendingIdMap = await syncFolderDraftChanges(
    projectId,
    folders,
    folderNameDrafts,
    pendingFolders,
    folderParentMoveDrafts,
    folderDeleteDraftIds,
  );

  const deleteSet = new Set(deleteDraftIds);

  for (const item of media) {
    if (deleteSet.has(item.id)) {
      continue;
    }
    if (item.id in mediaFolderMoveDrafts) {
      const targetFolderId = resolveMoveTargetFolderId(
        mediaFolderMoveDrafts[item.id],
        pendingIdMap,
      );
      if (targetFolderId !== (item.project_folder_id ?? null)) {
        await updateMediaAttachment(item.id, {
          project_folder_id: targetFolderId,
        });
      }
    }
  }

  await deleteFolderDrafts(projectId, folderDeleteDraftIds);

  for (const attachmentId of deleteDraftIds) {
    await deleteProjectMedia(projectId, attachmentId);
  }

  for (const item of pendingUploads) {
    if (item.error) {
      continue;
    }
    await uploadProjectMedia(
      projectId,
      item.file,
      resolveAttachmentFolderId(item, pendingIdMap),
    );
  }

  for (const item of pendingSelections) {
    await attachProjectMediaFromLibrary(
      projectId,
      item.media.id,
      resolveAttachmentFolderId(item, pendingIdMap),
    );
  }

  for (const item of media) {
    if (deleteSet.has(item.id)) {
      continue;
    }

    const draft = (filenameDrafts[item.mediaId] ?? item.original_filename).trim();
    if (draft.length > 0 && draft !== item.original_filename) {
      await updateProjectMedia(projectId, item.mediaId, {
        original_filename: draft,
      });
    }
  }
}
