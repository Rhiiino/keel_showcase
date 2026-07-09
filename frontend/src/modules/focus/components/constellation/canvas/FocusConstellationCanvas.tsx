// src/modules/focus/components/constellation/canvas/FocusConstellationCanvas.tsx

// Draggable React Flow canvas for the focus constellation view.

import { ReactFlowProvider } from "@xyflow/react";

import { FocusConstellationCanvasInner } from "./FocusConstellationCanvasInner";
import type { FocusConstellationCanvasProps } from "./FocusConstellationCanvas.types";

export type { FocusConstellationCanvasProps } from "./FocusConstellationCanvas.types";

export function FocusConstellationCanvas(props: FocusConstellationCanvasProps) {
  return (
    <ReactFlowProvider>
      <FocusConstellationCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
