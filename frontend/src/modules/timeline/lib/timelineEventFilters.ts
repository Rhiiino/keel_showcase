// keel_web/src/modules/timeline/lib/timelineEventFilters.ts

// Shared filter state for timeline event list and calendar views.

export type TimelineTagContactFilterValues = {
  tagIds: number[];
  contactIds: number[];
  figureIds: number[];
};

export type TimelineEventsFilterValues = TimelineTagContactFilterValues & {
  query: string;
};

export function emptyTimelineTagContactFilters(): TimelineTagContactFilterValues {
  return {
    tagIds: [],
    contactIds: [],
    figureIds: [],
  };
}

export function emptyTimelineEventsFilters(): TimelineEventsFilterValues {
  return {
    ...emptyTimelineTagContactFilters(),
    query: "",
  };
}

export function countTimelineTagContactFilters(
  filters: TimelineTagContactFilterValues,
): number {
  return filters.tagIds.length + filters.contactIds.length + filters.figureIds.length;
}

export function countTimelineEventsFilters(filters: TimelineEventsFilterValues): number {
  let count = countTimelineTagContactFilters(filters);
  if (filters.query.trim().length > 0) {
    count += 1;
  }
  return count;
}
