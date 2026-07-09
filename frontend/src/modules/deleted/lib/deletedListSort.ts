// keel_web/src/modules/deleted/lib/deletedListSort.ts

import type { DeletedRecord } from "../api";
import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import { getDeletedDaysLeft } from "./deletedDaysLeft";

export type DeletedSortColumn =
  | "entity_type"
  | "entity_id"
  | "display_label"
  | "deleted_at"
  | "expires_at"
  | "days_left"
  | "permanently_deleted_at";

export type DeletedSortDirection = "asc" | "desc";

export const DELETED_DEFAULT_SORT: ListColumnSortState<DeletedSortColumn> = {
  column: "deleted_at",
  direction: "desc",
};

export function getDeletedSortValue(
  record: DeletedRecord,
  column: DeletedSortColumn,
): string | number | null {
  switch (column) {
    case "entity_type":
      return record.entity_type;
    case "entity_id":
      return record.entity_id;
    case "display_label":
      return record.display_label;
    case "deleted_at":
      return record.deleted_at;
    case "expires_at":
      return record.expires_at;
    case "days_left":
      return getDeletedDaysLeft(record.expires_at);
    case "permanently_deleted_at":
      return record.permanently_deleted_at;
    default:
      return null;
  }
}

export function sortDeletedRecords(
  records: DeletedRecord[],
  column: DeletedSortColumn,
  direction: DeletedSortDirection = "desc",
): DeletedRecord[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...records].sort((left, right) => {
    if (column === "days_left") {
      const compare = getDeletedDaysLeft(left.expires_at) - getDeletedDaysLeft(right.expires_at);
      if (compare !== 0) {
        return compare * multiplier;
      }
      return left.id.localeCompare(right.id) * multiplier;
    }

    const leftValue = getDeletedSortValue(left, column);
    const rightValue = getDeletedSortValue(right, column);

    if (leftValue == null && rightValue == null) {
      return left.id.localeCompare(right.id) * multiplier;
    }
    if (leftValue == null) {
      return 1 * multiplier;
    }
    if (rightValue == null) {
      return -1 * multiplier;
    }

    if (column === "deleted_at" || column === "expires_at" || column === "permanently_deleted_at") {
      const compare = String(leftValue).localeCompare(String(rightValue));
      if (compare !== 0) {
        return compare * multiplier;
      }
      return left.id.localeCompare(right.id) * multiplier;
    }

    const compare = String(leftValue).localeCompare(String(rightValue), undefined, {
      sensitivity: "base",
    });
    if (compare !== 0) {
      return compare * multiplier;
    }
    return left.id.localeCompare(right.id) * multiplier;
  });
}
