// keel_web/src/modules/journal/lib/journalDisplay.ts

// Formatting helpers for journal list and detail views.

const PREVIEW_WORD_LIMIT = 40;

export function formatJournalEntryDate(entryDate: string): string {
  const parsed = new Date(`${entryDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return entryDate;
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncateJournalPreview(
  content: string,
  wordLimit: number = PREVIEW_WORD_LIMIT,
): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  const words = trimmed.split(/\s+/);
  if (words.length <= wordLimit) {
    return trimmed;
  }

  return `${words.slice(0, wordLimit).join(" ")}…`;
}

export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
