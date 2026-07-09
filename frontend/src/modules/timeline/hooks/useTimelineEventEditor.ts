// keel_web/src/modules/timeline/hooks/useTimelineEventEditor.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../lib/api";
import { contactsQueryKeys, fetchContacts } from "../../people/contacts/api";
import { fetchFigures, figuresQueryKeys } from "../../people/figures/api";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { usePagePaste } from "../../projects/hooks/usePagePaste";
import {
  formValuesToUpdatePayload,
  isTimelineDateRangeValid,
  isTimelineFormValid,
  timelineEventToFormValues,
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
  deleteTimelineEvent,
  deleteTimelineEventMedia,
  fetchTimelineEvent,
  fetchTimelineEventMedia,
  timelineQueryKeys,
  updateTimelineEvent,
  uploadTimelineEventMedia,
} from "../api";

type UseTimelineEventEditorOptions = {
  enabled?: boolean;
  onDeleteSuccess?: () => void;
};

export function useTimelineEventEditor(
  eventId: number | string | null,
  options: UseTimelineEventEditorOptions = {},
) {
  const { enabled = true, onDeleteSuccess } = options;
  const queryClient = useQueryClient();
  const eventIdString = eventId == null ? "" : String(eventId);
  const parsedEventId = Number.parseInt(eventIdString, 10);
  const isEventIdValid = eventIdString.length > 0 && Number.isFinite(parsedEventId) && parsedEventId > 0;
  const queryEnabled = enabled && isEventIdValid;

  const [values, setValues] = useState<TimelineEventFormValues | null>(null);
  const [baseline, setBaseline] = useState<TimelineEventFormValues | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>(
    [],
  );

  const eventQuery = useQuery({
    queryKey: timelineQueryKeys.detail(eventIdString),
    queryFn: () => fetchTimelineEvent(eventIdString),
    enabled: queryEnabled,
  });

  const mediaQuery = useQuery({
    queryKey: timelineQueryKeys.eventMedia(eventIdString),
    queryFn: () => fetchTimelineEventMedia(eventIdString),
    enabled: queryEnabled,
  });

  const contactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: fetchContacts,
    enabled: queryEnabled,
  });

  const figuresQuery = useQuery({
    queryKey: figuresQueryKeys.list(),
    queryFn: fetchFigures,
    enabled: queryEnabled,
  });

  const applyServerEvent = useCallback((event: NonNullable<typeof eventQuery.data>) => {
    const nextValues = timelineEventToFormValues(event);
    setValues(nextValues);
    setBaseline(nextValues);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, []);

  useEffect(() => {
    if (!eventQuery.data) {
      return;
    }
    applyServerEvent(eventQuery.data);
  }, [applyServerEvent, eventQuery.data]);

  useEffect(() => {
    if (!queryEnabled) {
      setValues(null);
      setBaseline(null);
      setPendingUploads([]);
      setPendingMediaSelections([]);
    }
  }, [queryEnabled]);

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
    enabled: Boolean(eventQuery.data) && queryEnabled,
    onDropFiles: queueUploads,
  });

  usePagePaste({
    enabled: Boolean(eventQuery.data) && queryEnabled,
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!values) {
        throw new Error("Form is not ready.");
      }
      const updated = await updateTimelineEvent(eventIdString, formValuesToUpdatePayload(values));
      for (const pending of pendingUploads) {
        await uploadTimelineEventMedia(eventIdString, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachTimelineEventMediaFromMedia(eventIdString, pending.media.id);
      }
      return updated;
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.eventMedia(eventIdString) });
      applyServerEvent(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTimelineEvent(eventIdString),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      onDeleteSuccess?.();
    },
  });

  const pending = saveMutation.isPending || deleteMutation.isPending;

  const canSave =
    Boolean(values) &&
    isTimelineFormValid(values!) &&
    isTimelineDateRangeValid(values!) &&
    !pending;

  const mutationError = saveMutation.isError
    ? saveMutation.error
    : deleteMutation.isError
      ? deleteMutation.error
      : null;

  const errorMessage = mutationError
    ? mutationError instanceof ApiError
      ? mutationError.message
      : mutationError instanceof Error
        ? mutationError.message
        : "Timeline action failed."
    : null;

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save timeline event."
    : null;

  const dateRangeError =
    isDirty && values && !isTimelineDateRangeValid(values)
      ? "End date must be on or after start date."
      : null;

  const handleDeleteMedia = async (attachmentId: number) => {
    await deleteTimelineEventMedia(eventIdString, attachmentId);
    void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.eventMedia(eventIdString) });
  };

  const handleDiscard = () => {
    if (baseline) {
      for (const pendingUpload of pendingUploads) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
      setValues(baseline);
      setPendingUploads([]);
      setPendingMediaSelections([]);
    }
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
    media: mediaQuery.data ?? [],
    invalidRecordId: !isEventIdValid,
    fetchError: eventQuery.error,
    isRecordFetched: eventQuery.isFetched,
    hasRecordData: Boolean(eventQuery.data),
    isFetchLoading: eventQuery.isLoading,
    isLoading: eventQuery.isLoading || (!values && eventQuery.isFetching),
    isError: eventQuery.isError || (eventQuery.isFetched && !eventQuery.data),
    isReady: Boolean(values && eventQuery.data),
    isDirty,
    pending,
    canSave,
    saveError: saveError ?? dateRangeError,
    errorMessage,
    pageFileDragActive,
    pendingUploads,
    pendingMediaSelections,
    queueUploads,
    queueMediaSelections,
    removePendingUpload,
    removePendingMedia,
    handleDiscard,
    handleDeleteMedia,
    resetPendingUploads,
    save: () => saveMutation.mutate(),
    deleteEvent: () => deleteMutation.mutate(),
    isSaving: saveMutation.isPending,
    eventDescription: eventQuery.data?.description ?? "Timeline event",
  };
}
