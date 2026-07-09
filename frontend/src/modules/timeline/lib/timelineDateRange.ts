// keel_web/src/modules/timeline/lib/timelineDateRange.ts

// Calendar visible-range helpers for timeline event queries.

import { readZonedParts } from "../../../app/timezone";

export type TimelineEventDateRangeFilters = {
  startDateFrom: string;
  startDateTo: string;
};

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatTimelineDateOnly(value: Date): string {
  return [
    value.getFullYear(),
    padDatePart(value.getMonth() + 1),
    padDatePart(value.getDate()),
  ].join("-");
}

export function formatTimelineDateOnlyInTimeZone(value: Date, timeZone: string): string {
  const parts = readZonedParts(value, timeZone);
  return [parts.year, padDatePart(parts.month), padDatePart(parts.day)].join("-");
}

/** Map FullCalendar's exclusive range end to an inclusive date-only string. */
export function calendarExclusiveEndToInclusiveDate(
  exclusiveEnd: Date,
  timeZone?: string,
): string {
  if (timeZone) {
    return addDaysToDateOnly(formatTimelineDateOnlyInTimeZone(exclusiveEnd, timeZone), -1);
  }

  const inclusiveEnd = new Date(exclusiveEnd);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  return formatTimelineDateOnly(inclusiveEnd);
}

export function calendarVisibleRangeToQueryParams(
  start: Date,
  exclusiveEnd: Date,
  timeZone?: string,
): TimelineEventDateRangeFilters {
  const formatDate = timeZone
    ? (value: Date) => formatTimelineDateOnlyInTimeZone(value, timeZone)
    : formatTimelineDateOnly;

  return {
    startDateFrom: formatDate(start),
    startDateTo: calendarExclusiveEndToInclusiveDate(exclusiveEnd, timeZone),
  };
}

/** Map FullCalendar `datesSet` ISO strings (already in the calendar timezone) to query params. */
export function calendarDatesSetToQueryParams(
  startStr: string,
  endStr: string,
): TimelineEventDateRangeFilters {
  const startDateFrom = startStr.slice(0, 10);
  const exclusiveEndDate = endStr.slice(0, 10);
  return {
    startDateFrom,
    startDateTo: addDaysToDateOnly(exclusiveEndDate, -1),
  };
}

export function addDaysToDateOnly(dateOnly: string, days: number): string {
  const parsed = new Date(`${dateOnly}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return formatTimelineDateOnly(parsed);
}
