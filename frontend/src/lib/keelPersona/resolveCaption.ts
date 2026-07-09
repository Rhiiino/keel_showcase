// keel_web/src/lib/keelPersona/resolveCaption.ts

import type { KeelAnimationClip, KeelAnimationStep, KeelCaption } from "./types";

const captionRegistry = new Map<string, KeelCaption>();

export function registerKeelCaptions(captions: readonly KeelCaption[]): void {
  for (const caption of captions) {
    captionRegistry.set(caption.id, caption);
  }
}

export function getKeelCaption(captionId: string): KeelCaption | undefined {
  return captionRegistry.get(captionId);
}

export function getCaptionsForContext(contextTags: string[]): KeelCaption[] {
  if (contextTags.length === 0) {
    return [...captionRegistry.values()];
  }

  return [...captionRegistry.values()].filter((caption) =>
    (caption.contextTags ?? []).some((tag) => contextTags.includes(tag)),
  );
}

export function resolveClipCaption(
  clip: KeelAnimationClip,
  step: KeelAnimationStep | null,
): KeelCaption | null {
  if (step?.captionText) {
    return {
      id: "inline",
      text: step.captionText,
    };
  }

  const captionId = step?.captionId ?? clip.defaultCaptionId;
  if (!captionId) {
    return null;
  }

  return getKeelCaption(captionId) ?? null;
}



// ----- Clip quip collection
export function getClipQuips(clip: KeelAnimationClip): string[] {
  const quips: string[] = [];
  const seen = new Set<string>();

  const addQuip = (text: string | null | undefined) => {
    if (!text || seen.has(text)) {
      return;
    }

    seen.add(text);
    quips.push(text);
  };

  if (clip.defaultCaptionId) {
    addQuip(getKeelCaption(clip.defaultCaptionId)?.text);
  }

  for (const step of clip.steps) {
    addQuip(resolveClipCaption(clip, step)?.text);
  }

  return quips;
}
