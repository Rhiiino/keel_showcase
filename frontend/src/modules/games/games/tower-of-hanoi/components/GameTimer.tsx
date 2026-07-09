// keel_web/src/modules/games/games/tower-of-hanoi/components/GameTimer.tsx

import { useEffect, useState } from "react";

import { computeElapsedMs } from "../lib/rules";

type GameTimerProps = {
  timerStartedAt: string;
  elapsedMs: number;
  running: boolean;
};

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function GameTimer({ timerStartedAt, elapsedMs, running }: GameTimerProps) {
  const [displayMs, setDisplayMs] = useState(() =>
    computeElapsedMs({ timerStartedAt, elapsedMs }),
  );

  useEffect(() => {
    if (!running) {
      setDisplayMs(computeElapsedMs({ timerStartedAt, elapsedMs }));
      return;
    }

    const tick = () => {
      setDisplayMs(computeElapsedMs({ timerStartedAt, elapsedMs }));
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [elapsedMs, running, timerStartedAt]);

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2",
        "border-stone-700/80 bg-gradient-to-b from-stone-800/90 to-stone-950/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)]",
      ].join(" ")}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        Time
      </span>
      <span className="font-mono text-sm tabular-nums text-stone-100">
        {formatDuration(displayMs)}
      </span>
      {running ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
      ) : null}
    </div>
  );
}
