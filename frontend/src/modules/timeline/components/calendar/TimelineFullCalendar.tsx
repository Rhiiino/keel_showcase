// keel_web/src/modules/timeline/components/calendar/TimelineFullCalendar.tsx

import type {
  DatesSetArg,
  EventClickArg,
  EventHoveringArg,
  EventInput,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useState } from "react";

import { useUserTimezone } from "../../../../app/timezone";
import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineEvent, TimelinePlanItem } from "../../api";
import { TimelineCalendarEventContent } from "./TimelineCalendarEventContent";
import {
  TimelineCalendarEventHoverPreview,
  TimelineCalendarPlanItemHoverPreview,
} from "./TimelineCalendarEventHoverPreview";

import "./timeline-calendar.css";

type TimelineFullCalendarProps = {
  events: EventInput[];
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
  onDatesSet: (dateInfo: DatesSetArg) => void;
  onEventClick: (eventId: number) => void;
  onPlanItemClick?: (item: TimelinePlanItem) => void;
  onViewStateChange?: (state: { isDayView: boolean; activeDay: Date }) => void;
};

type HoverPreviewState =
  | {
      kind: "event";
      event: TimelineEvent;
      anchorEl: HTMLElement;
    }
  | {
      kind: "plan_item";
      item: TimelinePlanItem;
      anchorEl: HTMLElement;
    };

export function TimelineFullCalendar({
  events,
  contactById,
  figureById,
  onDatesSet,
  onEventClick,
  onPlanItemClick,
  onViewStateChange,
}: TimelineFullCalendarProps) {
  const timeZone = useUserTimezone();
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewState | null>(null);

  const handleDateClick = useCallback((clickInfo: DateClickArg) => {
    clickInfo.view.calendar.changeView("timeGridDay", clickInfo.date);
  }, []);

  const handleEventClick = (clickInfo: EventClickArg) => {
    clickInfo.jsEvent.preventDefault();
    const kind = clickInfo.event.extendedProps.kind;
    if (kind === "plan_item") {
      const planItem = clickInfo.event.extendedProps.timelinePlanItem as
        | TimelinePlanItem
        | undefined;
      if (planItem) {
        onPlanItemClick?.(planItem);
      }
      return;
    }
    const eventId = Number(clickInfo.event.id);
    if (Number.isFinite(eventId)) {
      onEventClick(eventId);
    }
  };

  const handleEventMouseEnter = useCallback((info: EventHoveringArg) => {
    const kind = info.event.extendedProps.kind;
    if (kind === "plan_item") {
      const planItem = info.event.extendedProps.timelinePlanItem as TimelinePlanItem | undefined;
      if (!planItem) {
        return;
      }
      setHoverPreview({
        kind: "plan_item",
        item: planItem,
        anchorEl: info.el,
      });
      return;
    }

    const timelineEvent = info.event.extendedProps.timelineEvent as TimelineEvent | undefined;
    if (!timelineEvent) {
      return;
    }
    setHoverPreview({
      kind: "event",
      event: timelineEvent,
      anchorEl: info.el,
    });
  }, []);

  const handleEventMouseLeave = useCallback(() => {
    setHoverPreview(null);
  }, []);

  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      onViewStateChange?.({
        isDayView: dateInfo.view.type === "timeGridDay",
        activeDay: dateInfo.view.currentStart,
      });
      onDatesSet(dateInfo);
    },
    [onDatesSet, onViewStateChange],
  );

  return (
    <div className="timeline-full-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        height="auto"
        timeZone={timeZone}
        weekends
        events={events}
        eventContent={(eventInfo) => {
          const viewType = eventInfo.view.type;
          if (viewType === "timeGridDay" || viewType === "timeGridWeek") {
            // Custom React content breaks all-day height measurement in time-grid views.
            // FullCalendar treats `null` as empty output; `true` opts into default rendering.
            return true;
          }
          return (
            <TimelineCalendarEventContent
              eventInfo={eventInfo}
              contactById={contactById}
              figureById={figureById}
            />
          );
        }}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        views={{
          dayGridMonth: { dayMaxEvents: true },
          timeGridWeek: { dayMaxEvents: false, allDaySlot: true },
          timeGridDay: { dayMaxEvents: false, allDaySlot: true },
        }}
        navLinks
      />

      {hoverPreview?.kind === "event" ? (
        <TimelineCalendarEventHoverPreview
          event={hoverPreview.event}
          anchorEl={hoverPreview.anchorEl}
          contactById={contactById}
          figureById={figureById}
        />
      ) : null}
      {hoverPreview?.kind === "plan_item" ? (
        <TimelineCalendarPlanItemHoverPreview
          item={hoverPreview.item}
          anchorEl={hoverPreview.anchorEl}
        />
      ) : null}
    </div>
  );
}
