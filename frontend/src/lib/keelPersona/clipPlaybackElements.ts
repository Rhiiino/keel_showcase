// keel_web/src/lib/keelPersona/clipPlaybackElements.ts

import type { KeelAnimationClip, KeelPersonaElement } from "./types";

export function collectKeelClipGroupIds(clip: KeelAnimationClip): Set<string> {
  const groupIds = new Set<string>();

  for (const step of clip.steps) {
    for (const groupId of step.look?.visibleGroupIds ?? []) {
      groupIds.add(groupId);
    }
  }

  return groupIds;
}

export function collectKeelClipElementIds(clip: KeelAnimationClip): Set<string> {
  const elementIds = new Set<string>();

  for (const step of clip.steps) {
    for (const elementId of step.look?.visibleElementIds ?? []) {
      elementIds.add(elementId);
    }
  }

  return elementIds;
}

export function clipUsesGazeTransition(clip: KeelAnimationClip): boolean {
  return clip.steps.some((step) => step.layers?.gazeTransition);
}

export function resolveKeelClipPlaybackElements(
  clip: KeelAnimationClip,
  allElements: readonly KeelPersonaElement[],
): KeelPersonaElement[] {
  const groupIds = collectKeelClipGroupIds(clip);
  const elementIds = collectKeelClipElementIds(clip);
  const includeAllGaze = clipUsesGazeTransition(clip);

  return allElements.filter((element) => {
    if (elementIds.has(element.id)) {
      return true;
    }

    if (!element.groupId) {
      return false;
    }

    if (groupIds.has(element.groupId)) {
      return true;
    }

    return includeAllGaze && (element.tags?.includes("gaze") ?? false);
  });
}
