// keel_web/src/modules/timeline/pages/TimelineCreatePage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { contactsQueryKeys, fetchContacts } from "../../people/contacts/api";
import { fetchFigures, figuresQueryKeys } from "../../people/figures/api";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { usePagePaste } from "../../projects/hooks/usePagePaste";
import {
  TimelineEventForm,
  emptyTimelineEventFormValues,
  formValuesToCreatePayload,
  isTimelineDateRangeValid,
  isTimelineFormValid,
  type TimelineEventFormValues,
} from "../components/forms/TimelineEventForm";
import { FormPageLayout } from "../../../views";
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

function buildInitialFormValues(startParam: string | null): TimelineEventFormValues {
  const startDate = startParam?.trim() ?? "";
  if (!startDate) {
    return emptyTimelineEventFormValues();
  }
  return {
    ...emptyTimelineEventFormValues(),
    startDate,
  };
}

export function TimelineCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialValues = useMemo(
    () => buildInitialFormValues(searchParams.get("start")),
    [searchParams],
  );
  const [values, setValues] = useState<TimelineEventFormValues>(initialValues);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>(
    [],
  );

  const contactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: fetchContacts,
  });

  const figuresQuery = useQuery({
    queryKey: figuresQueryKeys.list(),
    queryFn: fetchFigures,
  });

  const queueUploads = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    setPendingUploads((current) => [
      ...current,
      ...list.map((file) => createPendingUpload(file)),
    ]);
  }, []);

  const queueMediaSelections = useCallback(
    (mediaItems: PendingMediaSelection["media"][]) => {
      setPendingMediaSelections((current) => [
        ...current,
        ...mediaItems.map((media) => createPendingMediaSelection(media)),
      ]);
    },
    [],
  );

  const pageFileDragActive = usePageFileDrop({
    enabled: true,
    onDropFiles: queueUploads,
  });

  usePagePaste({
    enabled: true,
    onPasteFiles: queueUploads,
  });

  const isDirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(initialValues) ||
      pendingUploads.length > 0 ||
      pendingMediaSelections.length > 0,
    [initialValues, values, pendingUploads.length, pendingMediaSelections.length],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: (created) => {
      setPendingUploads([]);
      setPendingMediaSelections([]);
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      navigate(`/timeline/${created.id}`);
    },
  });

  const canSave =
    isTimelineFormValid(values) &&
    isTimelineDateRangeValid(values) &&
    !createMutation.isPending;

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create timeline event."
    : null;

  const dateRangeError =
    isDirty && !isTimelineDateRangeValid(values)
      ? "End date must be on or after start date."
      : null;

  const handleDiscard = () => {
    for (const pending of pendingUploads) {
      URL.revokeObjectURL(pending.previewUrl);
    }
    setValues(initialValues);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  };

  return (
    <FormPageLayout
      backHref="/timeline"
      backLabel="Back to timeline"
      isDirty={isDirty}
      onDiscard={handleDiscard}
      onSave={() => createMutation.mutate()}
      isSaving={createMutation.isPending}
      canSave={canSave}
      saveError={saveError ?? dateRangeError}
      errorMessage={saveError}
    >
      <TimelineEventForm
        values={values}
        contacts={contactsQuery.data ?? []}
        figures={figuresQuery.data ?? []}
        onChange={setValues}
        disabled={createMutation.isPending}
        pendingUploads={pendingUploads}
        pendingMediaSelections={pendingMediaSelections}
        onQueueUploads={queueUploads}
        onQueueMediaSelections={queueMediaSelections}
        onRemovePendingUpload={(clientId) => {
          setPendingUploads((current) => {
            const target = current.find((item) => item.clientId === clientId);
            if (target) {
              URL.revokeObjectURL(target.previewUrl);
            }
            return current.filter((item) => item.clientId !== clientId);
          });
        }}
        onRemovePendingMedia={(clientId) => {
          setPendingMediaSelections((current) =>
            current.filter((item) => item.clientId !== clientId),
          );
        }}
        pageFileDragActive={pageFileDragActive}
      />
    </FormPageLayout>
  );
}
