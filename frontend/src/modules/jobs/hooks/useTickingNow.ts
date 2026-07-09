// keel_web/src/modules/jobs/hooks/useTickingNow.ts

import { useEffect, useState } from "react";

export function useTickingNow(intervalMs = 1_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(intervalId);
  }, [intervalMs]);

  return now;
}
