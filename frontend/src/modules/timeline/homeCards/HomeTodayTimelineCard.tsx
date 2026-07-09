// keel_web/src/modules/timeline/homeCards/HomeTodayTimelineCard.tsx

// Today's timeline events card for the home dashboard.

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchTimelineEvents, timelineQueryKeys } from "../api";
import { HomeTodayEvents } from "./HomeTodayEvents";
import {
  sortHomeTodayEvents,
  todayTimelineListFilters,
} from "./lib/homeTodayEvents";

export function HomeTodayTimelineCard() {
  const todayEventFilters = useMemo(() => todayTimelineListFilters(), []);

  const todayEventsQuery = useQuery({
    queryKey: timelineQueryKeys.events(todayEventFilters),
    queryFn: () => fetchTimelineEvents(todayEventFilters),
  });

  const todayEvents = useMemo(
    () => sortHomeTodayEvents(todayEventsQuery.data ?? []),
    [todayEventsQuery.data],
  );

  return (
    <HomeTodayEvents
      events={todayEvents}
      isLoading={todayEventsQuery.isLoading}
    />
  );
}
