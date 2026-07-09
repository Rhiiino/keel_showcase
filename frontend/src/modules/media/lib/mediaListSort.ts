// keel_web/src/modules/media/lib/mediaListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { MediaFolder, MediaObject } from "../api";
import { mediaStatusLabel } from "./media";

export type MediaListSortColumn =
  | "name"
  | "type"
  | "size"
  | "attached"
  | "status"
  | "created"
  | "updated";

export const MEDIA_LIST_DEFAULT_SORT: ListColumnSortState<MediaListSortColumn> = {
  column: "name",
  direction: "asc",
};

export type MediaListEntry =
  | { kind: "folder"; folder: MediaFolder }
  | { kind: "file"; item: MediaObject };

export function getMediaListEntryKey(entry: MediaListEntry): string {
  return entry.kind === "folder" ? `folder:${entry.folder.id}` : `file:${entry.item.id}`;
}

export function getMediaListSortValue(
  entry: MediaListEntry,
  column: MediaListSortColumn,
): string | number | null {
  if (entry.kind === "folder") {
    switch (column) {
      case "name":
        return entry.folder.name;
      case "type":
        return "folder";
      case "size":
      case "attached":
      case "status":
        return null;
      case "created":
        return entry.folder.created_at;
      case "updated":
        return entry.folder.updated_at;
      default:
        return null;
    }
  }

  switch (column) {
    case "name":
      return entry.item.original_filename;
    case "type":
      return entry.item.mime_type;
    case "size":
      return entry.item.byte_size;
    case "attached":
      return entry.item.attachment_count ?? 0;
    case "status":
      return mediaStatusLabel(entry.item.status);
    case "created":
      return entry.item.created_at;
    case "updated":
      return entry.item.updated_at;
    default:
      return null;
  }
}
