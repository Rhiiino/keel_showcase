// keel_web/src/modules/timeline/components/calendar/TimelineCalendarFilters.tsx

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineTag } from "../../api";
import {
  countTimelineCalendarFilters,
  emptyTimelineCalendarFilters,
  type TimelineCalendarFilterValues,
} from "../../lib/timelineCalendarFilters";
import { TimelineEventFilterFields } from "../filters/TimelineEventFilterFields";
import { TimelineFiltersPanel } from "../filters/TimelineFiltersPanel";
import { TimelineCalendarEntryTypeFields } from "./TimelineCalendarEntryTypeFields";

export type { TimelineCalendarFilterValues };
export { countTimelineCalendarFilters, emptyTimelineCalendarFilters };

type TimelineCalendarFiltersProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TimelineTag[];
  contacts: Contact[];
  figures: Figure[];
  filters: TimelineCalendarFilterValues;
  onFiltersChange: (next: TimelineCalendarFilterValues) => void;
  disabled?: boolean;
};

export function TimelineCalendarFilters({
  open,
  onOpenChange,
  tags,
  contacts,
  figures,
  filters,
  onFiltersChange,
  disabled = false,
}: TimelineCalendarFiltersProps) {
  const activeCount = countTimelineCalendarFilters(filters);

  return (
    <TimelineFiltersPanel
      open={open}
      onOpenChange={onOpenChange}
      activeCount={activeCount}
      disabled={disabled}
      onClearAll={() => onFiltersChange(emptyTimelineCalendarFilters())}
    >
      <div className="space-y-6">
        <TimelineCalendarEntryTypeFields
          entryTypes={filters.entryTypes}
          onEntryTypesChange={(entryTypes) => onFiltersChange({ ...filters, entryTypes })}
          disabled={disabled}
        />

        <TimelineEventFilterFields
          tags={tags}
          contacts={contacts}
          figures={figures}
          tagIds={filters.tagIds}
          contactIds={filters.contactIds}
          figureIds={filters.figureIds}
          onTagIdsChange={(tagIds) => onFiltersChange({ ...filters, tagIds })}
          onContactIdsChange={(contactIds) => onFiltersChange({ ...filters, contactIds })}
          onFigureIdsChange={(figureIds) => onFiltersChange({ ...filters, figureIds })}
          disabled={disabled}
        />
      </div>
    </TimelineFiltersPanel>
  );
}
