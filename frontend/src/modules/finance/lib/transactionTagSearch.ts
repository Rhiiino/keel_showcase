// keel_web/src/modules/shop/lib/transactionTagSearch.ts

import type { FinanceTransactionTag } from "../api";

export function financeTransactionTagMatchesSearch(tag: FinanceTransactionTag, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return tag.name.toLowerCase().includes(trimmed);
}

export function filterFinanceTransactionTags(tags: FinanceTransactionTag[], query: string): FinanceTransactionTag[] {
  return tags.filter((tag) => financeTransactionTagMatchesSearch(tag, query));
}

export function sortFinanceTransactionTags(tags: FinanceTransactionTag[]): FinanceTransactionTag[] {
  return [...tags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
