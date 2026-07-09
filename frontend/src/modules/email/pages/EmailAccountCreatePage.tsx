// keel_web/src/modules/email/pages/EmailAccountCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { createEmailAccount, emailAccountPath, emailQueryKeys } from "../api";
import { EmailAccountForm } from "../components/EmailAccountForm";
import { FormPageLayout } from "../../../views";
import {
  emptyEmailAccountFormValues,
  formValuesToCreatePayload,
  isEmailAccountFormValid,
  type EmailAccountFormValues,
} from "../lib/emailDisplay";

const EMPTY_VALUES = emptyEmailAccountFormValues();

export function EmailAccountCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<EmailAccountFormValues>(EMPTY_VALUES);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(EMPTY_VALUES),
    [values],
  );

  const createMutation = useMutation({
    mutationFn: () => createEmailAccount(formValuesToCreatePayload(values)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
      navigate(emailAccountPath(created));
    },
  });

  const canSave = isEmailAccountFormValid(values) && !createMutation.isPending;

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create email account."
    : null;

  const handleDiscard = () => {
    setValues(EMPTY_VALUES);
  };

  return (
    <FormPageLayout
      backHref="/email"
      backLabel="Back to email"
      isDirty={isDirty}
      onDiscard={handleDiscard}
      onSave={() => createMutation.mutate()}
      isSaving={createMutation.isPending}
      canSave={canSave}
      saveError={saveError}
      errorMessage={saveError}
    >
      <EmailAccountForm
        values={values}
        onChange={setValues}
        disabled={createMutation.isPending}
      />
    </FormPageLayout>
  );
}
