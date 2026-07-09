// stack_sandbox/frontend_web/src/modules/test/lib/viewer/viewerAppearanceConfig.ts

// Model color presets and tumble speed range for the STL stage viewer.

export type ModelColorOption = {
  id: string;
  label: string;
  hex: string;
};

export const DEFAULT_MODEL_COLOR = "#a8b5a0";

export const MODEL_COLOR_OPTIONS: ModelColorOption[] = [
  { id: "sage", label: "Sage", hex: "#a8b5a0" },
  { id: "lime", label: "Lime", hex: "#b8d4a0" },
  { id: "mint", label: "Mint", hex: "#86efac" },
  { id: "sky", label: "Sky", hex: "#7dd3fc" },
  { id: "lavender", label: "Lavender", hex: "#c4b5fd" },
  { id: "rose", label: "Rose", hex: "#fda4af" },
  { id: "sand", label: "Sand", hex: "#d6c6a8" },
  { id: "white", label: "White", hex: "#e7e5e4" },
];

export const DEFAULT_TUMBLE_SPEED = 0.18;
export const MIN_TUMBLE_SPEED = 0;
export const MAX_TUMBLE_SPEED = 0.75;
