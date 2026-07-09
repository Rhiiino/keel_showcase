// keel_web/src/modules/jobs/lib/jobTaskDisplay.ts

import type { JobTask } from "../api";

export type JobTaskSortColumn = "label" | "queue" | "schedulable";

export const JOB_TASK_DEFAULT_SORT = {
  column: "label" as const,
  direction: "asc" as const,
};

export function formatJobTaskSchedulable(schedulable: boolean): string {
  return schedulable ? "Yes" : "No";
}

export function jobTaskSchedulableClass(schedulable: boolean): string {
  return schedulable
    ? "bg-emerald-950 text-emerald-300"
    : "bg-stone-800 text-stone-400";
}

export function getJobTaskSortValue(task: JobTask, column: JobTaskSortColumn): string | number {
  switch (column) {
    case "label":
      return task.label.toLowerCase();
    case "queue":
      return task.queue;
    case "schedulable":
      return task.schedulable ? 1 : 0;
    default:
      return "";
  }
}

export function buildJobRunsFilterHref(taskName: string): string {
  const params = new URLSearchParams({ task_name: taskName });
  return `/jobs?${params.toString()}`;
}
