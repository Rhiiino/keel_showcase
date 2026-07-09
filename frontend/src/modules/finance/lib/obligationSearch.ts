// keel_web/src/modules/finance/lib/obligationSearch.ts

import type { FinanceObligation } from "../api";

function normalizeObligationSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function obligationMatchesSearch(
  obligation: FinanceObligation,
  query: string,
): boolean {
  const normalized = normalizeObligationSearchQuery(query);
  if (!normalized) {
    return true;
  }
  return [
    obligation.name,
    obligation.vendor_name,
    obligation.payment_method_label,
    obligation.notes,
    ...obligation.tags.map((tag) => tag.name),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalized));
}

export function filterFinanceObligations(
  obligations: FinanceObligation[],
  query: string,
): FinanceObligation[] {
  return obligations.filter((obligation) => obligationMatchesSearch(obligation, query));
}
