// keel_web/src/modules/home/cards/alive/HomeAliveTimer.tsx

// Digital-clock presentation for the home alive-timer card.

import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { HOME_CONTENT_WIDTH_CLASS } from "../layout/constants";
import { useHomeCardSlot } from "../layout/HomeCardCanvasContext";
import { useHomeCardContentScale } from "../layout/useHomeCardContentScale";
import {
  formatRemainderClock,
  padTwo,
  type AliveTimerDisplay,
} from "./lib/aliveDuration";
import {
  cycleAliveTimerDisplayMode,
  getAliveTimerDisplayModeLabel,
  type AliveTimerDisplayMode,
} from "./lib/aliveTimerDisplayModes";
import { HomeAliveTimerCountdown } from "./HomeAliveTimerCountdown";

type HomeAliveTimerProps = {
  display: AliveTimerDisplay | null;
  displayMode: AliveTimerDisplayMode;
  isLoading?: boolean;
  contactId?: number | null;
  emptyMessage?: string | null;
  countdown?: AliveTimerDisplay | null;
  targetReachMs?: number | null;
  onCycleDisplayMode: () => void;
  onEdit?: () => void;
};

type ClockBezelProps = {
  fillSlot?: boolean;
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
  children: ReactNode;
};

const DIGIT_CLASS =
  "font-mono tabular-nums tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]";
const CLOCK_BEZEL_CLASS =
  "rounded-xl bg-black/80 px-6 py-5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] ring-1 ring-stone-800/80";

const CLOCK_DISPLAY_SCALE = 1.5;

function ClockBezel({
  fillSlot = false,
  baseWidth = 480 * CLOCK_DISPLAY_SCALE,
  baseHeight = 136 * CLOCK_DISPLAY_SCALE,
  className = "",
  children,
}: ClockBezelProps) {
  const { containerRef, scale } = useHomeCardContentScale(baseWidth, baseHeight);

  if (!fillSlot) {
    return (
      <div className={[CLOCK_BEZEL_CLASS, className].filter(Boolean).join(" ")}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        CLOCK_BEZEL_CLASS,
        "flex min-h-0 flex-1 items-center justify-center overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="origin-center" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

function CycleModeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h5M20 20v-5h-5M20 9a8 8 0 0 0-14.9-3M4 15a8 8 0 0 0 14.9 3"
      />
    </svg>
  );
}

const hoverOverlayClass = [
  "pointer-events-none absolute inset-0 z-10 opacity-0",
  "transition-opacity duration-200",
  "group-hover/alive:opacity-100 group-focus-within/alive:opacity-100",
].join(" ");

function CycleModeButton({
  displayMode,
  onClick,
  className = "",
}: {
  displayMode: AliveTimerDisplayMode;
  onClick: () => void;
  className?: string;
}) {
  const nextMode = cycleAliveTimerDisplayMode(displayMode);
  const currentLabel = getAliveTimerDisplayModeLabel(displayMode);
  const nextLabel = getAliveTimerDisplayModeLabel(nextMode);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Display mode: ${currentLabel}. Click to switch to ${nextLabel}.`}
      title={`Switch to ${nextLabel}`}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-700/80",
        "bg-stone-950/75 text-stone-200 shadow-lg backdrop-blur-sm",
        "pointer-events-none group-hover/alive:pointer-events-auto group-focus-within/alive:pointer-events-auto",
        "transition hover:bg-stone-900/90",
        className,
      ].join(" ")}
    >
      <CycleModeIcon />
    </button>
  );
}

function ClockSegment({
  value,
  label,
  size = "md",
}: {
  value: string;
  label: string;
  size?: "md" | "lg" | "xl";
}) {
  const valueClass =
    size === "xl"
      ? "text-6xl sm:text-7xl font-semibold"
      : size === "lg"
        ? "text-5xl sm:text-6xl font-semibold"
        : "text-3xl sm:text-4xl font-medium";

  const labelClass =
    size === "xl"
      ? "text-base uppercase tracking-[0.2em] text-emerald-700/80"
      : size === "lg"
        ? "text-[15px] uppercase tracking-[0.2em] text-emerald-700/80"
        : "text-[15px] uppercase tracking-[0.2em] text-emerald-700/80";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`${DIGIT_CLASS} ${valueClass}`}>{value}</span>
      <span className={labelClass}>{label}</span>
    </div>
  );
}

function ClockColon({ blink = false, size = "md" }: { blink?: boolean; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "pb-7 text-5xl" : "pb-6 text-4xl";

  return (
    <span
      className={[
        sizeClass,
        "font-semibold text-emerald-600/70",
        blink ? "animate-pulse" : "",
      ].join(" ")}
      aria-hidden
    >
      :
    </span>
  );
}

function ClockLoadingFace({ fillSlot = false }: { fillSlot?: boolean }) {
  return (
    <ClockBezel
      fillSlot={fillSlot}
      className={fillSlot ? undefined : "flex min-h-[11rem] items-center justify-center"}
    >
      <div className="h-14 w-72 animate-pulse rounded bg-stone-800/80" aria-hidden />
      <span className="sr-only">Loading alive timer</span>
    </ClockBezel>
  );
}

function CalendarClockFace({
  display,
  fillSlot = false,
}: {
  display: Extract<AliveTimerDisplay, { mode: "calendar" }>;
  fillSlot?: boolean;
}) {
  const { parts } = display;

  return (
    <ClockBezel
      fillSlot={fillSlot}
      baseHeight={172 * CLOCK_DISPLAY_SCALE}
      className={fillSlot ? undefined : "space-y-6"}
    >
      <div className={fillSlot ? "space-y-6" : undefined}>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <ClockSegment value={String(parts.years)} label="yr" size="xl" />
          <ClockColon size="lg" />
          <ClockSegment value={padTwo(parts.months)} label="mo" size="xl" />
          <ClockColon size="lg" />
          <ClockSegment value={padTwo(parts.days)} label="d" size="xl" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <ClockSegment value={padTwo(parts.hours)} label="hr" size="lg" />
          <ClockColon blink />
          <ClockSegment value={padTwo(parts.minutes)} label="min" size="lg" />
          <ClockColon blink />
          <ClockSegment value={padTwo(parts.seconds)} label="sec" size="lg" />
        </div>
      </div>
    </ClockBezel>
  );
}

function SingleValueClockFace({
  value,
  suffix,
  fillSlot = false,
}: {
  value: string;
  suffix?: string;
  fillSlot?: boolean;
}) {
  return (
    <ClockBezel
      fillSlot={fillSlot}
      className={
        fillSlot ? undefined : "flex min-h-[11rem] flex-col items-center justify-center gap-2"
      }
    >
      <div className={fillSlot ? "flex flex-col items-center gap-3" : undefined}>
        <span className={`${DIGIT_CLASS} text-5xl sm:text-7xl font-semibold`}>{value}</span>
        {suffix ? (
          <span className="text-[15px] uppercase tracking-[0.25em] text-emerald-700/80">{suffix}</span>
        ) : null}
      </div>
    </ClockBezel>
  );
}

function PrimaryWithRemainderClockFace({
  primaryValue,
  primaryLabel,
  remainder,
  fillSlot = false,
}: {
  primaryValue: string;
  primaryLabel: string;
  remainder: string;
  fillSlot?: boolean;
}) {
  return (
    <ClockBezel
      fillSlot={fillSlot}
      baseHeight={148 * CLOCK_DISPLAY_SCALE}
      className={
        fillSlot ? undefined : "flex min-h-[11rem] flex-col items-center justify-center gap-3"
      }
    >
      <div className={fillSlot ? "flex flex-col items-center gap-4" : undefined}>
        <div className="flex flex-col items-center gap-1.5">
          <span className={`${DIGIT_CLASS} text-6xl sm:text-7xl font-semibold`}>
            {primaryValue}
          </span>
          <span className="text-base uppercase tracking-[0.25em] text-emerald-700/80">
            {primaryLabel}
          </span>
        </div>
        <span className={`${DIGIT_CLASS} text-5xl sm:text-6xl font-semibold`}>{remainder}</span>
      </div>
    </ClockBezel>
  );
}

function ClockFace({
  display,
  fillSlot = false,
}: {
  display: AliveTimerDisplay;
  fillSlot?: boolean;
}) {
  if (display.mode === "calendar") {
    return <CalendarClockFace display={display} fillSlot={fillSlot} />;
  }

  if (display.mode === "seconds") {
    return (
      <SingleValueClockFace
        value={display.totalSeconds.toLocaleString()}
        suffix="seconds"
        fillSlot={fillSlot}
      />
    );
  }

  return (
    <PrimaryWithRemainderClockFace
      primaryValue={display.totalDays.toLocaleString()}
      primaryLabel="days"
      remainder={formatRemainderClock(display.remainder)}
      fillSlot={fillSlot}
    />
  );
}

function EmptyClockFace({
  message,
  contactId,
  fillSlot = false,
}: {
  message: string;
  contactId?: number | null;
  fillSlot?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <ClockBezel
      fillSlot={fillSlot}
      className={
        fillSlot ? undefined : "flex min-h-[11rem] flex-col items-center justify-center gap-3 px-4 text-center"
      }
    >
      <div className={fillSlot ? "flex flex-col items-center gap-3 px-4 text-center" : undefined}>
        <p className="text-base text-stone-500">{message}</p>
        {contactId ? (
          <button
            type="button"
            onClick={() => navigate(`/people/contacts/${contactId}`)}
            className="text-base text-emerald-500/90 transition hover:text-emerald-400"
          >
            Edit contact
          </button>
        ) : null}
      </div>
    </ClockBezel>
  );
}

function EditTargetButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Edit alive timer targets"
      onClick={onClick}
      data-home-card-no-drag
      className={[
        "absolute left-3 bottom-3 z-10 rounded-full border border-stone-700/80",
        "bg-stone-950/75 px-2.5 py-1.5 text-xs font-medium text-stone-200 shadow-lg backdrop-blur-sm",
        "pointer-events-none group-hover/alive:pointer-events-auto group-focus-within/alive:pointer-events-auto",
        "transition hover:bg-stone-900/90",
      ].join(" ")}
    >
      Edit
    </button>
  );
}



function AliveTimerBody({
  display,
  isLoading,
  emptyMessage,
  contactId,
  fillSlot,
  countdown,
  targetReachMs,
}: {
  display: AliveTimerDisplay | null;
  isLoading: boolean;
  emptyMessage: string | null;
  contactId: number | null;
  fillSlot: boolean;
  countdown: AliveTimerDisplay | null;
  targetReachMs: number | null;
}) {
  if (isLoading) {
    return <ClockLoadingFace fillSlot={fillSlot} />;
  }
  if (emptyMessage) {
    return (
      <EmptyClockFace
        message={emptyMessage}
        contactId={contactId}
        fillSlot={fillSlot}
      />
    );
  }
  if (display) {
    return (
      <div className={fillSlot ? "flex min-h-0 flex-1 flex-col" : undefined}>
        <ClockFace display={display} fillSlot={fillSlot} />
        {countdown && targetReachMs != null ? (
          <HomeAliveTimerCountdown
            display={countdown}
            targetReachMs={targetReachMs}
            fillSlot={fillSlot}
          />
        ) : null}
      </div>
    );
  }
  return null;
}

export function HomeAliveTimer({
  display,
  displayMode,
  isLoading = false,
  contactId = null,
  emptyMessage = null,
  countdown = null,
  targetReachMs = null,
  onCycleDisplayMode,
  onEdit,
}: HomeAliveTimerProps) {
  const slot = useHomeCardSlot();
  const fillSlot = slot?.fillSlot ?? false;
  const sectionClass = fillSlot
    ? "flex h-full min-h-0 w-full flex-col"
    : `mt-8 ${HOME_CONTENT_WIDTH_CLASS}`;
  const modeLabel = getAliveTimerDisplayModeLabel(displayMode);

  return (
    <section className={sectionClass}>
      <div
        className={[
          "group/alive relative",
          fillSlot ? "flex min-h-0 flex-1 flex-col" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <AliveTimerBody
          display={display}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          contactId={contactId}
          fillSlot={fillSlot}
          countdown={countdown}
          targetReachMs={targetReachMs}
        />

        <div className={hoverOverlayClass}>
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-stone-950/70 px-2.5 py-1.5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-stone-200">Time alive</h2>
            <p className="text-xs text-stone-400">{modeLabel}</p>
          </div>
          <CycleModeButton
            displayMode={displayMode}
            onClick={onCycleDisplayMode}
            className="absolute right-3 top-3"
          />
          {onEdit ? <EditTargetButton onClick={onEdit} /> : null}
        </div>
      </div>
    </section>
  );
}
