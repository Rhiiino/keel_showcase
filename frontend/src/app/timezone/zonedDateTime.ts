// keel_web/src/app/timezone/zonedDateTime.ts

// IANA timezone conversions and Intl formatting helpers.

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  const trimmed = timeZone.trim();
  if (!trimmed) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function readZonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(instant);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour === "24" ? "0" : lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

function zonedPartsToUtcMs(parts: ZonedParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

export function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  return zonedPartsToUtcMs(readZonedParts(instant, timeZone)) - instant.getTime();
}

export function zonedWallTimeToUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(utcGuess);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = new Date(utcGuess - getTimeZoneOffsetMs(instant, timeZone));
  }
  return instant;
}

export function parseZonedDateTimeLocal(value: string, timeZone: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) {
    return null;
  }

  const [, yearString, monthString, dayString, hourString = "00", minuteString = "00"] = match;
  return zonedWallTimeToUtcDate(
    Number(yearString),
    Number(monthString),
    Number(dayString),
    Number(hourString),
    Number(minuteString),
    timeZone,
  );
}

export function formatUtcInstantAsZonedDateTimeLocal(instant: Date, timeZone: string): string {
  const parts = readZonedParts(instant, timeZone);
  return [
    parts.year,
    "-",
    padDatePart(parts.month),
    "-",
    padDatePart(parts.day),
    "T",
    padDatePart(parts.hour),
    ":",
    padDatePart(parts.minute),
  ].join("");
}

export function formatUtcInstantInTimeZone(
  instant: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return instant.toLocaleString(undefined, { ...options, timeZone });
}

export function formatDateOnlyPartsInTimeZone(
  year: number,
  month: number,
  day: number,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  const calendarDate = new Date(year, month - 1, day);
  return calendarDate.toLocaleDateString(undefined, options);
}

export function formatTimeZoneOffsetLabel(timeZone: string, at: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  });
  return (
    formatter.formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "UTC"
  );
}

export function formatTimeZoneOptionLabel(timeZone: string, at: Date = new Date()): string {
  const offset = formatTimeZoneOffsetLabel(timeZone, at);
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  return `${offset} · ${city} (${timeZone})`;
}

export function listSupportedTimeZones(): readonly string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return Object.freeze(
      [...Intl.supportedValuesOf("timeZone")].sort((left, right) => left.localeCompare(right)),
    );
  }
  return FALLBACK_TIME_ZONES;
}
