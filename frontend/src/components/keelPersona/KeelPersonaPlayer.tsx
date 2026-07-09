// keel_web/src/components/keelPersona/KeelPersonaPlayer.tsx

import { useEffect, useMemo, useRef } from "react";

import { useKeelAnimationPlayer, useKeelLoadingPlayback, useKeelTeslaLineGlow } from "../../hooks/keelPersona";
import {
  getKeelPersonaCenterPointPivotOrigin,
} from "../../lib/keelPersona/elements/baseDesign";
import {
  KEEL_PERSONA_DESIGN_CANVAS_PX,
  keelPersonaDisplayScale,
} from "../../lib/keelPersona/designCanvas";
import { isStraightGazeEyeDot } from "../../lib/keelPersona/happyEyeMorph";
import { DEFAULT_KEEL_CAPTIONS, getKeelClip, listKeelClips } from "../../lib/keelPersona";
import { resolveKeelClipPlaybackElements } from "../../lib/keelPersona/clipPlaybackElements";
import { resolveKeelClipMediaUrls } from "../../lib/keelPersona/clipMediaPreload";
import { buildKeelLoadingTimeline } from "../../lib/keelPersona/loadingTimeline";
import { resolveKeelPersonaStepMotion } from "../../lib/keelPersona/motionPlayback";
import { registerAllKeelClips } from "../../lib/keelPersona/clips/index";
import { preloadKeelPersonaMedia, preloadKeelPersonaMediaUrls } from "../../lib/keelPersona/preloadKeelPersonaMedia";
import {
  KEEL_PERSONA_PROMOTED_BASE_OFFSET,
  KEEL_PERSONA_PROMOTED_ELEMENTS,
} from "../../lib/keelPersona/promotedDesign";
import { filterKeelPersonaPlaybackElements } from "../../lib/keelPersona/playbackElements";
import type { KeelAnimationLayers } from "../../lib/keelPersona/types";
import { DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX } from "../../lib/keelPersona/types";
import { KeelAnimationComposer } from "./KeelAnimationComposer";
import { KeelCaptionBubble } from "./KeelCaptionBubble";
import { KeelPersonaRainOverlay } from "./KeelPersonaRainOverlay";
import { KeelPersonaRenderer } from "./KeelPersonaRenderer";

/** Head accessories extend above the 560px design canvas; reserve display space. */
const KEEL_PERSONA_HEAD_OVERFLOW_RATIO = 0.28;

type KeelPersonaPlayerProps = {
  clipId: string;
  size?: number;
  className?: string;
  /** Applied only to the animation stage, not the caption bubble. */
  stageClassName?: string;
  autoPlay?: boolean;
  waitForMedia?: boolean;
  mediaReady?: boolean;
  loadingPlayback?: boolean;
  /** When set, overrides the caption bank's `loadingDots` for the quip bubble. */
  captionLoadingDots?: boolean;
  /** When false, hides the quip caption bubble entirely. */
  showCaption?: boolean;
};

/** Continuous (step-independent) layers played as CSS in loading compositor mode. */
function collectContinuousLayers(
  steps: readonly { layers?: KeelAnimationLayers }[],
): KeelAnimationLayers {
  const layers: KeelAnimationLayers = {};
  for (const step of steps) {
    const stepLayers = step.layers ?? {};
    if (stepLayers.happyEyes) {
      layers.happyEyes = true;
    }
    if (stepLayers.orangeEyeGlow) {
      layers.orangeEyeGlow = true;
    }
    if (stepLayers.wobble) {
      layers.wobble = true;
      if (stepLayers.wobbleExcludedGroupIds) {
        layers.wobbleExcludedGroupIds = stepLayers.wobbleExcludedGroupIds;
      }
    }
    if (stepLayers.rainOverlay) {
      layers.rainOverlay = true;
    }
    if (stepLayers.teslaLineGlow) {
      layers.teslaLineGlow = true;
    }
    if (stepLayers.groupSpinIds) {
      layers.groupSpinIds = stepLayers.groupSpinIds;
    }
    if (stepLayers.elementSpinIds) {
      layers.elementSpinIds = stepLayers.elementSpinIds;
    }
  }
  return layers;
}

export function KeelPersonaPlayer({
  clipId,
  size = DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
  className = "",
  stageClassName = "",
  autoPlay = true,
  waitForMedia = false,
  mediaReady = true,
  loadingPlayback = false,
  captionLoadingDots,
  showCaption = true,
}: KeelPersonaPlayerProps) {
  const designSizePx = KEEL_PERSONA_DESIGN_CANVAS_PX;
  const displayScale = keelPersonaDisplayScale(size);
  const headOverflowPx = Math.ceil(size * KEEL_PERSONA_HEAD_OVERFLOW_RATIO);

  registerAllKeelClips();
  const clips = useMemo(() => listKeelClips(), []);

  const activeClip = useMemo(
    () => getKeelClip(clipId) ?? clips.find((entry) => entry.id === clipId) ?? null,
    [clipId, clips],
  );

  const baseElements = useMemo(
    () =>
      activeClip
        ? resolveKeelClipPlaybackElements(activeClip, KEEL_PERSONA_PROMOTED_ELEMENTS)
        : KEEL_PERSONA_PROMOTED_ELEMENTS,
    [activeClip],
  );

  const pivotOriginPct = useMemo(
    () => getKeelPersonaCenterPointPivotOrigin(baseElements, designSizePx),
    [baseElements, designSizePx],
  );

  const { playClip, stopPlayback, ...animationPlayer } = useKeelAnimationPlayer({
    baseElements,
    clips: activeClip ? [activeClip, ...clips.filter((clip) => clip.id !== activeClip.id)] : clips,
    captions: DEFAULT_KEEL_CAPTIONS,
  });

  const canPlay = autoPlay && (!waitForMedia || mediaReady);

  useEffect(() => {
    void preloadKeelPersonaMedia().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeClip) {
      return;
    }

    const urls = resolveKeelClipMediaUrls(activeClip, KEEL_PERSONA_PROMOTED_ELEMENTS);
    void preloadKeelPersonaMediaUrls(urls).catch(() => undefined);
  }, [activeClip]);

  // Dev builder / non-loading surfaces step the clip on a setTimeout clock. Loading
  // overlays instead drive the whole loop on the compositor (see below), so the
  // step player is skipped there — its timers would stall behind the WebGL build.
  useEffect(() => {
    if (loadingPlayback) {
      return;
    }
    if (!canPlay) {
      stopPlayback();
      return;
    }

    playClip(clipId);
    return () => stopPlayback();
  }, [canPlay, clipId, loadingPlayback, playClip, stopPlayback]);

  // ----- Loading compositor timeline
  const stageRef = useRef<HTMLDivElement>(null);
  const loadingTimeline = useMemo(
    () => (loadingPlayback && activeClip ? buildKeelLoadingTimeline(activeClip, baseElements) : null),
    [loadingPlayback, activeClip, baseElements],
  );
  useKeelLoadingPlayback(stageRef, loadingTimeline, canPlay);

  const continuousLayers = useMemo(
    () => (loadingPlayback && activeClip ? collectContinuousLayers(activeClip.steps) : {}),
    [loadingPlayback, activeClip],
  );

  // ----- Derived render state (loading vs stepped)
  const previewLayers: KeelAnimationLayers = loadingPlayback
    ? continuousLayers
    : animationPlayer.isPlaying
      ? animationPlayer.currentLayers
      : {};
  const previewElements = loadingPlayback
    ? baseElements
    : animationPlayer.isPlaying
      ? animationPlayer.previewElements
      : baseElements;

  const wobbleExcludedGroupIds = previewLayers.wobbleExcludedGroupIds ?? [];
  const wobbleActive = previewLayers.wobble ?? false;

  const excludedGroupSet = useMemo(
    () => new Set(wobbleExcludedGroupIds),
    [wobbleExcludedGroupIds],
  );

  const motionElements = useMemo(() => {
    if (!wobbleActive || excludedGroupSet.size === 0) {
      return previewElements;
    }

    if (loadingPlayback) {
      return previewElements.filter(
        (element) => !(element.groupId && excludedGroupSet.has(element.groupId)),
      );
    }

    return previewElements.map((element) =>
      element.groupId && excludedGroupSet.has(element.groupId)
        ? { ...element, visible: false }
        : element,
    );
  }, [excludedGroupSet, loadingPlayback, previewElements, wobbleActive]);

  const staticElements = useMemo(() => {
    if (!wobbleActive || excludedGroupSet.size === 0) {
      return [];
    }

    return previewElements.filter(
      (element) => element.visible && element.groupId && excludedGroupSet.has(element.groupId),
    );
  }, [excludedGroupSet, previewElements, wobbleActive]);

  const straightGazeVisible = useMemo(
    () =>
      previewElements.some(
        (element) =>
          element.visible && element.kind === "dot" && isStraightGazeEyeDot(element),
      ),
    [previewElements],
  );

  const happyEyesEnabled = (previewLayers.happyEyes ?? false) && straightGazeVisible;
  const orangeEyeGlow = previewLayers.orangeEyeGlow ?? false;
  const teslaLineGlowEnabled = (previewLayers.teslaLineGlow ?? false) && canPlay;
  const teslaLineGlowElapsedMs = useKeelTeslaLineGlow(teslaLineGlowEnabled);
  const teslaLineGlowProp = teslaLineGlowEnabled ? teslaLineGlowElapsedMs : undefined;

  const stepMotion = useMemo(
    () =>
      loadingPlayback
        ? {
            bodyShift: { direction: undefined, durationMs: 0, stepIndex: 0, isPlaying: false },
            gazeBlend: null,
            squintEyeSide: undefined,
          }
        : resolveKeelPersonaStepMotion({
            clip: activeClip,
            stepIndex: animationPlayer.stepIndex,
            stepDurationMs: animationPlayer.currentStepDurationMs,
            layers: previewLayers,
            currentLook: animationPlayer.currentLook,
            isPlaying: animationPlayer.isPlaying,
          }),
    [
      activeClip,
      animationPlayer.currentLook,
      animationPlayer.currentStepDurationMs,
      animationPlayer.isPlaying,
      animationPlayer.stepIndex,
      loadingPlayback,
      previewLayers,
    ],
  );

  const visibleMotionElements = useMemo(
    () =>
      loadingPlayback
        ? motionElements.filter((element) => !element.tags?.includes("pivot"))
        : filterKeelPersonaPlaybackElements(motionElements),
    [loadingPlayback, motionElements],
  );

  const visibleStaticElements = useMemo(
    () => filterKeelPersonaPlaybackElements(staticElements),
    [staticElements],
  );

  const loadingCaption = useMemo(() => {
    if (!loadingPlayback || !activeClip?.defaultCaptionId) {
      return null;
    }
    return DEFAULT_KEEL_CAPTIONS.find((caption) => caption.id === activeClip.defaultCaptionId) ?? null;
  }, [loadingPlayback, activeClip]);

  const captionNode = loadingPlayback ? loadingCaption : animationPlayer.currentCaption;
  const captionTextOverride = loadingPlayback ? null : animationPlayer.currentCaptionText;

  if (waitForMedia && !mediaReady) {
    return null;
  }

  return (
    <div className={`inline-flex flex-col items-center gap-3 overflow-visible ${className}`}>
      <div
        className={`relative shrink-0 overflow-visible ${stageClassName}`}
        style={{ width: size, height: size + headOverflowPx }}
      >
        <div
          ref={stageRef}
          className="keel-persona-player-stage absolute left-0 origin-top-left"
          style={{
            top: headOverflowPx,
            width: designSizePx,
            height: designSizePx,
            transform: `scale(${displayScale})`,
          }}
        >
          {previewLayers.rainOverlay ? <KeelPersonaRainOverlay /> : null}
          <KeelAnimationComposer
            layers={previewLayers}
            pivotOriginPct={pivotOriginPct}
            size={designSizePx}
            bodyShift={stepMotion.bodyShift}
            compositorLoading={loadingPlayback}
            staticOverlay={
              visibleStaticElements.length > 0 ? (
                <div className="pointer-events-none absolute inset-0 overflow-visible">
                  <KeelPersonaRenderer
                    elements={visibleStaticElements}
                    baseOffset={KEEL_PERSONA_PROMOTED_BASE_OFFSET}
                    focusedElementId={null}
                    size={designSizePx}
                    showBase={false}
                    teslaLineGlowElapsedMs={teslaLineGlowProp}
                  />
                </div>
              ) : null
            }
          >
            <KeelPersonaRenderer
              elements={visibleMotionElements}
              baseOffset={KEEL_PERSONA_PROMOTED_BASE_OFFSET}
              focusedElementId={null}
              size={designSizePx}
              designCanvasPx={designSizePx}
              happyEyesActive={happyEyesEnabled}
              orangeEyeGlow={orangeEyeGlow}
              motionLayers={previewLayers}
              gazeBlend={stepMotion.gazeBlend}
              squintEyeSide={stepMotion.squintEyeSide}
              compositorLoading={loadingPlayback}
              teslaLineGlowElapsedMs={teslaLineGlowProp}
            />
          </KeelAnimationComposer>
        </div>
      </div>

      {showCaption && (captionNode || captionTextOverride) ? (
        <KeelCaptionBubble
          caption={captionNode}
          textOverride={captionTextOverride}
          loadingDots={captionLoadingDots}
        />
      ) : null}
    </div>
  );
}
