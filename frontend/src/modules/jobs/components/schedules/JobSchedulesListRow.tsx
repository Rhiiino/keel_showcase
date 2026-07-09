// keel_web/src/modules/jobs/components/schedules/JobSchedulesListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ToggleSwitch } from "../../../../components/ToggleSwitch";
import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { JobSchedule } from "../../api";
import { formatScheduleEnabled } from "../../lib/jobScheduleDisplay";
import { ScheduleNextRunCell } from "./ScheduleNextRunCell";
import { ScheduleRunCountCell } from "./ScheduleRunCountCell";

export const JOB_SCHEDULES_LIST_TABLE_WIDTH_CLASS = "w-full";

export const JOB_SCHEDULES_LIST_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(12rem,1.2fr)_4rem_4.5rem_2.75rem]";

type JobSchedulesListRowProps = {
  schedule: JobSchedule;
  now: Date;
  onRunNow?: (scheduleId: string) => void;
  onToggleEnabled?: (scheduleId: string, enabled: boolean) => void;
  onDelete?: (scheduleId: string) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function JobSchedulesListRow({
  schedule,
  now,
  onRunNow,
  onToggleEnabled,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
}: JobSchedulesListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(schedule.id);

  const menuItems = [
    {
      id: "run-now",
      label: "Run now",
      onSelect: () => onRunNow?.(schedule.id),
      disabled: rowDisabled || !onRunNow,
    },
    {
      id: "delete",
      label: confirmPending ? "Confirm delete" : "Delete",
      tone: "danger" as const,
      onSelect: () => {
        if (confirmPending) {
          handleClick(() => onDelete?.(schedule.id));
          return;
        }
        handleClick(() => onDelete?.(schedule.id));
        return false;
      },
      disabled: rowDisabled || deleteDisabled || !onDelete,
    },
  ];

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(`/jobs/schedules/${schedule.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        JOB_SCHEDULES_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="truncate text-sm font-medium text-stone-100" title={schedule.name}>
          {schedule.name}
        </p>
        <p className="truncate text-xs text-stone-500" title={schedule.task_name}>
          {schedule.task_label}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="truncate text-sm text-stone-300" title={schedule.schedule_summary}>
          {schedule.schedule_summary}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <ScheduleNextRunCell schedule={schedule} now={now} />
      </div>

      <div className="flex items-center px-4 py-3.5 align-middle">
        <ScheduleRunCountCell schedule={schedule} />
      </div>

      <div className="flex items-center px-4 py-3.5 align-middle" data-no-row-nav>
        <ToggleSwitch
          checked={schedule.enabled}
          disabled={rowDisabled || !onToggleEnabled}
          ariaLabel={`${formatScheduleEnabled(schedule.enabled)} — ${schedule.name}`}
          onChange={(enabled) => onToggleEnabled?.(schedule.id, enabled)}
        />
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-10 flex shrink-0 items-center justify-center px-1 py-3.5"
      >
        <CardMenu
          ariaLabel={`Schedule options for ${schedule.name}`}
          disabled={rowDisabled}
          items={menuItems}
        />
      </div>
    </div>
  );
}
