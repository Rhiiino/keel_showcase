// keel_web/src/modules/timeline/pages/TimelinePage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import { contactsQueryKeys, fetchContacts, type Contact } from "../../people/contacts/api";
import { fetchFigures, figuresQueryKeys, type Figure } from "../../people/figures/api";
import { TimelineEventsFilters } from "../components/browse/TimelineEventsFilters";
import { TimelineListView } from "../components/browse/TimelineListView";
import {
  deleteTimelineEvent,
  fetchTimelineEvents,
  fetchTimelineTags,
  timelineQueryKeys,
} from "../api";
import {
  countTimelineEventsFilters,
  emptyTimelineEventsFilters,
  type TimelineEventsFilterValues,
} from "../lib/timelineEventFilters";

export function TimelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TimelineEventsFilterValues>(
    emptyTimelineEventsFilters(),
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(filters.query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const tagsQuery = useQuery({
    queryKey: timelineQueryKeys.tags(),
    queryFn: fetchTimelineTags,
  });

  const listFilters = useMemo(
    () => ({
      tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
      contactIds: filters.contactIds.length > 0 ? filters.contactIds : undefined,
      figureIds: filters.figureIds.length > 0 ? filters.figureIds : undefined,
      query: debouncedQuery || undefined,
    }),
    [filters.tagIds, filters.contactIds, filters.figureIds, debouncedQuery],
  );

  const eventsQuery = useQuery({
    queryKey: timelineQueryKeys.events(listFilters),
    queryFn: () => fetchTimelineEvents(listFilters),
  });

  const totalEventsQuery = useQuery({
    queryKey: timelineQueryKeys.events({}),
    queryFn: () => fetchTimelineEvents(),
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

  const deleteMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
    },
  });

  const filtersDisabled = tagsQuery.isLoading || contactsQuery.isLoading || figuresQuery.isLoading;

  const actionError = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : "Failed to delete timeline event."
    : null;

  const events = eventsQuery.data ?? [];
  const hasActiveFilters = countTimelineEventsFilters(filters) > 0;
  const emptyMessage =
    hasActiveFilters && events.length === 0
      ? "No events match the current filters."
      : "No events yet.";

  return (
    <ListPageLayout
      title="Events"
      recordCount={totalEventsQuery.data?.length}
      subtitle="Life events for you and the people you track."
      actions={
        <IconPlusButton
          onClick={() => navigate("/timeline/new")}
          ariaLabel="New timeline event"
        />
      }
    >
      <div className="space-y-4">
        <RouteNoticeBanner />
        <TimelineEventsFilters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          tags={tagsQuery.data ?? []}
          contacts={contactsQuery.data ?? []}
          figures={figuresQuery.data ?? []}
          filters={filters}
          onFiltersChange={setFilters}
          disabled={filtersDisabled}
        />

        {eventsQuery.isLoading ? (
          <p className="text-sm text-stone-500">Loading events…</p>
        ) : null}
        {eventsQuery.isError ? (
          <p className="text-sm text-red-400">Failed to load events.</p>
        ) : null}
        {actionError ? <p className="text-sm text-red-400">{actionError}</p> : null}

        {eventsQuery.data ? (
          <TimelineListView
            events={events}
            contactById={contactById}
            figureById={figureById}
            onDelete={(eventId) => deleteMutation.mutate(eventId)}
            deleteDisabled={deleteMutation.isPending}
            emptyMessage={emptyMessage}
            paginationResetKey={listFilters}
          />
        ) : null}
      </div>
    </ListPageLayout>
  );
}
