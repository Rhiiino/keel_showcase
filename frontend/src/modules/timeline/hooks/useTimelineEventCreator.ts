// keel_web/src/modules/timeline/hooks/useTimelineEventCreator.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import { contactsQueryKeys, fetchContacts } from "../../people/contacts/api";
import { fetchFigures, figuresQueryKeys } from "../../people/figures/api";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { usePagePaste } from "../../projects/hooks/usePagePaste";
import {
  emptyTimelineEventFormValues,
  formValuesToCreatePayload,
  isTimelineDateRangeValid,
  isTimelineFormValid,
  type TimelineEventFormValues,
} from "../components/forms/TimelineEventForm";
import {
  createPendingMediaSelection,
  createPendingUpload,
  type PendingMediaSelection,
  type PendingUpload,
} from "../components/TimelineMediaCarousel";
import {
  attachTimelineEventMediaFromMedia,
  createTimelineEvent,
  timelineQueryKeys,
  uploadTimelineEventMedia,
} from "../api";

type UseTimelineEventCreatorOptions = {
  enabled?: boolean;
  initialStartDate?: string | null;
  onCreateSuccess?: () => void;
};

function buildInitialValues(startDate: string | null | undefined): TimelineEventFormValues {
  return {
    ...emptyTimelineEventFormValues(),
    startDate: startDate ?? "",
  };
}

export function useTimelineEventCreator(
  options: UseTimelineEventCreatorOptions = {},
) {
  const { enabled = true, initialStartDate = null, onCreateSuccess } = options;
  const queryClient = useQueryClient();

  const [values, setValues] = useState<TimelineEventFormValues | null>(null);
  const [baseline, setBaseline] = useState<TimelineEventFormValues | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>(
    [],
  );

  const contactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: fetchContacts,
    enabled,
  });

  const figuresQuery = useQuery({
    queryKey: figuresQueryKeys.list(),
    queryFn: fetchFigures,
    enabled,
  });

  const resetForm = useCallback((startDate: string | null | undefined) => {
    const nextValues = buildInitialValues(startDate);
    setValues(nextValues);
    setBaseline(nextValues);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setValues(null);
      setBaseline(null);
      setPendingUploads([]);
      setPendingMediaSelections([]);
      return;
    }
    resetForm(initialStartDate);
  }, [enabled, initialStartDate, resetForm]);

  const queueUploads = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    setPendingUploads((current) => [
      ...current,
      ...list.map((file) => createPendingUpload(file)),
    ]);
  }, []);

  const queueMediaSelections = useCallback((mediaItems: PendingMediaSelection["media"][]) => {
    setPendingMediaSelections((current) => [
      ...current,
      ...mediaItems.map((media) => createPendingMediaSelection(media)),
    ]);
  }, []);

  const pageFileDragActive = usePageFileDrop({
    enabled,
    onDropFiles: queueUploads,
  });

  usePagePaste({
    enabled,
    onPasteFiles: queueUploads,
  });

  const isDirty = useMemo(() => {
    if (!values || !baseline) {
      return false;
    }
    return (
      JSON.stringify(values) !== JSON.stringify(baseline) ||
      pendingUploads.length > 0 ||
      pendingMediaSelections.length > 0
    );
  }, [baseline, values, pendingUploads.length, pendingMediaSelections.length]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!values) {
        throw new Error("Form is not ready.");
      }
      const created = await createTimelineEvent(formValuesToCreatePayload(values));
      for (const pending of pendingUploads) {
        await uploadTimelineEventMedia(created.id, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachTimelineEventMediaFromMedia(created.id, pending.media.id);
      }
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      onCreateSuccess?.();
    },
  });

  const pending = createMutation.isPending;

  const canSave =
    Boolean(values) &&
    isTimelineFormValid(values!) &&
    isTimelineDateRangeValid(values!) &&
    !pending;

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create timeline event."
    : null;

  const dateRangeError =
    isDirty && values && !isTimelineDateRangeValid(values)
      ? "End date must be on or after start date."
      : null;

  const handleDiscard = () => {
    if (!baseline) {
      return;
    }
    for (const pendingUpload of pendingUploads) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
    }
    setValues(baseline);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  };

  const resetPendingUploads = useCallback(() => {
    setPendingUploads((current) => {
      for (const pendingUpload of current) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
      return [];
    });
    setPendingMediaSelections([]);
  }, []);

  const removePendingUpload = useCallback((clientId: string) => {
    setPendingUploads((current) => {
      const target = current.find((item) => item.clientId === clientId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.clientId !== clientId);
    });
  }, []);

  const removePendingMedia = useCallback((clientId: string) => {
    setPendingMediaSelections((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
  }, []);

  return {
    values,
    setValues,
    contacts: contactsQuery.data ?? [],
    figures: figuresQuery.data ?? [],
    media: [],
    isLoading: contactsQuery.isLoading,
    isError: contactsQuery.isError,
    isReady: Boolean(values),
    isDirty,
    pending,
    canSave,
    saveError: saveError ?? dateRangeError,
    errorMessage: saveError,
    pageFileDragActive,
    pendingUploads,
    pendingMediaSelections,
    queueUploads,
    queueMediaSelections,
    removePendingUpload,
    removePendingMedia,
    handleDiscard,
    resetPendingUploads,
    save: () => createMutation.mutate(),
    isSaving: createMutation.isPending,
  };
}
