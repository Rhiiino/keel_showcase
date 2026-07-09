// keel_web/src/modules/home/cards/alive/HomeAliveTimerTargetEditor.tsx

// Inline editor for per-mode alive-timer targets on the home card.

import { useMemo, useState } from "react";

import { HOME_CONTENT_WIDTH_CLASS } from "../layout/constants";
import { useHomeCardSlot } from "../layout/HomeCardCanvasContext";
import {
  getCurrentAliveValueForMode,
  isAliveTargetGreaterThanCurrent,
} from "./lib/aliveTargetDuration";
import {
  ALIVE_TIMER_DISPLAY_MODES,
  getAliveTimerDisplayModeLabel,
  type AliveTimerDisplayMode,
} from "./lib/aliveTimerDisplayModes";
import type {
  AliveTimerCalendarTarget,
  AliveTimerDaysTarget,
  AliveTimerSecondsTarget,
  AliveTimerTargetByMode,
} from "./lib/aliveTimerTargets";

type HomeAliveTimerTargetEditorProps = {
  birthMs: number;
  nowMs: number;
  targets: AliveTimerTargetByMode;
  onSave: (targets: AliveTimerTargetByMode) => void;
  onCancel: () => void;
};

type DraftTargets = AliveTimerTargetByMode;

function parseInputInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function NumberField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(event) => {
          const next = parseInputInt(event.target.value);
          if (next != null) {
            onChange(next);
          }
        }}
        className="w-full rounded-md border border-stone-800 bg-stone-950/80 px-2.5 py-1.5 text-sm text-stone-100"
        data-home-card-no-drag
      />
    </label>
  );
}

function CalendarTargetFields({
  draft,
  onChange,
}: {
  draft: AliveTimerCalendarTarget | null;
  onChange: (next: AliveTimerCalendarTarget | null) => void;
}) {
  if (!draft) {
    return (
      <button
        type="button"
        onClick={() =>
          onChange({
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
          })
        }
        className="rounded-md border border-dashed border-stone-700 px-3 py-2 text-xs text-stone-400 hover:border-stone-600 hover:text-stone-300"
        data-home-card-no-drag
      >
        Set calendar target
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Years" value={draft.years} onChange={(years) => onChange({ ...draft, years })} />
        <NumberField label="Months" value={draft.months} max={11} onChange={(months) => onChange({ ...draft, months })} />
        <NumberField label="Days" value={draft.days} max={31} onChange={(days) => onChange({ ...draft, days })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Hours" value={draft.hours} max={23} onChange={(hours) => onChange({ ...draft, hours })} />
        <NumberField label="Minutes" value={draft.minutes} max={59} onChange={(minutes) => onChange({ ...draft, minutes })} />
        <NumberField label="Seconds" value={draft.seconds} max={59} onChange={(seconds) => onChange({ ...draft, seconds })} />
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline"
        data-home-card-no-drag
      >
        Clear calendar target
      </button>
    </div>
  );
}

function SecondsTargetFields({
  draft,
  onChange,
  currentTotalSeconds,
}: {
  draft: AliveTimerSecondsTarget | null;
  onChange: (next: AliveTimerSecondsTarget | null) => void;
  currentTotalSeconds: number;
}) {
  if (!draft) {
    return (
      <button
        type="button"
        onClick={() => onChange({ totalSeconds: currentTotalSeconds + 1 })}
        className="rounded-md border border-dashed border-stone-700 px-3 py-2 text-xs text-stone-400 hover:border-stone-600 hover:text-stone-300"
        data-home-card-no-drag
      >
        Set seconds target
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <NumberField
        label="Total seconds"
        value={draft.totalSeconds}
        onChange={(totalSeconds) => onChange({ totalSeconds })}
      />
      <p className="text-xs text-stone-500">
        Current: {currentTotalSeconds.toLocaleString()} seconds
      </p>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline"
        data-home-card-no-drag
      >
        Clear seconds target
      </button>
    </div>
  );
}

function DaysTargetFields({
  draft,
  onChange,
}: {
  draft: AliveTimerDaysTarget | null;
  onChange: (next: AliveTimerDaysTarget | null) => void;
}) {
  if (!draft) {
    return (
      <button
        type="button"
        onClick={() =>
          onChange({
            totalDays: 0,
            remainder: { hours: 0, minutes: 0, seconds: 0 },
          })
        }
        className="rounded-md border border-dashed border-stone-700 px-3 py-2 text-xs text-stone-400 hover:border-stone-600 hover:text-stone-300"
        data-home-card-no-drag
      >
        Set days target
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <NumberField
        label="Total days"
        value={draft.totalDays}
        onChange={(totalDays) => onChange({ ...draft, totalDays })}
      />
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Hours"
          value={draft.remainder.hours}
          max={23}
          onChange={(hours) =>
            onChange({ ...draft, remainder: { ...draft.remainder, hours } })
          }
        />
        <NumberField
          label="Minutes"
          value={draft.remainder.minutes}
          max={59}
          onChange={(minutes) =>
            onChange({ ...draft, remainder: { ...draft.remainder, minutes } })
          }
        />
        <NumberField
          label="Seconds"
          value={draft.remainder.seconds}
          max={59}
          onChange={(seconds) =>
            onChange({ ...draft, remainder: { ...draft.remainder, seconds } })
          }
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline"
        data-home-card-no-drag
      >
        Clear days target
      </button>
    </div>
  );
}

function TargetModeSection({
  mode,
  birthMs,
  nowMs,
  draft,
  onChange,
}: {
  mode: AliveTimerDisplayMode;
  birthMs: number;
  nowMs: number;
  draft: DraftTargets;
  onChange: (mode: AliveTimerDisplayMode, next: DraftTargets[AliveTimerDisplayMode]) => void;
}) {
  const currentDisplay = getCurrentAliveValueForMode(mode, birthMs, nowMs);
  const isValid =
    draft[mode] == null
    || isAliveTargetGreaterThanCurrent(birthMs, nowMs, mode, draft[mode]);

  return (
    <div className="space-y-3 rounded-lg border border-stone-800/80 bg-stone-950/40 px-4 py-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">
          {getAliveTimerDisplayModeLabel(mode)}
        </h3>
        {!isValid ? (
          <p className="mt-1 text-xs text-rose-400/90">
            Target must be greater than your current time alive for this format.
          </p>
        ) : null}
      </div>

      {mode === "calendar" ? (
        <CalendarTargetFields
          draft={draft.calendar}
          onChange={(next) => onChange("calendar", next)}
        />
      ) : null}
      {mode === "seconds" && currentDisplay.mode === "seconds" ? (
        <SecondsTargetFields
          draft={draft.seconds}
          currentTotalSeconds={currentDisplay.totalSeconds}
          onChange={(next) => onChange("seconds", next)}
        />
      ) : null}
      {mode === "days" ? (
        <DaysTargetFields
          draft={draft.days}
          onChange={(next) => onChange("days", next)}
        />
      ) : null}
    </div>
  );
}

export function HomeAliveTimerTargetEditor({
  birthMs,
  nowMs,
  targets: initialTargets,
  onSave,
  onCancel,
}: HomeAliveTimerTargetEditorProps) {
  const [draftTargets, setDraftTargets] = useState<DraftTargets>(initialTargets);
  const slot = useHomeCardSlot();
  const sectionClass = slot?.fillSlot
    ? "flex h-full min-h-0 w-full flex-col overflow-y-auto"
    : `mt-8 ${HOME_CONTENT_WIDTH_CLASS}`;

  const validationByMode = useMemo(() => {
    const result: Record<AliveTimerDisplayMode, boolean> = {
      calendar: true,
      seconds: true,
      days: true,
    };

    for (const mode of ALIVE_TIMER_DISPLAY_MODES) {
      const target = draftTargets[mode];
      result[mode] =
        target == null
        || isAliveTargetGreaterThanCurrent(birthMs, nowMs, mode, target);
    }

    return result;
  }, [birthMs, draftTargets, nowMs]);

  const canSave = ALIVE_TIMER_DISPLAY_MODES.every((mode) => validationByMode[mode]);
  const hasChanges =
    JSON.stringify(draftTargets) !== JSON.stringify(initialTargets);

  const handleModeChange = (
    mode: AliveTimerDisplayMode,
    next: DraftTargets[AliveTimerDisplayMode],
  ) => {
    setDraftTargets((current) => ({
      ...current,
      [mode]: next,
    }));
  };

  return (
    <div className={sectionClass} data-home-card-no-drag>
      <div className="rounded-xl border border-stone-800/90 bg-gradient-to-br from-stone-900/70 via-stone-950/50 to-stone-900/30 shadow-lg shadow-black/20">
        <div className="space-y-4 px-5 py-5">
          <div>
            <h2 className="text-sm font-semibold text-stone-100">Alive timer targets</h2>
            <p className="mt-1 text-xs text-stone-500">
              Set a checkpoint for each display format. When active, the card shows a countdown and the exact date and time it will be reached.
            </p>
          </div>

          <div className="space-y-3">
            {ALIVE_TIMER_DISPLAY_MODES.map((mode) => (
              <TargetModeSection
                key={mode}
                mode={mode}
                birthMs={birthMs}
                nowMs={nowMs}
                draft={draftTargets}
                onChange={handleModeChange}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-stone-800 px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-900"
              data-home-card-no-drag
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave || !hasChanges}
              onClick={() => onSave(draftTargets)}
              className="rounded-lg border border-emerald-700/80 bg-emerald-950/50 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
              data-home-card-no-drag
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
