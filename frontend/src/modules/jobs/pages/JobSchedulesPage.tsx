// keel_web/src/modules/jobs/pages/JobSchedulesPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import {
  deleteJobSchedule,
  fetchJobSchedules,
  jobsQueryKeys,
  runJobScheduleNow,
  updateJobSchedule,
} from "../api";
import { JobSchedulesListView } from "../components/schedules/JobSchedulesListView";

export function JobSchedulesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: jobsQueryKeys.schedules(),
    queryFn: fetchJobSchedules,
    refetchInterval: (query) => {
      const rows = query.state.data;
      return rows?.some((schedule) => schedule.enabled) ? 15_000 : false;
    },
  });

  const schedules = schedulesQuery.data ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ scheduleId, enabled }: { scheduleId: string; enabled: boolean }) =>
      updateJobSchedule(scheduleId, { enabled }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobSchedule,
    onSuccess: invalidate,
  });

  const runNowMutation = useMutation({
    mutationFn: runJobScheduleNow,
    onSuccess: invalidate,
  });

  const formBusy =
    toggleMutation.isPending || deleteMutation.isPending || runNowMutation.isPending;

  const actionError =
    [toggleMutation, deleteMutation, runNowMutation].find((mutation) => mutation.isError)
      ?.error ?? null;

  const actionErrorMessage =
    actionError instanceof ApiError
      ? actionError.message
      : actionError instanceof Error
        ? actionError.message
        : null;

  return (
    <ListPageLayout
      title="Schedules"
      recordCount={schedules.length}
      subtitle="Recurring background tasks"
      actions={
        <IconPlusButton
          ariaLabel="Create schedule"
          disabled={formBusy}
          onClick={() => navigate("/jobs/schedules/new")}
        />
      }
    >
      <RouteNoticeBanner />
      {actionErrorMessage ? (
        <p className="mb-4 text-sm text-red-300">{actionErrorMessage}</p>
      ) : null}

      {schedulesQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading schedules…</p>
      ) : schedulesQuery.isError ? (
        <p className="text-sm text-red-300">Failed to load schedules.</p>
      ) : (
        <JobSchedulesListView
          schedules={schedules}
          onRunNow={(scheduleId) => runNowMutation.mutate(scheduleId)}
          onToggleEnabled={(scheduleId, enabled) =>
            toggleMutation.mutate({ scheduleId, enabled })
          }
          onDelete={(scheduleId) => deleteMutation.mutate(scheduleId)}
          rowDisabled={formBusy}
          deleteDisabled={deleteMutation.isPending}
          paginationResetKey={schedules.length}
        />
      )}
    </ListPageLayout>
  );
}
