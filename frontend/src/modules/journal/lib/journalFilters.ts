// keel_web/src/modules/journal/lib/journalFilters.ts

// Shared filter state for journal entry list.

export type JournalFilterValues = {
  tagIds: number[];
  query: string;
  entryDateFrom: string;
  entryDateTo: string;
};

export function emptyJournalFilters(): JournalFilterValues {
  return {
    tagIds: [],
    query: "",
    entryDateFrom: "",
    entryDateTo: "",
  };
}

export function countJournalFilters(filters: JournalFilterValues): number {
  let count = filters.tagIds.length;
  if (filters.query.trim().length > 0) {
    count += 1;
  }
  if (filters.entryDateFrom.trim().length > 0) {
    count += 1;
  }
  if (filters.entryDateTo.trim().length > 0) {
    count += 1;
  }
  return count;
}
