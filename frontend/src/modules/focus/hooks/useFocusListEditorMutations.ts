// keel_web/src/modules/focus/hooks/useFocusListEditorMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  createFocusEntry,
  createFocusRecord,
  deleteFocusEntry,
  focusQueryKeys,
  updateFocusEntry,
  updateFocusList,
  updateFocusNode,
  type FocusEntryCreatePayload,
} from "../api";
import type { FocusEntryStatus, FocusNodeStatus } from "../lib/focus";

type UseFocusListEditorMutationsParams = {
  listId: number;
  deferConstellationRefresh: boolean;
  onBulkDeleteSuccess: () => void;
};

export function useFocusListEditorMutations({
  listId,
  deferConstellationRefresh,
  onBulkDeleteSuccess,
}: UseFocusListEditorMutationsParams) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    if (deferConstellationRefresh) {
      void queryClient.invalidateQueries({ queryKey: focusQueryKeys.list(listId) });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
  }, [deferConstellationRefresh, listId, queryClient]);

  const createEntryMutation = useMutation({
    mutationFn: (payload: FocusEntryCreatePayload) => createFocusEntry(payload),
    onSuccess: invalidate,
  });

  const createRecordMutation = useMutation({
    mutationFn: (result: Parameters<typeof createFocusRecord>[1]) =>
      createFocusRecord(listId, result, "limbo"),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => deleteFocusEntry(entryId),
    onSuccess: invalidate,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (entryIds: number[]) => {
      await Promise.all(entryIds.map((entryId) => deleteFocusEntry(entryId)));
    },
    onSuccess: () => {
      onBulkDeleteSuccess();
      invalidate();
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({
      entryId,
      status,
      title,
      notes,
      work_order,
    }: {
      entryId: number;
      status?: FocusEntryStatus;
      title?: string;
      notes?: string;
      work_order?: number | null;
    }) => updateFocusEntry(entryId, { status, title, notes, work_order }),
    onSuccess: invalidate,
  });

  const updateLinkedListMutation = useMutation({
    mutationFn: ({
      linkedListId,
      title,
      notes,
      status,
      work_order,
    }: {
      linkedListId: number;
      title?: string;
      notes?: string;
      status?: FocusNodeStatus;
      work_order?: number | null;
    }) => updateFocusList(linkedListId, { title, notes, status, work_order }),
    onSuccess: invalidate,
  });

  const moveNodeMutation = useMutation({
    mutationFn: ({
      nodeId,
      parent_id,
      sort_order,
    }: {
      nodeId: number;
      parent_id: number | null;
      sort_order: number;
    }) => updateFocusNode(nodeId, { parent_id, sort_order }),
    onSuccess: invalidate,
  });

  const updateListMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateFocusList>[1]) =>
      updateFocusList(listId, payload),
    onSuccess: invalidate,
  });

  return {
    createEntryMutation,
    createRecordMutation,
    deleteMutation,
    bulkDeleteMutation,
    updateEntryMutation,
    updateLinkedListMutation,
    moveNodeMutation,
    updateListMutation,
  };
}
