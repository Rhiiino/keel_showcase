// keel_web/src/modules/timeline/components/TimelinePeopleAvatars.tsx

import type { Contact } from "../../people/contacts/api";
import type { Figure } from "../../people/figures/api";
import type { TimelineEventContact, TimelineEventFigure } from "../api";
import { TimelinePersonCircle } from "./TimelinePersonCircle";

type TimelinePeopleAvatarsProps = {
  contacts: TimelineEventContact[];
  figures: TimelineEventFigure[];
  subjectName: string | null;
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
};

export function TimelinePeopleAvatars({
  contacts,
  figures,
  subjectName,
  contactById,
  figureById,
}: TimelinePeopleAvatarsProps) {
  const subject = subjectName?.trim();

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {contacts.map((contact) => {
        const details = contactById.get(contact.id);
        return (
          <TimelinePersonCircle
            key={`contact-${contact.id}`}
            displayName={contact.display_name}
            photo={details?.photo ?? null}
            firstName={details?.first_name}
          />
        );
      })}
      {figures.map((figure) => {
        const details = figureById.get(figure.id);
        return (
          <TimelinePersonCircle
            key={`figure-${figure.id}`}
            displayName={figure.display_name}
            photo={details?.photo ?? null}
            firstName={details?.first_name}
          />
        );
      })}
      {subject ? (
        <TimelinePersonCircle
          key="subject"
          displayName={subject}
          firstName={subject.split(/\s+/)[0]}
        />
      ) : null}
    </div>
  );
}
