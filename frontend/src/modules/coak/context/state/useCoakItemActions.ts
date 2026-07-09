// keel_web/src/modules/coak/context/state/useCoakItemActions.ts

import { useCallback } from "react";

import { uploadMedia, type MediaObject } from "../../../media/api";
import {
  COAK_ORIGIN_NODE_ID,
  coakItemNodeId,
  parseCoakItemNodeId,
  type CoakItem,
} from "../../api";
import { getCoakItemKindDefinition } from "../../lib/coakItemKindRegistry";
import {
  buildCoakSiblingSortOrderUpdatesForOrder,
  collectCoakSiblingItemIds,
  resolveCoakSiblingOrderAfterInsert,
} from "../../lib/tabs/directory/coakSiblingSortOrder";
import { isCoakFolderExpanded, resolveUniqueSiblingName } from "../../lib/tabs/directory/coakTree";
import type { CoakItemEditorState } from "./useCoakItemEditorState";
import type { CoakItemMutations } from "./useCoakItemMutations";
import type { CoakWorkspaceData } from "./useCoakWorkspaceData";

type UseCoakItemActionsParams = Pick<
  CoakWorkspaceData,
  "items" | "toggleFolderExpanded" | "workspaceState" | "pinItem" | "unpinItem" | "unpinAllItems"
> &
  Pick<
    CoakItemMutations,
    "createItemMutation" | "updateItemMutation" | "deleteItemMutation" | "updateRecordMutation"
  > &
  Pick<
    CoakItemEditorState,
    | "openItemEditor"
    | "setItemEditorNodeIds"
    | "setItemEditorAnchors"
  >;

export function useCoakItemActions({
  items,
  toggleFolderExpanded,
  workspaceState,
  pinItem,
  unpinItem,
  unpinAllItems,
  createItemMutation,
  updateItemMutation,
  deleteItemMutation,
  updateRecordMutation,
  openItemEditor,
  setItemEditorNodeIds,
  setItemEditorAnchors,
}: UseCoakItemActionsParams) {
  const createFolder = useCallback(
    async (name: string, parentId: number | null = null) => {
      const uniqueName = resolveUniqueSiblingName(items, parentId, name);
      await createItemMutation.mutateAsync({
        kind: "folder",
        name: uniqueName,
        parent_id: parentId,
      });
    },
    [createItemMutation, items],
  );

  const createNote = useCallback(
    async (name: string, parentId: number | null = null) => {
      const uniqueName = resolveUniqueSiblingName(items, parentId, name);
      await createItemMutation.mutateAsync({
        kind: "note",
        name: uniqueName,
        parent_id: parentId,
        note_body: "",
      });
    },
    [createItemMutation, items],
  );

  const createFlash = useCallback(
    async (name: string, parentId: number | null = null) => {
      const uniqueName = resolveUniqueSiblingName(items, parentId, name);
      await createItemMutation.mutateAsync({
        kind: "flash",
        name: uniqueName,
        parent_id: parentId,
        flash_front: "",
        flash_back: "",
      });
    },
    [createItemMutation, items],
  );

  const ensureFolderExpanded = useCallback(
    (folderId: number) => {
      if (!isCoakFolderExpanded(workspaceState.expanded_folder_ids, folderId)) {
        toggleFolderExpanded(folderId);
      }
    },
    [toggleFolderExpanded, workspaceState.expanded_folder_ids],
  );

  const createChildItemPayload = useCallback(
    (
      kind: "folder" | "note" | "flash",
      parentId: number | null,
    ): Parameters<typeof createItemMutation.mutateAsync>[0] => {
      const uniqueName = resolveUniqueSiblingName(
        items,
        parentId,
        getCoakItemKindDefinition(kind).createDefaultName,
      );

      if (kind === "folder") {
        return { kind: "folder", name: uniqueName, parent_id: parentId };
      }

      if (kind === "note") {
        return {
          kind: "note",
          name: uniqueName,
          parent_id: parentId,
          note_body: "",
        };
      }

      return {
        kind: "flash",
        name: uniqueName,
        parent_id: parentId,
        flash_front: "",
        flash_back: "",
      };
    },
    [items],
  );

  const createChildItem = useCallback(
    async (kind: "folder" | "note" | "flash", parentId: number): Promise<CoakItem> => {
      ensureFolderExpanded(parentId);
      return createItemMutation.mutateAsync(createChildItemPayload(kind, parentId));
    },
    [createChildItemPayload, createItemMutation, ensureFolderExpanded],
  );

  const createChildItemAndOpenEditor = useCallback(
    async (
      kind: "folder" | "note" | "flash",
      parentId: number | null,
      options?: { focusTitle?: boolean; orbit?: boolean },
    ) => {
      if (parentId != null) {
        ensureFolderExpanded(parentId);
      }

      const created = await createItemMutation.mutateAsync(
        createChildItemPayload(kind, parentId),
      );

      openItemEditor(coakItemNodeId(created.id), {
        orbit: options?.orbit ?? true,
        replace: true,
        focusTitle: options?.focusTitle ?? true,
      });
    },
    [createChildItemPayload, createItemMutation, ensureFolderExpanded, openItemEditor],
  );

  const attachFileToItem = useCallback(
    async (itemId: number, file: File) => {
      const media = await uploadMedia(file);
      await updateItemMutation.mutateAsync({
        itemId,
        payload: { media_id: media.id },
      });
    },
    [updateItemMutation],
  );

  const attachMediaToItem = useCallback(
    async (itemId: number, media: MediaObject) => {
      await updateItemMutation.mutateAsync({
        itemId,
        payload: { media_id: media.id },
      });
    },
    [updateItemMutation],
  );

  const replaceItemFile = useCallback(
    async (itemId: number, file: File) => {
      await attachFileToItem(itemId, file);
    },
    [attachFileToItem],
  );

  const replaceItemMedia = useCallback(
    async (itemId: number, media: MediaObject) => {
      await updateItemMutation.mutateAsync({
        itemId,
        payload: { media_id: media.id },
      });
    },
    [updateItemMutation],
  );

  const removeItemFile = useCallback(
    async (itemId: number) => {
      await updateItemMutation.mutateAsync({
        itemId,
        payload: { media_id: null },
      });
    },
    [updateItemMutation],
  );

  const renameItem = useCallback(
    async (itemId: number, name: string) => {
      await updateItemMutation.mutateAsync({ itemId, payload: { name } });
    },
    [updateItemMutation],
  );

  const promoteNoteToFolder = useCallback(
    async (itemId: number) => {
      await updateItemMutation.mutateAsync({ itemId, payload: { kind: "folder" } });
      if (!isCoakFolderExpanded(workspaceState.expanded_folder_ids, itemId)) {
        toggleFolderExpanded(itemId);
      }
    },
    [toggleFolderExpanded, updateItemMutation, workspaceState.expanded_folder_ids],
  );

  const recolorItem = useCallback(
    async (itemId: number, colorHex: string) => {
      await updateItemMutation.mutateAsync({ itemId, payload: { color_hex: colorHex } });
    },
    [updateItemMutation],
  );

  const updateItemTags = useCallback(
    async (itemId: number, tagIds: number[]) => {
      await updateItemMutation.mutateAsync({ itemId, payload: { tag_ids: tagIds } });
    },
    [updateItemMutation],
  );

  const updateNoteBody = useCallback(
    async (itemId: number, noteBody: string) => {
      await updateItemMutation.mutateAsync({ itemId, payload: { note_body: noteBody } });
    },
    [updateItemMutation],
  );

  const updateFlashContent = useCallback(
    async (
      itemId: number,
      content: { flash_front?: string; flash_back?: string },
    ) => {
      await updateItemMutation.mutateAsync({ itemId, payload: content });
    },
    [updateItemMutation],
  );

  const moveItem = useCallback(
    async (itemId: number, parentId: number | null, sortOrder?: number) => {
      await updateItemMutation.mutateAsync({
        itemId,
        payload: {
          parent_id: parentId,
          ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
        },
      });
    },
    [updateItemMutation],
  );

  const reorderSiblings = useCallback(
    async (parentId: number | null, draggedId: number, insertIndex: number) => {
      const siblingIds = collectCoakSiblingItemIds(items, parentId);
      const orderedIds = resolveCoakSiblingOrderAfterInsert(siblingIds, draggedId, insertIndex);
      if (orderedIds == null) {
        return;
      }

      const draggedItem = items.find((item) => item.id === draggedId);
      const parentChanged = draggedItem != null && draggedItem.parent_id !== parentId;
      const updates = buildCoakSiblingSortOrderUpdatesForOrder(items, orderedIds);

      for (const update of updates) {
        await updateItemMutation.mutateAsync({
          itemId: update.itemId,
          payload: {
            ...(update.itemId === draggedId && parentChanged ? { parent_id: parentId } : {}),
            sort_order: update.sortOrder,
          },
        });
      }

      if (parentChanged && !updates.some((update) => update.itemId === draggedId)) {
        await updateItemMutation.mutateAsync({
          itemId: draggedId,
          payload: {
            parent_id: parentId,
            sort_order: orderedIds.indexOf(draggedId),
          },
        });
      }
    },
    [items, updateItemMutation],
  );

  const pinNode = useCallback(
    (nodeId: string) => {
      if (nodeId === COAK_ORIGIN_NODE_ID) {
        return;
      }

      const itemId = parseCoakItemNodeId(nodeId);
      if (itemId == null) {
        return;
      }

      setItemEditorNodeIds((current) => current.filter((id) => id !== nodeId));
      setItemEditorAnchors((current) => {
        if (!(nodeId in current)) {
          return current;
        }
        const { [nodeId]: _removed, ...rest } = current;
        return rest;
      });
      pinItem(itemId);
    },
    [pinItem, setItemEditorAnchors, setItemEditorNodeIds],
  );

  const unpinNode = useCallback(
    (nodeId: string) => {
      const itemId = parseCoakItemNodeId(nodeId);
      if (itemId == null) {
        return;
      }
      unpinItem(itemId);
    },
    [unpinItem],
  );

  const unpinAllNodes = useCallback(() => {
    unpinAllItems();
  }, [unpinAllItems]);

  const deleteItem = useCallback(
    async (itemId: number) => {
      const nodeId = coakItemNodeId(itemId);
      unpinItem(itemId);
      setItemEditorNodeIds((current) => current.filter((id) => id !== nodeId));
      setItemEditorAnchors((current) => {
        if (!(nodeId in current)) {
          return current;
        }
        const { [nodeId]: _removed, ...rest } = current;
        return rest;
      });
      await deleteItemMutation.mutateAsync(itemId);
    },
    [deleteItemMutation, setItemEditorAnchors, setItemEditorNodeIds, unpinItem],
  );

  const updateRecordName = useCallback(
    async (name: string) => {
      await updateRecordMutation.mutateAsync({ name });
    },
    [updateRecordMutation],
  );

  const updateRecordColor = useCallback(
    async (colorHex: string) => {
      await updateRecordMutation.mutateAsync({ color_hex: colorHex });
    },
    [updateRecordMutation],
  );

  return {
    createFolder,
    createNote,
    createFlash,
    createChildItem,
    createChildItemAndOpenEditor,
    attachFileToItem,
    attachMediaToItem,
    replaceItemFile,
    replaceItemMedia,
    removeItemFile,
    renameItem,
    promoteNoteToFolder,
    recolorItem,
    updateItemTags,
    updateNoteBody,
    updateFlashContent,
    moveItem,
    reorderSiblings,
    pinNode,
    unpinNode,
    unpinAllNodes,
    deleteItem,
    updateRecordName,
    updateRecordColor,
  };
}

export type CoakItemActions = ReturnType<typeof useCoakItemActions>;
