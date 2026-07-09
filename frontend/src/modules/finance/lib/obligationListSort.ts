// keel_web/src/modules/finance/lib/obligationListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { FinanceObligation, FinanceVendor } from "../api";
import {
  OBLIGATION_STATUS_LABELS,
  isFinanceObligationStatus,
  type FinanceObligationStatus,
} from "./obligation";

export type FinanceObligationSortColumn =
  | "name"
  | "vendor"
  | "amount"
  | "next_billing"
  | "account"
  | "tags"
  | "status";

export const FINANCE_OBLIGATION_DEFAULT_SORT: ListColumnSortState<FinanceObligationSortColumn> = {
  column: "name",
  direction: "asc",
};

export function getObligationSortValue(
  obligation: FinanceObligation,
  column: FinanceObligationSortColumn,
  vendorById: Map<number, FinanceVendor>,
): string | number | null {
  switch (column) {
    case "name":
      return obligation.name;
    case "vendor": {
      if (obligation.vendor_id) {
        const vendor = vendorById.get(obligation.vendor_id);
        return vendor?.name ?? obligation.vendor_name ?? obligation.vendor_id;
      }
      return obligation.vendor_name;
    }
    case "amount":
      return obligation.amount ? Number(obligation.amount) : null;
    case "next_billing":
      return obligation.next_billing_at;
    case "account":
      return obligation.payment_method_label;
    case "tags":
      return obligation.tags.map((tag) => tag.name).join(", ") || null;
    case "status":
      return isFinanceObligationStatus(obligation.status)
        ? OBLIGATION_STATUS_LABELS[obligation.status as FinanceObligationStatus]
        : obligation.status;
    default:
      return null;
  }
}
