// keel_web/src/modules/focus/api/entries.ts

import type { FocusEntryKind, FocusEntryStatus, FocusNodeStatus } from "../lib/focus";
import type {
  FocusEntry,
  FocusEntryCreatePayload,
  FocusEntryReorderEntry,
  FocusEntryUpdatePayload,
  FocusReferenceSearchResult,
} from "./types";
import { nodeChildToFocusEntry } from "./mappers";
import {
  completeFocusNode,
  createFocusNode,
  deleteFocusNode,
  fetchFocusNode,
  fetchFocusNodes,
  reorderFocusNodes,
  updateFocusNode,
} from "./nodes";

export async function fetchFocusEntries(filters?: {
  list_id?: number | null;
  status?: FocusEntryStatus;
  kind?: FocusEntryKind;
}): Promise<FocusEntry[]> {
  if (filters?.list_id !== undefined && filters.list_id !== null) {
    const children = await fetchFocusNodes({ parent_id: filters.list_id });
    return children
      .filter((child) => {
        if (filters.kind === "task") {
          return child.kind === "item";
        }
        if (filters.kind === "list_link") {
          return child.kind === "list";
        }
        return child.kind === "item" || child.kind === "list" || child.kind === "record";
      })
      .map((child) => nodeChildToFocusEntry(child, filters.list_id!));
  }

  const nodes = await fetchFocusNodes();
  const entries: FocusEntry[] = [];

  for (const node of nodes) {
    if (node.parent_id === null) {
      continue;
    }
    if (node.kind === "item" || node.kind === "list" || node.kind === "record") {
      entries.push(nodeChildToFocusEntry(node, node.parent_id));
    }
  }

  if (filters?.status) {
    return entries.filter((entry) => entry.status === filters.status);
  }
  if (filters?.kind) {
    return entries.filter((entry) => entry.kind === filters.kind);
  }
  return entries;
}

export async function createFocusEntry(
  payload: FocusEntryCreatePayload,
): Promise<FocusEntry> {
  if (payload.kind === "list_link" && payload.linked_list) {
    const linkedList = await createFocusNode({
      kind: "list",
      title: payload.title,
      parent_id: payload.list_id,
      status: payload.status,
      notes: payload.linked_list.notes,
      node_color_hex: payload.linked_list.node_color_hex,
      title_font_key: payload.linked_list.title_font_key,
      tag_ids: payload.linked_list.tag_ids,
    });
    return nodeChildToFocusEntry(linkedList, payload.list_id);
  }

  if (payload.kind === "list_link" && payload.linked_list_id) {
    const linkedList = await updateFocusNode(payload.linked_list_id, {
      parent_id: payload.list_id,
      title: payload.title,
    });
    return nodeChildToFocusEntry(linkedList, payload.list_id);
  }

  const item = await createFocusNode({
    kind: "item",
    title: payload.title,
    parent_id: payload.list_id,
    notes: payload.notes,
    status: payload.status,
    work_order: payload.work_order,
    sort_order: payload.sort_order,
  });
  return nodeChildToFocusEntry(item, payload.list_id);
}

export async function createFocusRecord(
  parentId: number,
  result: FocusReferenceSearchResult,
  status?: FocusNodeStatus,
) {
  return createFocusNode({
    kind: "record",
    title: result.title,
    parent_id: parentId,
    status,
    reference_target_type: result.target_type,
    reference_target_id: result.target_id,
  });
}

export async function updateFocusEntry(
  entryId: number,
  payload: FocusEntryUpdatePayload,
): Promise<FocusEntry> {
  const node = await updateFocusNode(entryId, {
    title: payload.title,
    parent_id: payload.list_id,
    notes: payload.notes,
    status: payload.status,
    work_order: payload.work_order,
    sort_order: payload.sort_order,
  });

  const parentListId = node.parent_id ?? payload.list_id ?? entryId;
  return nodeChildToFocusEntry(node, parentListId);
}

export async function completeFocusEntry(entryId: number): Promise<FocusEntry> {
  const node = await completeFocusNode(entryId);
  if (node.parent_id === null) {
    throw new Error("Completed node has no parent list.");
  }
  return nodeChildToFocusEntry(node, node.parent_id);
}

export async function deleteFocusEntry(entryId: number): Promise<void> {
  const node = await fetchFocusNode(entryId);
  if (node.kind === "list" && node.parent_id !== null) {
    await updateFocusNode(entryId, { parent_id: null });
    return;
  }
  await deleteFocusNode(entryId);
}

export async function reorderFocusEntries(
  entries: FocusEntryReorderEntry[],
): Promise<FocusEntry[]> {
  const nodes = await reorderFocusNodes(entries);
  return nodes.flatMap((node) => {
    if (node.parent_id === null) {
      return [];
    }
    return [nodeChildToFocusEntry(node, node.parent_id)];
  });
}
