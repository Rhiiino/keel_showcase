// keel_web/src/modules/focus/api/mappers.ts

import type {
  FocusEntry,
  FocusLinkedListSummary,
  FocusList,
  FocusNode,
} from "./types";

export function nodeToLinkedListSummary(node: FocusNode): FocusLinkedListSummary {
  return {
    id: node.id,
    title: node.title,
    notes: node.notes ?? "",
    node_color_hex: node.node_color_hex,
    title_font_key: node.title_font_key,
    entry_count: node.child_count,
    work_order: node.work_order,
    tags: node.tags,
  };
}

export function nodeToFocusList(node: FocusNode): FocusList {
  return {
    id: node.id,
    user_id: node.user_id,
    parent_id: node.parent_id,
    title: node.title,
    notes: node.notes ?? "",
    status: node.status ?? "active",
    work_order: node.work_order,
    sort_order: node.sort_order,
    node_color_hex: node.node_color_hex,
    title_font_key: node.title_font_key,
    is_origin: node.is_origin,
    item_count: node.child_count,
    tags: node.tags,
    created_at: node.created_at,
    updated_at: node.updated_at,
  };
}

export function nodeChildToFocusEntry(child: FocusNode, parentListId: number): FocusEntry {
  if (child.kind === "item") {
    return {
      id: child.id,
      user_id: child.user_id,
      list_id: parentListId,
      kind: "task",
      linked_list_id: null,
      linked_list: null,
      title: child.title,
      notes: child.notes ?? "",
      status: child.status ?? "active",
      work_order: child.work_order,
      tags: child.tags,
      sort_order: child.sort_order,
      child_count: child.child_count,
      completed_at: child.completed_at,
      created_at: child.created_at,
      updated_at: child.updated_at,
    };
  }

  if (child.kind === "record") {
    return {
      id: child.id,
      user_id: child.user_id,
      list_id: parentListId,
      kind: "record",
      linked_list_id: null,
      linked_list: null,
      title: child.reference_target?.title ?? child.title,
      notes: child.notes ?? "",
      status: child.status ?? "active",
      work_order: child.work_order,
      tags: child.tags,
      sort_order: child.sort_order,
      child_count: child.child_count,
      node_color_hex: child.node_color_hex,
      title_font_key: child.title_font_key,
      completed_at: child.completed_at,
      created_at: child.created_at,
      updated_at: child.updated_at,
      reference_target_type: child.reference_target?.target_type ?? null,
      reference_target_id: child.reference_target?.target_id ?? null,
      reference_is_missing: child.reference_target?.is_missing ?? false,
      reference_mime_type: child.reference_target?.mime_type ?? null,
      reference_media_kind: child.reference_target?.media_kind ?? null,
      reference_content_updated_at: child.reference_target?.content_updated_at ?? null,
      show_reference_content: child.show_reference_content ?? false,
    };
  }

  return {
    id: child.id,
    user_id: child.user_id,
    list_id: parentListId,
    kind: "list_link",
    linked_list_id: child.id,
    linked_list: nodeToLinkedListSummary(child),
    title: child.title,
    notes: child.notes ?? "",
    status: child.status ?? "active",
    work_order: child.work_order,
    tags: child.tags,
    sort_order: child.sort_order,
    child_count: child.child_count,
    completed_at: child.completed_at,
    created_at: child.created_at,
    updated_at: child.updated_at,
  };
}
