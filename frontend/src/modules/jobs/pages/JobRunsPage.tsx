// keel_web/src/modules/jobs/pages/JobRunsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import { JobRunDetailModal } from "../components/runs/JobRunDetailModal";
import { JobRunsListView } from "../components/runs/JobRunsListView";
import { deleteJobRun, fetchJobRuns, jobsQueryKeys, type JobRun } from "../api";

export function JobRunsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedRun, setSelectedRun] = useState<JobRun | null>(null);

  const runFilters = useMemo(
    () => ({
      task_name: searchParams.get("task_name"),
    }),
    [searchParams],
  );

  const runsQuery = useQuery({
    queryKey: jobsQueryKeys.runs(runFilters),
    queryFn: () => fetchJobRuns(runFilters),
    refetchInterval: 15_000,
  });

  const runs = runsQuery.data ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteJobRun,
    onSuccess: invalidate,
  });

  const actionError = deleteMutation.isError ? deleteMutation.error : null;
  const actionErrorMessage =
    actionError instanceof ApiError
      ? actionError.message
      : actionError instanceof Error
        ? actionError.message
        : null;

  return (
    <ListPageLayout
      title="Runs"
      recordCount={runs.length}
      subtitle="Background task execution history"
    >
      {actionErrorMessage ? (
        <p className="mb-4 text-sm text-red-300">{actionErrorMessage}</p>
      ) : null}

      {runsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading job runs…</p>
      ) : runsQuery.isError ? (
        <p className="text-sm text-red-300">Failed to load job runs.</p>
      ) : (
        <JobRunsListView
          runs={runs}
          onRowClick={setSelectedRun}
          onDelete={(runId) => deleteMutation.mutate(runId)}
          rowDisabled={deleteMutation.isPending}
          deleteDisabled={deleteMutation.isPending}
          paginationResetKey={runs.length}
        />
      )}

      {selectedRun ? (
        <JobRunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      ) : null}
    </ListPageLayout>
  );
}
