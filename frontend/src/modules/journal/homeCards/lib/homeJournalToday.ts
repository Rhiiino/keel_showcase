// keel_web/src/modules/journal/homeCards/lib/homeJournalToday.ts

// Helpers for today's journal entry status on the home page.

import type { JournalEntry, JournalEntryListFilters } from "../../api";
import { todayDateInputValue } from "../../lib/journalDisplay";
import { isFilledJournalEntry } from "./homeJournalStreak";

export function todayJournalListFilters(): JournalEntryListFilters {
  const today = todayDateInputValue();
  return {
    entryDateFrom: today,
    entryDateTo: today,
  };
}

export function hasFilledJournalEntryForToday(entries: JournalEntry[]): boolean {
  const today = todayDateInputValue();
  return entries.some(
    (entry) => entry.entry_date === today && isFilledJournalEntry(entry),
  );
}

export function firstFilledJournalEntryForToday(
  entries: JournalEntry[],
): JournalEntry | null {
  const today = todayDateInputValue();
  return (
    entries.find(
      (entry) => entry.entry_date === today && isFilledJournalEntry(entry),
    ) ?? null
  );
}
