// keel_web/src/modules/jobs/lib/jobRunDisplay.ts

import type { JobRun, JobRunStatus, JobTriggeredBy } from "../api";
import { formatJobsTimestamp } from "./jobTimeDisplay";

const STATUS_LABELS: Record<JobRunStatus, string> = {
  pending: "Pending",
  running: "Running",
  success: "Success",
  failure: "Failure",
  retry: "Retry",
};

const STATUS_CLASS: Record<JobRunStatus, string> = {
  pending: "bg-stone-800 text-stone-300",
  running: "bg-sky-950 text-sky-300",
  success: "bg-emerald-950 text-emerald-300",
  failure: "bg-red-950 text-red-300",
  retry: "bg-amber-950 text-amber-300",
};

const TRIGGER_LABELS: Record<JobTriggeredBy, string> = {
  api: "API",
  beat: "Schedule",
  manual: "Manual",
};

export function formatJobRunStatus(status: JobRunStatus): string {
  return STATUS_LABELS[status];
}

export function jobRunStatusClass(status: JobRunStatus): string {
  return STATUS_CLASS[status];
}

export function formatJobRunTriggeredBy(triggeredBy: JobTriggeredBy): string {
  return TRIGGER_LABELS[triggeredBy];
}

export function formatJobRunTimestamp(value: string | null): string {
  return formatJobsTimestamp(value);
}

export function formatJobRunDuration(
  startedAt: string | null,
  finishedAt: string | null,
): string {
  if (!startedAt) {
    return "—";
  }
  if (!finishedAt) {
    return "In progress";
  }

  const durationMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  if (durationMs < 1000) {
    return "< 1s";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export type JobRunSortColumn =
  | "status"
  | "task"
  | "trigger"
  | "queue"
  | "created"
  | "started"
  | "finished";

export const JOB_RUN_DEFAULT_SORT = {
  column: "created" as const,
  direction: "desc" as const,
};

export function getJobRunSortValue(run: JobRun, column: JobRunSortColumn): string | number {
  switch (column) {
    case "status":
      return run.status;
    case "task":
      return run.task_label.toLowerCase();
    case "trigger":
      return run.triggered_by;
    case "queue":
      return run.queue;
    case "created":
      return new Date(run.created_at).getTime();
    case "started":
      return run.started_at ? new Date(run.started_at).getTime() : Number.NEGATIVE_INFINITY;
    case "finished":
      return run.finished_at ? new Date(run.finished_at).getTime() : Number.NEGATIVE_INFINITY;
    default:
      return "";
  }
}
