// keel_web/src/modules/finance/lib/vendorListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { FinanceVendor } from "../api";

export type FinanceVendorSortColumn = "name" | "website" | "currency" | "updated";

export const FINANCE_VENDOR_DEFAULT_SORT: ListColumnSortState<FinanceVendorSortColumn> = {
  column: "name",
  direction: "asc",
};

export function getVendorSortValue(
  vendor: FinanceVendor,
  column: FinanceVendorSortColumn,
): string | number | null {
  switch (column) {
    case "name":
      return vendor.name;
    case "website":
      return vendor.website_url;
    case "currency":
      return vendor.default_currency;
    case "updated":
      return vendor.updated_at;
    default:
      return null;
  }
}
