// keel_web/src/modules/finance/lib/paymentMethodListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { FinancePaymentMethod } from "../api";
import {
  PAYMENT_METHOD_KIND_LABELS,
  isFinancePaymentMethodKind,
  type FinancePaymentMethodKind,
} from "./paymentMethod";

export type FinancePaymentMethodSortColumn = "label" | "institution" | "kind" | "active";

export const FINANCE_PAYMENT_METHOD_DEFAULT_SORT: ListColumnSortState<FinancePaymentMethodSortColumn> =
  {
    column: "label",
    direction: "asc",
  };

function formatInstitutionSortValue(
  institutionName: string | null,
  lastFour: string | null,
): string | null {
  const parts: string[] = [];
  if (institutionName?.trim()) {
    parts.push(institutionName.trim());
  }
  if (lastFour?.trim()) {
    parts.push(lastFour.trim());
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export function getPaymentMethodSortValue(
  account: FinancePaymentMethod,
  column: FinancePaymentMethodSortColumn,
): string | number | boolean | null {
  switch (column) {
    case "label":
      return account.label;
    case "institution":
      return formatInstitutionSortValue(account.institution_name, account.last_four);
    case "kind":
      return isFinancePaymentMethodKind(account.kind)
        ? PAYMENT_METHOD_KIND_LABELS[account.kind as FinancePaymentMethodKind]
        : account.kind;
    case "active":
      return account.is_active;
    default:
      return null;
  }
}
