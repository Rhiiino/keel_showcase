// keel_web/src/modules/auth/components/login/scatter/MobileDesktopGateAmbience.tsx

// Mobile gate ambience — one persona above the title, cycling every 4s with teleport.
// In-flow slot (not viewport-absolute) so the first paint lands in the correct place.
// First clip waits for media before teleport-in so it never appears mid-settle.

import { useCallback, useEffect, useRef, useState } from "react";

import { KeelPersonaPlayer } from "../../../../../components/keelPersona";
import { getKeelClip, listKeelClips, pickRandomKeelClipId } from "../../../../../lib/keelPersona";
import { registerAllKeelClips } from "../../../../../lib/keelPersona/clips/index";
import { THE_SAILOR_CLIP } from "../../../../../lib/keelPersona/clips/theSailor";
import { resolveKeelClipMediaUrls } from "../../../../../lib/keelPersona/clipMediaPreload";
import { KEEL_PERSONA_PROMOTED_ELEMENTS } from "../../../../../lib/keelPersona/promotedDesign";
import { preloadKeelPersonaMediaUrls } from "../../../../../lib/keelPersona/preloadKeelPersonaMedia";
import { usePrefersReducedMotion } from "../../../../../lib/visual/usePrefersReducedMotion";
import {
  LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX,
  loginScatterDisplayHeightPx,
} from "../../../lib/loginScatterPlacement";
import {
  MOBILE_DESKTOP_GATE_CLIP_MS,
  MOBILE_DESKTOP_GATE_TELEPORT_MS,
} from "../../../lib/loginScatterTiming";

type SpotPhase = "waiting" | "entering" | "playing" | "teleporting-out";

type SpotState = {
  key: number;
  clipId: string;
  phase: SpotPhase;
};

const SLOT_SIZE_PX = LOGIN_SCATTER_INTRO_SAILOR_SIZE_PX;
const SLOT_HEIGHT_PX = loginScatterDisplayHeightPx(SLOT_SIZE_PX);

function preloadClip(clipId: string): void {
  const clip = getKeelClip(clipId);
  if (!clip) {
    return;
  }

  const urls = resolveKeelClipMediaUrls(clip, KEEL_PERSONA_PROMOTED_ELEMENTS);
  void preloadKeelPersonaMediaUrls(urls).catch(() => undefined);
}

function waitForClipMedia(clipId: string): Promise<void> {
  const clip = getKeelClip(clipId);
  if (!clip) {
    return Promise.resolve();
  }

  const urls = resolveKeelClipMediaUrls(clip, KEEL_PERSONA_PROMOTED_ELEMENTS);
  return preloadKeelPersonaMediaUrls(urls)
    .then(() => undefined)
    .catch(() => undefined);
}

function preloadAllClips(): void {
  registerAllKeelClips();
  for (const clip of listKeelClips()) {
    preloadClip(clip.id);
  }
}

export function MobileDesktopGateAmbience() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [spot, setSpot] = useState<SpotState>(() => ({
    key: 0,
    clipId: THE_SAILOR_CLIP.id,
    // Wait for sailor media before teleport-in so the first paint is never mid-settle.
    phase: prefersReducedMotion ? "playing" : "waiting",
  }));

  const spotRef = useRef(spot);
  const nextKeyRef = useRef(0);
  const playTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const pendingClipIdRef = useRef<string | null>(null);
  const swapGenerationRef = useRef(0);
  const [readyClipIds, setReadyClipIds] = useState<Set<string>>(() => new Set());

  const showPlayer =
    readyClipIds.has(spot.clipId) &&
    (spot.phase === "entering" || spot.phase === "playing");

  const markClipReady = useCallback((clipId: string) => {
    setReadyClipIds((current) => {
      if (current.has(clipId)) {
        return current;
      }
      const next = new Set(current);
      next.add(clipId);
      return next;
    });
  }, []);

  useEffect(() => {
    spotRef.current = spot;
  }, [spot]);

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const revealNextClip = useCallback(
    (nextClipId: string, generation: number) => {
      void waitForClipMedia(nextClipId).then(() => {
        if (swapGenerationRef.current !== generation || pendingClipIdRef.current !== nextClipId) {
          return;
        }

        pendingClipIdRef.current = null;
        markClipReady(nextClipId);
        nextKeyRef.current += 1;
        setSpot({
          key: nextKeyRef.current,
          clipId: nextClipId,
          phase: "entering",
        });
      });
    },
    [markClipReady],
  );

  const beginTeleportOut = useCallback(() => {
    const current = spotRef.current;
    const nextClipId = pickRandomKeelClipId(undefined, current.clipId);
    const generation = swapGenerationRef.current + 1;
    swapGenerationRef.current = generation;
    pendingClipIdRef.current = nextClipId;
    preloadClip(nextClipId);

    clearPlayTimer();
    setSpot((value) => ({ ...value, phase: "teleporting-out" }));

    clearExitTimer();
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      revealNextClip(nextClipId, generation);
    }, MOBILE_DESKTOP_GATE_TELEPORT_MS);
  }, [clearExitTimer, clearPlayTimer, revealNextClip]);

  const scheduleNextClip = useCallback(() => {
    preloadClip(pickRandomKeelClipId(undefined, spotRef.current.clipId));

    clearPlayTimer();
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      beginTeleportOut();
    }, MOBILE_DESKTOP_GATE_CLIP_MS);
  }, [beginTeleportOut, clearPlayTimer]);

  useEffect(() => {
    preloadAllClips();
    void waitForClipMedia(THE_SAILOR_CLIP.id).then(() => {
      markClipReady(THE_SAILOR_CLIP.id);
      setSpot((value) => {
        if (value.clipId !== THE_SAILOR_CLIP.id || value.key !== 0) {
          return value;
        }
        if (value.phase === "waiting") {
          return { ...value, phase: "entering" };
        }
        return value;
      });
    });

    return () => {
      swapGenerationRef.current += 1;
      clearPlayTimer();
      clearExitTimer();
    };
  }, [clearExitTimer, clearPlayTimer, markClipReady]);

  useEffect(() => {
    if (spot.phase !== "entering") {
      return;
    }

    const timerId = window.setTimeout(() => {
      setSpot((value) =>
        value.phase === "entering" ? { ...value, phase: "playing" } : value,
      );
    }, MOBILE_DESKTOP_GATE_TELEPORT_MS);

    return () => window.clearTimeout(timerId);
  }, [spot.key, spot.phase]);

  useEffect(() => {
    if (prefersReducedMotion || spot.phase !== "playing" || !readyClipIds.has(spot.clipId)) {
      return;
    }

    scheduleNextClip();
    return clearPlayTimer;
  }, [
    clearPlayTimer,
    prefersReducedMotion,
    readyClipIds,
    scheduleNextClip,
    spot.clipId,
    spot.key,
    spot.phase,
  ]);

  const phaseClass =
    spot.phase === "entering"
      ? "login-scatter-spot--entering"
      : spot.phase === "teleporting-out"
        ? "login-scatter-spot--teleporting-out"
        : spot.phase === "playing"
          ? "login-scatter-spot--playing"
          : "login-scatter-spot--waiting";

  const mediaReady = readyClipIds.has(spot.clipId);

  return (
    <div
      className="pointer-events-none relative shrink-0 overflow-visible"
      style={{ width: SLOT_SIZE_PX, height: SLOT_HEIGHT_PX }}
      aria-hidden
    >
      <div
        className={`login-scatter-spot login-scatter-intro-sailor login-scatter-spot--mobile-gate pointer-events-none absolute ${phaseClass}`}
        style={{ left: "50%", top: "50%" }}
      >
        {showPlayer ? (
          <KeelPersonaPlayer
            key={spot.key}
            clipId={spot.clipId}
            size={SLOT_SIZE_PX}
            waitForMedia
            mediaReady={mediaReady}
            loadingPlayback={true}
            showCaption={false}
          />
        ) : null}
      </div>
    </div>
  );
}
