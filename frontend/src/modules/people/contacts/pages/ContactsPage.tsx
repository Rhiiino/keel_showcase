// keel_web/src/modules/contacts/pages/ContactsPage.tsx

// Contacts list — table-style directory with filters and pagination.

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../../views/list/ListPageLayout";
import { contactsQueryKeys, fetchContactTags, fetchContacts } from "../api";
import { ContactsFilters } from "../components/browse/ContactsFilters";
import { ContactsListView } from "../components/browse/ContactsListView";
import {
  countContactsFilters,
  emptyContactsFilters,
  filterContacts,
} from "../lib/contactFilters";

export function ContactsPage() {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(emptyContactsFilters());

  const contactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: () => fetchContacts(),
  });

  const tagsQuery = useQuery({
    queryKey: contactsQueryKeys.tags(),
    queryFn: fetchContactTags,
  });

  const filteredContacts = useMemo(
    () => filterContacts(contactsQuery.data ?? [], filters),
    [contactsQuery.data, filters],
  );

  const hasActiveFilters = countContactsFilters(filters) > 0;
  const filtersDisabled = contactsQuery.isLoading || tagsQuery.isLoading;

  const emptyMessage =
    hasActiveFilters && filteredContacts.length === 0
      ? "No contacts match the current filters."
      : "No contacts yet.";

  return (
    <ListPageLayout
      className="mx-auto flex min-h-0 w-full flex-1 flex-col"
      title="Contacts"
      recordCount={contactsQuery.data?.length}
      subtitle="People in your life — family, friends, and everyone else."
      actions={
        <IconPlusButton
          onClick={() => navigate("/people/contacts/new")}
          ariaLabel="New contact"
        />
      }
    >
      <div className="space-y-4">
        <RouteNoticeBanner />
        <ContactsFilters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          tags={tagsQuery.data ?? []}
          filters={filters}
          onFiltersChange={setFilters}
          disabled={filtersDisabled}
        />

        {contactsQuery.isLoading && (
          <p className="text-sm text-stone-500">Loading contacts…</p>
        )}
        {contactsQuery.isError && (
          <p className="text-sm text-red-400">Failed to load contacts.</p>
        )}

        {contactsQuery.data ? (
          <ContactsListView
            contacts={filteredContacts}
            emptyMessage={emptyMessage}
            paginationResetKey={filters}
          />
        ) : null}
      </div>
    </ListPageLayout>
  );
}
