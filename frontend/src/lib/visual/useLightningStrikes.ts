// keel_web/src/lib/visual/useLightningStrikes.ts

import { useEffect, useRef, useState } from "react";

import {
  createLightningStrike,
  randomBetween,
  type LightningStrike,
} from "./lightningStrike";

type UseLightningStrikesOptions = {
  disabled?: boolean;
};

export function useLightningStrikes({ disabled = false }: UseLightningStrikesOptions = {}) {
  const [strikes, setStrikes] = useState<LightningStrike[]>([]);
  const strikeTimeoutRef = useRef<number | null>(null);
  const cleanupIdsRef = useRef<number[]>([]);

  useEffect(() => {
    if (disabled) {
      setStrikes([]);
      return;
    }

    let active = true;

    const removeStrike = (id: string, delayMs: number) => {
      const timeoutId = window.setTimeout(() => {
        if (!active) {
          return;
        }
        setStrikes((current) => current.filter((strike) => strike.id !== id));
      }, delayMs);
      cleanupIdsRef.current.push(timeoutId);
    };

    const addStrike = () => {
      if (!active) {
        return;
      }
      const strike = createLightningStrike();
      setStrikes((current) => [...current.slice(-5), strike]);
      removeStrike(strike.id, 520);

      if (Math.random() < 0.28) {
        const followUpId = window.setTimeout(() => {
          if (!active) {
            return;
          }
          const followUp = createLightningStrike();
          setStrikes((current) => [...current.slice(-5), followUp]);
          removeStrike(followUp.id, 520);
        }, randomBetween(80, 220));
        cleanupIdsRef.current.push(followUpId);
      }
    };

    const scheduleNextStrike = () => {
      const delayMs = randomBetween(2200, 7200);
      strikeTimeoutRef.current = window.setTimeout(() => {
        addStrike();
        scheduleNextStrike();
      }, delayMs);
    };

    const initialDelayId = window.setTimeout(() => {
      addStrike();
      scheduleNextStrike();
    }, randomBetween(900, 2400));
    cleanupIdsRef.current.push(initialDelayId);

    return () => {
      active = false;
      if (strikeTimeoutRef.current != null) {
        window.clearTimeout(strikeTimeoutRef.current);
      }
      cleanupIdsRef.current.forEach((id) => window.clearTimeout(id));
      cleanupIdsRef.current = [];
    };
  }, [disabled]);

  return strikes;
}
