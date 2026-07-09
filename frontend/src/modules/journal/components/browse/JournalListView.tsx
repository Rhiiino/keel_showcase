// keel_web/src/modules/journal/components/browse/JournalListView.tsx

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { JournalEntry } from "../../api";
import {
  getJournalSortValue,
  JOURNAL_DEFAULT_SORT,
  type JournalSortColumn,
} from "../../lib/journalListSort";
import {
  JOURNAL_LIST_GRID_CLASS,
  JOURNAL_LIST_TABLE_WIDTH_CLASS,
  JournalListRow,
} from "./JournalListRow";

const JOURNAL_COLUMNS: ListColumnDef<JournalSortColumn | "actions">[] = [
  { id: "date", label: "Date" },
  { id: "tags", label: "Tags" },
  { id: "preview", label: "Preview" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type JournalListViewProps = {
  entries: JournalEntry[];
  onDelete?: (entryId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function JournalListView({
  entries,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No entries yet.",
  paginationResetKey,
}: JournalListViewProps) {
  return (
    <ListView
      items={entries}
      columns={JOURNAL_COLUMNS}
      getSortValue={(entry, column) =>
        column === "actions" ? null : getJournalSortValue(entry, column)
      }
      defaultSort={JOURNAL_DEFAULT_SORT}
      gridClassName={JOURNAL_LIST_GRID_CLASS}
      tableWidthClassName={JOURNAL_LIST_TABLE_WIDTH_CLASS}
      renderRow={(entry) => (
        <JournalListRow
          entry={entry}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(entry) => entry.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
