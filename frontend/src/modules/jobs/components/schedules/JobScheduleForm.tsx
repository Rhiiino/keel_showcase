// keel_web/src/modules/jobs/components/schedules/JobScheduleForm.tsx

import { ToggleSwitch } from "../../../../components/ToggleSwitch";
import type { JobRecurrence, JobSchedule, JobScheduleCreatePayload, SchedulableTaskOption } from "../../api";
import {
  DAY_OF_WEEK_OPTIONS,
  MONTH_OPTIONS,
  RECURRENCE_LABELS,
  formatTimeValue,
  isWeeklyScheduleValid,
  parseTimeValue,
  toggleScheduleDay,
} from "../../lib/jobScheduleDisplay";
import { JOBS_DISPLAY_TIMEZONE } from "../../lib/jobTimeDisplay";

export type JobScheduleFormValues = {
  name: string;
  task_name: string;
  enabled: boolean;
  queue: string;
  recurrence: JobRecurrence;
  time: string;
  days_of_week: number[];
  day_of_month: number;
  month_of_year: number;
  interval_minutes: number;
};

type JobScheduleFormProps = {
  values: JobScheduleFormValues;
  taskOptions: SchedulableTaskOption[];
  disabled?: boolean;
  onChange: (values: JobScheduleFormValues) => void;
};

export function emptyScheduleFormValues(
  taskOptions: SchedulableTaskOption[],
): JobScheduleFormValues {
  return {
    name: "",
    task_name: taskOptions[0]?.task_name ?? "",
    enabled: true,
    queue: "default",
    recurrence: "daily",
    time: "03:00",
    days_of_week: [1],
    day_of_month: 1,
    month_of_year: 1,
    interval_minutes: 5,
  };
}

export function scheduleToFormValues(schedule: JobSchedule): JobScheduleFormValues {
  return {
    name: schedule.name,
    task_name: schedule.task_name,
    enabled: schedule.enabled,
    queue: schedule.queue,
    recurrence: schedule.recurrence,
    time: formatTimeValue(schedule.hour, schedule.minute),
    days_of_week: schedule.days_of_week?.length ? schedule.days_of_week : [1],
    day_of_month: schedule.day_of_month ?? 1,
    month_of_year: schedule.month_of_year ?? 1,
    interval_minutes: schedule.interval_minutes ?? 5,
  };
}

export function formValuesEqual(
  left: JobScheduleFormValues,
  right: JobScheduleFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.task_name === right.task_name &&
    left.enabled === right.enabled &&
    left.queue === right.queue &&
    left.recurrence === right.recurrence &&
    left.time === right.time &&
    left.day_of_month === right.day_of_month &&
    left.month_of_year === right.month_of_year &&
    left.interval_minutes === right.interval_minutes &&
    left.days_of_week.join(",") === right.days_of_week.join(",")
  );
}

export function isJobScheduleFormValid(values: JobScheduleFormValues): boolean {
  const weeklyScheduleValid =
    values.recurrence !== "weekly" || isWeeklyScheduleValid(values.days_of_week);
  const intervalValid =
    values.recurrence !== "interval" ||
    (Number.isFinite(values.interval_minutes) &&
      values.interval_minutes >= 1 &&
      values.interval_minutes <= 1440);
  return Boolean(
    values.name.trim() && values.task_name && weeklyScheduleValid && intervalValid,
  );
}

export function formValuesToPayload(values: JobScheduleFormValues): JobScheduleCreatePayload {
  const { hour, minute } = parseTimeValue(values.time);
  return {
    name: values.name.trim(),
    task_name: values.task_name,
    enabled: values.enabled,
    queue: values.queue,
    recurrence: values.recurrence,
    minute: values.recurrence === "interval" ? 0 : minute,
    hour: values.recurrence === "interval" ? 0 : hour,
    days_of_week:
      values.recurrence === "weekly" && values.days_of_week.length > 0
        ? values.days_of_week
        : null,
    day_of_month:
      values.recurrence === "monthly" || values.recurrence === "yearly"
        ? values.day_of_month
        : null,
    month_of_year: values.recurrence === "yearly" ? values.month_of_year : null,
    interval_minutes: values.recurrence === "interval" ? values.interval_minutes : null,
    timezone: JOBS_DISPLAY_TIMEZONE,
  };
}

const inputClass =
  "w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none focus:border-stone-500";

export function JobScheduleForm({
  values,
  taskOptions,
  disabled = false,
  onChange,
}: JobScheduleFormProps) {
  const update = (patch: Partial<JobScheduleFormValues>) => {
    onChange({ ...values, ...patch });
  };

  const weeklyScheduleValid =
    values.recurrence !== "weekly" || isWeeklyScheduleValid(values.days_of_week);

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-stone-300">
          Name
          <input
            className={inputClass}
            value={values.name}
            disabled={disabled}
            onChange={(event) => update({ name: event.target.value })}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm text-stone-300">
          Task
          <select
            className={inputClass}
            value={values.task_name}
            disabled={disabled}
            onChange={(event) => update({ task_name: event.target.value })}
          >
            {taskOptions.map((option) => (
              <option key={option.task_name} value={option.task_name}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm text-stone-300">
          Recurrence
          <select
            className={inputClass}
            value={values.recurrence}
            disabled={disabled}
            onChange={(event) => update({ recurrence: event.target.value as JobRecurrence })}
          >
            {(Object.keys(RECURRENCE_LABELS) as JobRecurrence[]).map((recurrence) => (
              <option key={recurrence} value={recurrence}>
                {RECURRENCE_LABELS[recurrence]}
              </option>
            ))}
          </select>
        </label>

        {values.recurrence === "interval" ? (
          <label className="grid gap-1.5 text-sm text-stone-300">
            Interval (minutes)
            <input
              type="number"
              min={1}
              max={1440}
              className={inputClass}
              value={values.interval_minutes}
              disabled={disabled}
              onChange={(event) => update({ interval_minutes: Number(event.target.value) })}
              required
            />
          </label>
        ) : (
          <label className="grid gap-1.5 text-sm text-stone-300">
            Time (ET)
            <input
              type="time"
              className={inputClass}
              value={values.time}
              disabled={disabled}
              onChange={(event) => update({ time: event.target.value })}
              required
            />
          </label>
        )}

        {values.recurrence === "weekly" ? (
          <div className="grid gap-1.5 text-sm text-stone-300 md:col-span-2">
            <span>Days of week</span>
            <div className="flex flex-wrap gap-2">
              {DAY_OF_WEEK_OPTIONS.map((option) => {
                const selected = values.days_of_week.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => {
                      const next = toggleScheduleDay(values.days_of_week, option.value);
                      if (next.length === 0) {
                        return;
                      }
                      update({ days_of_week: next });
                    }}
                    className={[
                      "rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition",
                      selected
                        ? "bg-stone-100 text-stone-950 ring-stone-100"
                        : "bg-stone-950 text-stone-300 ring-stone-700 hover:bg-stone-900",
                      disabled ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    {option.shortLabel}
                  </button>
                );
              })}
            </div>
            {!weeklyScheduleValid ? (
              <p className="text-xs text-red-300">Select at least one day.</p>
            ) : null}
          </div>
        ) : null}

        {values.recurrence === "monthly" || values.recurrence === "yearly" ? (
          <label className="grid gap-1.5 text-sm text-stone-300">
            Day of month
            <input
              type="number"
              min={1}
              max={31}
              className={inputClass}
              value={values.day_of_month}
              disabled={disabled}
              onChange={(event) => update({ day_of_month: Number(event.target.value) })}
            />
          </label>
        ) : null}

        {values.recurrence === "yearly" ? (
          <label className="grid gap-1.5 text-sm text-stone-300">
            Month
            <select
              className={inputClass}
              value={values.month_of_year}
              disabled={disabled}
              onChange={(event) => update({ month_of_year: Number(event.target.value) })}
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid gap-1.5 text-sm text-stone-300">
          Queue
          <select
            className={inputClass}
            value={values.queue}
            disabled={disabled}
            onChange={(event) => update({ queue: event.target.value })}
          >
            <option value="default">default</option>
            <option value="heavy">heavy</option>
          </select>
        </label>

        <div className="flex items-center gap-3 self-end text-sm text-stone-300">
          <ToggleSwitch
            checked={values.enabled}
            disabled={disabled}
            ariaLabel="Schedule enabled"
            onChange={(enabled) => update({ enabled })}
          />
          <span>{values.enabled ? "Enabled" : "Disabled"}</span>
        </div>
      </div>
    </div>
  );
}
