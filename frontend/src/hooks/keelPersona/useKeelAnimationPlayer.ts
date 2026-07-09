// keel_web/src/hooks/keelPersona/useKeelAnimationPlayer.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { applyKeelPersonaLook } from "../../lib/keelPersona/applyLook";
import type {
  KeelAnimationClip,
  KeelAnimationLayers,
  KeelAnimationStep,
  KeelCaption,
  KeelPersonaElement,
  KeelPersonaLook,
} from "../../lib/keelPersona/types";

export type KeelAnimationPlayerState = {
  isPlaying: boolean;
  clipId: string | null;
  stepIndex: number;
  currentStepDurationMs: number;
  currentLook: Partial<KeelPersonaLook> | null;
  currentLayers: KeelAnimationLayers;
  currentCaption: KeelCaption | null;
  currentCaptionText: string | null;
  previewElements: KeelPersonaElement[];
};

type UseKeelAnimationPlayerOptions = {
  baseElements: readonly KeelPersonaElement[];
  clips: readonly KeelAnimationClip[];
  captions: readonly KeelCaption[];
};

function resolveCaption(
  step: KeelAnimationStep,
  captions: readonly KeelCaption[],
): { caption: KeelCaption | null; text: string | null } {
  if (step.captionText) {
    return { caption: null, text: step.captionText };
  }

  if (!step.captionId) {
    return { caption: null, text: null };
  }

  const caption = captions.find((entry) => entry.id === step.captionId) ?? null;
  return { caption, text: caption?.text ?? null };
}

function buildPreviewElements(
  baseElements: readonly KeelPersonaElement[],
  look: Partial<KeelPersonaLook> | null | undefined,
): KeelPersonaElement[] {
  return applyKeelPersonaLook(baseElements, look);
}

export function useKeelAnimationPlayer({
  baseElements,
  clips,
  captions,
}: UseKeelAnimationPlayerOptions) {
  const [state, setState] = useState<KeelAnimationPlayerState>(() => ({
    isPlaying: false,
    clipId: null,
    stepIndex: 0,
    currentStepDurationMs: 0,
    currentLook: null,
    currentLayers: {},
    currentCaption: null,
    currentCaptionText: null,
    previewElements: buildPreviewElements(baseElements, null),
  }));

  const timerRef = useRef<number | null>(null);
  const layerScheduleTimersRef = useRef<number[]>([]);
  const clipsRef = useRef(clips);
  const captionsRef = useRef(captions);
  const baseElementsRef = useRef(baseElements);

  useEffect(() => {
    clipsRef.current = clips;
    captionsRef.current = captions;
    baseElementsRef.current = baseElements;
  }, [clips, captions, baseElements]);

  const clearLayerScheduleTimers = useCallback(() => {
    for (const timerId of layerScheduleTimersRef.current) {
      window.clearTimeout(timerId);
    }

    layerScheduleTimersRef.current = [];
  }, []);

  const clearStepTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearStepTimer();
    clearLayerScheduleTimers();
  }, [clearLayerScheduleTimers, clearStepTimer]);

  const applyLayerOnly = useCallback((layers: KeelAnimationLayers) => {
    setState((current) => ({
      ...current,
      currentLayers: layers,
    }));
  }, []);

  const scheduleLayerEvents = useCallback(
    (step: KeelAnimationStep) => {
      clearLayerScheduleTimers();

      for (const event of step.layerSchedule ?? []) {
        const timerId = window.setTimeout(() => {
          layerScheduleTimersRef.current = layerScheduleTimersRef.current.filter(
            (entry) => entry !== timerId,
          );
          applyLayerOnly(event.layers);
        }, event.atMs);

        layerScheduleTimersRef.current.push(timerId);
      }
    },
    [applyLayerOnly, clearLayerScheduleTimers],
  );

  const applyStep = useCallback(
    (clip: KeelAnimationClip, stepIndex: number) => {
      const step = clip.steps[stepIndex];
      if (!step) {
        return;
      }

      clearLayerScheduleTimers();

      const { caption, text } = resolveCaption(step, captionsRef.current);
      const nextState: KeelAnimationPlayerState = {
        isPlaying: true,
        clipId: clip.id,
        stepIndex,
        currentStepDurationMs: step.durationMs,
        currentLook: step.look ?? null,
        currentLayers: step.layers ?? {},
        currentCaption: caption,
        currentCaptionText: text,
        previewElements: buildPreviewElements(baseElementsRef.current, step.look),
      };

      setState(nextState);

      scheduleLayerEvents(step);
    },
    [clearLayerScheduleTimers, scheduleLayerEvents],
  );

  const scheduleNextStep = useCallback(
    (clip: KeelAnimationClip, stepIndex: number) => {
      const step = clip.steps[stepIndex];
      if (!step) {
        setState((current) => ({ ...current, isPlaying: false }));
        return;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const nextIndex = stepIndex + 1;

        if (nextIndex >= clip.steps.length) {
          if (clip.loop) {
            applyStep(clip, 0);
            scheduleNextStep(clip, 0);
            return;
          }

          clearLayerScheduleTimers();
          setState((current) => ({ ...current, isPlaying: false }));
          return;
        }

        applyStep(clip, nextIndex);
        scheduleNextStep(clip, nextIndex);
      }, step.durationMs);
    },
    [applyStep, clearLayerScheduleTimers],
  );

  const playClip = useCallback(
    (clipId: string) => {
      clearAllTimers();
      const clip = clipsRef.current.find((entry) => entry.id === clipId);
      if (!clip || clip.steps.length === 0) {
        return;
      }

      applyStep(clip, 0);
      scheduleNextStep(clip, 0);
    },
    [applyStep, clearAllTimers, scheduleNextStep],
  );

  const stopPlayback = useCallback(() => {
    clearAllTimers();
    setState({
      isPlaying: false,
      clipId: null,
      stepIndex: 0,
      currentStepDurationMs: 0,
      currentLook: null,
      currentLayers: {},
      currentCaption: null,
      currentCaptionText: null,
      previewElements: buildPreviewElements(baseElementsRef.current, null),
    });
  }, [clearAllTimers]);

  useEffect(() => {
    if (!state.isPlaying) {
      setState((current) => ({
        ...current,
        previewElements: buildPreviewElements(baseElementsRef.current, current.currentLook),
      }));
    }
  }, [baseElements, state.isPlaying]);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  return {
    ...state,
    playClip,
    stopPlayback,
  };
}
