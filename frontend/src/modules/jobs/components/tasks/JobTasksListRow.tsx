// keel_web/src/modules/jobs/components/tasks/JobTasksListRow.tsx

import type { KeyboardEvent } from "react";

import type { JobTask } from "../../api";
import {
  formatJobTaskSchedulable,
  jobTaskSchedulableClass,
} from "../../lib/jobTaskDisplay";

export const JOB_TASKS_LIST_TABLE_WIDTH_CLASS = "w-full";

export const JOB_TASKS_LIST_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1.6fr)_6rem_7rem]";

type JobTasksListRowProps = {
  task: JobTask;
  onRowClick?: (task: JobTask) => void;
};

export function JobTasksListRow({ task, onRowClick }: JobTasksListRowProps) {
  const handleRowClick = () => {
    onRowClick?.(task);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(task);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        JOB_TASKS_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="min-w-0 px-4 py-3.5 align-middle">
        <span className="truncate text-sm font-medium text-stone-100">{task.label}</span>
      </div>

      <div className="px-4 py-3.5 align-middle">
        <span className="text-sm text-stone-300">{task.queue}</span>
      </div>

      <div className="px-4 py-3.5 align-middle">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            jobTaskSchedulableClass(task.schedulable),
          ].join(" ")}
        >
          {formatJobTaskSchedulable(task.schedulable)}
        </span>
      </div>
    </div>
  );
}
