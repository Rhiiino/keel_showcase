// keel_web/src/modules/projects/lib/project/projectTagSearch.ts

import type { ProjectTag } from "../../api";

export function projectTagMatchesSearch(tag: ProjectTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterProjectTags(tags: ProjectTag[], query: string): ProjectTag[] {
  return tags.filter((tag) => projectTagMatchesSearch(tag, query));
}

export function sortProjectTags(tags: ProjectTag[]): ProjectTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
