// keel_web/src/modules/people/figures/components/FiguresListView.tsx

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { Figure } from "../api";
import {
  FIGURE_DEFAULT_SORT,
  getFigureSortValue,
  type FigureSortColumn,
} from "../lib/figuresListSort";
import {
  FIGURE_LIST_GRID_CLASS,
  FIGURE_LIST_TABLE_WIDTH_CLASS,
  FigureListRow,
} from "./FigureListRow";

const FIGURE_COLUMNS: ListColumnDef<FigureSortColumn | "avatar" | "actions">[] = [
  { id: "avatar", label: "", sortable: false, headerClassName: "px-4 py-3" },
  { id: "name", label: "Name" },
  { id: "born", label: "Born", headerClassName: "justify-end px-4 py-3 text-right" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type FiguresListViewProps = {
  figures: Figure[];
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function FiguresListView({
  figures,
  emptyMessage = "No figures yet.",
  paginationResetKey,
}: FiguresListViewProps) {
  return (
    <ListView
      items={figures}
      columns={FIGURE_COLUMNS}
      getSortValue={(figure, column) => {
        if (column === "avatar" || column === "actions") {
          return null;
        }
        return getFigureSortValue(figure, column);
      }}
      defaultSort={FIGURE_DEFAULT_SORT}
      gridClassName={FIGURE_LIST_GRID_CLASS}
      tableWidthClassName={FIGURE_LIST_TABLE_WIDTH_CLASS}
      renderRow={(figure) => <FigureListRow figure={figure} />}
      getRowKey={(figure) => figure.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
