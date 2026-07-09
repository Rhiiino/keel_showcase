// src/modules/focus/components/cards/card/FocusListCardColorStripe.tsx

// Vertical gradient accent beside the focus list detail form for the selected card tint.

import type { CSSProperties } from "react";

import { resolveFocusListCardTint } from "../../../lib/appearance";

type FocusListCardColorStripeProps = {
  colorHex: string | null | undefined;
};

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

function stripeStyle(colorHex: string | null | undefined): CSSProperties {
  const tint = resolveFocusListCardTint(colorHex);
  if (!tint) {
    return {
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 52%, transparent 100%)",
    };
  }

  const rgb = hexToRgb(tint);
  if (!rgb) {
    return {
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 52%, transparent 100%)",
    };
  }

  return {
    background: `linear-gradient(180deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.92) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38) 48%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06) 100%)`,
  };
}

export function FocusListCardColorStripe({
  colorHex,
}: FocusListCardColorStripeProps) {
  return (
    <div
      className="w-1 shrink-0 self-stretch rounded-full"
      style={stripeStyle(colorHex)}
      aria-hidden
    />
  );
}
