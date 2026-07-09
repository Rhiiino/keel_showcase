// keel_web/src/modules/journal/lib/journalTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { JournalTag } from "../api";

export function getJournalTagSortValue(
  tag: JournalTag,
  column: TagsListColumnId,
): string | number | null {
  switch (column) {
    case "color":
      return tag.color_hex;
    case "name":
      return tag.name;
    case "description":
      return null;
    case "preview":
      return tag.name;
    case "count":
      return tag.entry_count;
    default:
      return null;
  }
}
