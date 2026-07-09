// keel_web/src/modules/auth/components/login/scatter/LoginScatterAmbience.tsx

import { useCallback, useEffect, useRef, useState } from "react";

import { getKeelClip, pickRandomKeelClipId } from "../../../../../lib/keelPersona";
import { THE_SAILOR_CLIP } from "../../../../../lib/keelPersona/clips/theSailor";
import { registerAllKeelClips } from "../../../../../lib/keelPersona/clips/index";
import { resolveKeelClipMediaUrls } from "../../../../../lib/keelPersona/clipMediaPreload";
import { KEEL_PERSONA_PROMOTED_ELEMENTS } from "../../../../../lib/keelPersona/promotedDesign";
import { preloadKeelPersonaMediaUrls } from "../../../../../lib/keelPersona/preloadKeelPersonaMedia";
import { usePrefersReducedMotion } from "../../../../../lib/visual/usePrefersReducedMotion";
import {
  loginScatterPlayDurationMs,
  LOGIN_SCATTER_TELEPORT_MS,
  pickLoginScatterPositionInQuadrant,
  resolveNextLoginScatterQuadrant,
  type LoginScatterQuadrant,
  type ViewportSize,
} from "../../../lib/loginScatterPlacement";
import {
  LOGIN_SCATTER_INTRO_SAILOR_MS,
  scatterLoginTitleCompleteMs,
} from "../../../lib/loginScatterTiming";
import { LoginScatterIntroSailor } from "./LoginScatterIntroSailor";
import {
  LoginScatterSpot,
  type LoginScatterSpotState,
} from "./LoginScatterSpot";

type AmbiencePhase = "waiting-title" | "intro-sailor" | "scatter";

function useViewportSize(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
}

function preloadScatterClip(clipId: string): void {
  const clip = getKeelClip(clipId);
  if (!clip) {
    return;
  }

  const urls = resolveKeelClipMediaUrls(clip, KEEL_PERSONA_PROMOTED_ELEMENTS);
  void preloadKeelPersonaMediaUrls(urls).catch(() => undefined);
}

function createScatterSpot(
  viewport: ViewportSize,
  key: number,
  quadrant: LoginScatterQuadrant,
  options?: {
    avoidCenter?: { x: number; y: number };
    excludeClipId?: string;
  },
): LoginScatterSpotState {
  const position = pickLoginScatterPositionInQuadrant(viewport, quadrant, {
    avoidCenter: options?.avoidCenter,
  });
  const clipId = pickRandomKeelClipId(undefined, options?.excludeClipId);

  preloadScatterClip(clipId);

  return {
    key,
    clipId,
    quadrant,
    x: position.x,
    y: position.y,
    phase: "entering",
  };
}

export function LoginScatterAmbience() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewport = useViewportSize();
  const viewportRef = useRef(viewport);
  const spotsRef = useRef<LoginScatterSpotState[]>([]);
  const [phase, setPhase] = useState<AmbiencePhase>(
    prefersReducedMotion ? "scatter" : "waiting-title",
  );
  const [introSailorExiting, setIntroSailorExiting] = useState(false);
  const [spots, setSpots] = useState<LoginScatterSpotState[]>([]);
  const nextKeyRef = useRef(0);
  const playTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const introExitTimerRef = useRef<number | null>(null);
  const pendingNextRef = useRef<LoginScatterSpotState | null>(null);
  const activePlayKeyRef = useRef<number | null>(null);
  const lastQuadrantRef = useRef<LoginScatterQuadrant | null>(null);
  const quadrantStepRef = useRef(0);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  spotsRef.current = spots;

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    activePlayKeyRef.current = null;
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const clearIntroExitTimer = useCallback(() => {
    if (introExitTimerRef.current !== null) {
      window.clearTimeout(introExitTimerRef.current);
      introExitTimerRef.current = null;
    }
  }, []);

  const beginScatterLoop = useCallback((excludeClipId?: string) => {
    const firstQuadrant = resolveNextLoginScatterQuadrant(null, 0);
    lastQuadrantRef.current = firstQuadrant;
    quadrantStepRef.current = 1;

    const initial = createScatterSpot(
      viewportRef.current,
      nextKeyRef.current,
      firstQuadrant,
      { excludeClipId },
    );
    setSpots([initial]);
  }, []);

  const prepareNextSpot = useCallback((current: LoginScatterSpotState) => {
    const incomingKey = nextKeyRef.current + 1;
    const nextQuadrant = resolveNextLoginScatterQuadrant(
      lastQuadrantRef.current,
      quadrantStepRef.current,
    );
    lastQuadrantRef.current = nextQuadrant;
    quadrantStepRef.current += 1;

    const incoming = createScatterSpot(viewportRef.current, incomingKey, nextQuadrant, {
      avoidCenter: { x: current.x, y: current.y },
      excludeClipId: current.clipId,
    });
    pendingNextRef.current = incoming;
  }, []);

  const beginTeleportOut = useCallback(
    (outgoingKey: number) => {
      const incoming = pendingNextRef.current;
      if (!incoming) {
        return;
      }

      clearPlayTimer();

      setSpots((current) =>
        current.map((entry) =>
          entry.key === outgoingKey
            ? { ...entry, phase: "teleporting-out" as const }
            : entry,
        ),
      );

      clearExitTimer();
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        pendingNextRef.current = null;
        nextKeyRef.current = incoming.key;
        setSpots([{ ...incoming, phase: "entering" as const }]);
      }, LOGIN_SCATTER_TELEPORT_MS);
    },
    [clearExitTimer, clearPlayTimer],
  );

  const handlePlayStart = useCallback(
    (key: number) => {
      const spot = spotsRef.current.find((entry) => entry.key === key);
      if (!spot) {
        return;
      }

      if (activePlayKeyRef.current === key && playTimerRef.current !== null) {
        return;
      }

      clearPlayTimer();
      activePlayKeyRef.current = key;
      prepareNextSpot(spot);

      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        activePlayKeyRef.current = null;
        beginTeleportOut(key);
      }, loginScatterPlayDurationMs());
    },
    [clearPlayTimer, prepareNextSpot, beginTeleportOut],
  );

  const handleEnterComplete = useCallback((key: number) => {
    setSpots((current) =>
      current.map((entry) =>
        entry.key === key && entry.phase === "entering"
          ? { ...entry, phase: "playing" as const }
          : entry,
      ),
    );
  }, []);

  const finishIntroSailor = useCallback(() => {
    setIntroSailorExiting(true);

    clearIntroExitTimer();
    introExitTimerRef.current = window.setTimeout(() => {
      introExitTimerRef.current = null;
      setIntroSailorExiting(false);
      setPhase("scatter");
      beginScatterLoop(THE_SAILOR_CLIP.id);
    }, LOGIN_SCATTER_TELEPORT_MS);
  }, [beginScatterLoop, clearIntroExitTimer]);

  useEffect(() => {
    registerAllKeelClips();
    preloadScatterClip(THE_SAILOR_CLIP.id);

    if (prefersReducedMotion) {
      beginScatterLoop();
      return () => {
        clearPlayTimer();
        clearExitTimer();
        clearIntroExitTimer();
      };
    }

    const titleTimerId = window.setTimeout(() => {
      setPhase("intro-sailor");
    }, scatterLoginTitleCompleteMs());

    return () => {
      window.clearTimeout(titleTimerId);
      clearPlayTimer();
      clearExitTimer();
      clearIntroExitTimer();
    };
  }, [
    beginScatterLoop,
    clearExitTimer,
    clearIntroExitTimer,
    clearPlayTimer,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (phase !== "intro-sailor" || introSailorExiting) {
      return;
    }

    const introTimerId = window.setTimeout(() => {
      finishIntroSailor();
    }, LOGIN_SCATTER_INTRO_SAILOR_MS);

    return () => window.clearTimeout(introTimerId);
  }, [finishIntroSailor, introSailorExiting, phase]);

  return (
    <div className="login-scatter-ambience pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {phase === "waiting-title" || phase === "intro-sailor" ? (
        <LoginScatterIntroSailor
          viewport={viewport}
          exiting={introSailorExiting}
          revealed={phase === "intro-sailor"}
        />
      ) : null}
      {phase === "scatter"
        ? spots.map((spot) => (
            <LoginScatterSpot
              key={spot.key}
              spot={spot}
              viewportWidth={viewport.width}
              onEnterComplete={handleEnterComplete}
              onPlayStart={handlePlayStart}
            />
          ))
        : null}
    </div>
  );
}
