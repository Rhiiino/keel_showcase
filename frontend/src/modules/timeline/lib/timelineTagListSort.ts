// keel_web/src/modules/timeline/lib/timelineTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { TimelineTag } from "../api";

export function getTimelineTagSortValue(
  tag: TimelineTag,
  column: TagsListColumnId,
): string | number | null {
  switch (column) {
    case "color":
      return tag.color_hex;
    case "name":
      return tag.name;
    case "description":
      return tag.description;
    case "preview":
      return tag.name;
    case "count":
      return tag.event_count;
    case "planItemCount":
      return tag.plan_item_count;
    default:
      return null;
  }
}
