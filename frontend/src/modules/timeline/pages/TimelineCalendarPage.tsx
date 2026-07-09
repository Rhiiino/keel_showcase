// keel_web/src/modules/timeline/pages/TimelineCalendarPage.tsx

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { ListPageTitle } from "../../../views/list/primitives/ListPageTitle";
import { contactsQueryKeys, fetchContacts, type Contact } from "../../people/contacts/api";
import { fetchFigures, figuresQueryKeys, type Figure } from "../../people/figures/api";
import {
  TimelineCalendarFilters,
  countTimelineCalendarFilters,
  emptyTimelineCalendarFilters,
} from "../components/calendar/TimelineCalendarFilters";
import {
  calendarFilterIncludesEvents,
  calendarFilterIncludesPlans,
  type TimelineCalendarFilterValues,
} from "../lib/timelineCalendarFilters";
import { TimelineEventCreateModal } from "../components/calendar/TimelineEventCreateModal";
import { TimelineEventEditModal } from "../components/calendar/TimelineEventEditModal";
import { TimelineFullCalendar } from "../components/calendar/TimelineFullCalendar";
import { TimelinePlanItemEditorModal } from "../components/plans/TimelinePlanItemEditorModal";
import { dateToTimelineDatetimeLocal } from "../lib/timelineDateTime";
import {
  fetchTimelineCalendarFeed,
  fetchTimelinePlan,
  fetchTimelineTags,
  timelineQueryKeys,
  type TimelineEvent,
  type TimelinePlanItem,
} from "../api";
import { useTimelineCalendarRange } from "../hooks/useTimelineCalendarRange";
import {
  timelineEventsToCalendarEvents,
  timelinePlanItemsToCalendarEvents,
} from "../lib/timelineCalendarEvents";

function calendarRangeToApiBounds(startDateFrom: string, startDateTo: string) {
  return {
    start: `${startDateFrom}T00:00:00.000Z`,
    end: `${startDateTo}T23:59:59.999Z`,
  };
}

function filterEventsByCalendarFilters(
  events: TimelineEvent[],
  filters: TimelineCalendarFilterValues,
): TimelineEvent[] {
  let result = events;
  if (filters.tagIds.length > 0) {
    result = result.filter((event) =>
      event.tags.some((tag) => filters.tagIds.includes(tag.id)),
    );
  }
  if (filters.contactIds.length > 0) {
    result = result.filter((event) =>
      event.contacts.some((contact) => filters.contactIds.includes(contact.id)),
    );
  }
  if (filters.figureIds.length > 0) {
    result = result.filter((event) =>
      event.figures.some((figure) => filters.figureIds.includes(figure.id)),
    );
  }
  return result;
}

function filterPlanItemsByCalendarFilters(
  items: TimelinePlanItem[],
  filters: TimelineCalendarFilterValues,
): TimelinePlanItem[] {
  if (filters.tagIds.length === 0) {
    return items;
  }
  return items.filter((item) => item.tags.some((tag) => filters.tagIds.includes(tag.id)));
}

export function TimelineCalendarPage() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedPlanItem, setSelectedPlanItem] = useState<TimelinePlanItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStartDate, setCreateStartDate] = useState<string | null>(null);
  const [isDayView, setIsDayView] = useState(false);
  const [activeDay, setActiveDay] = useState(() => new Date());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TimelineCalendarFilterValues>(
    emptyTimelineCalendarFilters,
  );
  const { range, handleDatesSet } = useTimelineCalendarRange();

  const calendarBounds = useMemo(
    () => calendarRangeToApiBounds(range.startDateFrom, range.startDateTo),
    [range.startDateFrom, range.startDateTo],
  );

  const tagsQuery = useQuery({
    queryKey: timelineQueryKeys.tags(),
    queryFn: fetchTimelineTags,
  });

  const calendarQuery = useQuery({
    queryKey: timelineQueryKeys.calendar(calendarBounds.start, calendarBounds.end),
    queryFn: () => fetchTimelineCalendarFeed(calendarBounds.start, calendarBounds.end),
    placeholderData: keepPreviousData,
  });

  const selectedPlanQuery = useQuery({
    queryKey: timelineQueryKeys.planDetail(selectedPlanItem?.plan_id ?? ""),
    queryFn: () => fetchTimelinePlan(selectedPlanItem!.plan_id),
    enabled: selectedPlanItem != null,
  });

  const contactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: fetchContacts,
  });

  const figuresQuery = useQuery({
    queryKey: figuresQueryKeys.list(),
    queryFn: fetchFigures,
  });

  const contactById = useMemo(() => {
    const map = new Map<number, Contact>();
    for (const contact of contactsQuery.data ?? []) {
      map.set(contact.id, contact);
    }
    return map;
  }, [contactsQuery.data]);

  const figureById = useMemo(() => {
    const map = new Map<number, Figure>();
    for (const figure of figuresQuery.data ?? []) {
      map.set(figure.id, figure);
    }
    return map;
  }, [figuresQuery.data]);

  const filteredEvents = useMemo(() => {
    if (!calendarFilterIncludesEvents(filters)) {
      return [];
    }
    return filterEventsByCalendarFilters(calendarQuery.data?.events ?? [], filters);
  }, [calendarQuery.data?.events, filters]);

  const filteredPlanItems = useMemo(() => {
    if (!calendarFilterIncludesPlans(filters)) {
      return [];
    }
    return filterPlanItemsByCalendarFilters(calendarQuery.data?.plan_items ?? [], filters);
  }, [calendarQuery.data?.plan_items, filters]);

  const calendarEvents = useMemo(
    () => [
      ...timelineEventsToCalendarEvents(filteredEvents),
      ...timelinePlanItemsToCalendarEvents(filteredPlanItems),
    ],
    [filteredEvents, filteredPlanItems],
  );

  const filtersDisabled = tagsQuery.isLoading || contactsQuery.isLoading || figuresQuery.isLoading;
  const totalVisibleCount =
    (calendarQuery.data?.events.length ?? 0) + (calendarQuery.data?.plan_items.length ?? 0);

  return (
    <>
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <ListPageTitle title="Calendar" recordCount={totalVisibleCount} />
            <p className="mt-1 text-sm text-stone-500">
              Month, week, day, and list views of timeline events and planned items.
            </p>
          </div>
          {isDayView ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <IconPlusButton
                onClick={() => {
                  setCreateStartDate(dateToTimelineDatetimeLocal(activeDay));
                  setCreateModalOpen(true);
                }}
                ariaLabel="New timeline event"
              />
            </div>
          ) : null}
        </div>

        <TimelineCalendarFilters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          tags={tagsQuery.data ?? []}
          contacts={contactsQuery.data ?? []}
          figures={figuresQuery.data ?? []}
          filters={filters}
          onFiltersChange={setFilters}
          disabled={filtersDisabled}
        />
      </header>

      {calendarQuery.isLoading ? (
        <p className="mt-12 text-sm text-stone-500">Loading calendar…</p>
      ) : null}
      {calendarQuery.isError ? (
        <p className="mt-12 text-sm text-red-400">Failed to load calendar events.</p>
      ) : null}
      {countTimelineCalendarFilters(filters) > 0 && calendarEvents.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">No events match the current filters.</p>
      ) : null}

      <div className="mt-8 w-full min-w-0">
        <TimelineFullCalendar
          events={calendarEvents}
          contactById={contactById}
          figureById={figureById}
          onDatesSet={handleDatesSet}
          onEventClick={setSelectedEventId}
          onPlanItemClick={setSelectedPlanItem}
          onViewStateChange={({ isDayView: nextIsDayView, activeDay: nextActiveDay }) => {
            setIsDayView(nextIsDayView);
            setActiveDay(nextActiveDay);
          }}
        />
      </div>

      <TimelineEventCreateModal
        open={createModalOpen}
        initialStartDate={createStartDate}
        onClose={() => setCreateModalOpen(false)}
      />

      <TimelineEventEditModal
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />

      <TimelinePlanItemEditorModal
        open={selectedPlanItem != null}
        planId={selectedPlanItem?.plan_id ?? 0}
        planStartDate={selectedPlanQuery.data?.start_date ?? ""}
        planEndDate={selectedPlanQuery.data?.end_date ?? ""}
        item={selectedPlanItem}
        mode="edit"
        planContext={
          selectedPlanQuery.data
            ? {
                title: selectedPlanQuery.data.title,
                startDate: selectedPlanQuery.data.start_date,
                endDate: selectedPlanQuery.data.end_date,
              }
            : null
        }
        planContextLoading={selectedPlanItem != null && selectedPlanQuery.isLoading}
        onClose={() => {
          setSelectedPlanItem(null);
          void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
        }}
      />
    </>
  );
}
