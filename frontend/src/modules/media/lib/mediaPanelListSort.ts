// keel_web/src/modules/media/lib/mediaPanelListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { MediaPanel } from "../api";

export type MediaPanelSortColumn = "name" | "items" | "updated";

export const MEDIA_PANEL_DEFAULT_SORT: ListColumnSortState<MediaPanelSortColumn> = {
  column: "name",
  direction: "asc",
};

export function getMediaPanelSortValue(
  panel: MediaPanel,
  column: MediaPanelSortColumn,
  itemCount: number,
): string | number | null {
  switch (column) {
    case "name":
      return panel.name;
    case "items":
      return itemCount;
    case "updated":
      return panel.updated_at;
    default:
      return null;
  }
}
