// keel_web/src/modules/jobs/pages/JobScheduleFormPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { JobRunDetailModal } from "../components/runs/JobRunDetailModal";
import { JobRunsListView } from "../components/runs/JobRunsListView";
import {
  JobScheduleForm,
  emptyScheduleFormValues,
  formValuesEqual,
  formValuesToPayload,
  isJobScheduleFormValid,
  scheduleToFormValues,
  type JobScheduleFormValues,
} from "../components/schedules/JobScheduleForm";
import { FormPageLayout } from "../../../views";
import {
  createJobSchedule,
  deleteJobRun,
  fetchJobRuns,
  fetchJobSchedule,
  fetchSchedulableTaskOptions,
  jobsQueryKeys,
  runJobScheduleNow,
  updateJobSchedule,
  type JobRun,
} from "../api";

const headerOutlineButtonClass =
  "rounded-md px-3 py-1.5 text-xs font-medium transition text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200 disabled:cursor-not-allowed disabled:text-stone-600";

export function JobScheduleFormPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isCreateMode = scheduleId === "new";
  const [selectedRun, setSelectedRun] = useState<JobRun | null>(null);

  const taskOptionsQuery = useQuery({
    queryKey: jobsQueryKeys.taskOptions(),
    queryFn: fetchSchedulableTaskOptions,
  });

  const scheduleQuery = useQuery({
    queryKey: jobsQueryKeys.schedule(scheduleId ?? ""),
    queryFn: () => fetchJobSchedule(scheduleId!),
    enabled: !isCreateMode && Boolean(scheduleId),
  });

  const redirecting = useRecordNotFoundRedirect({
    isLoading: !isCreateMode && scheduleQuery.isLoading,
    error: scheduleQuery.error,
    isFetched: scheduleQuery.isFetched,
    hasData: Boolean(scheduleQuery.data),
    listPath: "/jobs/schedules",
    notice: "That schedule could not be found.",
  });

  const [values, setValues] = useState<JobScheduleFormValues | null>(null);
  const [baselineValues, setBaselineValues] = useState<JobScheduleFormValues | null>(null);

  useEffect(() => {
    if (isCreateMode) {
      if (taskOptionsQuery.data) {
        const nextValues = emptyScheduleFormValues(taskOptionsQuery.data);
        setValues(nextValues);
        setBaselineValues(nextValues);
      }
      return;
    }
    if (scheduleQuery.data) {
      const nextValues = scheduleToFormValues(scheduleQuery.data);
      setValues(nextValues);
      setBaselineValues(nextValues);
    }
  }, [isCreateMode, scheduleQuery.data, taskOptionsQuery.data]);

  const scheduleRunsQuery = useQuery({
    queryKey: jobsQueryKeys.runs({ schedule_id: scheduleId }),
    queryFn: () => fetchJobRuns({ schedule_id: scheduleId }),
    enabled: !isCreateMode && Boolean(scheduleId),
    refetchInterval: scheduleQuery.data?.enabled ? 15_000 : false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: createJobSchedule,
    onSuccess: () => {
      invalidate();
      navigate("/jobs/schedules");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReturnType<typeof formValuesToPayload>;
    }) => updateJobSchedule(id, payload),
    onSuccess: (updatedSchedule) => {
      const nextValues = scheduleToFormValues(updatedSchedule);
      setValues(nextValues);
      setBaselineValues(nextValues);
      invalidate();
      navigate("/jobs/schedules");
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: deleteJobRun,
    onSuccess: invalidate,
  });

  const runNowMutation = useMutation({
    mutationFn: () => runJobScheduleNow(scheduleId!),
    onSuccess: invalidate,
  });

  const formBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteRunMutation.isPending ||
    runNowMutation.isPending;

  const actionError = createMutation.isError
    ? createMutation.error
    : updateMutation.isError
      ? updateMutation.error
      : null;
  const actionErrorMessage =
    actionError instanceof ApiError
      ? actionError.message
      : actionError instanceof Error
        ? actionError.message
        : null;

  const isDirty = useMemo(() => {
    if (!values || !baselineValues) {
      return false;
    }
    return !formValuesEqual(values, baselineValues);
  }, [baselineValues, values]);

  const canSave = values ? isJobScheduleFormValid(values) : false;

  const handleDiscard = () => {
    if (baselineValues) {
      setValues(baselineValues);
    }
  };

  const handleSave = () => {
    if (!values) {
      return;
    }
    const payload = formValuesToPayload(values);
    if (isCreateMode) {
      createMutation.mutate(payload);
      return;
    }
    if (scheduleId) {
      updateMutation.mutate({ id: scheduleId, payload });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (redirecting) {
    return null;
  }

  const isLoading =
    taskOptionsQuery.isLoading || (!isCreateMode && scheduleQuery.isLoading) || values === null;

  const scheduleRuns = scheduleRunsQuery.data ?? [];

  const scheduleRunsFooter =
    !isCreateMode && scheduleId ? (
      <section className="mt-2 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium text-stone-200">
            Schedule runs
            <span className="font-normal text-stone-500"> ({scheduleRuns.length})</span>
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Execution history for {scheduleQuery.data?.name ?? "this schedule"}
          </p>
        </div>
        {scheduleRunsQuery.isLoading ? (
          <p className="text-sm text-stone-500">Loading schedule runs…</p>
        ) : scheduleRunsQuery.isError ? (
          <p className="text-sm text-red-300">Failed to load schedule runs.</p>
        ) : (
          <JobRunsListView
            runs={scheduleRuns}
            onRowClick={setSelectedRun}
            onDelete={(runId) => deleteRunMutation.mutate(runId)}
            rowDisabled={deleteRunMutation.isPending}
            deleteDisabled={deleteRunMutation.isPending}
            emptyMessage="No runs for this schedule yet."
            paginationResetKey={`${scheduleId}:${scheduleRuns.length}`}
          />
        )}
      </section>
    ) : null;

  const runNowErrorMessage = runNowMutation.isError
    ? runNowMutation.error instanceof ApiError
      ? runNowMutation.error.message
      : runNowMutation.error instanceof Error
        ? runNowMutation.error.message
        : "Failed to run schedule."
    : null;

  const runNowButton =
    !isCreateMode && scheduleId ? (
      <button
        type="button"
        onClick={() => runNowMutation.mutate()}
        disabled={formBusy}
        className={headerOutlineButtonClass}
      >
        {runNowMutation.isPending ? "Running…" : "Run now"}
      </button>
    ) : null;

  return (
    <>
      <FormPageLayout
        backHref="/jobs/schedules"
        backLabel="Back to schedules"
        title={isCreateMode ? "Create schedule" : "Edit schedule"}
        subtitle={!isCreateMode ? scheduleQuery.data?.name : null}
        maxWidth="7xl"
        padded
        isDirty={isDirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        isSaving={formBusy}
        canSave={canSave}
        saveError={actionErrorMessage}
        headerAction={runNowButton}
        errorMessage={runNowErrorMessage}
        footer={scheduleRunsFooter}
      >
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : (
          <JobScheduleForm
            values={values}
            taskOptions={taskOptionsQuery.data ?? []}
            disabled={formBusy}
            onChange={setValues}
          />
        )}
      </FormPageLayout>

      {selectedRun ? (
        <JobRunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      ) : null}
    </>
  );
}
