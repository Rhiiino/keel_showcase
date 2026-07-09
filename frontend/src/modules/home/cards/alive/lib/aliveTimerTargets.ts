// keel_web/src/modules/home/cards/alive/lib/aliveTimerTargets.ts

// Per-mode alive-timer target storage for the home card.

import type {
  CalendarAliveParts,
  RemainderAliveParts,
} from "./aliveDuration";
import type { AliveTimerDisplayMode } from "./aliveTimerDisplayModes";

export type AliveTimerCalendarTarget = CalendarAliveParts;

export type AliveTimerSecondsTarget = {
  totalSeconds: number;
};

export type AliveTimerDaysTarget = {
  totalDays: number;
  remainder: RemainderAliveParts;
};

export type AliveTimerTargetByMode = {
  calendar: AliveTimerCalendarTarget | null;
  seconds: AliveTimerSecondsTarget | null;
  days: AliveTimerDaysTarget | null;
};

export type AliveTimerTarget = AliveTimerTargetByMode[AliveTimerDisplayMode];

const STORAGE_KEY = "home-alive-timer-targets";

const EMPTY_TARGETS: AliveTimerTargetByMode = {
  calendar: null,
  seconds: null,
  days: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.trunc(value);
  return rounded >= 0 ? rounded : null;
}

function parseRemainder(value: unknown): RemainderAliveParts | null {
  if (!isRecord(value)) {
    return null;
  }
  const hours = parseNonNegativeInt(value.hours);
  const minutes = parseNonNegativeInt(value.minutes);
  const seconds = parseNonNegativeInt(value.seconds);
  if (hours == null || minutes == null || seconds == null) {
    return null;
  }
  if (minutes > 59 || seconds > 59 || hours > 23) {
    return null;
  }
  return { hours, minutes, seconds };
}

function parseCalendarTarget(value: unknown): AliveTimerCalendarTarget | null {
  if (!isRecord(value)) {
    return null;
  }
  const years = parseNonNegativeInt(value.years);
  const months = parseNonNegativeInt(value.months);
  const days = parseNonNegativeInt(value.days);
  const hours = parseNonNegativeInt(value.hours);
  const minutes = parseNonNegativeInt(value.minutes);
  const seconds = parseNonNegativeInt(value.seconds);
  if (
    years == null
    || months == null
    || days == null
    || hours == null
    || minutes == null
    || seconds == null
  ) {
    return null;
  }
  if (months > 11 || days > 31 || hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }
  return { years, months, days, hours, minutes, seconds };
}

function parseSecondsTarget(value: unknown): AliveTimerSecondsTarget | null {
  if (!isRecord(value)) {
    return null;
  }
  const totalSeconds = parseNonNegativeInt(value.totalSeconds);
  if (totalSeconds == null || totalSeconds <= 0) {
    return null;
  }
  return { totalSeconds };
}

function parseDaysTarget(value: unknown): AliveTimerDaysTarget | null {
  if (!isRecord(value)) {
    return null;
  }
  const totalDays = parseNonNegativeInt(value.totalDays);
  const remainder = parseRemainder(value.remainder);
  if (totalDays == null || remainder == null) {
    return null;
  }
  if (totalDays <= 0 && remainder.hours === 0 && remainder.minutes === 0 && remainder.seconds === 0) {
    return null;
  }
  return { totalDays, remainder };
}

function parseStoredTargets(raw: unknown): AliveTimerTargetByMode {
  if (!isRecord(raw)) {
    return { ...EMPTY_TARGETS };
  }

  return {
    calendar: parseCalendarTarget(raw.calendar),
    seconds: parseSecondsTarget(raw.seconds),
    days: parseDaysTarget(raw.days),
  };
}

export function readStoredAliveTimerTargets(): AliveTimerTargetByMode {
  if (typeof window === "undefined") {
    return { ...EMPTY_TARGETS };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { ...EMPTY_TARGETS };
  }

  try {
    return parseStoredTargets(JSON.parse(stored));
  } catch {
    return { ...EMPTY_TARGETS };
  }
}

export function writeStoredAliveTimerTargets(targets: AliveTimerTargetByMode): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: Partial<Record<AliveTimerDisplayMode, AliveTimerTarget>> = {};
  for (const mode of ["calendar", "seconds", "days"] as const) {
    if (targets[mode] != null) {
      payload[mode] = targets[mode];
    }
  }

  if (Object.keys(payload).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredAliveTimerTarget(mode: AliveTimerDisplayMode): AliveTimerTargetByMode {
  const next = {
    ...readStoredAliveTimerTargets(),
    [mode]: null,
  };
  writeStoredAliveTimerTargets(next);
  return next;
}
