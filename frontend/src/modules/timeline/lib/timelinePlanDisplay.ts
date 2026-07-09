// keel_web/src/modules/timeline/lib/timelinePlanDisplay.ts

import { getUserTimezone } from "../../../app/timezone";
import { formatTimelineDateOnlyLabel } from "./timelineDateTime";

export function formatTimelinePlanDateRange(startDate: string, endDate: string): string {
  const timeZone = getUserTimezone();
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (startDate === endDate) {
    return formatTimelineDateOnlyLabel(`${startDate}T00:00:00Z`, options, timeZone);
  }
  return `${formatTimelineDateOnlyLabel(`${startDate}T00:00:00Z`, options, timeZone)} – ${formatTimelineDateOnlyLabel(`${endDate}T00:00:00Z`, options, timeZone)}`;
}

export function formatPlanItemStatusLabel(status: string): string {
  if (status === "done") {
    return "Done";
  }
  if (status === "skipped") {
    return "Skipped";
  }
  return "Planned";
}

export function truncatePlanNotes(notes: string, maxLength = 120): string {
  const trimmed = notes.trim();
  if (!trimmed) {
    return "—";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
