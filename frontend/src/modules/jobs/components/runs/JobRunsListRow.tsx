// keel_web/src/modules/jobs/components/runs/JobRunsListRow.tsx

import type { MouseEvent } from "react";

import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { JobRun } from "../../api";
import {
  formatJobRunStatus,
  formatJobRunTimestamp,
  formatJobRunTriggeredBy,
  jobRunStatusClass,
} from "../../lib/jobRunDisplay";

export const JOB_RUNS_LIST_TABLE_WIDTH_CLASS = "w-full";

export const JOB_RUNS_LIST_GRID_CLASS =
  "grid w-full grid-cols-[7rem_minmax(0,1.4fr)_5.5rem_5.5rem_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_2.75rem]";

type JobRunsListRowProps = {
  run: JobRun;
  onRowClick?: (run: JobRun) => void;
  onDelete?: (runId: string) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function JobRunsListRow({
  run,
  onRowClick,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
}: JobRunsListRowProps) {
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(run.id);

  const menuItems = [
    {
      id: "delete",
      label: confirmPending ? "Confirm delete" : "Delete",
      tone: "danger" as const,
      onSelect: () => {
        if (confirmPending) {
          handleClick(() => onDelete?.(run.id));
          return;
        }
        handleClick(() => onDelete?.(run.id));
        return false;
      },
      disabled: rowDisabled || deleteDisabled || !onDelete,
    },
  ];

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    onRowClick?.(run);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        JOB_RUNS_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-3.5 align-middle">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            jobRunStatusClass(run.status),
          ].join(" ")}
        >
          {formatJobRunStatus(run.status)}
        </span>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="truncate text-sm font-medium text-stone-100" title={run.task_name}>
          {run.task_label}
        </p>
        {run.schedule_name ? (
          <p className="truncate text-xs text-stone-500" title={run.schedule_name}>
            {run.schedule_name}
          </p>
        ) : null}
      </div>

      <div className="px-4 py-3.5 align-middle">
        <p className="text-sm text-stone-300">{formatJobRunTriggeredBy(run.triggered_by)}</p>
      </div>

      <div className="px-4 py-3.5 align-middle">
        <p className="text-sm text-stone-300">{run.queue}</p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p
          className="truncate text-sm text-stone-300"
          title={formatJobRunTimestamp(run.created_at)}
        >
          {formatJobRunTimestamp(run.created_at)}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p
          className="truncate text-sm text-stone-300"
          title={formatJobRunTimestamp(run.started_at)}
        >
          {formatJobRunTimestamp(run.started_at)}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p
          className="truncate text-sm text-stone-300"
          title={formatJobRunTimestamp(run.finished_at)}
        >
          {formatJobRunTimestamp(run.finished_at)}
        </p>
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-10 flex shrink-0 items-center justify-center px-1 py-3.5"
      >
        <CardMenu
          ariaLabel={`Run options for ${run.task_label}`}
          disabled={rowDisabled}
          items={menuItems}
        />
      </div>
    </div>
  );
}
