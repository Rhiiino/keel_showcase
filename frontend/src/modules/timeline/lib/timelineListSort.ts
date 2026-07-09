// keel_web/src/modules/timeline/lib/timelineListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { Contact } from "../../people/contacts/api";
import type { TimelineEvent } from "../api";

export type TimelineSortColumn = "date" | "people" | "event";

export const TIMELINE_DEFAULT_SORT: ListColumnSortState<TimelineSortColumn> = {
  column: "date",
  direction: "desc",
};

export function getTimelinePeopleSortLabel(
  event: TimelineEvent,
  contactById: Map<number, Contact>,
): string {
  const names = event.contacts.map((contact) => {
    const details = contactById.get(contact.id);
    if (details) {
      return [details.first_name, details.last_name].filter(Boolean).join(" ") || contact.display_name;
    }
    return contact.display_name;
  });

  if (event.subject_name?.trim()) {
    names.push(event.subject_name.trim());
  }

  return names.sort((left, right) => left.localeCompare(right)).join(", ");
}

export function getTimelineSortValue(
  event: TimelineEvent,
  column: TimelineSortColumn,
  contactById: Map<number, Contact>,
): string | number | null {
  switch (column) {
    case "date":
      return event.start_date;
    case "people":
      return getTimelinePeopleSortLabel(event, contactById);
    case "event":
      return event.description;
    default:
      return null;
  }
}
