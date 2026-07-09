// keel_web/src/modules/timeline/components/browse/TimelineListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { TimelineEvent } from "../../api";
import { TimelinePeopleAvatars } from "../TimelinePeopleAvatars";
import { TimelineTagPill } from "../tags/TimelineTagPill";
import { formatTimelineDateRange, hasTimelinePeople } from "../../lib/timelineDisplay";

export const TIMELINE_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[56rem]";

export const TIMELINE_LIST_GRID_CLASS =
  "grid w-full grid-cols-[22rem_minmax(0,14rem)_minmax(0,1fr)_3.5rem]";

type TimelineListRowProps = {
  event: TimelineEvent;
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
  onDelete?: (eventId: number) => void;
  deleteDisabled?: boolean;
};

export function TimelineListRow({
  event,
  contactById,
  figureById,
  onDelete,
  deleteDisabled = false,
}: TimelineListRowProps) {
  const navigate = useNavigate();
  const dateRange = formatTimelineDateRange(event.start_date, event.end_date);
  const showPeople = hasTimelinePeople(event);
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(event.id);

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(`/timeline/${event.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        "relative grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        TIMELINE_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-3.5 align-middle">
        <p className="whitespace-nowrap text-sm text-stone-300">
          <span className="font-medium text-stone-100">{dateRange.primary}</span>
          {dateRange.secondary ? (
            <>
              <span className="mx-1.5 text-stone-600">–</span>
              <span className="font-medium text-stone-100">{dateRange.secondary}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        {showPeople ? (
          <TimelinePeopleAvatars
            contacts={event.contacts}
            figures={event.figures}
            subjectName={event.subject_name}
            contactById={contactById}
            figureById={figureById}
          />
        ) : (
          <span className="text-sm text-stone-600">—</span>
        )}
      </div>

      <div className="min-w-0 overflow-hidden px-4 py-3.5 align-middle">
        <p className="truncate text-sm text-stone-200" title={event.description}>
          {event.description}
        </p>
        {event.tags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {event.tags.map((tag) => (
              <TimelineTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-20 flex items-center justify-center px-2 py-3.5"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {onDelete ? (
          <CardMenu
            ariaLabel={`Timeline event options for ${event.description}`}
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: confirmPending ? "Confirm delete" : "Delete",
                tone: "danger",
                onSelect: () => {
                  handleClick(() => onDelete(event.id));
                },
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}
