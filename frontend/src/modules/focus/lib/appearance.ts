// keel_web/src/modules/focus/lib/appearance.ts

// Focus list card tint presets and overlay helpers (mirrors FocusAppearance.swift).

import type { CSSProperties } from "react";

export type FocusNodeColorOption = {
  id: string;
  label: string;
  hex: string | null;
};

/** @deprecated Use FocusNodeColorOption */
export type FocusListCardColorOption = FocusNodeColorOption;

export const FOCUS_NODE_COLOR_PRESETS: FocusNodeColorOption[] = [
  { id: "default", label: "Default", hex: null },
  { id: "sky", label: "Sky", hex: "#38BDF8" },
  { id: "mint", label: "Mint", hex: "#34D399" },
  { id: "amber", label: "Amber", hex: "#FBBF24" },
  { id: "rose", label: "Rose", hex: "#FB7185" },
  { id: "violet", label: "Violet", hex: "#A78BFA" },
  { id: "cyan", label: "Cyan", hex: "#22D3EE" },
  { id: "lime", label: "Lime", hex: "#A3E635" },
];

/** @deprecated Use FOCUS_NODE_COLOR_PRESETS */
export const FOCUS_LIST_CARD_COLOR_PRESETS = FOCUS_NODE_COLOR_PRESETS;

export const FOCUS_LIST_CARD_GLASS_CLASS = [
  "rounded-2xl border border-stone-700/55",
  "bg-gradient-to-b from-stone-900/92 to-stone-950",
  "shadow-[0_6px_12px_rgba(0,0,0,0.28)]",
].join(" ");

export const FOCUS_LIST_CARD_GLASS_HOVER_CLASS = [
  "transition-[transform,box-shadow] duration-300 ease-out",
  "hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.32)]",
].join(" ");

function hexToRgb(colorHex: string): { r: number; g: number; b: number } | null {
  const normalized = colorHex.trim().replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function resolveFocusListCardTint(
  colorHex: string | null | undefined,
): string | null {
  if (!colorHex) {
    return null;
  }
  const normalized = colorHex.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  return normalized;
}

export function focusListCardTintRgb(
  colorHex: string | null | undefined,
): { r: number; g: number; b: number } | null {
  const tint = resolveFocusListCardTint(colorHex);
  if (!tint) {
    return null;
  }
  return hexToRgb(tint);
}

export function focusListCardTintStyle(
  colorHex: string | null | undefined,
): CSSProperties | undefined {
  const rgb = focusListCardTintRgb(colorHex);
  if (!rgb) {
    return undefined;
  }
  return {
    backgroundImage: `radial-gradient(ellipse 280px 140px at 50% 100%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35), transparent 72%)`,
  };
}

export function isFocusListCardColorSelected(
  colorHex: string | null | undefined,
  presetHex: string | null,
): boolean {
  const resolved = resolveFocusListCardTint(colorHex);
  if (presetHex === null) {
    return resolved === null;
  }
  return resolved === presetHex.toUpperCase();
}

export type FocusListLinkEntryRowSurface = {
  className: string;
  style?: CSSProperties;
};

export function focusListLinkEntryRowSurface(
  colorHex: string | null | undefined,
  options?: { selected?: boolean },
): FocusListLinkEntryRowSurface {
  const selected = options?.selected ?? false;
  const rgb = focusListCardTintRgb(colorHex);

  if (!rgb) {
    return {
      className: [
        "ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors duration-200",
        selected
          ? "bg-gradient-to-br from-sky-500/[0.2] via-sky-500/[0.05] to-transparent ring-sky-400/40"
          : "bg-gradient-to-br from-sky-500/[0.14] via-sky-500/[0.05] to-transparent ring-sky-400/25 hover:from-sky-500/[0.18] hover:ring-sky-400/35",
      ].join(" "),
    };
  }

  const fillAlpha = selected ? 0.24 : 0.17;
  const ringAlpha = selected ? 0.44 : 0.3;

  return {
    className:
      "ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[filter,box-shadow] duration-200 hover:brightness-105",
    style: {
      backgroundImage: `linear-gradient(to bottom right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fillAlpha}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.07) 58%, transparent 100%)`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ringAlpha})`,
    },
  };
}
