// keel_web/src/modules/jobs/components/tasks/JobTasksListView.tsx

import { ListView } from "../../../../views/list/ListView";
import type { JobTask } from "../../api";
import {
  getJobTaskSortValue,
  JOB_TASK_DEFAULT_SORT,
  type JobTaskSortColumn,
} from "../../lib/jobTaskDisplay";
import {
  JOB_TASKS_LIST_GRID_CLASS,
  JOB_TASKS_LIST_TABLE_WIDTH_CLASS,
  JobTasksListRow,
} from "./JobTasksListRow";

const TASK_COLUMNS: Array<{ id: JobTaskSortColumn; label: string }> = [
  { id: "label", label: "Task" },
  { id: "queue", label: "Queue" },
  { id: "schedulable", label: "Schedulable" },
];

type JobTasksListViewProps = {
  tasks: JobTask[];
  onRowClick?: (task: JobTask) => void;
  emptyMessage?: string;
};

export function JobTasksListView({
  tasks,
  onRowClick,
  emptyMessage = "No registered tasks.",
}: JobTasksListViewProps) {
  return (
    <ListView
      items={tasks}
      columns={TASK_COLUMNS}
      getSortValue={(task, column) => getJobTaskSortValue(task, column)}
      defaultSort={JOB_TASK_DEFAULT_SORT}
      gridClassName={JOB_TASKS_LIST_GRID_CLASS}
      tableWidthClassName={JOB_TASKS_LIST_TABLE_WIDTH_CLASS}
      renderRow={(task) => (
        <JobTasksListRow task={task} onRowClick={onRowClick} />
      )}
      getRowKey={(task) => task.task_name}
      emptyMessage={emptyMessage}
      pagination={false}
    />
  );
}
