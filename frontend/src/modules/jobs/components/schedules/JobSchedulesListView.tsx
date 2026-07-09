// keel_web/src/modules/jobs/components/schedules/JobSchedulesListView.tsx

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { JobSchedule } from "../../api";
import { useTickingNow } from "../../hooks/useTickingNow";
import {
  getJobScheduleSortValue,
  JOB_SCHEDULE_DEFAULT_SORT,
  type JobScheduleSortColumn,
} from "../../lib/jobScheduleDisplay";
import {
  JOB_SCHEDULES_LIST_GRID_CLASS,
  JOB_SCHEDULES_LIST_TABLE_WIDTH_CLASS,
  JobSchedulesListRow,
} from "./JobSchedulesListRow";

const SCHEDULE_COLUMNS: ListColumnDef<JobScheduleSortColumn | "actions">[] = [
  { id: "task", label: "Task" },
  { id: "schedule", label: "Schedule" },
  { id: "next_run", label: "Next run" },
  { id: "runs", label: "Runs" },
  { id: "status", label: "Active" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-1 py-3" },
];

type JobSchedulesListViewProps = {
  schedules: JobSchedule[];
  onRunNow?: (scheduleId: string) => void;
  onToggleEnabled?: (scheduleId: string, enabled: boolean) => void;
  onDelete?: (scheduleId: string) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function JobSchedulesListView({
  schedules,
  onRunNow,
  onToggleEnabled,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
  emptyMessage = "No schedules yet.",
  paginationResetKey,
}: JobSchedulesListViewProps) {
  const now = useTickingNow();

  return (
    <ListView
      items={schedules}
      columns={SCHEDULE_COLUMNS}
      getSortValue={(schedule, column) =>
        column === "actions" ? null : getJobScheduleSortValue(schedule, column)
      }
      defaultSort={JOB_SCHEDULE_DEFAULT_SORT}
      gridClassName={JOB_SCHEDULES_LIST_GRID_CLASS}
      tableWidthClassName={JOB_SCHEDULES_LIST_TABLE_WIDTH_CLASS}
      renderRow={(schedule) => (
        <JobSchedulesListRow
          schedule={schedule}
          now={now}
          onRunNow={onRunNow}
          onToggleEnabled={onToggleEnabled}
          onDelete={onDelete}
          rowDisabled={rowDisabled}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(schedule) => schedule.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
