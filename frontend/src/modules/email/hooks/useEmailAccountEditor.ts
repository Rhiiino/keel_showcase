// keel_web/src/modules/email/hooks/useEmailAccountEditor.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  deleteEmailAccount,
  emailQueryKeys,
  fetchEmailAccount,
  updateEmailAccount,
} from "../api";
import {
  emailAccountToFormValues,
  formValuesToUpdatePayload,
  isEmailAccountFormValid,
  type EmailAccountFormValues,
} from "../lib/emailDisplay";

type UseEmailAccountEditorOptions = {
  enabled?: boolean;
  onDeleteSuccess?: () => void;
};

export function useEmailAccountEditor(
  accountId: number | string | null,
  options: UseEmailAccountEditorOptions = {},
) {
  const { enabled = true, onDeleteSuccess } = options;
  const queryClient = useQueryClient();
  const accountIdString = accountId == null ? "" : String(accountId);
  const parsedAccountId = Number.parseInt(accountIdString, 10);
  const isAccountIdValid =
    accountIdString.length > 0 && Number.isFinite(parsedAccountId) && parsedAccountId > 0;
  const queryEnabled = enabled && isAccountIdValid;

  const [values, setValues] = useState<EmailAccountFormValues | null>(null);
  const [baseline, setBaseline] = useState<EmailAccountFormValues | null>(null);

  const accountQuery = useQuery({
    queryKey: emailQueryKeys.detail(accountIdString),
    queryFn: () => fetchEmailAccount(accountIdString),
    enabled: queryEnabled,
  });

  const applyServerAccount = useCallback((account: NonNullable<typeof accountQuery.data>) => {
    const nextValues = emailAccountToFormValues(account);
    setValues(nextValues);
    setBaseline(nextValues);
  }, []);

  useEffect(() => {
    setValues(null);
    setBaseline(null);
  }, [accountIdString]);

  useEffect(() => {
    if (!queryEnabled) {
      setValues(null);
      setBaseline(null);
    }
  }, [queryEnabled]);

  const isDirty = useMemo(() => {
    if (!values || !baseline) {
      return false;
    }
    return JSON.stringify(values) !== JSON.stringify(baseline);
  }, [values, baseline]);

  useEffect(() => {
    if (!accountQuery.data) {
      return;
    }
    if (!isDirty) {
      applyServerAccount(accountQuery.data);
    }
  }, [applyServerAccount, isDirty, accountQuery.data]);

  const canSave = values ? isEmailAccountFormValid(values) : false;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!values || !isAccountIdValid) {
        throw new Error("Invalid email account form state.");
      }
      return updateEmailAccount(parsedAccountId, formValuesToUpdatePayload(values));
    },
    onSuccess: (updated) => {
      applyServerAccount(updated);
      void queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!isAccountIdValid) {
        throw new Error("Invalid email account id.");
      }
      await deleteEmailAccount(parsedAccountId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
      onDeleteSuccess?.();
    },
  });

  const handleDiscard = useCallback(() => {
    if (baseline) {
      setValues(baseline);
    }
  }, [baseline]);

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save email account."
    : null;

  const errorMessage = accountQuery.isError
    ? accountQuery.error instanceof ApiError
      ? accountQuery.error.message
      : accountQuery.error instanceof Error
        ? accountQuery.error.message
        : "Email account not found."
    : null;

  return {
    account: accountQuery.data ?? null,
    values,
    setValues,
    isLoading: accountQuery.isLoading,
    isError: accountQuery.isError,
    isReady: Boolean(accountQuery.data && values),
    isDirty,
    canSave,
    isSaving: saveMutation.isPending,
    saveError,
    errorMessage,
    handleDiscard,
    save: () => saveMutation.mutateAsync(),
    deleteAccount: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    pending: saveMutation.isPending || deleteMutation.isPending,
  };
}
