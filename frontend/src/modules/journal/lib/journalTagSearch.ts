// keel_web/src/modules/journal/lib/journalTagSearch.ts

import type { JournalTag } from "../api";

export function journalTagMatchesSearch(tag: JournalTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterJournalTags(tags: JournalTag[], query: string): JournalTag[] {
  return tags.filter((tag) => journalTagMatchesSearch(tag, query));
}

export function sortJournalTags(tags: JournalTag[]): JournalTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
