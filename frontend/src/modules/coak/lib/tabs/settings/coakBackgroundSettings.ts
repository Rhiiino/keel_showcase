// keel_web/src/modules/coak/lib/tabs/settings/coakBackgroundSettings.ts

export type CoakConstellationBackgroundPreset =
  | "black"
  | "gray"
  | "dark_green"
  | "storm"
  | "rainy_night";

export const COAK_CONSTELLATION_BACKGROUND_PRESETS: readonly CoakConstellationBackgroundPreset[] = [
  "black",
  "gray",
  "dark_green",
  "storm",
  "rainy_night",
] as const;

export const COAK_CONSTELLATION_BACKGROUND_DEFAULT: CoakConstellationBackgroundPreset = "black";

export const COAK_CONFIGURATION_CONSTELLATION_BACKGROUND_KEY = "constellation_background";

export const COAK_CONSTELLATION_BACKGROUND_LABELS: Record<
  CoakConstellationBackgroundPreset,
  string
> = {
  black: "Black",
  gray: "Gray",
  dark_green: "Dark green",
  storm: "Stormy sky",
  rainy_night: "Rainy night",
};

export type CoakConstellationBackdropTone = {
  edge: string;
  mid: string;
  core: string;
};

export const COAK_CONSTELLATION_BACKDROP_BY_PRESET: Record<
  CoakConstellationBackgroundPreset,
  CoakConstellationBackdropTone
> = {
  black: {
    edge: "#080808",
    mid: "#111111",
    core: "#1a1a1a",
  },
  gray: {
    edge: "#0e0e10",
    mid: "#1a1a1e",
    core: "#2a2a30",
  },
  dark_green: {
    edge: "#060c08",
    mid: "#0c1610",
    core: "#122218",
  },
  storm: {
    edge: "#060810",
    mid: "#0e121c",
    core: "#162030",
  },
  rainy_night: {
    edge: "#020202",
    mid: "#060606",
    core: "#0c0c0c",
  },
};

export function isCoakStormConstellationBackground(
  preset: CoakConstellationBackgroundPreset,
): preset is "storm" {
  return preset === "storm";
}

export function isCoakRainyNightConstellationBackground(
  preset: CoakConstellationBackgroundPreset,
): preset is "rainy_night" {
  return preset === "rainy_night";
}

export function isCoakConstellationBackgroundPreset(
  value: unknown,
): value is CoakConstellationBackgroundPreset {
  return (
    typeof value === "string" &&
    COAK_CONSTELLATION_BACKGROUND_PRESETS.includes(value as CoakConstellationBackgroundPreset)
  );
}

export function readCoakConstellationBackgroundPreset(
  settings: Record<string, unknown>,
): CoakConstellationBackgroundPreset {
  const raw = settings[COAK_CONFIGURATION_CONSTELLATION_BACKGROUND_KEY];
  return isCoakConstellationBackgroundPreset(raw)
    ? raw
    : COAK_CONSTELLATION_BACKGROUND_DEFAULT;
}

export function resolveCoakConstellationBackdropTone(
  settings: Record<string, unknown>,
): CoakConstellationBackdropTone {
  return COAK_CONSTELLATION_BACKDROP_BY_PRESET[readCoakConstellationBackgroundPreset(settings)];
}
