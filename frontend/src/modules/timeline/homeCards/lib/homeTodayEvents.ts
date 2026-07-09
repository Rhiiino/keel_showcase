// keel_web/src/modules/home/cards/timeline/lib/homeTodayEvents.ts

// Helpers for loading and ordering today's timeline events on the home page.

import type { TimelineEvent, TimelineEventListFilters } from "../../api";
import { formatTimelineDateOnly } from "../../lib/timelineDateRange";
import {
  dateToTimelineDatetimeLocal,
  isTimelineUtcMidnight,
  parseTimelineDateTime,
} from "../../lib/timelineDateTime";

export function todayTimelineListFilters(
  referenceDate: Date = new Date(),
): TimelineEventListFilters {
  const today = formatTimelineDateOnly(referenceDate);
  return {
    startDateFrom: today,
    startDateTo: today,
  };
}

export function todayTimelineCreateStartDate(referenceDate: Date = new Date()): string {
  return dateToTimelineDatetimeLocal(referenceDate);
}

export function sortHomeTodayEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((left, right) => {
    const dateCompare = left.start_date.localeCompare(right.start_date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return left.id - right.id;
  });
}

export function formatHomeTodayEventTimeLabel(startDate: string): string {
  const display = getHomeTodayEventTimeDisplay(startDate);
  if (display.isAllDay) {
    return display.primary;
  }
  return display.secondary
    ? `${display.primary} ${display.secondary}`
    : display.primary;
}

export type HomeTodayEventTimeDisplay = {
  isAllDay: boolean;
  primary: string;
  secondary?: string;
};

export function getHomeTodayEventTimeDisplay(
  startDate: string,
): HomeTodayEventTimeDisplay {
  if (isTimelineUtcMidnight(startDate)) {
    return { isAllDay: true, primary: "All day" };
  }
  const parsed = parseTimelineDateTime(startDate);
  if (!parsed) {
    return { isAllDay: true, primary: "All day" };
  }

  const formatted = parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const match = formatted.match(/^(.+?)\s*(AM|PM)$/i);
  if (match) {
    return {
      isAllDay: false,
      primary: match[1].trim(),
      secondary: match[2].toUpperCase(),
    };
  }
  return { isAllDay: false, primary: formatted };
}
