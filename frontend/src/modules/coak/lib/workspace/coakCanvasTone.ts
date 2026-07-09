// keel_web/src/modules/coak/lib/workspace/coakCanvasTone.ts

// Constellation panel backdrop — soft gradient behind the transparent R3F canvas.

import type { CSSProperties } from "react";

import {
  COAK_CONSTELLATION_BACKDROP_BY_PRESET,
  COAK_CONSTELLATION_BACKGROUND_DEFAULT,
  type CoakConstellationBackdropTone,
  type CoakConstellationBackgroundPreset,
} from "../tabs/settings/coakBackgroundSettings";

export const COAK_CONSTELLATION_BACKDROP =
  COAK_CONSTELLATION_BACKDROP_BY_PRESET[COAK_CONSTELLATION_BACKGROUND_DEFAULT];

export function coakSpaceBackgroundStyleFromTone(tone: CoakConstellationBackdropTone): CSSProperties {
  const { edge, mid, core } = tone;

  return {
    backgroundColor: mid,
    backgroundImage: [
      `radial-gradient(ellipse 85% 75% at 50% 42%, ${core} 0%, ${mid} 52%, ${edge} 100%)`,
      `linear-gradient(168deg, ${edge} 0%, ${mid} 46%, ${core} 100%)`,
    ].join(", "),
  };
}

export function coakSpaceBackgroundStyle(
  preset: CoakConstellationBackgroundPreset = COAK_CONSTELLATION_BACKGROUND_DEFAULT,
): CSSProperties {
  const tone = COAK_CONSTELLATION_BACKDROP_BY_PRESET[preset];
  const base = coakSpaceBackgroundStyleFromTone(tone);

  if (preset === "storm") {
    const baseLayers =
      typeof base.backgroundImage === "string" ? base.backgroundImage.split(", ") : [];

    return {
      ...base,
      backgroundImage: [
        ...baseLayers,
        "radial-gradient(ellipse 120% 80% at 30% 20%, rgba(30, 41, 59, 0.45) 0%, transparent 55%)",
        "radial-gradient(ellipse 90% 70% at 72% 28%, rgba(51, 65, 85, 0.35) 0%, transparent 50%)",
      ].join(", "),
    };
  }

  if (preset === "rainy_night") {
    const baseLayers =
      typeof base.backgroundImage === "string" ? base.backgroundImage.split(", ") : [];

    return {
      ...base,
      backgroundImage: [
        ...baseLayers,
        "radial-gradient(ellipse 90% 70% at 50% 100%, rgba(15, 23, 42, 0.35) 0%, transparent 62%)",
        "radial-gradient(ellipse 55% 40% at 18% 12%, rgba(30, 41, 59, 0.18) 0%, transparent 70%)",
      ].join(", "),
    };
  }

  return base;
}
