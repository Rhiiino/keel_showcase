// keel_web/src/modules/journal/components/browse/JournalFilters.tsx

import type { JournalTag } from "../../api";
import { JournalFilterFields } from "../filters/JournalFilterFields";
import { JournalFiltersPanel } from "../filters/JournalFiltersPanel";
import {
  countJournalFilters,
  emptyJournalFilters,
  type JournalFilterValues,
} from "../../lib/journalFilters";

type JournalFiltersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: JournalTag[];
  filters: JournalFilterValues;
  onFiltersChange: (next: JournalFilterValues) => void;
  disabled?: boolean;
};

export function JournalFilters({
  open,
  onOpenChange,
  tags,
  filters,
  onFiltersChange,
  disabled = false,
}: JournalFiltersProps) {
  const activeCount = countJournalFilters(filters);

  return (
    <JournalFiltersPanel
      open={open}
      onOpenChange={onOpenChange}
      activeCount={activeCount}
      disabled={disabled}
      onClearAll={() => onFiltersChange(emptyJournalFilters())}
    >
      <JournalFilterFields
        tags={tags}
        tagIds={filters.tagIds}
        onTagIdsChange={(tagIds) => onFiltersChange({ ...filters, tagIds })}
        query={filters.query}
        onQueryChange={(query) => onFiltersChange({ ...filters, query })}
        entryDateFrom={filters.entryDateFrom}
        entryDateTo={filters.entryDateTo}
        onEntryDateFromChange={(entryDateFrom) =>
          onFiltersChange({ ...filters, entryDateFrom })
        }
        onEntryDateToChange={(entryDateTo) =>
          onFiltersChange({ ...filters, entryDateTo })
        }
        disabled={disabled}
      />
    </JournalFiltersPanel>
  );
}
