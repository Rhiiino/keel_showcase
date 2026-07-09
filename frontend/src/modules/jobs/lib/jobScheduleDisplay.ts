// keel_web/src/modules/jobs/lib/jobScheduleDisplay.ts

import type { JobRecurrence, JobSchedule } from "../api";
import { formatJobsTimestamp } from "./jobTimeDisplay";

export const RECURRENCE_LABELS: Record<JobRecurrence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  interval: "Every N minutes",
};

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday", shortLabel: "Sun" },
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
];

export function toggleScheduleDay(days: number[], day: number): number[] {
  const selected = new Set(days);
  if (selected.has(day)) {
    selected.delete(day);
  } else {
    selected.add(day);
  }
  return [...selected].sort((left, right) => left - right);
}

export function isWeeklyScheduleValid(daysOfWeek: number[]): boolean {
  return daysOfWeek.length > 0;
}

export const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export type JobScheduleSortColumn = "task" | "schedule" | "next_run" | "runs" | "status";

export const JOB_SCHEDULE_DEFAULT_SORT = {
  column: "task" as const,
  direction: "asc" as const,
};

export function getJobScheduleSortValue(
  schedule: JobSchedule,
  column: JobScheduleSortColumn,
): string | number | boolean {
  switch (column) {
    case "task":
      return schedule.name.toLowerCase();
    case "schedule":
      return schedule.schedule_summary.toLowerCase();
    case "next_run":
      return schedule.next_run_at ? new Date(schedule.next_run_at).getTime() : Number.NEGATIVE_INFINITY;
    case "runs":
      return schedule.run_count ?? 0;
    case "status":
      return schedule.enabled;
    default:
      return "";
  }
}

export function formatScheduleEnabled(enabled: boolean): string {
  return enabled ? "Enabled" : "Disabled";
}

export function formatScheduleNextRun(
  nextRunAt: string | null,
  enabled: boolean,
): string {
  if (!enabled) {
    return "—";
  }
  return formatJobsTimestamp(nextRunAt);
}

export function formatScheduleCountdown(
  nextRunAt: string | null,
  enabled: boolean,
  now: Date = new Date(),
): string | null {
  if (!enabled || !nextRunAt) {
    return null;
  }

  const targetMs = new Date(nextRunAt).getTime();
  if (Number.isNaN(targetMs)) {
    return null;
  }

  const diffMs = targetMs - now.getTime();
  if (diffMs <= 0) {
    return "Due";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTimeValue(value: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number.parseInt(hourPart ?? "0", 10);
  const minute = Number.parseInt(minutePart ?? "0", 10);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 0,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}
