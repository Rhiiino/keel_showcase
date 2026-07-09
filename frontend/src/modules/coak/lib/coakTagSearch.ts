// keel_web/src/modules/coak/lib/coakTagSearch.ts

import type { CoakTag } from "../api";

export function coakTagMatchesSearch(tag: CoakTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterCoakTags(tags: CoakTag[], query: string): CoakTag[] {
  return tags.filter((tag) => coakTagMatchesSearch(tag, query));
}

export function sortCoakTags(tags: CoakTag[]): CoakTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
