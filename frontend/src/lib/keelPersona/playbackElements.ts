// keel_web/src/lib/keelPersona/playbackElements.ts

import type { KeelPersonaElement } from "./types";

export type KeelPersonaPlaybackElement = KeelPersonaElement & {
  playbackHidden?: boolean;
};

export type KeelPersonaPlaybackFilterOptions = {
  stableMount?: boolean;
};

/** Clip playback: hide dev pivot markers. */
export function filterKeelPersonaPlaybackElements(
  elements: readonly KeelPersonaElement[],
  options?: KeelPersonaPlaybackFilterOptions,
): KeelPersonaPlaybackElement[] {
  if (options?.stableMount) {
    return elements
      .filter((element) => !element.tags?.includes("pivot"))
      .map((element) => ({
        ...element,
        playbackHidden: !element.visible,
      }));
  }

  return elements.filter((element) => {
    if (!element.visible) {
      return false;
    }

    if (element.tags?.includes("pivot")) {
      return false;
    }

    return true;
  });
}
