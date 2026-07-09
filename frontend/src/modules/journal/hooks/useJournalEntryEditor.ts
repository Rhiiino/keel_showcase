// keel_web/src/modules/journal/hooks/useJournalEntryEditor.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  formValuesToUpdatePayload,
  isJournalFormValid,
  journalEntryToFormValues,
  type JournalEntryFormValues,
} from "../components/forms/JournalEntryForm";
import {
  attachJournalEntryMediaFromMedia,
  deleteJournalEntry,
  deleteJournalEntryMedia,
  fetchJournalEntry,
  fetchJournalEntryMedia,
  journalQueryKeys,
  updateJournalEntry,
  uploadJournalEntryMedia,
} from "../api";

type UseJournalEntryEditorOptions = {
  enabled?: boolean;
  onDeleteSuccess?: () => void;
};

export function useJournalEntryEditor(
  entryId: number | string | null,
  options: UseJournalEntryEditorOptions = {},
) {
  const { enabled = true, onDeleteSuccess } = options;
  const queryClient = useQueryClient();
  const entryIdString = entryId == null ? "" : String(entryId);
  const parsedEntryId = Number.parseInt(entryIdString, 10);
  const isEntryIdValid =
    entryIdString.length > 0 && Number.isFinite(parsedEntryId) && parsedEntryId > 0;
  const queryEnabled = enabled && isEntryIdValid;

  const [values, setValues] = useState<JournalEntryFormValues | null>(null);
  const [baseline, setBaseline] = useState<JournalEntryFormValues | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>(
    [],
  );

  const entryQuery = useQuery({
    queryKey: journalQueryKeys.detail(entryIdString),
    queryFn: () => fetchJournalEntry(entryIdString),
    enabled: queryEnabled,
  });

  const mediaQuery = useQuery({
    queryKey: journalQueryKeys.entryMedia(entryIdString),
    queryFn: () => fetchJournalEntryMedia(entryIdString),
    enabled: queryEnabled,
  });

  const applyServerEntry = useCallback((entry: NonNullable<typeof entryQuery.data>) => {
    const nextValues = journalEntryToFormValues(entry);
    setValues(nextValues);
    setBaseline(nextValues);
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, []);

  useEffect(() => {
    if (!entryQuery.data) {
      return;
    }
    applyServerEntry(entryQuery.data);
  }, [applyServerEntry, entryQuery.data]);

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
    enabled: Boolean(entryQuery.data) && queryEnabled,
    onDropFiles: queueUploads,
  });

  usePagePaste({
    enabled: Boolean(entryQuery.data) && queryEnabled,
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
      const updated = await updateJournalEntry(entryIdString, formValuesToUpdatePayload(values));
      for (const pending of pendingUploads) {
        await uploadJournalEntryMedia(entryIdString, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachJournalEntryMediaFromMedia(entryIdString, pending.media.id);
      }
      return updated;
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.entryMedia(entryIdString) });
      applyServerEntry(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJournalEntry(entryIdString),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all });
      onDeleteSuccess?.();
    },
  });

  const pending = saveMutation.isPending || deleteMutation.isPending;

  const canSave = Boolean(values) && isJournalFormValid(values!) && !pending;

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
        : "Journal action failed."
    : null;

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save journal entry."
    : null;

  const handleDeleteMedia = async (attachmentId: number) => {
    await deleteJournalEntryMedia(entryIdString, attachmentId);
    void queryClient.invalidateQueries({ queryKey: journalQueryKeys.entryMedia(entryIdString) });
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
    media: mediaQuery.data ?? [],
    invalidRecordId: !isEntryIdValid,
    fetchError: entryQuery.error,
    isRecordFetched: entryQuery.isFetched,
    hasRecordData: Boolean(entryQuery.data),
    isFetchLoading: entryQuery.isLoading,
    isLoading: entryQuery.isLoading || (!values && entryQuery.isFetching),
    isError: entryQuery.isError || (entryQuery.isFetched && !entryQuery.data),
    isReady: Boolean(values && entryQuery.data),
    isDirty,
    pending,
    canSave,
    saveError,
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
    save: () => saveMutation.mutate(),
    deleteEntry: () => deleteMutation.mutate(),
    isSaving: saveMutation.isPending,
  };
}
