// keel_web/src/modules/contacts/components/browse/ContactsFilters.tsx

import type { ContactTag } from "../../api";
import { ContactFilterFields } from "../filters/ContactFilterFields";
import { ContactsFiltersPanel } from "../filters/ContactsFiltersPanel";
import {
  countContactsFilters,
  emptyContactsFilters,
  type ContactsFilterValues,
} from "../../lib/contactFilters";

type ContactsFiltersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: ContactTag[];
  filters: ContactsFilterValues;
  onFiltersChange: (next: ContactsFilterValues) => void;
  disabled?: boolean;
};

export function ContactsFilters({
  open,
  onOpenChange,
  tags,
  filters,
  onFiltersChange,
  disabled = false,
}: ContactsFiltersProps) {
  const activeCount = countContactsFilters(filters);

  return (
    <ContactsFiltersPanel
      open={open}
      onOpenChange={onOpenChange}
      activeCount={activeCount}
      disabled={disabled}
      onClearAll={() => onFiltersChange(emptyContactsFilters())}
    >
      <ContactFilterFields
        tags={tags}
        tagIds={filters.tagIds}
        query={filters.query}
        onTagIdsChange={(tagIds) => onFiltersChange({ ...filters, tagIds })}
        onQueryChange={(query) => onFiltersChange({ ...filters, query })}
        disabled={disabled}
      />
    </ContactsFiltersPanel>
  );
}
