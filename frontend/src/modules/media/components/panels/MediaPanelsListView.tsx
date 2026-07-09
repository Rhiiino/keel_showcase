// keel_web/src/modules/media/components/panels/MediaPanelsListView.tsx

// Table-style list of media display panels.

import { useCallback, useMemo } from "react";

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { MediaPanel, MediaPanelDetail } from "../../api";
import {
  getMediaPanelSortValue,
  MEDIA_PANEL_DEFAULT_SORT,
  type MediaPanelSortColumn,
} from "../../lib/mediaPanelListSort";
import { MEDIA_PANEL_LIST_GRID_CLASS, MediaPanelRow } from "./MediaPanelRow";

const PANEL_COLUMNS: ListColumnDef<MediaPanelSortColumn | "preview" | "actions">[] = [
  { id: "preview", label: "Preview", sortable: false },
  { id: "name", label: "Name" },
  { id: "items", label: "Items" },
  { id: "updated", label: "Updated" },
  {
    id: "actions",
    label: "Actions",
    sortable: false,
    headerClassName: "justify-center px-4 py-3 text-center",
  },
];

type MediaPanelsListViewProps = {
  panels: MediaPanel[];
  panelDetailsById: Map<string, MediaPanelDetail>;
  panelDetailsLoading?: boolean;
  onRename?: (panelId: string, name: string) => void;
  renameDisabled?: boolean;
  onDelete?: (panelId: string) => void;
  deleteDisabled?: boolean;
};

export function MediaPanelsListView({
  panels,
  panelDetailsById,
  panelDetailsLoading = false,
  onRename,
  renameDisabled = false,
  onDelete,
  deleteDisabled = false,
}: MediaPanelsListViewProps) {
  const itemCountByPanelId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const panel of panels) {
      counts.set(panel.id, panelDetailsById.get(panel.id)?.items.length ?? 0);
    }
    return counts;
  }, [panelDetailsById, panels]);

  const getSortValue = useCallback(
    (panel: MediaPanel, column: MediaPanelSortColumn | "preview" | "actions") => {
      if (column === "preview" || column === "actions") {
        return null;
      }
      return getMediaPanelSortValue(panel, column, itemCountByPanelId.get(panel.id) ?? 0);
    },
    [itemCountByPanelId],
  );

  return (
    <ListView
      items={panels}
      columns={PANEL_COLUMNS}
      getSortValue={getSortValue}
      defaultSort={MEDIA_PANEL_DEFAULT_SORT}
      gridClassName={[
        "grid min-w-[36rem] items-center px-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
        MEDIA_PANEL_LIST_GRID_CLASS,
      ].join(" ")}
      renderRow={(panel) => {
        const detail = panelDetailsById.get(panel.id);
        return (
          <MediaPanelRow
            panel={panel}
            items={detail?.items ?? []}
            previewLoading={panelDetailsLoading && !detail}
            onRename={onRename}
            renameDisabled={renameDisabled}
            onDelete={onDelete}
            deleteDisabled={deleteDisabled}
          />
        );
      }}
      getRowKey={(panel) => panel.id}
      emptyMessage="No panels yet. Create one to start curating a display board."
      pagination={false}
    />
  );
}
