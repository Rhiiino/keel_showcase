// keel_web/src/modules/timeline/lib/timelinePersonCircle.ts

// Compact label for timeline person circles when no profile photo is available.

export const TIMELINE_PERSON_CIRCLE_SIZE_CLASS = "h-8 w-8";

export const TIMELINE_CALENDAR_PERSON_CIRCLE_SIZE_CLASS = "h-6 w-6";

export function timelinePersonCircleLabel(
  displayName: string,
  firstName?: string | null,
): string {
  const fromFirst = firstName?.trim();
  if (fromFirst) {
    return fromFirst.slice(0, 5);
  }

  const firstWord = displayName.trim().split(/\s+/)[0] ?? "";
  return firstWord.slice(0, 5) || "?";
}
