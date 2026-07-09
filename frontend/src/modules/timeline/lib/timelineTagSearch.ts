// keel_web/src/modules/timeline/lib/timelineTagSearch.ts

import type { TimelineTag } from "../api";

export function timelineTagMatchesSearch(tag: TimelineTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterTimelineTags(tags: TimelineTag[], query: string): TimelineTag[] {
  return tags.filter((tag) => timelineTagMatchesSearch(tag, query));
}

export function sortTimelineTags(tags: TimelineTag[]): TimelineTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
