// src/modules/focus/components/constellation/node/FocusConstellationNode.constants.ts

import { Position } from "@xyflow/react";

export const SELECTION_RING_COLOR = "rgba(125, 211, 252, 0.98)";
export const SELECTION_RING_GLOW =
  "0 0 0 2.5px rgba(125, 211, 252, 0.95), 0 0 20px rgba(56, 189, 248, 0.5)";

export const PATH_HIGHLIGHT_RING_GLOW =
  "0 0 0 2px rgba(125, 211, 252, 0.62), 0 0 16px rgba(56, 189, 248, 0.34)";

export const AUTOMATION_HIGHLIGHT_RING_GLOW =
  "0 0 0 2.5px rgba(167, 139, 250, 0.92), 0 0 22px rgba(139, 92, 246, 0.48)";

export const HEXAGON_CLIP_PATH =
  "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)";

export const CONNECTION_SIDES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

export const ORIGIN_PULSE_KEYFRAMES = `
@keyframes focus-origin-pulse {
  0%, 76%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
  84% {
    opacity: 0.72;
  }
  96% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.22);
  }
}`;
