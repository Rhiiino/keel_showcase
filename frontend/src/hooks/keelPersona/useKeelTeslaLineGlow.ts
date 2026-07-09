// keel_web/src/hooks/keelPersona/useKeelTeslaLineGlow.ts

import { useEffect, useState } from "react";

/** Elapsed ms since the Tesla glow layer was enabled (loops via timeline math). */
export function useKeelTeslaLineGlow(enabled = false): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setElapsedMs(0);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      setElapsedMs(now - startedAt);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  return elapsedMs;
}
