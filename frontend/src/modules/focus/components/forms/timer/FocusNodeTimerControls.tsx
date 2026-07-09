// keel_web/src/modules/focus/components/forms/timer/FocusNodeTimerControls.tsx

// Top-of-form timer controls for a focus node.

import type { FocusNodeTimeEntry } from "../../../api";
import { FocusListIcon } from "../../shared/icons";

export type FocusNodeTimerControlsProps = {
  activeEntry: FocusNodeTimeEntry | null;
  elapsedSeconds: number;
  isLoading: boolean;
  actionPending: boolean;
  errorMessage: string | null;
  historyOpen: boolean;
  onToggleHistory: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
};

export function formatElapsedTime(totalSeconds: number): string {
  const safeSeconds = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export const FOCUS_NODE_TIMER_PILL_SURFACE_CLASS =
  "rounded-full border border-emerald-300/20 bg-emerald-300/10 font-mono leading-none text-emerald-100/90";

export function FocusNodeTimerControls({
  activeEntry,
  elapsedSeconds,
  isLoading,
  actionPending,
  errorMessage,
  historyOpen,
  onToggleHistory,
  onStart,
  onPause,
  onResume,
  onEnd,
}: FocusNodeTimerControlsProps) {
  const disabled = isLoading || actionPending;
  const isPaused = activeEntry?.status === "paused";
  const isOpen = activeEntry !== null;

  return (
    <section className="flex flex-wrap items-center justify-end gap-2">
      {isOpen ? (
        <div
          className={[FOCUS_NODE_TIMER_PILL_SURFACE_CLASS, "px-3 py-1.5 text-sm"].join(" ")}
        >
          {formatElapsedTime(elapsedSeconds)}
        </div>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-semibold text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            disabled={disabled}
            className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onEnd}
            disabled={disabled}
            className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            End
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onToggleHistory}
        aria-label="Show time entries"
        title="Time entries"
        className={[
          "grid h-8 w-8 place-items-center rounded-full transition",
          historyOpen
            ? "bg-sky-400 text-stone-950"
            : "text-white/55 ring-1 ring-white/15 hover:bg-white/[0.06] hover:text-white/85",
        ].join(" ")}
      >
        <FocusListIcon className="h-4 w-4" />
      </button>

      {errorMessage ? (
        <p className="basis-full text-right text-xs text-rose-300">{errorMessage}</p>
      ) : null}
    </section>
  );
}
