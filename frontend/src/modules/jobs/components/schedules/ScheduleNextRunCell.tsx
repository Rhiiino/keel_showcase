// keel_web/src/modules/jobs/components/schedules/ScheduleNextRunCell.tsx

import type { JobSchedule } from "../../api";
import { formatScheduleCountdown, formatScheduleNextRun } from "../../lib/jobScheduleDisplay";

type ScheduleNextRunCellProps = {
  schedule: JobSchedule;
  now: Date;
};

export function ScheduleNextRunCell({ schedule, now }: ScheduleNextRunCellProps) {
  const nextRunLabel = formatScheduleNextRun(schedule.next_run_at, schedule.enabled);
  const countdownLabel = formatScheduleCountdown(schedule.next_run_at, schedule.enabled, now);
  const isDue = countdownLabel === "Due";

  return (
    <div className="flex min-w-0 items-center gap-2">
      {countdownLabel ? (
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            isDue ? "bg-amber-950 text-amber-300" : "bg-stone-800 text-sky-300",
          ].join(" ")}
        >
          {countdownLabel}
        </span>
      ) : null}
      <p className="truncate text-sm text-stone-300" title={nextRunLabel}>
        {nextRunLabel}
      </p>
    </div>
  );
}
