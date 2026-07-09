// keel_web/src/modules/services/hooks/useServiceEditor.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import {
  deleteService,
  fetchService,
  servicesQueryKeys,
  updateService,
} from "../api";
import {
  formValuesToUpdatePayload,
  isServiceFormValid,
  serviceToFormValues,
  type ServiceFormValues,
} from "../lib/serviceDisplay";

type UseServiceEditorOptions = {
  enabled?: boolean;
  onDeleteSuccess?: () => void;
};

export function useServiceEditor(
  serviceId: number | string | null,
  options: UseServiceEditorOptions = {},
) {
  const { enabled = true, onDeleteSuccess } = options;
  const queryClient = useQueryClient();
  const serviceIdString = serviceId == null ? "" : String(serviceId);
  const parsedServiceId = Number.parseInt(serviceIdString, 10);
  const isServiceIdValid =
    serviceIdString.length > 0 && Number.isFinite(parsedServiceId) && parsedServiceId > 0;
  const queryEnabled = enabled && isServiceIdValid;

  const [values, setValues] = useState<ServiceFormValues | null>(null);
  const [baseline, setBaseline] = useState<ServiceFormValues | null>(null);

  const serviceQuery = useQuery({
    queryKey: servicesQueryKeys.detail(serviceIdString),
    queryFn: () => fetchService(serviceIdString),
    enabled: queryEnabled,
  });

  const applyServerService = useCallback((service: NonNullable<typeof serviceQuery.data>) => {
    const nextValues = serviceToFormValues(service);
    setValues(nextValues);
    setBaseline(nextValues);
  }, []);

  useEffect(() => {
    setValues(null);
    setBaseline(null);
  }, [serviceIdString]);

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
    if (!serviceQuery.data) {
      return;
    }
    if (!isDirty) {
      applyServerService(serviceQuery.data);
    }
  }, [applyServerService, isDirty, serviceQuery.data]);

  const canSave = values ? isServiceFormValid(values) : false;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!values || !isServiceIdValid) {
        throw new Error("Invalid service form state.");
      }
      return updateService(parsedServiceId, formValuesToUpdatePayload(values));
    },
    onSuccess: (updated) => {
      applyServerService(updated);
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!isServiceIdValid) {
        throw new Error("Invalid service id.");
      }
      await deleteService(parsedServiceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
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
        : "Failed to save service."
    : null;

  const errorMessage = serviceQuery.isError
    ? serviceQuery.error instanceof ApiError
      ? serviceQuery.error.message
      : serviceQuery.error instanceof Error
        ? serviceQuery.error.message
        : "Service not found."
    : null;

  return {
    service: serviceQuery.data ?? null,
    values,
    setValues,
    invalidRecordId: !isServiceIdValid,
    fetchError: serviceQuery.error,
    isRecordFetched: serviceQuery.isFetched,
    hasRecordData: Boolean(serviceQuery.data),
    isFetchLoading: serviceQuery.isLoading,
    isLoading: serviceQuery.isLoading,
    isError: serviceQuery.isError,
    isReady: Boolean(serviceQuery.data && values),
    isDirty,
    canSave,
    isSaving: saveMutation.isPending,
    saveError,
    errorMessage,
    handleDiscard,
    save: () => saveMutation.mutateAsync(),
    deleteService: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    pending: saveMutation.isPending || deleteMutation.isPending,
  };
}
