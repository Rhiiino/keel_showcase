// keel_web/src/modules/shop/lib/obligationTagSearch.ts

import type { FinanceObligationTag } from "../api";

export function financeObligationTagMatchesSearch(tag: FinanceObligationTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterFinanceObligationTags(tags: FinanceObligationTag[], query: string): FinanceObligationTag[] {
  return tags.filter((tag) => financeObligationTagMatchesSearch(tag, query));
}

export function sortFinanceObligationTags(tags: FinanceObligationTag[]): FinanceObligationTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
