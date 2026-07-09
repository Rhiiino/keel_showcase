// keel_web/src/modules/timeline/lib/timelineCalendarEvents.ts

// Map timeline API rows to FullCalendar event inputs.

import type { EventInput } from "@fullcalendar/core";

import type { TimelineEvent, TimelinePlanItem } from "../api";
import { addDaysToDateOnly } from "./timelineDateRange";
import {
  isTimelineAllDayEvent,
  isTimelineUtcMidnight,
  timelineDateTimeToDateOnly,
} from "./timelineDateTime";

const PLAN_ITEM_EVENT_COLORS = {
  backgroundColor: "rgba(14, 116, 144, 0.55)",
  borderColor: "rgba(34, 211, 238, 0.55)",
  textColor: "rgb(250, 250, 249)",
};

/** FullCalendar all-day end dates are exclusive; DB end_date is inclusive. */
export function timelineExclusiveCalendarEnd(inclusiveEndDate: string): string {
  return addDaysToDateOnly(timelineDateTimeToDateOnly(inclusiveEndDate), 1);
}

export function timelineEventToCalendarEvent(event: TimelineEvent): EventInput {
  const allDay = isTimelineAllDayEvent(event.start_date, event.end_date);

  if (allDay) {
    const inclusiveEnd = event.end_date ?? event.start_date;
    return {
      id: String(event.id),
      title: event.description,
      start: timelineDateTimeToDateOnly(event.start_date),
      end: timelineExclusiveCalendarEnd(inclusiveEnd),
      allDay: true,
      extendedProps: {
        timelineEvent: event,
      },
    };
  }

  return {
    id: String(event.id),
    title: event.description,
    start: event.start_date,
    end: event.end_date ?? undefined,
    allDay: false,
    display: "block",
    extendedProps: {
      timelineEvent: event,
    },
  };
}

export function timelinePlanItemToCalendarEvent(item: TimelinePlanItem): EventInput {
  const allDay = item.all_day || isTimelineUtcMidnight(item.start_at);

  if (allDay) {
    const startDate = timelineDateTimeToDateOnly(item.start_at);
    const inclusiveEnd = item.end_at ? timelineDateTimeToDateOnly(item.end_at) : startDate;
    return {
      id: `plan-item-${item.id}`,
      title: item.title,
      start: startDate,
      end: timelineExclusiveCalendarEnd(inclusiveEnd),
      allDay: true,
      ...PLAN_ITEM_EVENT_COLORS,
      classNames: ["timeline-plan-item-event"],
      extendedProps: {
        kind: "plan_item",
        timelinePlanItem: item,
      },
    };
  }

  return {
    id: `plan-item-${item.id}`,
    title: item.title,
    start: item.start_at,
    end: item.end_at ?? undefined,
    allDay: false,
    ...PLAN_ITEM_EVENT_COLORS,
    classNames: ["timeline-plan-item-event"],
    display: "block",
    extendedProps: {
      kind: "plan_item",
      timelinePlanItem: item,
    },
  };
}

export function timelinePlanItemsToCalendarEvents(items: TimelinePlanItem[]): EventInput[] {
  return items.map(timelinePlanItemToCalendarEvent);
}

export function timelineEventsToCalendarEvents(events: TimelineEvent[]): EventInput[] {
  return events.map(timelineEventToCalendarEvent);
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function timelineCalendarEventTitle(event: TimelineEvent): string {
  return truncateText(event.description, 80);
}
