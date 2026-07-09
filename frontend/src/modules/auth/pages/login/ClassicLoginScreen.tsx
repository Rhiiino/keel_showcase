// keel_web/src/modules/auth/pages/login/ClassicLoginScreen.tsx

// Classic login screen: Keel 3D model, lightning sky, staggered entrance, Google sign-in.

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { AgentModelViewer } from "../../../agents/components/AgentModelViewer";
import { subagentModelSrc } from "../../../agents/lib/agentDisplay";
import { LoginLightningSky } from "../../components/login/classic/LoginLightningSky";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";

const FADE_DURATION_S = 1.5;
const ELEMENT_GAP_S = 1.8;

type EntranceVisibility = {
  model: boolean;
  subtitle: boolean;
  title: boolean;
  button: boolean;
};

const ALL_VISIBLE: EntranceVisibility = {
  model: true,
  subtitle: true,
  title: true,
  button: true,
};

const HIDDEN: EntranceVisibility = {
  model: false,
  subtitle: false,
  title: false,
  button: false,
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function fadeProps(isVisible: boolean, instant: boolean) {
  return {
    initial: false as const,
    animate: { opacity: isVisible ? 1 : 0 },
    transition: instant
      ? { duration: 0 }
      : {
          duration: FADE_DURATION_S,
          ease: [0.22, 1, 0.36, 1] as const,
        },
  };
}

export function ClassicLoginScreen() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState<EntranceVisibility>(
    prefersReducedMotion ? ALL_VISIBLE : HIDDEN,
  );
  const [entranceComplete, setEntranceComplete] = useState(prefersReducedMotion);
  const [skipInstant, setSkipInstant] = useState(prefersReducedMotion);
  const timersRef = useRef<number[]>([]);
  const keelModelSrc = subagentModelSrc("keel");

  const clearEntranceTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleEntrance = useCallback(
    (delayMs: number, action: () => void) => {
      const id = window.setTimeout(action, delayMs);
      timersRef.current.push(id);
    },
    [],
  );

  const skipEntrance = useCallback(() => {
    if (entranceComplete) {
      return;
    }
    clearEntranceTimers();
    setSkipInstant(true);
    setVisible(ALL_VISIBLE);
    setEntranceComplete(true);
  }, [clearEntranceTimers, entranceComplete]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(ALL_VISIBLE);
      setSkipInstant(true);
      setEntranceComplete(true);
      return;
    }

    clearEntranceTimers();
    setVisible(HIDDEN);
    setSkipInstant(false);
    setEntranceComplete(false);

    scheduleEntrance(0, () => setVisible((current) => ({ ...current, model: true })));
    scheduleEntrance(ELEMENT_GAP_S * 1000, () =>
      setVisible((current) => ({ ...current, subtitle: true })),
    );
    scheduleEntrance(ELEMENT_GAP_S * 2 * 1000, () =>
      setVisible((current) => ({ ...current, title: true })),
    );
    scheduleEntrance(ELEMENT_GAP_S * 3 * 1000, () =>
      setVisible((current) => ({ ...current, button: true })),
    );
    scheduleEntrance((ELEMENT_GAP_S * 3 + FADE_DURATION_S) * 1000, () =>
      setEntranceComplete(true),
    );

    return clearEntranceTimers;
  }, [clearEntranceTimers, prefersReducedMotion, scheduleEntrance]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-app px-6 py-10 text-stone-100">
      {!entranceComplete ? (
        <div
          className="fixed inset-0 z-50"
          aria-hidden
          onPointerDown={(event) => {
            if (event.button === 0) {
              skipEntrance();
            }
          }}
        />
      ) : null}

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_22%_28%,rgba(125,211,252,0.12),transparent_34%),linear-gradient(115deg,rgba(255,255,255,0.035),transparent_40%)]" />

      <LoginLightningSky disabled={prefersReducedMotion} />

      <section className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="flex flex-col items-center gap-3">
            {keelModelSrc ? (
              <motion.div
                className="relative flex justify-center"
                {...fadeProps(visible.model, skipInstant)}
              >
                <div className="login-model-glow" aria-hidden>
                  <div className="login-model-glow-ripples">
                    <span className="login-model-glow-ripple" />
                    <span className="login-model-glow-ripple" />
                    <span className="login-model-glow-ripple" />
                  </div>
                  <div className="login-model-glow-hotspot" />
                  <div className="login-model-glow-pool" />
                </div>
                <AgentModelViewer
                  agentId="keel"
                  src={keelModelSrc}
                  lightingVariant="dualSpotlight"
                  spinRamp={!prefersReducedMotion}
                  className="relative z-10 h-36 w-36 sm:h-40 sm:w-40"
                />
              </motion.div>
            ) : null}

            <motion.p
              className="font-mono text-xl font-bold uppercase tracking-[0.35em] text-lime-300 sm:text-2xl"
              {...fadeProps(visible.title, skipInstant)}
            >
              K E E L
            </motion.p>

            <motion.p
              className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400 sm:text-sm"
              {...fadeProps(visible.subtitle, skipInstant)}
            >
              <span
                className={
                  entranceComplete && !prefersReducedMotion
                    ? "login-subtitle-glitch"
                    : undefined
                }
              >
                Your Backbone
              </span>
            </motion.p>
          </div>

          <motion.div className="mt-8" {...fadeProps(visible.button, skipInstant)}>
            <GoogleSignInButton />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
