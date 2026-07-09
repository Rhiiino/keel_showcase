// keel_web/src/modules/coak/lib/coakTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { CoakTag } from "../api";

export function getCoakTagSortValue(
  tag: CoakTag,
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
      return tag.item_count;
    default:
      return null;
  }
}
