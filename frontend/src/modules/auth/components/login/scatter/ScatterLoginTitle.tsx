// keel_web/src/modules/auth/components/login/scatter/ScatterLoginTitle.tsx

// KEEL title with staggered letter fade-in and intermittent sheen.

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "../../../../../lib/visual/usePrefersReducedMotion";
import {
  SCATTER_LOGIN_FADE_DURATION_S,
  SCATTER_LOGIN_INITIAL_DELAY_S,
  SCATTER_LOGIN_LETTER_STAGGER_S,
  scatterLoginSheenDelayMs,
  scatterLoginTitleCompleteMs,
} from "../../../lib/loginScatterTiming";

const LETTERS = ["K", "E", "E", "L"] as const;
const FADE_EASE = [0.22, 1, 0.36, 1] as const;

export function ScatterLoginTitle() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animate, setAnimate] = useState(prefersReducedMotion);
  const [entranceComplete, setEntranceComplete] = useState(prefersReducedMotion);
  const [sheenTick, setSheenTick] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimate(true);
      return;
    }

    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setEntranceComplete(true);
      return;
    }

    const timerId = window.setTimeout(() => {
      setEntranceComplete(true);
    }, scatterLoginTitleCompleteMs());

    return () => window.clearTimeout(timerId);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!entranceComplete || prefersReducedMotion) {
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;

    const scheduleSheen = () => {
      timerId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setSheenTick((current) => current + 1);
        scheduleSheen();
      }, scatterLoginSheenDelayMs());
    };

    scheduleSheen();

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [entranceComplete, prefersReducedMotion]);

  return (
    <p
      className="font-mono text-3xl font-bold uppercase text-lime-300 sm:text-4xl"
      aria-label="KEEL"
    >
      <span className="scatter-login-title relative inline-flex overflow-hidden">
        <span className="relative z-[1] inline-flex items-center justify-center">
          {LETTERS.map((letter, index) => {
            const isLast = index === LETTERS.length - 1;

            return (
              <motion.span
                key={`${letter}-${index}`}
                className={`inline-block ${isLast ? "" : "mr-[0.38em] sm:mr-[0.42em]"}`}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: animate ? 1 : 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: SCATTER_LOGIN_FADE_DURATION_S,
                        delay:
                          SCATTER_LOGIN_INITIAL_DELAY_S + index * SCATTER_LOGIN_LETTER_STAGGER_S,
                        ease: FADE_EASE,
                      }
                }
              >
                {letter}
              </motion.span>
            );
          })}
        </span>
        {sheenTick > 0 ? (
          <span
            key={sheenTick}
            className="scatter-login-title-sheen pointer-events-none absolute inset-0 z-[2]"
            aria-hidden
          />
        ) : null}
      </span>
    </p>
  );
}
