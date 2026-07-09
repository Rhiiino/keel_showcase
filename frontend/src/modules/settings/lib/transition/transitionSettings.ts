// stack_sandbox/frontend_web/src/modules/settings/lib/transition/transitionSettings.ts

// Transition preset registry and localStorage persistence for shell page animations.

import type { Variants } from "framer-motion";

export const TRANSITION_SETTINGS_STORAGE_KEY = "keel.app.transitions";

export type TransitionPresetId =
  | "fade"
  | "slideHorizontal"
  | "slideVertical"
  | "scale"
  | "none";

export type TransitionKind = "menu" | "page";

export type TransitionPresetConfig = {
  preset: TransitionPresetId;
  durationMs: number;
};

export type TransitionSettings = {
  enabled: boolean;
  menu: TransitionPresetConfig;
  page: TransitionPresetConfig;
};

export const TRANSITION_PRESET_OPTIONS: {
  id: TransitionPresetId;
  label: string;
}[] = [
  { id: "fade", label: "Fade" },
  { id: "slideHorizontal", label: "Slide horizontal" },
  { id: "slideVertical", label: "Slide vertical" },
  { id: "scale", label: "Scale" },
  { id: "none", label: "None (instant)" },
];

export const DEFAULT_TRANSITION_SETTINGS: TransitionSettings = {
  enabled: true,
  menu: { preset: "slideHorizontal", durationMs: 280 },
  page: { preset: "fade", durationMs: 220 },
};

const PRESET_IDS = new Set<TransitionPresetId>(
  TRANSITION_PRESET_OPTIONS.map((option) => option.id),
);

function clampDurationMs(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(800, Math.max(0, Math.round(value)));
}

function parsePresetConfig(
  raw: unknown,
  fallback: TransitionPresetConfig,
): TransitionPresetConfig {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const record = raw as Record<string, unknown>;
  const preset =
    typeof record.preset === "string" && PRESET_IDS.has(record.preset as TransitionPresetId)
      ? (record.preset as TransitionPresetId)
      : fallback.preset;
  return {
    preset,
    durationMs: clampDurationMs(
      record.durationMs ?? record.duration_ms,
      fallback.durationMs,
    ),
  };
}

export function readStoredTransitionSettings(): TransitionSettings {
  try {
    const raw = localStorage.getItem(TRANSITION_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TRANSITION_SETTINGS;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_TRANSITION_SETTINGS;
    }
    const record = parsed as Record<string, unknown>;
    return {
      enabled:
        typeof record.enabled === "boolean"
          ? record.enabled
          : DEFAULT_TRANSITION_SETTINGS.enabled,
      menu: parsePresetConfig(record.menu, DEFAULT_TRANSITION_SETTINGS.menu),
      page: parsePresetConfig(record.page, DEFAULT_TRANSITION_SETTINGS.page),
    };
  } catch {
    return DEFAULT_TRANSITION_SETTINGS;
  }
}

export function writeStoredTransitionSettings(settings: TransitionSettings): void {
  try {
    localStorage.setItem(TRANSITION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode
  }
}

export function getTransitionVariants(preset: TransitionPresetId): Variants {
  switch (preset) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    case "slideHorizontal":
      return {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      };
    case "slideVertical":
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -14 },
      };
    case "scale":
      return {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
      };
    case "none":
    default:
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
  }
}

export function resolveTransitionConfig(
  settings: TransitionSettings,
  kind: TransitionKind,
): { variants: Variants; durationMs: number; animate: boolean } {
  const config = kind === "menu" ? settings.menu : settings.page;
  const durationMs = settings.enabled ? config.durationMs : 0;
  const animate =
    settings.enabled && config.preset !== "none" && durationMs > 0;
  return {
    variants: getTransitionVariants(config.preset),
    durationMs,
    animate,
  };
}
