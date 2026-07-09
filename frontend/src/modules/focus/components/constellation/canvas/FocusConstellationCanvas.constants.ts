// src/modules/focus/components/constellation/canvas/FocusConstellationCanvas.constants.ts

import type { FocusConstellationCanvasTone } from "../../../lib/focus";
import { FocusConstellationEdge } from "../edge";
import { FocusConstellationNode } from "../node";

export const nodeTypes = {
  focusConstellation: FocusConstellationNode,
};

export const edgeTypes = {
  focusConstellation: FocusConstellationEdge,
};

export const CANVAS_TONES: Record<
  FocusConstellationCanvasTone,
  { background: string; dots: string; dotGap: number; dotSize: number }
> = {
  slate: { background: "#1a2230", dots: "#70829ccc", dotGap: 16, dotSize: 1.35 },
  black: { background: "#0b0d11", dots: "#9aa8bcd8", dotGap: 16, dotSize: 1.4 },
  ocean: { background: "#0f1e2c", dots: "#4dafd4c0", dotGap: 16, dotSize: 1.35 },
};
