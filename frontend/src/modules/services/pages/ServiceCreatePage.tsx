// keel_web/src/modules/services/pages/ServiceCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { createService, servicePath, servicesQueryKeys } from "../api";
import { ServiceForm } from "../components/ServiceForm";
import { FormPageLayout } from "../../../views";
import {
  emptyServiceFormValues,
  formValuesToCreatePayload,
  isServiceFormValid,
  type ServiceFormValues,
} from "../lib/serviceDisplay";

const EMPTY_VALUES = emptyServiceFormValues();

export function ServiceCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ServiceFormValues>(EMPTY_VALUES);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(EMPTY_VALUES),
    [values],
  );

  const createMutation = useMutation({
    mutationFn: () => createService(formValuesToCreatePayload(values)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
      navigate(servicePath(created));
    },
  });

  const canSave = isServiceFormValid(values) && !createMutation.isPending;

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create service."
    : null;

  const handleDiscard = () => {
    setValues(EMPTY_VALUES);
  };

  return (
    <FormPageLayout
      backHref="/services"
      backLabel="Back to services"
      isDirty={isDirty}
      onDiscard={handleDiscard}
      onSave={() => createMutation.mutate()}
      isSaving={createMutation.isPending}
      canSave={canSave}
      saveError={saveError}
      errorMessage={saveError}
    >
      <ServiceForm
        values={values}
        onChange={setValues}
        disabled={createMutation.isPending}
      />
    </FormPageLayout>
  );
}
