// stack_sandbox/frontend_web/src/modules/shop/lib/transactionSearch.ts

// Client-side search helpers for shop list and vendors list views.

import type { FinanceTransaction, FinanceVendor } from "../api";
import {
  KIND_LABELS,
  STATUS_LABELS,
  isFinanceTransactionKind,
  isFinanceTransactionStatus,
} from "./transaction";

export function normalizeShopSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function shopItemMatchesSearch(
  item: FinanceTransaction,
  query: string,
  vendorById: Map<number, FinanceVendor>,
): boolean {
  const needle = normalizeShopSearchQuery(query);
  if (!needle) {
    return true;
  }

  const vendor =
    item.vendor_id != null ? vendorById.get(item.vendor_id) ?? null : null;

  const statusLabel = isFinanceTransactionStatus(item.status)
    ? STATUS_LABELS[item.status]
    : item.status;
  const kindLabel = isFinanceTransactionKind(item.kind)
    ? KIND_LABELS[item.kind]
    : item.kind;

  const haystack = [
    item.title,
    item.notes,
    item.listing_url ?? "",
    item.vendor_name ?? "",
    item.obligation_name ?? "",
    vendor?.name ?? "",
    vendor?.website_url ?? "",
    vendor?.notes ?? "",
    statusLabel,
    kindLabel,
  ];

  return haystack.some((value) => value.toLowerCase().includes(needle));
}

export function financeVendorMatchesSearch(
  vendor: FinanceVendor,
  query: string,
): boolean {
  const needle = normalizeShopSearchQuery(query);
  if (!needle) {
    return true;
  }

  const haystack = [
    vendor.name,
    vendor.notes,
    vendor.website_url ?? "",
    vendor.default_currency ?? "",
  ];

  return haystack.some((value) => value.toLowerCase().includes(needle));
}

export function filterFinanceTransactionGroups<
  TGroup extends { status: string; items: FinanceTransaction[] },
>(
  grouped: readonly TGroup[],
  query: string,
  vendorById: Map<number, FinanceVendor>,
): TGroup[] {
  const needle = normalizeShopSearchQuery(query);
  if (!needle) {
    return [...grouped];
  }

  return grouped
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        shopItemMatchesSearch(item, needle, vendorById),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
