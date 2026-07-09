// keel_web/src/modules/focus/lib/constellation/listNodeStyle.ts

// Constellation list-node surface presets (how card color is rendered on list nodes).

import type { CSSProperties } from "react";

import type {
  FocusConstellationListNodeStyle,
  FocusConstellationNodeShape,
} from "../focus";
import { focusListCardTintRgb } from "../appearance";

export type FocusConstellationListNodeSurface = {
  background: string;
  boxShadow: string;
  ringColor: string;
};

const PREVIEW_SAMPLE_COLOR_HEX = "#38BDF8";

const DEFAULT_TINT = { r: 226, g: 232, b: 240 };

function resolveTint(colorHex: string | null | undefined) {
  return focusListCardTintRgb(colorHex) ?? DEFAULT_TINT;
}

function ringColorForTint(
  tint: { r: number; g: number; b: number },
  alpha = 0.72,
): string {
  return `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${alpha})`;
}

function circleInsetRing(ringColor: string): string {
  return `inset 0 0 0 0.75px ${ringColor}`;
}

export function isFocusConstellationListNode(data: {
  kind: string;
  entryKind?: string | null;
  nodeKind?: string;
}): boolean {
  if (data.nodeKind === "list") {
    return true;
  }
  return data.kind === "list" || data.entryKind === "list_link";
}

export function buildFocusConstellationListNodeSurface({
  style,
  colorHex,
  shape,
}: {
  style: FocusConstellationListNodeStyle;
  colorHex: string | null | undefined;
  shape: FocusConstellationNodeShape;
}): FocusConstellationListNodeSurface {
  const tint = resolveTint(colorHex);
  const { r, g, b } = tint;
  const ringColor = ringColorForTint(tint);
  const insetRing = shape === "circle" ? circleInsetRing(ringColor) : "";

  if (style === "metallic") {
    return {
      ringColor: ringColorForTint(tint, 0.58),
      boxShadow: [
        insetRing,
        "inset 0 2px 4px rgba(255,255,255,0.32)",
        "inset 0 -3px 6px rgba(0,0,0,0.45)",
        "0 3px 10px rgba(0,0,0,0.35)",
      ]
        .filter(Boolean)
        .join(", "),
      background: [
        "linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(200,210,225,0.08) 18%, transparent 36%)",
        `radial-gradient(circle at 50% 32%, rgba(${r}, ${g}, ${b}, 0.34), rgba(48, 54, 66, 0.92) 62%, rgba(18, 20, 26, 0.98) 100%)`,
        "linear-gradient(180deg, rgba(110,118,132,0.55) 0%, rgba(35,38,46,0.95) 100%)",
      ].join(", "),
    };
  }

  if (style === "matte") {
    const shadeR = Math.round(r * 0.82);
    const shadeG = Math.round(g * 0.82);
    const shadeB = Math.round(b * 0.82);

    return {
      ringColor: ringColorForTint(tint, 0.48),
      boxShadow: [insetRing, "0 2px 8px rgba(0,0,0,0.24)"]
        .filter(Boolean)
        .join(", "),
      background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.9) 0%, rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.96) 100%)`,
    };
  }

  if (style === "prism") {
    return {
      ringColor: ringColorForTint(tint, 0.86),
      boxShadow: [
        insetRing,
        `inset 0 0 18px rgba(${r}, ${g}, ${b}, 0.28)`,
        "inset 0 1px 0 rgba(255,255,255,0.36)",
        "0 5px 16px rgba(0,0,0,0.32)",
      ]
        .filter(Boolean)
        .join(", "),
      background: [
        "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 28%)",
        `linear-gradient(45deg, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(167,139,250,0.28) 44%, rgba(34,211,238,0.22) 100%)`,
        "radial-gradient(circle at 50% 64%, rgba(17,24,39,0.18), rgba(10,14,22,0.94) 78%)",
      ].join(", "),
    };
  }

  if (style === "ember") {
    const warmR = Math.min(255, Math.round((r + 251) / 2));
    const warmG = Math.min(255, Math.round((g + 146) / 2));
    const warmB = Math.min(255, Math.round((b + 60) / 2));

    return {
      ringColor: `rgba(${warmR}, ${warmG}, ${warmB}, 0.78)`,
      boxShadow: [
        insetRing,
        `inset 0 -10px 22px rgba(${warmR}, ${warmG}, ${warmB}, 0.18)`,
        "inset 0 1px 0 rgba(255,255,255,0.2)",
        `0 0 18px rgba(${warmR}, ${warmG}, ${warmB}, 0.22)`,
      ]
        .filter(Boolean)
        .join(", "),
      background: [
        `radial-gradient(circle at 50% 82%, rgba(${warmR}, ${warmG}, ${warmB}, 0.58), transparent 42%)`,
        `radial-gradient(circle at 42% 26%, rgba(${r}, ${g}, ${b}, 0.26), rgba(31, 19, 12, 0.9) 68%, rgba(12, 9, 8, 0.96) 100%)`,
      ].join(", "),
    };
  }

  if (style === "classic") {
    return {
      ringColor: ringColorForTint(tint, 0.72),
      boxShadow: [insetRing, "0 2px 8px rgba(0,0,0,0.2)"]
        .filter(Boolean)
        .join(", "),
      background: `radial-gradient(circle at 50% 30%, rgba(${r}, ${g}, ${b}, 0.42) 0%, rgba(${r}, ${g}, ${b}, 0.12) 42%, rgba(28, 25, 23, 0.95) 100%)`,
    };
  }

  return {
    ringColor,
    boxShadow: [
      insetRing,
      "inset 0 1px 0 rgba(255,255,255,0.28)",
      "0 4px 14px rgba(0,0,0,0.28)",
    ]
      .filter(Boolean)
      .join(", "),
    background: [
      "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.38), transparent 42%)",
      `radial-gradient(circle at 72% 88%, rgba(${r}, ${g}, ${b}, 0.16), transparent 48%)`,
      `radial-gradient(circle at 50% 55%, rgba(${r}, ${g}, ${b}, 0.2), rgba(24,28,36,0.82) 72%, rgba(14,17,22,0.94) 100%)`,
    ].join(", "),
  };
}

export function buildFocusConstellationListNodePreviewStyle(
  style: FocusConstellationListNodeStyle,
): CSSProperties {
  const surface = buildFocusConstellationListNodeSurface({
    style,
    colorHex: PREVIEW_SAMPLE_COLOR_HEX,
    shape: "circle",
  });

  return {
    background: surface.background,
    boxShadow: surface.boxShadow,
  };
}
