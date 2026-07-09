// keel_web/src/modules/focus/lib/constellation/graph/nodes.ts

import type { FocusEntry } from "../../../api";
import { isFocusNodeStatus } from "../../focus";
import type { FocusNodeStatus } from "../../focus";
import type { ConstellationGraphIndexes, ConstellationGraphNode } from "./types";
import { entryNodeId, listNodeId } from "./ids";

function resolveFocusGraphStatus(status: string): FocusNodeStatus {
  return isFocusNodeStatus(status) ? status : "active";
}

export function buildListGraphNode(
  list: import("../../../api").FocusList,
  isOrigin: boolean,
): ConstellationGraphNode {
  return {
    id: listNodeId(list.id),
    kind: "list",
    entityId: list.id,
    title: list.title,
    notes: list.notes,
    colorHex: list.node_color_hex,
    titleFontKey: list.title_font_key,
    status: resolveFocusGraphStatus(list.status),
    workOrder: list.work_order,
    tags: list.tags,
    isOrigin,
    listId: list.id,
  };
}

function resolveEntryNotes(entry: FocusEntry): string {
  if (entry.kind === "list_link") {
    return entry.notes || entry.linked_list?.notes || "";
  }
  return entry.notes ?? "";
}

export function buildEntryGraphNode(entry: FocusEntry): ConstellationGraphNode {
  const colorHex =
    entry.kind === "list_link"
      ? entry.linked_list?.node_color_hex ?? null
      : entry.kind === "record"
        ? entry.node_color_hex ?? null
      : null;
  const titleFontKey =
    entry.kind === "list_link"
      ? entry.linked_list?.title_font_key ?? null
      : entry.kind === "record"
        ? entry.title_font_key ?? null
      : null;
  const tags = entry.kind === "list_link" ? entry.linked_list?.tags ?? entry.tags : entry.tags;

  return {
    id: entryNodeId(entry.id),
    kind: "entry",
    entityId: entry.id,
    title: entry.title,
    notes: resolveEntryNotes(entry),
    colorHex,
    titleFontKey,
    status: resolveFocusGraphStatus(entry.status),
    workOrder: entry.work_order,
    tags,
    isOrigin: false,
    entryKind: entry.kind,
    linkedListId: entry.linked_list_id,
    listId: entry.list_id,
    referenceTargetType: entry.reference_target_type ?? null,
    referenceTargetId: entry.reference_target_id ?? null,
    referenceIsMissing: entry.reference_is_missing ?? false,
    referenceMimeType: entry.reference_mime_type ?? null,
    referenceMediaKind: entry.reference_media_kind ?? null,
    referenceContentUpdatedAt: entry.reference_content_updated_at ?? null,
    showReferenceContent: entry.show_reference_content ?? false,
  };
}

export function targetListIdForNode(node: ConstellationGraphNode): number | null {
  if (node.kind === "list") {
    return node.listId ?? null;
  }
  if (node.entryKind === "list_link") {
    return node.linkedListId ?? null;
  }
  if (node.entryKind === "record") {
    return node.entityId;
  }
  return null;
}

/** @alias targetListIdForNode */
export function targetContainerIdForNode(node: ConstellationGraphNode): number | null {
  return targetListIdForNode(node);
}

export function getChildEntries(
  node: ConstellationGraphNode,
  indexes: ConstellationGraphIndexes,
): FocusEntry[] {
  if (node.kind === "list" && node.listId !== undefined) {
    return indexes.entriesByListId.get(node.listId) ?? [];
  }

  if (
    node.kind === "entry" &&
    node.entryKind === "list_link" &&
    node.linkedListId !== null &&
    node.linkedListId !== undefined
  ) {
    return indexes.entriesByListId.get(node.linkedListId) ?? [];
  }

  if (node.kind === "entry" && node.entryKind === "record") {
    return indexes.entriesByListId.get(node.entityId) ?? [];
  }

  return [];
}

export function nodeHasExpandableChildren(
  node: ConstellationGraphNode,
  indexes: ConstellationGraphIndexes,
): boolean {
  return getChildEntries(node, indexes).length > 0;
}

export function findEntryById(
  indexes: ConstellationGraphIndexes,
  entryId: number,
): FocusEntry | null {
  for (const entries of indexes.entriesByListId.values()) {
    const match = entries.find((entry) => entry.id === entryId);
    if (match) {
      return match;
    }
  }
  return null;
}
