// keel_web/src/modules/focus/lib/constellation/graph/indexes.ts

import type { FocusEntry, FocusList } from "../../../api";
import type { ConstellationGraphIndexes } from "./types";

export function buildConstellationIndexes(
  lists: FocusList[],
  entries: FocusEntry[],
): ConstellationGraphIndexes {
  const listsById = new Map(lists.map((list) => [list.id, list]));
  const entriesByListId = new Map<number, FocusEntry[]>();

  for (const entry of entries) {
    const bucket = entriesByListId.get(entry.list_id) ?? [];
    bucket.push(entry);
    entriesByListId.set(entry.list_id, bucket);
  }

  for (const bucket of entriesByListId.values()) {
    bucket.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }

  const originList = lists.find((list) => list.is_origin) ?? null;

  return { listsById, entriesByListId, originList };
}

export function incomingLinkedListIds(
  indexes: ConstellationGraphIndexes,
): ReadonlySet<number> {
  const linkedListIds = new Set<number>();
  for (const entries of indexes.entriesByListId.values()) {
    for (const entry of entries) {
      if (entry.kind === "list_link" && entry.linked_list_id !== null) {
        linkedListIds.add(entry.linked_list_id);
      }
    }
  }
  return linkedListIds;
}

function isConstellationIslandList(
  list: FocusList,
  linkedListIds: ReadonlySet<number>,
): boolean {
  if (list.is_origin) {
    return false;
  }

  // Unparented in the node tree, or not linked into the expanded graph from origin.
  return list.parent_id == null || !linkedListIds.has(list.id);
}

/** Lists that can appear as unconnected roots on the constellation canvas. */
export function standaloneRootLists(
  indexes: ConstellationGraphIndexes,
): FocusList[] {
  const linkedListIds = incomingLinkedListIds(indexes);

  return [...indexes.listsById.values()].filter((list) =>
    isConstellationIslandList(list, linkedListIds),
  );
}
