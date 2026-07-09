// keel_web/src/modules/media/lib/panelTileBorderColors.ts

// Preset border colors for media panel tiles.

export type MediaPanelTileBorderPreset = {
  id: string;
  label: string;
  hex: string | null;
};

export const MEDIA_PANEL_TILE_BORDER_PRESETS: MediaPanelTileBorderPreset[] = [
  { id: "default", label: "Default", hex: null },
  { id: "white", label: "White", hex: "#f5f5f4" },
  { id: "sky", label: "Sky", hex: "#38bdf8" },
  { id: "cyan", label: "Cyan", hex: "#22d3ee" },
  { id: "emerald", label: "Emerald", hex: "#34d399" },
  { id: "lime", label: "Lime", hex: "#a3e635" },
  { id: "amber", label: "Amber", hex: "#fbbf24" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
  { id: "rose", label: "Rose", hex: "#fb7185" },
  { id: "violet", label: "Violet", hex: "#a78bfa" },
];

export function isMediaPanelTileBorderSelected(
  currentHex: string | null | undefined,
  presetHex: string | null,
): boolean {
  if (presetHex === null) {
    return !currentHex;
  }
  return currentHex?.toLowerCase() === presetHex.toLowerCase();
}

export function mediaPanelTileBorderStyle(borderColor: string | null | undefined): {
  className: string;
  style?: { borderColor: string };
} {
  if (!borderColor) {
    return { className: "ring-[1.5px] ring-white/[0.06]" };
  }
  return {
    className: "border-[3px]",
    style: { borderColor },
  };
}
