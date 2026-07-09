// keel_web/src/lib/keelPersona/clipMediaPreload.ts

import { resolveKeelClipPlaybackElements } from "./clipPlaybackElements";
import { resolveKeelPersonaMediaSrc } from "./mediaAssets";
import type { KeelAnimationClip, KeelPersonaElement } from "./types";

export function resolveKeelClipMediaUrls(
  clip: KeelAnimationClip,
  allElements: readonly KeelPersonaElement[],
): string[] {
  const playbackElements = resolveKeelClipPlaybackElements(clip, allElements);
  const urls = new Set<string>();

  for (const element of playbackElements) {
    if (element.kind !== "media-image") {
      continue;
    }

    urls.add(resolveKeelPersonaMediaSrc(element.mediaId));
  }

  return [...urls];
}
