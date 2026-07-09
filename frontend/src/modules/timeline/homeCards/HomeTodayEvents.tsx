// keel_web/src/modules/timeline/homeCards/HomeTodayEvents.tsx

// Compact list of today's timeline events for the home landing page.

import { useNavigate } from "react-router-dom";

import type { TimelineEvent } from "../api";
import { HOME_CONTENT_WIDTH_CLASS } from "../../home/cards/layout/constants";
import {
  getHomeTodayEventTimeDisplay,
  todayTimelineCreateStartDate,
} from "./lib/homeTodayEvents";

type HomeTodayEventsProps = {
  events: TimelineEvent[];
  isLoading?: boolean;
};

const createRowClass =
  "flex w-full items-center rounded-xl border border-stone-800/90 bg-stone-950/30 px-5 py-4 text-left transition hover:bg-stone-900/40";

const addEventRowClass =
  "flex w-full items-center justify-center gap-2 px-5 py-4 text-left transition hover:bg-stone-900/40";



// ----- Row visuals
function TimelinePlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TimelinePlusVisual({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100",
        className,
      ].join(" ")}
      aria-hidden
    >
      <TimelinePlusIcon />
    </span>
  );
}



// ----- Event rows
function HomeTodayEventTime({ startDate }: { startDate: string }) {
  const display = getHomeTodayEventTimeDisplay(startDate);

  if (display.isAllDay) {
    return (
      <span className="inline-flex w-[5.25rem] shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-400/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
        {display.primary}
      </span>
    );
  }

  return (
    <span className="inline-flex w-[5.25rem] shrink-0 flex-col items-center rounded-lg border border-sky-400/25 bg-sky-400/10 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(125,211,252,0.08)]">
      <span className="font-mono text-sm font-semibold tabular-nums leading-none text-sky-100">
        {display.primary}
      </span>
      {display.secondary ? (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sky-300/75">
          {display.secondary}
        </span>
      ) : null}
    </span>
  );
}

function HomeTodayEventRow({ event }: { event: TimelineEvent }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/timeline/${event.id}`)}
      className="flex w-full items-center gap-4 border-b border-stone-800/60 px-5 py-3.5 text-left transition last:border-b-0 hover:bg-stone-900/40"
    >
      <HomeTodayEventTime startDate={event.start_date} />
      <span className="min-w-0 flex-1 truncate text-sm leading-snug text-stone-200">
        {event.description}
      </span>
    </button>
  );
}



// ----- Create rows
function HomeTodayEventsEmptyRow({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreateClick}
      aria-label="Timeline. New timeline event for today"
      className={`${createRowClass} justify-between`}
    >
      <h2 className="shrink-0 text-sm font-semibold text-stone-300">Timeline</h2>
      <TimelinePlusVisual />
    </button>
  );
}

function HomeTodayEventsAddRow({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreateClick}
      aria-label="Add an event"
      className={addEventRowClass}
    >
      <TimelinePlusVisual className="h-8 w-8 rounded-lg" />
      <span className="text-sm font-semibold text-stone-300">Add an event</span>
    </button>
  );
}



// ----- Card
export function HomeTodayEvents({ events, isLoading = false }: HomeTodayEventsProps) {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    const start = encodeURIComponent(todayTimelineCreateStartDate());
    navigate(`/timeline/new?start=${start}`);
  };

  if (isLoading) {
    return (
      <section className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`}>
        <p className="text-sm text-stone-500">Loading events…</p>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`}>
        <HomeTodayEventsEmptyRow onCreateClick={handleCreateClick} />
      </section>
    );
  }

  return (
    <section className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`}>
      <div className="divide-y divide-stone-800/60 rounded-xl border border-stone-800/90 bg-stone-950/30">
        {events.map((event) => (
          <HomeTodayEventRow key={event.id} event={event} />
        ))}
        <HomeTodayEventsAddRow onCreateClick={handleCreateClick} />
      </div>
    </section>
  );
}
