// keel_web/src/modules/contacts/lib/contactTagSearch.ts

import type { ContactTag } from "../api";

export function contactTagMatchesSearch(tag: ContactTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterContactTags(tags: ContactTag[], query: string): ContactTag[] {
  return tags.filter((tag) => contactTagMatchesSearch(tag, query));
}

export function sortContactTags(tags: ContactTag[]): ContactTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
