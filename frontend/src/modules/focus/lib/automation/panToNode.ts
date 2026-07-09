// keel_web/src/modules/focus/lib/automation/panToNode.ts

import type { ConstellationLayoutNode } from "../constellation/graph";
import {
  entryNodeId,
  findEntryById,
  listNodeId,
  type ConstellationGraphIndexes,
} from "../constellation/graph";

export function findListLinkEntryId(
  indexes: ConstellationGraphIndexes,
  listId: number,
): number | null {
  for (const entries of indexes.entriesByListId.values()) {
    const match = entries.find(
      (entry) => entry.kind === "list_link" && entry.linked_list_id === listId,
    );
    if (match) {
      return match.id;
    }
  }
  return null;
}

/** Resolve a Focus node id to the canvas node id currently used for expand/highlight. */
export function resolveCanvasNodeIdForFocusNode(
  focusNodeId: number,
  layoutNodes: ConstellationLayoutNode[],
  indexes: ConstellationGraphIndexes | null = null,
): string | null {
  return resolveVisibleCanvasNodeIdForFocusNode(focusNodeId, layoutNodes, indexes);
}

/** Prefer the rendered canvas node for a focus id (nested list-links beat standalone lists). */
export function resolveVisibleCanvasNodeIdForFocusNode(
  focusNodeId: number,
  layoutNodes: ConstellationLayoutNode[],
  indexes: ConstellationGraphIndexes | null = null,
): string | null {
  const listLinkMatches = layoutNodes.filter(
    (node) =>
      node.kind === "entry" &&
      node.entryKind === "list_link" &&
      node.linkedListId === focusNodeId,
  );
  const nestedListLink = listLinkMatches.find((node) => node.parentId);
  if (nestedListLink) {
    return nestedListLink.id;
  }
  if (listLinkMatches[0]) {
    return listLinkMatches[0].id;
  }

  const recordLayout = layoutNodes.find(
    (node) =>
      node.kind === "entry" &&
      node.entryKind === "record" &&
      node.entityId === focusNodeId,
  );
  if (recordLayout) {
    return recordLayout.id;
  }

  const entryLayout = layoutNodes.find(
    (node) => node.kind === "entry" && node.entityId === focusNodeId,
  );
  if (entryLayout) {
    return entryLayout.id;
  }

  const listLayout = layoutNodes.find(
    (node) => node.kind === "list" && node.entityId === focusNodeId,
  );
  if (listLayout) {
    return listLayout.id;
  }

  if (!indexes) {
    return null;
  }

  if (indexes.listsById.has(focusNodeId)) {
    const listLinkEntryId = findListLinkEntryId(indexes, focusNodeId);
    if (listLinkEntryId !== null) {
      return entryNodeId(listLinkEntryId);
    }
    return listNodeId(focusNodeId);
  }

  if (findEntryById(indexes, focusNodeId)) {
    return entryNodeId(focusNodeId);
  }

  return null;
}

/** Resolve canvas node id from graph indexes alone (reliable regardless of layout/visibility). */
export function resolveCanvasNodeIdFromIndexes(
  focusNodeId: number,
  indexes: ConstellationGraphIndexes,
): string | null {
  const listLinkEntryId = findListLinkEntryId(indexes, focusNodeId);
  if (listLinkEntryId !== null) {
    return entryNodeId(listLinkEntryId);
  }

  if (indexes.listsById.has(focusNodeId)) {
    return listNodeId(focusNodeId);
  }

  if (findEntryById(indexes, focusNodeId)) {
    return entryNodeId(focusNodeId);
  }

  return null;
}

function collectContainerAncestorCanvasNodeIds(
  listId: number,
  indexes: ConstellationGraphIndexes,
): string[] {
  const ancestors: string[] = [];
  const listLinkEntryId = findListLinkEntryId(indexes, listId);
  if (listLinkEntryId === null) {
    return ancestors;
  }

  const parentEntry = findEntryById(indexes, listLinkEntryId);
  ancestors.push(entryNodeId(listLinkEntryId));

  if (
    parentEntry &&
    indexes.originList &&
    parentEntry.list_id !== indexes.originList.id
  ) {
    ancestors.unshift(...collectContainerAncestorCanvasNodeIds(parentEntry.list_id, indexes));
  }

  return ancestors;
}

/** Origin + container ancestors that must be expanded before a target node is visible. */
export function collectAncestorCanvasNodeIdsForExpansion(
  targetCanvasNodeId: string,
  indexes: ConstellationGraphIndexes,
): string[] {
  const ancestors: string[] = [];
  if (indexes.originList) {
    ancestors.push(listNodeId(indexes.originList.id));
  }

  if (targetCanvasNodeId.startsWith("entry:")) {
    const entryId = Number(targetCanvasNodeId.slice("entry:".length));
    const entry = findEntryById(indexes, entryId);
    if (entry && indexes.originList && entry.list_id !== indexes.originList.id) {
      ancestors.push(...collectContainerAncestorCanvasNodeIds(entry.list_id, indexes));
    }
  }

  return [...new Set(ancestors)];
}
