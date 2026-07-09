// keel_web/src/modules/home/cards/alive/lib/aliveTargetDuration.ts

// Target-to-timestamp and countdown math for the home alive-timer card.

import {
  decomposeCalendarBetween,
  decomposeRemainder,
  formatAliveDisplay,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_SECOND,
  type AliveTimerDisplay,
} from "./aliveDuration";
import type { AliveTimerDisplayMode } from "./aliveTimerDisplayModes";
import type {
  AliveTimerCalendarTarget,
  AliveTimerDaysTarget,
  AliveTimerSecondsTarget,
  AliveTimerTarget,
} from "./aliveTimerTargets";

export type AliveTimerCountdownDisplay = AliveTimerDisplay;

function calendarTargetToTimestamp(
  birthMs: number,
  target: AliveTimerCalendarTarget,
): number {
  const birth = new Date(birthMs);
  return new Date(
    birth.getFullYear() + target.years,
    birth.getMonth() + target.months,
    birth.getDate() + target.days,
    birth.getHours() + target.hours,
    birth.getMinutes() + target.minutes,
    birth.getSeconds() + target.seconds,
  ).getTime();
}

function daysTargetToElapsedMs(target: AliveTimerDaysTarget): number {
  return (
    target.totalDays * MS_PER_DAY
    + target.remainder.hours * MS_PER_HOUR
    + target.remainder.minutes * MS_PER_MINUTE
    + target.remainder.seconds * MS_PER_SECOND
  );
}

function secondsTargetToElapsedMs(target: AliveTimerSecondsTarget): number {
  return target.totalSeconds * MS_PER_SECOND;
}

export function aliveTargetToTimestampMs(
  birthMs: number,
  mode: AliveTimerDisplayMode,
  target: AliveTimerTarget,
): number {
  if (target == null) {
    return birthMs;
  }

  if (mode === "calendar") {
    return calendarTargetToTimestamp(birthMs, target as AliveTimerCalendarTarget);
  }

  if (mode === "seconds") {
    return birthMs + secondsTargetToElapsedMs(target as AliveTimerSecondsTarget);
  }

  return birthMs + daysTargetToElapsedMs(target as AliveTimerDaysTarget);
}

export function isAliveTargetGreaterThanCurrent(
  birthMs: number,
  nowMs: number,
  mode: AliveTimerDisplayMode,
  target: AliveTimerTarget,
): boolean {
  if (target == null) {
    return false;
  }

  const targetMs = aliveTargetToTimestampMs(birthMs, mode, target);
  return targetMs > nowMs;
}

export function isAliveTargetReached(
  birthMs: number,
  nowMs: number,
  mode: AliveTimerDisplayMode,
  target: AliveTimerTarget,
): boolean {
  if (target == null) {
    return false;
  }

  const targetMs = aliveTargetToTimestampMs(birthMs, mode, target);
  return nowMs >= targetMs;
}

export function formatAliveCountdownDisplay(
  mode: AliveTimerDisplayMode,
  birthMs: number,
  nowMs: number,
  target: AliveTimerTarget,
): AliveTimerCountdownDisplay | null {
  if (target == null) {
    return null;
  }

  const targetMs = aliveTargetToTimestampMs(birthMs, mode, target);
  const remainingMs = targetMs - nowMs;
  if (remainingMs <= 0) {
    return null;
  }

  if (mode === "calendar") {
    return {
      mode,
      parts: decomposeCalendarBetween(nowMs, targetMs),
    };
  }

  if (mode === "seconds") {
    return {
      mode,
      totalSeconds: Math.floor(remainingMs / MS_PER_SECOND),
    };
  }

  return {
    mode,
    totalDays: Math.floor(remainingMs / MS_PER_DAY),
    remainder: decomposeRemainder(remainingMs),
  };
}

export function formatAliveTargetReachDateTime(targetMs: number): string {
  return new Date(targetMs).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getCurrentAliveValueForMode(
  mode: AliveTimerDisplayMode,
  birthMs: number,
  nowMs: number,
): AliveTimerDisplay {
  return formatAliveDisplay(mode, birthMs, nowMs);
}
