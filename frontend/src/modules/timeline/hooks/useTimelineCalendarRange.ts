// keel_web/src/modules/timeline/hooks/useTimelineCalendarRange.ts

import { useCallback, useState } from "react";
import type { DatesSetArg } from "@fullcalendar/core";

import { getUserTimezone } from "../../../app/timezone";
import {
  calendarDatesSetToQueryParams,
  calendarVisibleRangeToQueryParams,
  type TimelineEventDateRangeFilters,
} from "../lib/timelineDateRange";

function getDefaultRange(): TimelineEventDateRangeFilters {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const exclusiveEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return calendarVisibleRangeToQueryParams(start, exclusiveEnd, getUserTimezone());
}

export function useTimelineCalendarRange() {
  const [range, setRange] = useState<TimelineEventDateRangeFilters>(getDefaultRange);

  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setRange(calendarDatesSetToQueryParams(dateInfo.startStr, dateInfo.endStr));
  }, []);

  return {
    range,
    handleDatesSet,
  };
}
