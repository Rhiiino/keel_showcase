// keel_web/src/modules/auth/components/login/scatter/LoginScatterAmbience.tsx

import { useCallback, useEffect, useRef, useState } from "react";

import { getKeelClip, pickRandomKeelClipId } from "../../../../../lib/keelPersona";
import { registerAllKeelClips } from "../../../../../lib/keelPersona/clips/index";
import { resolveKeelClipMediaUrls } from "../../../../../lib/keelPersona/clipMediaPreload";
import { KEEL_PERSONA_PROMOTED_ELEMENTS } from "../../../../../lib/keelPersona/promotedDesign";
import { preloadKeelPersonaMediaUrls } from "../../../../../lib/keelPersona/preloadKeelPersonaMedia";
import {
  loginScatterPlayDurationMs,
  LOGIN_SCATTER_TELEPORT_MS,
  pickLoginScatterPosition,
  type ViewportSize,
} from "../../../lib/loginScatterPlacement";
import {
  LoginScatterSpot,
  type LoginScatterSpotState,
} from "./LoginScatterSpot";

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

function createSpot(
  viewport: ViewportSize,
  key: number,
  avoidCenter?: { x: number; y: number },
): LoginScatterSpotState {
  const position = pickLoginScatterPosition(viewport, { avoidCenter });
  const clipId = pickRandomKeelClipId();

  preloadScatterClip(clipId);

  return {
    key,
    clipId,
    x: position.x,
    y: position.y,
    phase: "entering",
  };
}

export function LoginScatterAmbience() {
  const viewport = useViewportSize();
  const viewportRef = useRef(viewport);
  const spotsRef = useRef<LoginScatterSpotState[]>([]);
  const [spots, setSpots] = useState<LoginScatterSpotState[]>([]);
  const nextKeyRef = useRef(0);
  const playTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const pendingNextRef = useRef<LoginScatterSpotState | null>(null);
  const activePlayKeyRef = useRef<number | null>(null);

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

  const prepareNextSpot = useCallback((current: LoginScatterSpotState) => {
    const incomingKey = nextKeyRef.current + 1;
    const incoming = createSpot(viewportRef.current, incomingKey, {
      x: current.x,
      y: current.y,
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

  useEffect(() => {
    registerAllKeelClips();

    const initial = createSpot(viewportRef.current, nextKeyRef.current);
    setSpots([initial]);

    return () => {
      clearPlayTimer();
      clearExitTimer();
    };
  }, [clearExitTimer, clearPlayTimer]);

  return (
    <div className="login-scatter-ambience pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {spots.map((spot) => (
        <LoginScatterSpot
          key={spot.key}
          spot={spot}
          viewportWidth={viewport.width}
          onEnterComplete={handleEnterComplete}
          onPlayStart={handlePlayStart}
        />
      ))}
    </div>
  );
}
