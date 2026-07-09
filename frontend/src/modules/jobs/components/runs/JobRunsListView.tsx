// keel_web/src/modules/jobs/components/runs/JobRunsListView.tsx

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { JobRun } from "../../api";
import {
  getJobRunSortValue,
  JOB_RUN_DEFAULT_SORT,
  type JobRunSortColumn,
} from "../../lib/jobRunDisplay";
import {
  JOB_RUNS_LIST_GRID_CLASS,
  JOB_RUNS_LIST_TABLE_WIDTH_CLASS,
  JobRunsListRow,
} from "./JobRunsListRow";

const RUN_COLUMNS: ListColumnDef<JobRunSortColumn | "actions">[] = [
  { id: "status", label: "Status" },
  { id: "task", label: "Task" },
  { id: "trigger", label: "Trigger" },
  { id: "queue", label: "Queue" },
  { id: "created", label: "Created" },
  { id: "started", label: "Started" },
  { id: "finished", label: "Finished" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-1 py-3" },
];

type JobRunsListViewProps = {
  runs: JobRun[];
  onRowClick?: (run: JobRun) => void;
  onDelete?: (runId: string) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function JobRunsListView({
  runs,
  onRowClick,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
  emptyMessage = "No job runs yet.",
  paginationResetKey,
}: JobRunsListViewProps) {
  return (
    <ListView
      items={runs}
      columns={RUN_COLUMNS}
      getSortValue={(run, column) =>
        column === "actions" ? null : getJobRunSortValue(run, column)
      }
      defaultSort={JOB_RUN_DEFAULT_SORT}
      gridClassName={JOB_RUNS_LIST_GRID_CLASS}
      tableWidthClassName={JOB_RUNS_LIST_TABLE_WIDTH_CLASS}
      renderRow={(run) => (
        <JobRunsListRow
          run={run}
          onRowClick={onRowClick}
          onDelete={onDelete}
          rowDisabled={rowDisabled}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(run) => run.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
