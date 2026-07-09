// keel_web/src/modules/media/lib/panelView.ts

// View preferences for the media panels list page.

export type PanelViewMode = "list" | "carousel";

const STORAGE_KEY = "keel.media.panels.viewMode";

export function readPanelViewMode(): PanelViewMode {
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

export function writePanelViewMode(viewMode: PanelViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, viewMode);
  } catch {
    // ignore
  }
}
