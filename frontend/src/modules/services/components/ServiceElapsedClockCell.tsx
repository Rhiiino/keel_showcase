// keel_web/src/modules/services/components/ServiceElapsedClockCell.tsx

import { useEffect, useState } from "react";

import {
  formatServiceElapsedClock,
  getServiceElapsedSinceCheck,
} from "../lib/serviceDisplay";

type ServiceElapsedClockCellProps = {
  lastCheckedAt: string | null;
};

const CLOCK_BEZEL_CLASS =
  "inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-1 shadow-[inset_0_1px_6px_rgba(0,0,0,0.55)] ring-1 ring-stone-800/80";

const DIGIT_CLASS =
  "font-mono text-xs tabular-nums tracking-wider text-sky-300 drop-shadow-[0_0_5px_rgba(125,211,252,0.4)]";

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 text-sky-500/80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" d="M12 7.5V12l2.75 2.75" />
    </svg>
  );
}

function ClockColon() {
  return (
    <span className="animate-pulse font-semibold text-sky-600/70" aria-hidden>
      :
    </span>
  );
}

function ElapsedClockFace({ lastCheckedAt, now }: { lastCheckedAt: string; now: Date }) {
  const elapsed = getServiceElapsedSinceCheck(lastCheckedAt, now);
  if (!elapsed) {
    return <span className="text-xs text-stone-600">—</span>;
  }

  const hours = String(elapsed.hours).padStart(2, "0");
  const minutes = String(elapsed.minutes).padStart(2, "0");
  const seconds = String(elapsed.seconds).padStart(2, "0");

  return (
    <div className={CLOCK_BEZEL_CLASS} title={`${formatServiceElapsedClock(elapsed)} elapsed`}>
      <ClockIcon />
      {elapsed.days > 0 ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
          {elapsed.days}d
        </span>
      ) : null}
      <span className={`${DIGIT_CLASS} inline-flex items-center`}>
        <span>{hours}</span>
        <ClockColon />
        <span>{minutes}</span>
        <ClockColon />
        <span>{seconds}</span>
      </span>
    </div>
  );
}

export function ServiceElapsedClockCell({ lastCheckedAt }: ServiceElapsedClockCellProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!lastCheckedAt) {
    return <span className="text-xs text-stone-600">—</span>;
  }

  return <ElapsedClockFace lastCheckedAt={lastCheckedAt} now={now} />;
}
