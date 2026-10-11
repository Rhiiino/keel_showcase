// keel_web/src/lib/keelPersona/clipRegistry.ts

import type { KeelAnimationClip } from "./types";

const clipRegistry = new Map<string, KeelAnimationClip>();

export function registerKeelClip(clip: KeelAnimationClip): void {
  clipRegistry.set(clip.id, clip);
}

export function getKeelClip(clipId: string): KeelAnimationClip | undefined {
  return clipRegistry.get(clipId);
}

export function getKeelClipsByTag(tag: string): KeelAnimationClip[] {
  return [...clipRegistry.values()].filter((clip) => clip.tags.includes(tag));
}

export function listKeelClips(): KeelAnimationClip[] {
  return [...clipRegistry.values()];
}

export function pickRandomKeelClipId(
  candidates: readonly KeelAnimationClip[] = listKeelClips(),
): string {
  if (candidates.length === 0) {
    throw new Error("No Keel Persona clips registered");
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index]!.id;
}
