// keel_web/src/modules/settings/lib/animationView.ts

export type AnimationViewMode = "cards" | "carousel";

const STORAGE_KEY = "keel.settings.animations.viewMode";

export function readAnimationViewMode(): AnimationViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "carousel") {
      return "carousel";
    }
    return "cards";
  } catch {
    return "cards";
  }
}

export function writeAnimationViewMode(viewMode: AnimationViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, viewMode);
  } catch {
    // ignore
  }
}
