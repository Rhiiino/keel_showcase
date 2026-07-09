// keel_web/src/modules/timeline/components/calendar/TimelineCalendarEventHoverPreview.tsx

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineEvent, TimelinePlanItem } from "../../api";
import { formatTimelineHoverDateRange, hasTimelinePeople } from "../../lib/timelineDisplay";
import { formatReminderList } from "../../lib/timelineReminderDisplay";
import { TimelinePeopleAvatars } from "../TimelinePeopleAvatars";
import { TimelineTagPill } from "../tags/TimelineTagPill";

const HOVER_PREVIEW_MAX_WIDTH = 320;
const HOVER_PREVIEW_GAP = 8;

const HOVER_PREVIEW_SHELL_CLASS =
  "pointer-events-none fixed z-[80] w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-stone-700/90 bg-stone-950/95 p-3 shadow-xl ring-1 ring-stone-800/80 backdrop-blur-sm";

type TimelineCalendarEventHoverPreviewProps = {
  event: TimelineEvent;
  anchorEl: HTMLElement;
  contactById: Map<number, Contact>;
  figureById: Map<number, Figure>;
};

type TimelineCalendarPlanItemHoverPreviewProps = {
  item: TimelinePlanItem;
  anchorEl: HTMLElement;
};

function useAnchorRect(anchorEl: HTMLElement | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchorEl) {
      setRect(null);
      return;
    }

    const update = () => {
      setRect(anchorEl.getBoundingClientRect());
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl]);

  return rect;
}

function TimelineCalendarHoverPreviewShell({
  anchorEl,
  children,
}: {
  anchorEl: HTMLElement;
  children: ReactNode;
}) {
  const anchorRect = useAnchorRect(anchorEl);

  if (!anchorRect) {
    return null;
  }

  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const showAbove = spaceBelow < 160 && spaceAbove > spaceBelow;

  const left = Math.min(
    Math.max(HOVER_PREVIEW_GAP, anchorRect.left),
    window.innerWidth - HOVER_PREVIEW_MAX_WIDTH - HOVER_PREVIEW_GAP,
  );

  const top = showAbove
    ? anchorRect.top - HOVER_PREVIEW_GAP
    : anchorRect.bottom + HOVER_PREVIEW_GAP;

  return createPortal(
    <div
      role="tooltip"
      className={HOVER_PREVIEW_SHELL_CLASS}
      style={{
        left,
        top,
        transform: showAbove ? "translateY(-100%)" : undefined,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function HoverPreviewDateLabel({ label }: { label: string }) {
  return <p className="text-xs font-medium text-stone-400">{label}</p>;
}

function HoverPreviewTags({ tags }: { tags: TimelineEvent["tags"] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <TimelineTagPill key={tag.id} tag={tag} compact />
      ))}
    </div>
  );
}

export function TimelineCalendarEventHoverPreview({
  event,
  anchorEl,
  contactById,
  figureById,
}: TimelineCalendarEventHoverPreviewProps) {
  const dateLabel = formatTimelineHoverDateRange(event.start_date, event.end_date);
  const showPeople = hasTimelinePeople(event);
  const reminderLabel = formatReminderList(event.reminders ?? []);

  return (
    <TimelineCalendarHoverPreviewShell anchorEl={anchorEl}>
      <HoverPreviewDateLabel label={dateLabel} />
      <HoverPreviewTags tags={event.tags} />

      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-100">
        {event.description}
      </p>

      {reminderLabel ? (
        <p className="mt-2 text-xs text-stone-400">Reminders: {reminderLabel}</p>
      ) : null}

      {showPeople ? (
        <div className="mt-3">
          <TimelinePeopleAvatars
            contacts={event.contacts}
            figures={event.figures}
            subjectName={event.subject_name}
            contactById={contactById}
            figureById={figureById}
          />
        </div>
      ) : null}
    </TimelineCalendarHoverPreviewShell>
  );
}

export function TimelineCalendarPlanItemHoverPreview({
  item,
  anchorEl,
}: TimelineCalendarPlanItemHoverPreviewProps) {
  const dateLabel = formatTimelineHoverDateRange(item.start_at, item.end_at);
  const description = item.description.trim();

  return (
    <TimelineCalendarHoverPreviewShell anchorEl={anchorEl}>
      <HoverPreviewDateLabel label={dateLabel} />
      <HoverPreviewTags tags={item.tags} />

      <p className="mt-2 text-sm font-medium leading-relaxed text-stone-100">{item.title}</p>

      {description ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-100">
          {description}
        </p>
      ) : null}
    </TimelineCalendarHoverPreviewShell>
  );
}
