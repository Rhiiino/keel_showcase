// keel_web/src/modules/timeline/hooks/useTimelinePlanEditor.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  formValuesToPlanUpdatePayload,
  isTimelinePlanFormValid,
  timelinePlanToFormValues,
  type TimelinePlanFormValues,
} from "../components/plans/TimelinePlanForm";
import {
  deleteTimelinePlan,
  fetchTimelinePlan,
  timelineQueryKeys,
  updateTimelinePlan,
} from "../api";

type UseTimelinePlanEditorOptions = {
  onDeleteSuccess?: () => void;
};

export function useTimelinePlanEditor(
  planId: number | string | null,
  options: UseTimelinePlanEditorOptions = {},
) {
  const { onDeleteSuccess } = options;
  const queryClient = useQueryClient();
  const planIdString = planId == null ? "" : String(planId);
  const parsedPlanId = Number.parseInt(planIdString, 10);
  const isPlanIdValid =
    planIdString.length > 0 && Number.isFinite(parsedPlanId) && parsedPlanId > 0;

  const [values, setValues] = useState<TimelinePlanFormValues | null>(null);
  const [baseline, setBaseline] = useState<TimelinePlanFormValues | null>(null);

  const planQuery = useQuery({
    queryKey: timelineQueryKeys.planDetail(planIdString),
    queryFn: () => fetchTimelinePlan(planIdString),
    enabled: isPlanIdValid,
  });

  const applyServerPlan = useCallback((plan: NonNullable<typeof planQuery.data>) => {
    const nextValues = timelinePlanToFormValues(plan);
    setValues(nextValues);
    setBaseline(nextValues);
  }, []);

  useEffect(() => {
    if (!planQuery.data) {
      return;
    }
    applyServerPlan(planQuery.data);
  }, [applyServerPlan, planQuery.data]);

  const isDirty = useMemo(() => {
    if (!values || !baseline) {
      return false;
    }
    return JSON.stringify(values) !== JSON.stringify(baseline);
  }, [baseline, values]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!values) {
        throw new Error("Plan form is not ready.");
      }
      return updateTimelinePlan(planIdString, formValuesToPlanUpdatePayload(values));
    },
    onSuccess: (plan) => {
      applyServerPlan({ ...plan, items: planQuery.data?.items ?? [] });
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTimelinePlan(planIdString),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      onDeleteSuccess?.();
    },
  });

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save plan."
    : null;

  return {
    plan: planQuery.data ?? null,
    items: planQuery.data?.items ?? [],
    values,
    setValues,
    invalidRecordId: !isPlanIdValid,
    fetchError: planQuery.error,
    isRecordFetched: planQuery.isFetched,
    hasRecordData: Boolean(planQuery.data),
    isFetchLoading: planQuery.isLoading,
    isLoading: planQuery.isLoading,
    isError: planQuery.isError,
    isReady: Boolean(planQuery.data && values),
    isDirty,
    pending: saveMutation.isPending || deleteMutation.isPending,
    isSaving: saveMutation.isPending,
    canSave: isTimelinePlanFormValid(values ?? { title: "", startDate: "", endDate: "", notes: "" }),
    saveError,
    errorMessage:
      planQuery.error instanceof ApiError
        ? planQuery.error.message
        : planQuery.error instanceof Error
          ? planQuery.error.message
          : null,
    handleDiscard: () => {
      if (baseline) {
        setValues(baseline);
      }
    },
    save: () => saveMutation.mutateAsync(),
    deletePlan: () => deleteMutation.mutateAsync(),
    refetchPlan: () => planQuery.refetch(),
  };
}
