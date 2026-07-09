// keel_web/src/modules/finance/components/FinanceListView.tsx

// Table-style list of purchases with pagination and sortable columns.

import { useCallback } from "react";

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { FinanceTransaction, FinanceVendor } from "../api";
import {
  FINANCE_TRANSACTION_DEFAULT_SORT,
  getFinanceTransactionSortValue,
  type FinanceTransactionSortColumn,
} from "../lib/transactionListSort";
import {
  FINANCE_TRANSACTION_LIST_GRID_CLASS,
  FINANCE_TRANSACTION_LIST_TABLE_WIDTH_CLASS,
  FinanceListRow,
} from "./FinanceListRow";

const FINANCE_TRANSACTION_COLUMNS: ListColumnDef<FinanceTransactionSortColumn | "image" | "actions">[] = [
  { id: "ordered_at", label: "Ordered" },
  { id: "image", label: "Image", sortable: false },
  { id: "title", label: "Title" },
  { id: "price", label: "Price" },
  { id: "status", label: "Status" },
  { id: "vendor", label: "Vendor" },
  { id: "kind", label: "Kind" },
  { id: "tags", label: "Tags" },
  { id: "actions", label: "", sortable: false },
];

type FinanceListViewProps = {
  items: FinanceTransaction[];
  vendorById: Map<number, FinanceVendor>;
  onDelete: (transactionId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function FinanceListView({
  items,
  vendorById,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No items yet.",
  paginationResetKey,
}: FinanceListViewProps) {
  const getSortValue = useCallback(
    (item: FinanceTransaction, column: FinanceTransactionSortColumn | "image" | "actions") => {
      if (column === "image" || column === "actions") {
        return null;
      }
      return getFinanceTransactionSortValue(item, column, vendorById);
    },
    [vendorById],
  );

  return (
    <ListView
      items={items}
      columns={FINANCE_TRANSACTION_COLUMNS}
      getSortValue={getSortValue}
      defaultSort={FINANCE_TRANSACTION_DEFAULT_SORT}
      gridClassName={FINANCE_TRANSACTION_LIST_GRID_CLASS}
      tableWidthClassName={FINANCE_TRANSACTION_LIST_TABLE_WIDTH_CLASS}
      renderRow={(item) => (
        <FinanceListRow
          item={item}
          vendor={item.vendor_id ? vendorById.get(item.vendor_id) ?? null : null}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(item) => item.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
