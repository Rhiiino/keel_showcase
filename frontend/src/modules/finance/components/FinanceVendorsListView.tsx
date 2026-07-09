// keel_web/src/modules/finance/components/FinanceVendorsListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { FinanceVendor } from "../api";
import {
  FINANCE_VENDOR_DEFAULT_SORT,
  getVendorSortValue,
  type FinanceVendorSortColumn,
} from "../lib/vendorListSort";
import {
  FINANCE_VENDOR_LIST_GRID_CLASS,
  FINANCE_VENDOR_LIST_TABLE_WIDTH_CLASS,
  FinanceVendorListRow,
} from "./FinanceVendorListRow";

const FINANCE_VENDOR_COLUMNS: ListColumnDef<FinanceVendorSortColumn | "logo" | "actions">[] = [
  { id: "logo", label: "", sortable: false, headerClassName: "px-4 py-3" },
  { id: "name", label: "Name" },
  { id: "website", label: "Website" },
  { id: "currency", label: "Currency" },
  { id: "updated", label: "Updated" },
  { id: "actions", label: "", sortable: false },
];

type FinanceVendorsListViewProps = {
  vendors: FinanceVendor[];
  onDelete?: (vendorId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function FinanceVendorsListView({
  vendors,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No vendors yet.",
  paginationResetKey,
}: FinanceVendorsListViewProps) {
  return (
    <ListView
      items={vendors}
      columns={FINANCE_VENDOR_COLUMNS}
      getSortValue={(vendor, column) => {
        if (column === "logo" || column === "actions") {
          return null;
        }
        return getVendorSortValue(vendor, column);
      }}
      defaultSort={FINANCE_VENDOR_DEFAULT_SORT}
      gridClassName={FINANCE_VENDOR_LIST_GRID_CLASS}
      tableWidthClassName={FINANCE_VENDOR_LIST_TABLE_WIDTH_CLASS}
      renderRow={(vendor) => (
        <FinanceVendorListRow
          vendor={vendor}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(vendor) => vendor.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
