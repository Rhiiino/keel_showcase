// keel_web/src/modules/media/lib/mediaView.ts

// View preferences for the media library page.

export type MediaViewMode = "list" | "carousel";

const STORAGE_KEY = "keel.media.viewMode";

export function readMediaViewMode(): MediaViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "carousel") {
      return "carousel";
    }
    return "list";
  } catch {
    return "list";
  }
}

export function writeMediaViewMode(viewMode: MediaViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, viewMode);
  } catch {
    // ignore
  }
}
