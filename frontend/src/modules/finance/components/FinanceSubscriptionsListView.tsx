// keel_web/src/modules/finance/components/FinanceSubscriptionsListView.tsx

import { useCallback } from "react";

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { FinanceObligation, FinanceVendor } from "../api";
import {
  FINANCE_OBLIGATION_DEFAULT_SORT,
  getObligationSortValue,
  type FinanceObligationSortColumn,
} from "../lib/obligationListSort";
import {
  FINANCE_SUBSCRIPTION_LIST_GRID_CLASS,
  FINANCE_SUBSCRIPTION_LIST_TABLE_WIDTH_CLASS,
  FinanceSubscriptionListRow,
} from "./FinanceSubscriptionListRow";

const FINANCE_SUBSCRIPTION_COLUMNS: ListColumnDef<FinanceObligationSortColumn | "actions">[] = [
  { id: "name", label: "Name" },
  { id: "vendor", label: "Vendor" },
  { id: "amount", label: "Amount" },
  { id: "next_billing", label: "Next billing" },
  { id: "account", label: "Account" },
  { id: "tags", label: "Tags" },
  { id: "status", label: "Status" },
  { id: "actions", label: "", sortable: false },
];

type FinanceSubscriptionsListViewProps = {
  obligations: FinanceObligation[];
  vendorById: Map<number, FinanceVendor>;
  onDelete?: (obligationId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function FinanceSubscriptionsListView({
  obligations,
  vendorById,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No subscriptions yet.",
  paginationResetKey,
}: FinanceSubscriptionsListViewProps) {
  const getSortValue = useCallback(
    (obligation: FinanceObligation, column: FinanceObligationSortColumn | "actions") => {
      if (column === "actions") {
        return null;
      }
      return getObligationSortValue(obligation, column, vendorById);
    },
    [vendorById],
  );

  return (
    <ListView
      items={obligations}
      columns={FINANCE_SUBSCRIPTION_COLUMNS}
      getSortValue={getSortValue}
      defaultSort={FINANCE_OBLIGATION_DEFAULT_SORT}
      gridClassName={FINANCE_SUBSCRIPTION_LIST_GRID_CLASS}
      tableWidthClassName={FINANCE_SUBSCRIPTION_LIST_TABLE_WIDTH_CLASS}
      renderRow={(obligation) => (
        <FinanceSubscriptionListRow
          obligation={obligation}
          vendor={
            obligation.vendor_id ? vendorById.get(obligation.vendor_id) ?? null : null
          }
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(obligation) => obligation.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
