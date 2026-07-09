// keel_web/src/modules/jobs/components/schedules/ScheduleRunCountCell.tsx

import type { JobSchedule } from "../../api";

type ScheduleRunCountCellProps = {
  schedule: JobSchedule;
};

export function ScheduleRunCountCell({ schedule }: ScheduleRunCountCellProps) {
  const runCount = schedule.run_count ?? 0;
  const hasRuns = runCount > 0;

  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        hasRuns ? "bg-stone-800 text-sky-300" : "bg-stone-900 text-stone-500",
      ].join(" ")}
      title={`${runCount} run${runCount === 1 ? "" : "s"}`}
    >
      {runCount}
    </span>
  );
}
