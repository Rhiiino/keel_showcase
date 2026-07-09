// keel_web/src/modules/timeline/hooks/useTimelinePlanItemEditor.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  emptyTimelinePlanItemFormValues,
  formValuesToPlanItemCreatePayload,
  formValuesToPlanItemUpdatePayload,
  isPlanItemWithinPlanDates,
  isTimelinePlanItemFormValid,
  timelinePlanItemToFormValues,
  type TimelinePlanItemFormValues,
} from "../components/plans/TimelinePlanItemForm";
import {
  createTimelinePlanItem,
  deleteTimelinePlanItem,
  promoteTimelinePlanItem,
  timelineQueryKeys,
  updateTimelinePlanItem,
  type TimelinePlanItem,
} from "../api";

type UseTimelinePlanItemEditorOptions = {
  planId: number;
  planStartDate: string;
  planEndDate: string;
  item: TimelinePlanItem | null;
  mode: "create" | "edit";
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
};

export function useTimelinePlanItemEditor(options: UseTimelinePlanItemEditorOptions) {
  const {
    planId,
    planStartDate,
    planEndDate,
    item,
    mode,
    onSaveSuccess,
    onDeleteSuccess,
  } = options;
  const queryClient = useQueryClient();

  const [values, setValues] = useState<TimelinePlanItemFormValues>(() =>
    item
      ? timelinePlanItemToFormValues(item)
      : emptyTimelinePlanItemFormValues(planStartDate),
  );
  const [baseline, setBaseline] = useState<TimelinePlanItemFormValues>(() =>
    item
      ? timelinePlanItemToFormValues(item)
      : emptyTimelinePlanItemFormValues(planStartDate),
  );
  const [linkedEventId, setLinkedEventId] = useState<number | null>(
    () => item?.timeline_event_id ?? null,
  );

  useEffect(() => {
    const next = item
      ? timelinePlanItemToFormValues(item)
      : emptyTimelinePlanItemFormValues(planStartDate);
    setValues(next);
    setBaseline(next);
    setLinkedEventId(item?.timeline_event_id ?? null);
  }, [item, planStartDate, mode]);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [baseline, values],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = mode === "create"
        ? formValuesToPlanItemCreatePayload(values)
        : formValuesToPlanItemUpdatePayload(values);
      if (mode === "create") {
        return createTimelinePlanItem(planId, payload);
      }
      if (!item) {
        throw new Error("Plan item is not ready.");
      }
      return updateTimelinePlanItem(item.id, payload);
    },
    onSuccess: (saved) => {
      const next = timelinePlanItemToFormValues(saved);
      setValues(next);
      setBaseline(next);
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      onSaveSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item) {
        throw new Error("Plan item is not ready.");
      }
      await deleteTimelinePlanItem(item.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      onDeleteSuccess?.();
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async () => {
      if (!item) {
        throw new Error("Plan item is not ready.");
      }
      return promoteTimelinePlanItem(item.id);
    },
    onSuccess: (saved) => {
      const next = timelinePlanItemToFormValues(saved);
      setValues(next);
      setBaseline(next);
      setLinkedEventId(saved.timeline_event_id);
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
    },
  });

  const rangeError = !isPlanItemWithinPlanDates(values, planStartDate, planEndDate)
    ? "Item date must fall within the plan date range."
    : null;

  const dateRangeError =
    values.endAt.trim() && values.endAt < values.startAt
      ? "End must be on or after start."
      : null;

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save plan item."
    : null;

  const promoteError = promoteMutation.isError
    ? promoteMutation.error instanceof ApiError
      ? promoteMutation.error.message
      : promoteMutation.error instanceof Error
        ? promoteMutation.error.message
        : "Failed to promote plan item."
    : null;

  const canPromote =
    mode === "edit" && item != null && linkedEventId == null && !promoteMutation.isPending;

  return {
    values,
    setValues,
    isDirty,
    linkedEventId,
    pending: saveMutation.isPending || deleteMutation.isPending || promoteMutation.isPending,
    isSaving: saveMutation.isPending,
    isPromoting: promoteMutation.isPending,
    canPromote,
    promoteError,
    canSave:
      isTimelinePlanItemFormValid(values) &&
      !rangeError &&
      !dateRangeError &&
      !saveMutation.isPending,
    saveError: saveError ?? rangeError ?? dateRangeError,
    handleDiscard: () => setValues(baseline),
    save: () => saveMutation.mutateAsync(),
    deleteItem: () => deleteMutation.mutateAsync(),
    promoteItem: () => promoteMutation.mutateAsync(),
  };
}
