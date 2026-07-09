// keel_web/src/modules/shop/lib/transactionTagListSort.ts

import type { TagsListColumnId } from "../../../views/list/types";
import type { FinanceTransactionTag } from "../api";

export function getFinanceTransactionTagSortValue(
  tag: FinanceTransactionTag,
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
      return tag.transaction_count;
    default:
      return null;
  }
}
