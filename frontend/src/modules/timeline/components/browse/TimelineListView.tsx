// keel_web/src/modules/timeline/components/browse/TimelineListView.tsx

import { useCallback } from "react";

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { TimelineEvent } from "../../api";
import {
  getTimelineSortValue,
  TIMELINE_DEFAULT_SORT,
  type TimelineSortColumn,
} from "../../lib/timelineListSort";
import {
  TIMELINE_LIST_GRID_CLASS,
  TIMELINE_LIST_TABLE_WIDTH_CLASS,
  TimelineListRow,
} from "./TimelineListRow";

const TIMELINE_COLUMNS: ListColumnDef<TimelineSortColumn | "actions">[] = [
  { id: "date", label: "Date" },
  { id: "people", label: "People" },
  { id: "event", label: "Event" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type TimelineListViewProps = {
  events: TimelineEvent[];
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
  onDelete?: (eventId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function TimelineListView({
  events,
  contactById,
  figureById,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No events yet.",
  paginationResetKey,
}: TimelineListViewProps) {
  const getSortValue = useCallback(
    (event: TimelineEvent, column: TimelineSortColumn | "actions") => {
      if (column === "actions") {
        return null;
      }
      return getTimelineSortValue(event, column, contactById);
    },
    [contactById],
  );

  return (
    <ListView
      items={events}
      columns={TIMELINE_COLUMNS}
      getSortValue={getSortValue}
      defaultSort={TIMELINE_DEFAULT_SORT}
      gridClassName={TIMELINE_LIST_GRID_CLASS}
      tableWidthClassName={TIMELINE_LIST_TABLE_WIDTH_CLASS}
      renderRow={(event) => (
        <TimelineListRow
          event={event}
          contactById={contactById}
          figureById={figureById}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(event) => event.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
