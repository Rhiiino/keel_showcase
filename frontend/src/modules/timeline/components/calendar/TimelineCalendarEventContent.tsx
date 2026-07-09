// keel_web/src/modules/timeline/components/calendar/TimelineCalendarEventContent.tsx

import type { EventContentArg } from "@fullcalendar/core";

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineEvent } from "../../api";
import { hasTimelinePeople } from "../../lib/timelineDisplay";
import { timelineCalendarEventTitle } from "../../lib/timelineCalendarEvents";
import { TIMELINE_CALENDAR_PERSON_CIRCLE_SIZE_CLASS } from "../../lib/timelinePersonCircle";
import { TimelinePersonCircle } from "../TimelinePersonCircle";

const MAX_VISIBLE_PEOPLE = 2;

type CalendarPersonEntry = {
  key: string;
  displayName: string;
  photo: Contact["photo"] | Figure["photo"] | null;
  firstName: string | null | undefined;
};

function buildCalendarPeople(
  event: TimelineEvent,
  contactById: Map<number, Contact>,
  figureById: Map<number, Figure>,
): CalendarPersonEntry[] {
  const people: CalendarPersonEntry[] = [];

  for (const contact of event.contacts) {
    const details = contactById.get(contact.id);
    people.push({
      key: `contact-${contact.id}`,
      displayName: contact.display_name,
      photo: details?.photo ?? null,
      firstName: details?.first_name,
    });
  }

  for (const figure of event.figures) {
    const details = figureById.get(figure.id);
    people.push({
      key: `figure-${figure.id}`,
      displayName: figure.display_name,
      photo: details?.photo ?? null,
      firstName: details?.first_name,
    });
  }

  return people;
}

type TimelineCalendarEventContentProps = {
  eventInfo: EventContentArg;
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
};

export function TimelineCalendarEventContent({
  eventInfo,
  contactById,
  figureById,
}: TimelineCalendarEventContentProps) {
  // Multi-day month/week cells render a thin continuation bar; custom content overflows it.
  const viewType = eventInfo.view.type;
  if (
    !eventInfo.isStart &&
    (viewType === "dayGridMonth" || viewType === "dayGridWeek")
  ) {
    return null;
  }

  const timelineEvent = eventInfo.event.extendedProps.timelineEvent as TimelineEvent | undefined;
  const title = timelineEvent
    ? timelineCalendarEventTitle(timelineEvent)
    : eventInfo.event.title;

  if (!timelineEvent || !hasTimelinePeople(timelineEvent)) {
    return (
      <div className="flex min-w-0 items-center overflow-hidden px-0.5">
        <span className="truncate">{title}</span>
      </div>
    );
  }

  const people = buildCalendarPeople(timelineEvent, contactById, figureById);
  const visiblePeople = people.slice(0, MAX_VISIBLE_PEOPLE);
  const overflowCount = people.length - visiblePeople.length;

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden px-0.5">
      <div className="flex shrink-0 items-center">
        {visiblePeople.map((person, index) => (
          <span
            key={person.key}
            className={index > 0 ? "-ml-2.5" : undefined}
            style={{ zIndex: visiblePeople.length - index }}
          >
            <TimelinePersonCircle
              displayName={person.displayName}
              photo={person.photo}
              firstName={person.firstName}
              sizeClass={TIMELINE_CALENDAR_PERSON_CIRCLE_SIZE_CLASS}
              showTooltip={false}
            />
          </span>
        ))}
        {overflowCount > 0 ? (
          <span
            className={[
              "inline-flex shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-semibold leading-none text-stone-200 ring-1 ring-stone-700",
              TIMELINE_CALENDAR_PERSON_CIRCLE_SIZE_CLASS,
              visiblePeople.length > 0 ? "-ml-2.5" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`${overflowCount} more people`}
            title={`+${overflowCount} more`}
          >
            +{overflowCount}
          </span>
        ) : null}
      </div>
      <span className="min-w-0 truncate">{title}</span>
    </div>
  );
}
