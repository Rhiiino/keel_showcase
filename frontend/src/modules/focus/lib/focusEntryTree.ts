// keel_web/src/modules/focus/lib/focusEntryTree.ts

// Pure helpers for staging Focus entry tree reorders and reparenting.

import type { FocusEntry } from "../api";
import { isFocusEntryKind } from "./focus";

export type FocusEntryContainerId = number;

export type FocusEntryTreeChildren = Map<FocusEntryContainerId, FocusEntry[]>;

export type FocusEntryTreeLocation = {
  parentId: FocusEntryContainerId;
  index: number;
};

export type FocusEntryPendingMove = {
  nodeId: number;
  parentId: FocusEntryContainerId;
  sortOrder: number;
  fromParentId: FocusEntryContainerId;
  fromSortOrder: number;
};

export function getFocusEntryContainerId(entry: FocusEntry): number | null {
  if (isFocusEntryKind(entry.kind) && entry.kind === "list_link") {
    return entry.linked_list_id;
  }
  if (isFocusEntryKind(entry.kind) && entry.kind === "record") {
    return entry.id;
  }
  return null;
}

export function sortFocusEntries(entries: readonly FocusEntry[]): FocusEntry[] {
  return [...entries].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export function cloneFocusEntryTree(
  children: FocusEntryTreeChildren,
): FocusEntryTreeChildren {
  return new Map(
    [...children.entries()].map(([containerId, entries]) => [
      containerId,
      entries.map((entry) => ({ ...entry })),
    ]),
  );
}

export function normalizeFocusEntryOrder(
  entries: readonly FocusEntry[],
  parentId: FocusEntryContainerId,
): FocusEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    list_id: parentId,
    sort_order: index,
  }));
}

export function indexFocusEntryTree(
  children: FocusEntryTreeChildren,
): Map<number, FocusEntryTreeLocation> {
  const index = new Map<number, FocusEntryTreeLocation>();
  for (const [parentId, entries] of children.entries()) {
    entries.forEach((entry, entryIndex) => {
      index.set(entry.id, { parentId, index: entryIndex });
    });
  }
  return index;
}

export function moveFocusEntryInTree({
  children,
  nodeId,
  toParentId,
  insertIndex,
}: {
  children: FocusEntryTreeChildren;
  nodeId: number;
  toParentId: FocusEntryContainerId;
  insertIndex: number;
}): FocusEntryTreeChildren {
  let movedEntry: FocusEntry | null = null;
  let fromParentId: FocusEntryContainerId | null = null;
  const next = cloneFocusEntryTree(children);

  for (const [parentId, entries] of next.entries()) {
    const fromIndex = entries.findIndex((entry) => entry.id === nodeId);
    if (fromIndex === -1) {
      continue;
    }
    [movedEntry] = entries.splice(fromIndex, 1);
    fromParentId = parentId;
    next.set(parentId, normalizeFocusEntryOrder(entries, parentId));
    break;
  }

  if (!movedEntry || fromParentId === null) {
    return children;
  }

  const destination = [...(next.get(toParentId) ?? [])];
  let targetIndex = insertIndex;
  if (fromParentId === toParentId) {
    const originalIndex = children.get(fromParentId)?.findIndex((entry) => entry.id === nodeId);
    if (originalIndex !== undefined && originalIndex !== -1 && originalIndex < insertIndex) {
      targetIndex -= 1;
    }
  }
  targetIndex = Math.max(0, Math.min(targetIndex, destination.length));
  destination.splice(targetIndex, 0, { ...movedEntry, list_id: toParentId });
  next.set(toParentId, normalizeFocusEntryOrder(destination, toParentId));

  return next;
}

export function isContainerDescendantOfEntry({
  children,
  entryId,
  containerId,
}: {
  children: FocusEntryTreeChildren;
  entryId: number;
  containerId: FocusEntryContainerId;
}): boolean {
  if (entryId === containerId) {
    return true;
  }

  const stack = [entryId];
  const visited = new Set<number>();
  while (stack.length > 0) {
    const currentContainerId = stack.pop();
    if (currentContainerId === undefined || visited.has(currentContainerId)) {
      continue;
    }
    visited.add(currentContainerId);
    for (const child of children.get(currentContainerId) ?? []) {
      const childContainerId = getFocusEntryContainerId(child);
      if (childContainerId === null) {
        continue;
      }
      if (childContainerId === containerId) {
        return true;
      }
      stack.push(childContainerId);
    }
  }
  return false;
}

export function collectFocusEntryPendingMoves({
  current,
  snapshot,
}: {
  current: FocusEntryTreeChildren;
  snapshot: FocusEntryTreeChildren;
}): FocusEntryPendingMove[] {
  const savedIndex = indexFocusEntryTree(snapshot);
  const pending: FocusEntryPendingMove[] = [];

  for (const [parentId, entries] of current.entries()) {
    entries.forEach((entry, index) => {
      const saved = savedIndex.get(entry.id);
      if (!saved) {
        return;
      }
      if (saved.parentId === parentId && saved.index === index) {
        return;
      }
      pending.push({
        nodeId: entry.id,
        parentId,
        sortOrder: index,
        fromParentId: saved.parentId,
        fromSortOrder: saved.index,
      });
    });
  }

  return pending;
}
