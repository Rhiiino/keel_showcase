// keel_web/src/modules/timeline/lib/timelineDateTime.ts

// Timeline event datetime parsing, form values, and all-day detection.

import {
  formatUtcInstantAsZonedDateTimeLocal,
  formatUtcInstantInTimeZone,
  getUserTimezone,
  parseZonedDateTimeLocal,
  readZonedParts,
} from "../../../app/timezone";

const UTC_MIDNIGHT_SUFFIX = /T00:00:00(\.0+)?(Z|[+-]00:00)?$/;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseTimelineDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length === 10) {
    const parsed = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function timelineDateTimeToDateOnly(
  value: string,
  timeZone?: string,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length === 10) {
    return trimmed;
  }
  if (UTC_MIDNIGHT_SUFFIX.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = parseTimelineDateTime(trimmed);
  if (!parsed) {
    return trimmed.slice(0, 10);
  }
  const parts = readZonedParts(parsed, timeZone ?? getUserTimezone());
  return [
    parts.year,
    padDatePart(parts.month),
    padDatePart(parts.day),
  ].join("-");
}

export function formatTimelineDateOnlyLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
  timeZone?: string,
): string {
  const dateOnly = timelineDateTimeToDateOnly(value, timeZone);
  if (!dateOnly) {
    return value;
  }

  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) {
    return dateOnly;
  }

  const calendarDate = new Date(year, month - 1, day);
  return calendarDate.toLocaleDateString(undefined, options);
}

export function formatTimelineInstantLabel(
  value: string,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): string {
  const parsed = parseTimelineDateTime(value);
  if (!parsed) {
    return value;
  }
  return formatUtcInstantInTimeZone(parsed, timeZone ?? getUserTimezone(), options);
}

export function isTimelineUtcMidnight(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.length === 10 || UTC_MIDNIGHT_SUFFIX.test(trimmed);
}

export function isTimelineAllDayEvent(
  startDate: string,
  endDate: string | null,
): boolean {
  if (!isTimelineUtcMidnight(startDate)) {
    return false;
  }
  if (!endDate) {
    return true;
  }
  return isTimelineUtcMidnight(endDate);
}

export function timelineApiToDatetimeLocal(
  value: string,
  timeZone?: string,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const resolvedTimeZone = timeZone ?? getUserTimezone();

  if (trimmed.length === 10 || isTimelineUtcMidnight(trimmed)) {
    return `${timelineDateTimeToDateOnly(trimmed, resolvedTimeZone)}T00:00`;
  }

  const parsed = parseTimelineDateTime(trimmed);
  if (!parsed) {
    return trimmed;
  }

  return formatUtcInstantAsZonedDateTimeLocal(parsed, resolvedTimeZone);
}

export function timelineDatetimeLocalToApi(
  value: string,
  timeZone?: string,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const [datePart, timePart = "00:00"] = trimmed.split("T");
  if (!datePart) {
    return trimmed;
  }

  const normalizedTime = timePart.slice(0, 5);
  if (normalizedTime === "00:00") {
    return `${datePart}T00:00:00Z`;
  }

  const parsed = parseZonedDateTimeLocal(trimmed, timeZone ?? getUserTimezone());
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return trimmed;
  }
  return parsed.toISOString();
}

export function dateToTimelineDatetimeLocal(date: Date, timeZone?: string): string {
  return formatUtcInstantAsZonedDateTimeLocal(date, timeZone ?? getUserTimezone());
}

export function compareTimelineDateTimes(left: string, right: string): number {
  const leftParsed = parseTimelineDateTime(left);
  const rightParsed = parseTimelineDateTime(right);
  if (!leftParsed || !rightParsed) {
    return left.localeCompare(right);
  }
  return leftParsed.getTime() - rightParsed.getTime();
}
