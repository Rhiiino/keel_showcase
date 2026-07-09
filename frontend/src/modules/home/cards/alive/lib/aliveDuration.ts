// keel_web/src/modules/home/cards/alive/lib/aliveDuration.ts

// Elapsed-time math for the home alive-timer card.

import type { AliveTimerDisplayMode } from "./aliveTimerDisplayModes";

export type CalendarAliveParts = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type RemainderAliveParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type AliveTimerDisplay =
  | { mode: "calendar"; parts: CalendarAliveParts }
  | { mode: "seconds"; totalSeconds: number }
  | { mode: "days"; totalDays: number; remainder: RemainderAliveParts };

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

export function parseBirthDateMs(birthDate: string): number | null {
  const parsed = new Date(`${birthDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function decomposeCalendarBetween(fromMs: number, toMs: number): CalendarAliveParts {
  const from = new Date(fromMs);
  const to = new Date(toMs);

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  let hours = to.getHours() - from.getHours();
  let minutes = to.getMinutes() - from.getMinutes();
  let seconds = to.getSeconds() - from.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const daysInPrevMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days, hours, minutes, seconds };
}

export function decomposeRemainder(elapsedMs: number): RemainderAliveParts {
  const remainderMs = ((elapsedMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  const hours = Math.floor(remainderMs / MS_PER_HOUR);
  const minutes = Math.floor((remainderMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((remainderMs % MS_PER_MINUTE) / MS_PER_SECOND);
  return { hours, minutes, seconds };
}

export function formatAliveDisplay(
  mode: AliveTimerDisplayMode,
  birthMs: number,
  nowMs: number,
): AliveTimerDisplay {
  const elapsedMs = Math.max(0, nowMs - birthMs);

  if (mode === "calendar") {
    return {
      mode,
      parts: decomposeCalendarBetween(birthMs, nowMs),
    };
  }

  if (mode === "seconds") {
    return {
      mode,
      totalSeconds: Math.floor(elapsedMs / MS_PER_SECOND),
    };
  }

  return {
    mode,
    totalDays: Math.floor(elapsedMs / MS_PER_DAY),
    remainder: decomposeRemainder(elapsedMs),
  };
}

export function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatRemainderClock(remainder: RemainderAliveParts): string {
  return `${padTwo(remainder.hours)}:${padTwo(remainder.minutes)}:${padTwo(remainder.seconds)}`;
}
