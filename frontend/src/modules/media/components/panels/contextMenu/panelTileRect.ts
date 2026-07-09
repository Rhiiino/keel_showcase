// keel_web/src/modules/media/components/panels/contextMenu/panelTileRect.ts

// Serializable tile bounds for panel tile view animations.

export type PanelTileRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function panelTileRectFromDomRect(rect: DOMRectReadOnly): PanelTileRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
