// keel_web/src/modules/home/cards/alive/HomeAliveTimerCountdown.tsx

// Countdown presentation shown below the alive timer when a target is active.

import {
  formatRemainderClock,
  padTwo,
  type AliveTimerDisplay,
} from "./lib/aliveDuration";
import { formatAliveTargetReachDateTime } from "./lib/aliveTargetDuration";

type HomeAliveTimerCountdownProps = {
  display: AliveTimerDisplay;
  targetReachMs: number;
  fillSlot?: boolean;
};

const DIGIT_CLASS =
  "font-mono tabular-nums tracking-wider text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.35)]";
const BEZEL_CLASS =
  "rounded-lg bg-black/70 px-4 py-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.55)] ring-1 ring-stone-800/70";

function CountdownSegment({
  value,
  label,
  size = "sm",
}: {
  value: string;
  label: string;
  size?: "sm" | "md";
}) {
  const valueClass =
    size === "md" ? "text-2xl sm:text-3xl font-semibold" : "text-xl sm:text-2xl font-medium";
  const labelClass = "text-[11px] uppercase tracking-[0.18em] text-amber-700/80";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`${DIGIT_CLASS} ${valueClass}`}>{value}</span>
      <span className={labelClass}>{label}</span>
    </div>
  );
}

function CountdownColon({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "pb-5 text-2xl" : "pb-4 text-xl";
  return (
    <span className={`${sizeClass} font-semibold text-amber-600/70`} aria-hidden>
      :
    </span>
  );
}

function CalendarCountdownFace({
  display,
}: {
  display: Extract<AliveTimerDisplay, { mode: "calendar" }>;
}) {
  const { parts } = display;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <CountdownSegment value={String(parts.years)} label="yr" size="md" />
        <CountdownColon size="md" />
        <CountdownSegment value={padTwo(parts.months)} label="mo" size="md" />
        <CountdownColon size="md" />
        <CountdownSegment value={padTwo(parts.days)} label="d" size="md" />
      </div>
      <div className="flex items-center justify-center gap-2">
        <CountdownSegment value={padTwo(parts.hours)} label="hr" />
        <CountdownColon />
        <CountdownSegment value={padTwo(parts.minutes)} label="min" />
        <CountdownColon />
        <CountdownSegment value={padTwo(parts.seconds)} label="sec" />
      </div>
    </div>
  );
}

function SecondsCountdownFace({
  display,
}: {
  display: Extract<AliveTimerDisplay, { mode: "seconds" }>;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`${DIGIT_CLASS} text-3xl sm:text-4xl font-semibold`}>
        {display.totalSeconds.toLocaleString()}
      </span>
      <span className="text-[11px] uppercase tracking-[0.22em] text-amber-700/80">seconds</span>
    </div>
  );
}

function DaysCountdownFace({
  display,
}: {
  display: Extract<AliveTimerDisplay, { mode: "days" }>;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <span className={`${DIGIT_CLASS} text-3xl sm:text-4xl font-semibold`}>
          {display.totalDays.toLocaleString()}
        </span>
        <span className="text-[11px] uppercase tracking-[0.22em] text-amber-700/80">days</span>
      </div>
      <span className={`${DIGIT_CLASS} text-2xl sm:text-3xl font-semibold`}>
        {formatRemainderClock(display.remainder)}
      </span>
    </div>
  );
}

function CountdownFace({ display }: { display: AliveTimerDisplay }) {
  if (display.mode === "calendar") {
    return <CalendarCountdownFace display={display} />;
  }
  if (display.mode === "seconds") {
    return <SecondsCountdownFace display={display} />;
  }
  return <DaysCountdownFace display={display} />;
}

export function HomeAliveTimerCountdown({
  display,
  targetReachMs,
  fillSlot = false,
}: HomeAliveTimerCountdownProps) {
  const reachLabel = formatAliveTargetReachDateTime(targetReachMs);

  return (
    <div
      className={[
        BEZEL_CLASS,
        fillSlot ? "mt-3 shrink-0" : "mt-4",
      ].join(" ")}
    >
      <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">
        Target countdown
      </div>
      <CountdownFace display={display} />
      <p className="mt-3 text-center text-xs text-stone-400">
        Reached on{" "}
        <span className="font-medium text-stone-300">{reachLabel}</span>
      </p>
    </div>
  );
}
