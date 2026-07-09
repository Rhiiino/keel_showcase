// keel_web/src/modules/journal/homeCards/HomeJournalStatus.tsx

// Stylized journal completion indicator for the home dashboard.

import { HOME_CONTENT_WIDTH_CLASS } from "../../home/cards/layout/constants";
import { formatJournalStreakLabel } from "./lib/homeJournalStreak";

type HomeJournalStatusProps = {
  isComplete: boolean;
  isLoading?: boolean;
  streak?: number;
  onClick?: () => void;
};

function JournalStreakIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-amber-400/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
    </svg>
  );
}

function JournalCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function HomeJournalStatus({
  isComplete,
  isLoading = false,
  streak = 0,
  onClick,
}: HomeJournalStatusProps) {
  const streakLabel = formatJournalStreakLabel(streak);
  const statusLabel = isLoading
    ? "Checking today's journal entry"
    : isComplete
      ? `Journal entry completed for today. ${streakLabel}.`
      : `No journal entry for today yet. ${streakLabel}.`;

  const indicator = isLoading ? (
    <div
      className="h-9 w-9 animate-pulse rounded-full bg-stone-800/80 ring-1 ring-stone-700/60"
      aria-hidden
    />
  ) : isComplete ? (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/35 shadow-[0_0_20px_-6px_rgba(52,211,153,0.55)]">
      <JournalCheckIcon />
    </div>
  ) : (
    <div
      className="h-9 w-9 rounded-full bg-stone-900/60 ring-1 ring-stone-700/70"
      aria-hidden
    />
  );

  const streakDisplay = isLoading ? (
    <div
      className="h-4 w-24 animate-pulse rounded bg-stone-800/80"
      aria-hidden
    />
  ) : (
    <div
      className="flex items-center justify-center gap-1.5 text-sm tabular-nums text-stone-400"
      aria-label={streakLabel}
    >
      <JournalStreakIcon />
      <span>{streakLabel}</span>
    </div>
  );

  const content = (
    <>
      <h2 className="shrink-0 text-sm font-semibold text-stone-300">Journal</h2>
      <div className="min-w-0 flex-1 px-3">{streakDisplay}</div>
      <div className="shrink-0" title={statusLabel}>
        {indicator}
      </div>
    </>
  );

  return (
    <section className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={statusLabel}
          className="flex w-full items-center justify-between rounded-xl border border-stone-800/90 bg-stone-950/30 px-5 py-4 text-left transition hover:bg-stone-900/40"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-stone-800/90 bg-stone-950/30 px-5 py-4">
          {content}
        </div>
      )}
    </section>
  );
}
