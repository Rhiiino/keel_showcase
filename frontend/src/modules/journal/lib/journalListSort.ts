// keel_web/src/modules/journal/lib/journalListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { JournalEntry } from "../api";
import { truncateJournalPreview } from "./journalDisplay";

export type JournalSortColumn = "date" | "tags" | "preview";

export const JOURNAL_DEFAULT_SORT: ListColumnSortState<JournalSortColumn> = {
  column: "date",
  direction: "desc",
};

export function getJournalSortValue(
  entry: JournalEntry,
  column: JournalSortColumn,
): string | number | null {
  switch (column) {
    case "date":
      return entry.entry_date;
    case "tags":
      return entry.tags
        .map((tag) => tag.name)
        .sort((left, right) => left.localeCompare(right))
        .join(", ");
    case "preview":
      return truncateJournalPreview(entry.content);
    default:
      return null;
  }
}
