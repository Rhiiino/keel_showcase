// keel_web/src/modules/jobs/api.ts

import { apiFetch } from "../../lib/api";

const credentials: RequestCredentials = "include";

export type JobRunStatus = "pending" | "running" | "success" | "failure" | "retry";
export type JobTriggeredBy = "api" | "beat" | "manual";
export type JobRecurrence = "daily" | "weekly" | "monthly" | "yearly" | "interval";

export type JobRun = {
  id: string;
  celery_task_id: string;
  task_name: string;
  task_label: string;
  queue: string;
  status: JobRunStatus;
  triggered_by: JobTriggeredBy;
  user_id: number | null;
  schedule_id: string | null;
  schedule_name: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type JobSchedule = {
  id: string;
  name: string;
  task_name: string;
  task_label: string;
  enabled: boolean;
  queue: string;
  recurrence: JobRecurrence;
  minute: number;
  hour: number;
  days_of_week: number[] | null;
  day_of_month: number | null;
  month_of_year: number | null;
  interval_minutes: number | null;
  timezone: string;
  task_kwargs: Record<string, unknown>;
  schedule_summary: string;
  next_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
};

export type SchedulableTaskOption = {
  task_name: string;
  label: string;
};

export type JobTaskKwargSpec = {
  name: string;
  type: string;
  default: string | null;
  description: string | null;
};

export type JobTask = {
  task_name: string;
  label: string;
  description: string;
  queue: string;
  schedulable: boolean;
  kwargs: JobTaskKwargSpec[];
};

export type JobRunListFilters = {
  status?: JobRunStatus | null;
  task_name?: string | null;
  schedule_id?: string | null;
  triggered_by?: JobTriggeredBy | null;
};

export type JobScheduleCreatePayload = {
  name: string;
  task_name: string;
  enabled?: boolean;
  queue?: string;
  recurrence: JobRecurrence;
  minute: number;
  hour: number;
  days_of_week?: number[] | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  interval_minutes?: number | null;
  timezone?: string;
  task_kwargs?: Record<string, unknown>;
};

export type JobScheduleUpdatePayload = Partial<JobScheduleCreatePayload>;

export const jobsQueryKeys = {
  all: ["jobs"] as const,
  runs: (filters?: JobRunListFilters) => [...jobsQueryKeys.all, "runs", filters ?? {}] as const,
  run: (runId: string) => [...jobsQueryKeys.all, "runs", runId] as const,
  schedules: () => [...jobsQueryKeys.all, "schedules"] as const,
  schedule: (scheduleId: string) => [...jobsQueryKeys.all, "schedules", scheduleId] as const,
  taskOptions: () => [...jobsQueryKeys.all, "task-options"] as const,
  tasks: () => [...jobsQueryKeys.all, "tasks"] as const,
};

export async function fetchJobRuns(filters?: JobRunListFilters): Promise<JobRun[]> {
  const params = new URLSearchParams();
  if (filters?.status) {
    params.set("status", filters.status);
  }
  if (filters?.task_name?.trim()) {
    params.set("task_name", filters.task_name.trim());
  }
  if (filters?.schedule_id?.trim()) {
    params.set("schedule_id", filters.schedule_id.trim());
  }
  if (filters?.triggered_by) {
    params.set("triggered_by", filters.triggered_by);
  }
  const query = params.toString();
  return apiFetch<JobRun[]>(`/jobs/runs${query ? `?${query}` : ""}`, { credentials });
}

export async function fetchJobRun(runId: string): Promise<JobRun> {
  return apiFetch<JobRun>(`/jobs/runs/${runId}`, { credentials });
}

export async function deleteJobRun(runId: string): Promise<void> {
  await apiFetch<void>(`/jobs/runs/${runId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchJobSchedules(): Promise<JobSchedule[]> {
  return apiFetch<JobSchedule[]>("/jobs/schedules", { credentials });
}

export async function fetchJobSchedule(scheduleId: string): Promise<JobSchedule> {
  return apiFetch<JobSchedule>(`/jobs/schedules/${scheduleId}`, { credentials });
}

export async function fetchSchedulableTaskOptions(): Promise<SchedulableTaskOption[]> {
  return apiFetch<SchedulableTaskOption[]>("/jobs/schedules/task-options", { credentials });
}

export async function fetchJobTasks(): Promise<JobTask[]> {
  return apiFetch<JobTask[]>("/jobs/tasks", { credentials });
}

export async function createJobSchedule(payload: JobScheduleCreatePayload): Promise<JobSchedule> {
  return apiFetch<JobSchedule>("/jobs/schedules", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateJobSchedule(
  scheduleId: string,
  payload: JobScheduleUpdatePayload,
): Promise<JobSchedule> {
  return apiFetch<JobSchedule>(`/jobs/schedules/${scheduleId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteJobSchedule(scheduleId: string): Promise<void> {
  await apiFetch<void>(`/jobs/schedules/${scheduleId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function runJobScheduleNow(scheduleId: string): Promise<JobRun> {
  return apiFetch<JobRun>(`/jobs/schedules/${scheduleId}/run`, {
    method: "POST",
    credentials,
  });
}
