// keel_web/src/modules/shop/lib/obligationTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { FinanceObligationTag } from "../api";

export function getFinanceObligationTagSortValue(
  tag: FinanceObligationTag,
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
      return tag.obligation_count;
    default:
      return null;
  }
}
