// keel_web/src/modules/contacts/lib/contactsListSort.ts

import type { ListColumnSortState } from "../../../../views/list/primitives/listColumnSort";
import { formatContactName, type Contact } from "../api";

export type ContactSortColumn = "name" | "tags" | "family" | "born";

export const CONTACT_DEFAULT_SORT: ListColumnSortState<ContactSortColumn> = {
  column: "name",
  direction: "asc",
};

export function getContactSortValue(
  contact: Contact,
  column: ContactSortColumn,
): string | number | null {
  switch (column) {
    case "name":
      return formatContactName(contact);
    case "tags":
      return contact.tags
        .map((tag) => tag.name)
        .sort((left, right) => left.localeCompare(right))
        .join(", ");
    case "family":
      return contact.family_groups
        .map((group) => group.name)
        .sort((left, right) => left.localeCompare(right))
        .join(", ");
    case "born":
      return contact.birth_date;
    default:
      return null;
  }
}
