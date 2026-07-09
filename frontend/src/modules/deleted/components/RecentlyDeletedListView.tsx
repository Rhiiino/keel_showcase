// keel_web/src/modules/deleted/components/RecentlyDeletedListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { DeletedRecord } from "../api";
import {
  DELETED_DEFAULT_SORT,
  getDeletedSortValue,
  type DeletedSortColumn,
} from "../lib/deletedListSort";
import {
  DELETED_LIST_GRID_CLASS,
  DELETED_LIST_TABLE_WIDTH_CLASS,
} from "../lib/deletedListLayout";
import { RecentlyDeletedListRow } from "./RecentlyDeletedListRow";

const DELETED_COLUMNS: ListColumnDef<DeletedSortColumn | "actions">[] = [
  { id: "entity_type", label: "Type" },
  { id: "entity_id", label: "ID" },
  { id: "display_label", label: "Label" },
  { id: "deleted_at", label: "Deleted" },
  { id: "expires_at", label: "Expires" },
  { id: "days_left", label: "Days left" },
  { id: "permanently_deleted_at", label: "Permanently deleted" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type RecentlyDeletedListViewProps = {
  records: DeletedRecord[];
  onRestore: (recordId: string) => void;
  onPurge: (recordId: string) => void;
  actionDisabled?: boolean;
  emptyMessage?: string;
};

export function RecentlyDeletedListView({
  records,
  onRestore,
  onPurge,
  actionDisabled = false,
  emptyMessage = "No recently deleted items.",
}: RecentlyDeletedListViewProps) {
  return (
    <ListView
      items={records}
      columns={DELETED_COLUMNS}
      getSortValue={(record, column) =>
        column === "actions" ? null : getDeletedSortValue(record, column)
      }
      defaultSort={DELETED_DEFAULT_SORT}
      gridClassName={DELETED_LIST_GRID_CLASS}
      tableWidthClassName={DELETED_LIST_TABLE_WIDTH_CLASS}
      renderRow={(record) => (
        <RecentlyDeletedListRow
          record={record}
          onRestore={onRestore}
          onPurge={onPurge}
          restoreDisabled={actionDisabled}
          purgeDisabled={actionDisabled}
        />
      )}
      getRowKey={(record) => record.id}
      emptyMessage={emptyMessage}
      paginationResetKey={records.length}
    />
  );
}
