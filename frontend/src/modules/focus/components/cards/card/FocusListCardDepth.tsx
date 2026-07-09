// src/modules/focus/components/cards/card/FocusListCardDepth.tsx

// Card tint overlay inside a focus list card (mirrors iOS cardBackground radial).

import { FocusListCardTint } from "./FocusListCardTint";

type FocusListCardDepthProps = {
  colorHex: string | null | undefined;
};

export function FocusListCardDepth({ colorHex }: FocusListCardDepthProps) {
  return <FocusListCardTint colorHex={colorHex} />;
}
