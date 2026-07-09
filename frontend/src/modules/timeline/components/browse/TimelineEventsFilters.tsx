// keel_web/src/modules/timeline/components/browse/TimelineEventsFilters.tsx

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineTag } from "../../api";
import { TimelineEventFilterFields } from "../filters/TimelineEventFilterFields";
import { TimelineFiltersPanel } from "../filters/TimelineFiltersPanel";
import {
  countTimelineEventsFilters,
  emptyTimelineEventsFilters,
  type TimelineEventsFilterValues,
} from "../../lib/timelineEventFilters";

type TimelineEventsFiltersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TimelineTag[];
  contacts: Contact[];
  figures: Figure[];
  filters: TimelineEventsFilterValues;
  onFiltersChange: (next: TimelineEventsFilterValues) => void;
  disabled?: boolean;
};

export function TimelineEventsFilters({
  open,
  onOpenChange,
  tags,
  contacts,
  figures,
  filters,
  onFiltersChange,
  disabled = false,
}: TimelineEventsFiltersProps) {
  const activeCount = countTimelineEventsFilters(filters);

  return (
    <TimelineFiltersPanel
      open={open}
      onOpenChange={onOpenChange}
      activeCount={activeCount}
      disabled={disabled}
      onClearAll={() => onFiltersChange(emptyTimelineEventsFilters())}
    >
      <TimelineEventFilterFields
        tags={tags}
        contacts={contacts}
        figures={figures}
        tagIds={filters.tagIds}
        contactIds={filters.contactIds}
        figureIds={filters.figureIds}
        query={filters.query}
        onTagIdsChange={(tagIds) => onFiltersChange({ ...filters, tagIds })}
        onContactIdsChange={(contactIds) => onFiltersChange({ ...filters, contactIds })}
        onFigureIdsChange={(figureIds) => onFiltersChange({ ...filters, figureIds })}
        onQueryChange={(query) => onFiltersChange({ ...filters, query })}
        disabled={disabled}
      />
    </TimelineFiltersPanel>
  );
}
