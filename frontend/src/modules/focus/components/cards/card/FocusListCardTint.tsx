// src/modules/focus/components/cards/card/FocusListCardTint.tsx

// Optional bottom radial tint overlay inside a focus list card.

import { focusListCardTintStyle } from "../../../lib/appearance";

type FocusListCardTintProps = {
  colorHex: string | null | undefined;
  className?: string;
};

export function FocusListCardTint({
  colorHex,
  className = "",
}: FocusListCardTintProps) {
  const style = focusListCardTintStyle(colorHex);
  if (!style) {
    return null;
  }

  return (
    <div
      aria-hidden
      className={["pointer-events-none absolute inset-0 rounded-2xl", className].join(
        " ",
      )}
      style={style}
    />
  );
}
