// keel_web/src/modules/finance/components/FinanceAccountsListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { FinancePaymentMethod } from "../api";
import {
  FINANCE_PAYMENT_METHOD_DEFAULT_SORT,
  getPaymentMethodSortValue,
  type FinancePaymentMethodSortColumn,
} from "../lib/paymentMethodListSort";
import {
  FINANCE_ACCOUNT_LIST_GRID_CLASS,
  FINANCE_ACCOUNT_LIST_TABLE_WIDTH_CLASS,
  FinanceAccountListRow,
} from "./FinanceAccountListRow";

const FINANCE_ACCOUNT_COLUMNS: ListColumnDef<FinancePaymentMethodSortColumn | "actions">[] = [
  { id: "label", label: "Label" },
  { id: "institution", label: "Institution" },
  { id: "kind", label: "Kind" },
  { id: "active", label: "Active" },
  { id: "actions", label: "", sortable: false },
];

type FinanceAccountsListViewProps = {
  accounts: FinancePaymentMethod[];
  onDelete?: (paymentMethodId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
};

export function FinanceAccountsListView({
  accounts,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No accounts yet.",
}: FinanceAccountsListViewProps) {
  return (
    <ListView
      items={accounts}
      columns={FINANCE_ACCOUNT_COLUMNS}
      getSortValue={(account, column) =>
        column === "actions" ? null : getPaymentMethodSortValue(account, column)
      }
      defaultSort={FINANCE_PAYMENT_METHOD_DEFAULT_SORT}
      gridClassName={FINANCE_ACCOUNT_LIST_GRID_CLASS}
      tableWidthClassName={FINANCE_ACCOUNT_LIST_TABLE_WIDTH_CLASS}
      renderRow={(account) => (
        <FinanceAccountListRow
          account={account}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(account) => account.id}
      emptyMessage={emptyMessage}
    />
  );
}
