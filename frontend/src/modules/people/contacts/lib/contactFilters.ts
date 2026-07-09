// keel_web/src/modules/contacts/lib/contactFilters.ts

import { formatContactName, type Contact } from "../api";

export type ContactsFilterValues = {
  tagIds: number[];
  query: string;
};

export function emptyContactsFilters(): ContactsFilterValues {
  return {
    tagIds: [],
    query: "",
  };
}

export function countContactsFilters(filters: ContactsFilterValues): number {
  let count = filters.tagIds.length;
  if (filters.query.trim().length > 0) {
    count += 1;
  }
  return count;
}

export function contactMatchesSearch(
  contact: Pick<Contact, "first_name" | "last_name"> & { id?: number },
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const first = contact.first_name?.trim().toLowerCase() ?? "";
  const last = contact.last_name?.trim().toLowerCase() ?? "";
  const full = formatContactName(contact).toLowerCase();
  return (
    full.includes(normalized) ||
    first.includes(normalized) ||
    last.includes(normalized)
  );
}

export function filterContacts(
  contacts: Contact[],
  filters: ContactsFilterValues,
): Contact[] {
  return contacts.filter((contact) => {
    if (filters.tagIds.length > 0) {
      const contactTagIds = contact.tags.map((tag) => tag.id);
      if (!filters.tagIds.some((id) => contactTagIds.includes(id))) {
        return false;
      }
    }
    if (!contactMatchesSearch(contact, filters.query)) {
      return false;
    }
    return true;
  });
}
