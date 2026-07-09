// keel_web/src/modules/media/lib/mediaPickerBrowse.ts

// Search and filter helpers for folder-aware media picker browsing.

import type { MediaFolder, MediaObject } from "../api";
import { mediaKindLabel } from "./media";

export function matchesMediaPickerFileSearch(media: MediaObject, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    media.original_filename.toLowerCase().includes(normalized) ||
    media.mime_type.toLowerCase().includes(normalized) ||
    mediaKindLabel(media.media_kind).toLowerCase().includes(normalized)
  );
}

export function matchesMediaPickerFolderSearch(folder: MediaFolder, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return folder.name.toLowerCase().includes(normalized);
}

export function filterMediaPickerBrowseFiles({
  media,
  searchQuery,
  excludeIds,
  hideSelectedIds,
  mediaFilter,
}: {
  media: MediaObject[];
  searchQuery: string;
  excludeIds: ReadonlySet<string>;
  hideSelectedIds: ReadonlySet<string>;
  mediaFilter?: (media: MediaObject) => boolean;
}): MediaObject[] {
  return media.filter((item) => {
    if (item.status !== "ready" || excludeIds.has(item.id)) {
      return false;
    }
    if (hideSelectedIds.has(item.id)) {
      return false;
    }
    if (mediaFilter && !mediaFilter(item)) {
      return false;
    }
    return matchesMediaPickerFileSearch(item, searchQuery);
  });
}

export function filterMediaPickerBrowseFolders(
  folders: MediaFolder[],
  searchQuery: string,
): MediaFolder[] {
  return folders.filter((folder) => matchesMediaPickerFolderSearch(folder, searchQuery));
}
