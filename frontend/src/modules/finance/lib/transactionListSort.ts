// keel_web/src/modules/finance/lib/transactionListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { FinanceTransaction, FinanceVendor } from "../api";
import {
  KIND_LABELS,
  STATUS_LABELS,
  isFinanceTransactionKind,
  isFinanceTransactionStatus,
  type FinanceTransactionKind,
  type FinanceTransactionStatus,
} from "./transaction";

export type FinanceTransactionSortColumn =
  | "ordered_at"
  | "title"
  | "status"
  | "vendor"
  | "kind"
  | "price"
  | "tags";

export const FINANCE_TRANSACTION_DEFAULT_SORT: ListColumnSortState<FinanceTransactionSortColumn> = {
  column: "title",
  direction: "asc",
};

export function getFinanceTransactionSortValue(
  item: FinanceTransaction,
  column: FinanceTransactionSortColumn,
  vendorById: Map<number, FinanceVendor>,
): string | number | null {
  switch (column) {
    case "ordered_at":
      return item.ordered_at;
    case "title":
      return item.title;
    case "status":
      return isFinanceTransactionStatus(item.status)
        ? STATUS_LABELS[item.status as FinanceTransactionStatus]
        : item.status;
    case "kind":
      return isFinanceTransactionKind(item.kind)
        ? KIND_LABELS[item.kind as FinanceTransactionKind]
        : item.kind;
    case "vendor": {
      if (!item.vendor_id) {
        return null;
      }
      const vendor = vendorById.get(item.vendor_id);
      return vendor?.name ?? item.vendor_id;
    }
    case "price":
      return item.price_amount;
    case "tags":
      return item.tags.map((tag) => tag.name).join(", ") || null;
    default:
      return null;
  }
}
