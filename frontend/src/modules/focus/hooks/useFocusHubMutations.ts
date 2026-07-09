// keel_web/src/modules/focus/hooks/useFocusHubMutations.ts

// Shared focus hub mutations used by cards and constellation pages.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createFocusEntry,
  createFocusList,
  createFocusRecord,
  deleteFocusEntry,
  deleteFocusList,
  focusQueryKeys,
  updateFocusNode,
  updateFocusEntry,
  updateFocusList,
  type FocusEntryCreatePayload,
  type FocusListCreatePayload,
  type FocusReferenceSearchResult,
} from "../api";
import type { FocusNodeStatus } from "../lib/focus";

export function useFocusHubMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });

  const createListMutation = useMutation({
    mutationFn: (payload: FocusListCreatePayload | string) =>
      typeof payload === "string"
        ? createFocusList({ title: payload })
        : createFocusList(payload),
    onSuccess: invalidate,
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: number) => deleteFocusList(listId),
    onSuccess: invalidate,
  });

  const updateListColorMutation = useMutation({
    mutationFn: ({ listId, nodeColorHex }: { listId: number; nodeColorHex: string | null }) =>
      updateFocusList(listId, { node_color_hex: nodeColorHex }),
    onSuccess: invalidate,
  });

  const reparentEntryMutation = useMutation({
    mutationFn: ({ entryId, targetListId }: { entryId: number; targetListId: number }) =>
      updateFocusEntry(entryId, { list_id: targetListId }),
    onSuccess: invalidate,
  });

  const promoteEntryToListMutation = useMutation({
    mutationFn: (entryId: number) => updateFocusNode(entryId, { kind: "list" }),
    onSuccess: invalidate,
  });

  const updateNodeWorkOrderMutation = useMutation({
    mutationFn: ({ nodeId, workOrder }: { nodeId: number; workOrder: number | null }) =>
      updateFocusNode(nodeId, { work_order: workOrder }),
    onSuccess: invalidate,
  });

  const updateNodeStatusMutation = useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: number; status: FocusNodeStatus }) =>
      updateFocusNode(nodeId, { status }),
    onSuccess: invalidate,
  });

  const updateNodeTitleMutation = useMutation({
    mutationFn: ({ nodeId, title }: { nodeId: number; title: string }) =>
      updateFocusNode(nodeId, { title }),
    onSuccess: invalidate,
  });

  const updateNodeColorMutation = useMutation({
    mutationFn: ({ nodeId, colorHex }: { nodeId: number; colorHex: string | null }) =>
      updateFocusNode(nodeId, { node_color_hex: colorHex }),
    onSuccess: invalidate,
  });

  const updateNodeNotesMutation = useMutation({
    mutationFn: ({ nodeId, notes }: { nodeId: number; notes: string }) =>
      updateFocusNode(nodeId, { notes }),
    onSuccess: invalidate,
  });

  const updateNodeTagsMutation = useMutation({
    mutationFn: ({ nodeId, tagIds }: { nodeId: number; tagIds: number[] }) =>
      updateFocusNode(nodeId, { tag_ids: tagIds }),
    onSuccess: invalidate,
  });

  const updateNodeShowReferenceContentMutation = useMutation({
    mutationFn: ({
      nodeId,
      showReferenceContent,
    }: {
      nodeId: number;
      showReferenceContent: boolean;
    }) => updateFocusNode(nodeId, { show_reference_content: showReferenceContent }),
    onSuccess: invalidate,
  });

  const orphanListLinkMutation = useMutation({
    mutationFn: (entryId: number) => deleteFocusEntry(entryId),
    onSuccess: invalidate,
  });

  const connectStandaloneListMutation = useMutation({
    mutationFn: ({
      listId,
      targetListId,
      title,
    }: {
      listId: number;
      targetListId: number;
      title: string;
    }) =>
      createFocusEntry({
        title,
        list_id: targetListId,
        kind: "list_link",
        linked_list_id: listId,
      }),
    onSuccess: invalidate,
  });

  const createEntryMutation = useMutation({
    mutationFn: (payload: FocusEntryCreatePayload) => createFocusEntry(payload),
    onSuccess: invalidate,
  });

  const createRecordMutation = useMutation({
    mutationFn: ({
      parentId,
      result,
      status,
    }: {
      parentId: number;
      result: FocusReferenceSearchResult;
      status?: FocusNodeStatus;
    }) => createFocusRecord(parentId, result, status),
    onSuccess: invalidate,
  });

  return {
    invalidate,
    createListMutation,
    deleteListMutation,
    updateListColorMutation,
    reparentEntryMutation,
    promoteEntryToListMutation,
    updateNodeWorkOrderMutation,
    updateNodeStatusMutation,
    updateNodeTitleMutation,
    updateNodeColorMutation,
    updateNodeNotesMutation,
    updateNodeTagsMutation,
    updateNodeShowReferenceContentMutation,
    orphanListLinkMutation,
    connectStandaloneListMutation,
    createEntryMutation,
    createRecordMutation,
  };
}
