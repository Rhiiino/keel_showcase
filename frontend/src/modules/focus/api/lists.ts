// keel_web/src/modules/focus/api/lists.ts

import { nodeChildToFocusEntry, nodeToFocusList } from "./mappers";
import {
  createFocusNode,
  deleteFocusNode,
  fetchFocusNode,
  fetchFocusNodes,
  updateFocusNode,
} from "./nodes";
import type {
  FocusList,
  FocusListCreatePayload,
  FocusListDetail,
  FocusListStatus,
  FocusListUpdatePayload,
} from "./types";

export async function fetchFocusLists(
  filters?: { status?: FocusListStatus },
): Promise<FocusList[]> {
  const nodes = await fetchFocusNodes({
    hub_lists_only: true,
    status: filters?.status,
  });
  return nodes.filter((node) => node.kind === "list").map(nodeToFocusList);
}

export async function fetchFocusConstellationLists(): Promise<FocusList[]> {
  const nodes = await fetchFocusNodes({ kind: "list" });
  return nodes.map(nodeToFocusList);
}

export async function fetchFocusList(listId: number): Promise<FocusListDetail> {
  const node = await fetchFocusNode(listId, { include_subtree: true });
  const list = nodeToFocusList(node);
  const entries = node.children.map((child) => nodeChildToFocusEntry(child, list.id));
  return {
    ...list,
    kind: node.kind,
    reference_target: node.reference_target,
    entries,
  };
}

export async function createFocusList(
  payload: FocusListCreatePayload,
): Promise<FocusList> {
  const node = await createFocusNode({
    kind: "list",
    title: payload.title,
    parent_id: payload.parent_id,
    sort_order: payload.sort_order,
    notes: payload.notes,
    status: payload.status,
    work_order: payload.work_order,
    node_color_hex: payload.node_color_hex,
    title_font_key: payload.title_font_key,
    tag_ids: payload.tag_ids,
  });
  return nodeToFocusList(node);
}

export async function updateFocusList(
  listId: number,
  payload: FocusListUpdatePayload,
): Promise<FocusList> {
  const node = await updateFocusNode(listId, {
    title: payload.title,
    parent_id: payload.parent_id,
    sort_order: payload.sort_order,
    notes: payload.notes,
    status: payload.status,
    work_order: payload.work_order,
    node_color_hex: payload.node_color_hex,
    title_font_key: payload.title_font_key,
    tag_ids: payload.tag_ids,
  });
  return nodeToFocusList(node);
}

export async function deleteFocusList(listId: number): Promise<void> {
  await deleteFocusNode(listId);
}
