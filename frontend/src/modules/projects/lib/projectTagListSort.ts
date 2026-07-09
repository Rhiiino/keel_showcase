// keel_web/src/modules/projects/lib/projectTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { ProjectTag } from "../api";

export function getProjectTagSortValue(
  tag: ProjectTag,
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
      return tag.project_count;
    default:
      return null;
  }
}
