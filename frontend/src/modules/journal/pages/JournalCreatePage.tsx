// keel_web/src/modules/journal/pages/JournalCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import {
  createPendingMediaSelection,
  createPendingUpload,
  type PendingMediaSelection,
  type PendingUpload,
} from "../../media/components/EntityMediaCarousel";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { usePagePaste } from "../../projects/hooks/usePagePaste";
import {
  JournalEntryForm,
  emptyJournalEntryFormValues,
  formValuesToCreatePayload,
  isJournalFormValid,
  type JournalEntryFormValues,
} from "../components/forms/JournalEntryForm";
import { FormPageLayout } from "../../../views";
import {
  attachJournalEntryMediaFromMedia,
  createJournalEntry,
  journalQueryKeys,
  uploadJournalEntryMedia,
} from "../api";

const EMPTY_VALUES = emptyJournalEntryFormValues();

export function JournalCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<JournalEntryFormValues>(EMPTY_VALUES);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>(
    [],
  );

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
      JSON.stringify(values) !== JSON.stringify(EMPTY_VALUES) ||
      pendingUploads.length > 0 ||
      pendingMediaSelections.length > 0,
    [values, pendingUploads.length, pendingMediaSelections.length],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await createJournalEntry(formValuesToCreatePayload(values));
      for (const pending of pendingUploads) {
        await uploadJournalEntryMedia(created.id, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachJournalEntryMediaFromMedia(created.id, pending.media.id);
      }
      return created;
    },
    onSuccess: (created) => {
      setPendingUploads([]);
      setPendingMediaSelections([]);
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all });
      navigate(`/journal/${created.id}`);
    },
  });

  const canSave = isJournalFormValid(values) && !createMutation.isPending;

  const saveError = createMutation.isError
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : "Failed to create journal entry."
    : null;

  const handleDiscard = () => {
    for (const pending of pendingUploads) {
      URL.revokeObjectURL(pending.previewUrl);
    }
    setValues(EMPTY_VALUES);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  };

  return (
    <FormPageLayout
      backHref="/journal"
      backLabel="Back to journal"
      isDirty={isDirty}
      onDiscard={handleDiscard}
      onSave={() => createMutation.mutate()}
      isSaving={createMutation.isPending}
      canSave={canSave}
      saveError={saveError}
      errorMessage={saveError}
    >
      <JournalEntryForm
        values={values}
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
