// keel_web/src/modules/media/lib/mediaItems.ts

// Unified browse items for list and carousel views.

import type { MediaFolder, MediaObject } from "../api";

export type MediaBrowseFolderItem = {
  kind: "folder";
  folder: MediaFolder;
};

export type MediaBrowseFileItem = {
  kind: "file";
  media: MediaObject;
};

export type MediaBrowseItem = MediaBrowseFolderItem | MediaBrowseFileItem;

export function buildMediaBrowseItems(
  folders: MediaFolder[],
  media: MediaObject[],
): MediaBrowseItem[] {
  const folderItems: MediaBrowseFolderItem[] = folders.map((folder) => ({
    kind: "folder",
    folder,
  }));
  const fileItems: MediaBrowseFileItem[] = media.map((item) => ({
    kind: "file",
    media: item,
  }));
  return [...folderItems, ...fileItems];
}

export function mediaBrowseItemKey(item: MediaBrowseItem): string {
  return item.kind === "folder" ? `folder:${item.folder.id}` : `file:${item.media.id}`;
}
