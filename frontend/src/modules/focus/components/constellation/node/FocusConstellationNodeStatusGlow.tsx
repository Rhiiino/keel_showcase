// src/modules/focus/components/constellation/node/FocusConstellationNodeStatusGlow.tsx

import type { FocusConstellationNodeShape } from "../../../lib/focus";
import { HEXAGON_CLIP_PATH } from "./FocusConstellationNode.constants";

type FocusConstellationNodeStatusGlowProps = {
  statusBackGlow: string;
  visualNodeSize: number;
  shape: FocusConstellationNodeShape;
};

export function FocusConstellationNodeStatusGlow({
  statusBackGlow,
  visualNodeSize,
  shape,
}: FocusConstellationNodeStatusGlowProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: visualNodeSize * 1.45,
        height: visualNodeSize * 1.45,
        background: statusBackGlow,
        clipPath: shape === "hexagon" ? HEXAGON_CLIP_PATH : undefined,
        filter: "blur(16px)",
        opacity: 0.95,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    />
  );
}
