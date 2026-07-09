// keel_web/src/modules/jobs/pages/JobTasksPage.tsx

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { JobTaskDetailModal } from "../components/tasks/JobTaskDetailModal";
import { JobTasksListView } from "../components/tasks/JobTasksListView";
import { fetchJobTasks, jobsQueryKeys, type JobTask } from "../api";

export function JobTasksPage() {
  const [selectedTask, setSelectedTask] = useState<JobTask | null>(null);

  const tasksQuery = useQuery({
    queryKey: jobsQueryKeys.tasks(),
    queryFn: fetchJobTasks,
  });

  const tasks = tasksQuery.data ?? [];

  return (
    <ListPageLayout
      title="Tasks"
      recordCount={tasks.length}
      subtitle="Registered background tasks"
    >
      {tasksQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading tasks…</p>
      ) : tasksQuery.isError ? (
        <p className="text-sm text-red-300">Failed to load tasks.</p>
      ) : (
        <JobTasksListView tasks={tasks} onRowClick={setSelectedTask} />
      )}

      {selectedTask ? (
        <JobTaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      ) : null}
    </ListPageLayout>
  );
}
