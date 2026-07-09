// keel_web/src/modules/media/lib/panelViewportHeight.ts

// Persisted viewport height for a media display panel.

const STORAGE_PREFIX = "keel.media.panelViewportHeight.";

export function readPanelViewportHeight(panelId: string): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + panelId);
    if (!raw) {
      return null;
    }
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function writePanelViewportHeight(panelId: string, heightPx: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + panelId, String(Math.round(heightPx)));
  } catch {
    // ignore
  }
}
