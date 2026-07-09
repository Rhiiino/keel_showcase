// keel_web/src/modules/home/cards/alive/lib/useAliveTimerTick.ts

// One-second tick hook for live alive-timer updates.

import { useEffect, useState } from "react";

export function useAliveTimerTick(enabled = true): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setNowMs(Date.now());
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return nowMs;
}
