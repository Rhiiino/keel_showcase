// keel_web/src/modules/timeline/lib/timelineDisplay.ts

// Timeline list and form display helpers.

import { getUserTimezone } from "../../../app/timezone";
import type { TimelineEvent } from "../api";
import {
  formatTimelineDateOnlyLabel,
  formatTimelineInstantLabel,
  isTimelineUtcMidnight,
  parseTimelineDateTime,
  timelineDateTimeToDateOnly,
} from "./timelineDateTime";

function formatTimelineDate(value: string, timeZone?: string): string {
  if (isTimelineUtcMidnight(value)) {
    return formatTimelineDateOnlyLabel(
      value,
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
      timeZone,
    );
  }
  return formatTimelineInstantLabel(
    value,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
    timeZone,
  );
}

function formatTimelineTime(value: string, timeZone?: string): string | null {
  if (isTimelineUtcMidnight(value)) {
    return null;
  }
  const parsed = parseTimelineDateTime(value);
  if (!parsed) {
    return null;
  }
  return formatTimelineInstantLabel(
    value,
    {
      hour: "numeric",
      minute: "2-digit",
    },
    timeZone,
  );
}

function formatTimelineDateTimeLabel(value: string, timeZone?: string): string {
  const dateLabel = formatTimelineDate(value, timeZone);
  const timeLabel = formatTimelineTime(value, timeZone);
  if (!timeLabel) {
    return dateLabel;
  }
  return `${dateLabel}, ${timeLabel}`;
}

export function formatTimelineDateRange(
  startDate: string,
  endDate: string | null,
  timeZone?: string,
): { primary: string; secondary?: string } {
  const resolvedTimeZone = timeZone ?? getUserTimezone();
  const startDateOnly = timelineDateTimeToDateOnly(startDate, resolvedTimeZone);
  const endDateOnly = endDate ? timelineDateTimeToDateOnly(endDate, resolvedTimeZone) : null;
  const startLabel = formatTimelineDateTimeLabel(startDate, resolvedTimeZone);

  if (!endDate || endDateOnly === startDateOnly) {
    if (
      endDate &&
      endDate !== startDate &&
      !isTimelineUtcMidnight(startDate) &&
      !isTimelineUtcMidnight(endDate)
    ) {
      const endTimeLabel = formatTimelineTime(endDate, resolvedTimeZone);
      if (endTimeLabel) {
        return {
          primary: startLabel,
          secondary: endTimeLabel,
        };
      }
    }
    return { primary: startLabel };
  }

  return {
    primary: startLabel,
    secondary: formatTimelineDateTimeLabel(endDate, resolvedTimeZone),
  };
}

export function formatTimelineHoverDateRange(
  startDate: string,
  endDate: string | null,
  timeZone?: string,
): string {
  const range = formatTimelineDateRange(startDate, endDate, timeZone);
  if (range.secondary) {
    return `${range.primary} – ${range.secondary}`;
  }
  return range.primary;
}

export function hasTimelinePeople(
  event: Pick<TimelineEvent, "contacts" | "figures" | "subject_name">,
): boolean {
  return (
    event.contacts.length > 0 ||
    event.figures.length > 0 ||
    Boolean(event.subject_name?.trim())
  );
}

export type TimelineEventDateSortDirection = "asc" | "desc";

export function sortTimelineEvents(
  events: TimelineEvent[],
  direction: TimelineEventDateSortDirection = "desc",
): TimelineEvent[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...events].sort((left, right) => {
    const dateCompare = left.start_date.localeCompare(right.start_date);
    if (dateCompare !== 0) {
      return dateCompare * multiplier;
    }
    return (left.id - right.id) * multiplier;
  });
}
