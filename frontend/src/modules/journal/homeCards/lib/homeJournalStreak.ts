// keel_web/src/modules/home/cards/journal/lib/homeJournalStreak.ts

// Consecutive-day journal streak helpers for the home dashboard card.

import type { JournalEntry, JournalEntryListFilters } from "../../api";
import { todayDateInputValue } from "../../lib/journalDisplay";

const JOURNAL_STREAK_LOOKBACK_DAYS = 366;



// ----- Entry fill detection
export function isFilledJournalEntry(entry: JournalEntry): boolean {
  return entry.content.trim().length > 0;
}



// ----- Streak query filters
export function journalStreakLookbackFilters(): JournalEntryListFilters {
  const today = todayDateInputValue();
  return {
    entryDateFrom: shiftCalendarDate(today, -JOURNAL_STREAK_LOOKBACK_DAYS),
  };
}



// ----- Streak calculation
export function calculateJournalStreak(
  entries: JournalEntry[],
  today: string = todayDateInputValue(),
): number {
  const filledDates = filledJournalEntryDates(entries);
  let cursor = filledDates.has(today) ? today : shiftCalendarDate(today, -1);

  if (!filledDates.has(cursor)) {
    return 0;
  }

  let streak = 0;
  while (filledDates.has(cursor)) {
    streak += 1;
    cursor = shiftCalendarDate(cursor, -1);
  }

  return streak;
}

export function formatJournalStreakLabel(streak: number): string {
  if (streak === 1) {
    return "1 day streak";
  }
  return `${streak} day streak`;
}



// ----- Calendar date helpers
function filledJournalEntryDates(entries: JournalEntry[]): Set<string> {
  const dates = new Set<string>();
  for (const entry of entries) {
    if (isFilledJournalEntry(entry)) {
      dates.add(entry.entry_date);
    }
  }
  return dates;
}

function shiftCalendarDate(dateStr: string, deltaDays: number): string {
  const parsed = new Date(`${dateStr}T12:00:00`);
  parsed.setDate(parsed.getDate() + deltaDays);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
