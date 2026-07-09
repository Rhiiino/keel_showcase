// keel_web/src/modules/contacts/components/browse/ContactsListView.tsx

import { ListView } from "../../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../../views/list/types";
import type { Contact } from "../../api";
import {
  CONTACT_DEFAULT_SORT,
  getContactSortValue,
  type ContactSortColumn,
} from "../../lib/contactsListSort";
import {
  CONTACT_LIST_GRID_CLASS,
  CONTACT_LIST_TABLE_WIDTH_CLASS,
  ContactListRow,
} from "../ContactListRow";

const CONTACT_COLUMNS: ListColumnDef<ContactSortColumn | "avatar" | "actions">[] = [
  { id: "avatar", label: "", sortable: false, headerClassName: "px-4 py-3" },
  { id: "name", label: "Name" },
  { id: "tags", label: "Tags" },
  { id: "family", label: "Family" },
  { id: "born", label: "Born", headerClassName: "justify-end px-4 py-3 text-right" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type ContactsListViewProps = {
  contacts: Contact[];
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function ContactsListView({
  contacts,
  emptyMessage = "No contacts yet.",
  paginationResetKey,
}: ContactsListViewProps) {
  return (
    <ListView
      items={contacts}
      columns={CONTACT_COLUMNS}
      getSortValue={(contact, column) => {
        if (column === "avatar" || column === "actions") {
          return null;
        }
        return getContactSortValue(contact, column);
      }}
      defaultSort={CONTACT_DEFAULT_SORT}
      gridClassName={CONTACT_LIST_GRID_CLASS}
      tableWidthClassName={CONTACT_LIST_TABLE_WIDTH_CLASS}
      renderRow={(contact) => <ContactListRow contact={contact} />}
      getRowKey={(contact) => contact.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
