// keel_web/src/modules/contacts/lib/contactTagListSort.ts

import type { TagsListColumnId } from "../../../../views/list/types";
import type { ContactTag } from "../api";

export function getContactTagSortValue(
  tag: ContactTag,
  column: TagsListColumnId,
): string | number | null {
  switch (column) {
    case "color":
      return tag.color_hex;
    case "name":
      return tag.name;
    case "description":
      return null;
    case "preview":
      return tag.name;
    case "count":
      return tag.contact_count;
    default:
      return null;
  }
}
