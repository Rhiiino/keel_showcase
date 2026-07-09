// keel_web/src/modules/timeline/lib/timelineCalendarFilters.ts

import {
  countTimelineTagContactFilters,
  emptyTimelineTagContactFilters,
  type TimelineTagContactFilterValues,
} from "./timelineEventFilters";

export type TimelineCalendarEntryType = "events" | "plans";

export type TimelineCalendarFilterValues = TimelineTagContactFilterValues & {
  entryTypes: TimelineCalendarEntryType[];
};

export function emptyTimelineCalendarFilters(): TimelineCalendarFilterValues {
  return {
    ...emptyTimelineTagContactFilters(),
    entryTypes: [],
  };
}

export function countTimelineCalendarFilters(filters: TimelineCalendarFilterValues): number {
  return countTimelineTagContactFilters(filters) + filters.entryTypes.length;
}

export function calendarFilterIncludesEvents(filters: TimelineCalendarFilterValues): boolean {
  return filters.entryTypes.length === 0 || filters.entryTypes.includes("events");
}

export function calendarFilterIncludesPlans(filters: TimelineCalendarFilterValues): boolean {
  return filters.entryTypes.length === 0 || filters.entryTypes.includes("plans");
}
