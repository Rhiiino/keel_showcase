// keel_web/src/modules/focus/lib/constellation/draggablePanel.ts

import type { FocusConstellationConfigPanelPosition } from "../focus";



export function clampFocusConstellationPanelPosition(
  position: FocusConstellationConfigPanelPosition,
  panelWidth: number,
  panelHeight: number,
  boundsWidth: number,
  boundsHeight: number,
): FocusConstellationConfigPanelPosition {
  const maxX = Math.max(0, boundsWidth - panelWidth);
  const maxY = Math.max(0, boundsHeight - panelHeight);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}
