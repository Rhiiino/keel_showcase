// keel_web/src/modules/timeline/pages/TimelinePlanCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { FormPageLayout } from "../../../views";
import {
  TimelinePlanForm,
  emptyTimelinePlanFormValues,
  formValuesToPlanCreatePayload,
  isTimelinePlanFormValid,
  type TimelinePlanFormValues,
} from "../components/plans/TimelinePlanForm";
import { createTimelinePlan, timelineQueryKeys } from "../api";

export function TimelinePlanCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialValues = useMemo(() => emptyTimelinePlanFormValues(), []);
  const [values, setValues] = useState<TimelinePlanFormValues>(initialValues);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [initialValues, values],
  );

  const createMutation = useMutation({
    mutationFn: () => createTimelinePlan(formValuesToPlanCreatePayload(values)),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      navigate(`/timeline/plan/${plan.id}`);
    },
  });

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create plan."
    : null;

  return (
    <FormPageLayout
      backHref="/timeline/plan"
      backLabel="Back to plans"
      isDirty={isDirty}
      onDiscard={() => setValues(initialValues)}
      onSave={() => createMutation.mutate()}
      isSaving={createMutation.isPending}
      canSave={isTimelinePlanFormValid(values) && !createMutation.isPending}
      saveError={saveError}
    >
      <TimelinePlanForm
        values={values}
        onChange={setValues}
        disabled={createMutation.isPending}
      />
    </FormPageLayout>
  );
}
