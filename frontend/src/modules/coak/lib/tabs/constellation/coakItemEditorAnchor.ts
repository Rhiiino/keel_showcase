// keel_web/src/modules/coak/lib/modals/coakItemEditorAnchor.ts

import type { Camera } from "three";
import type { Vector3 } from "three";

/** Default constellation camera distance — item editor scale is 1 at this depth. */
export const COAK_ITEM_EDITOR_REFERENCE_DISTANCE = 5;

/** Extra multiplier so constellation item editors stay legible at typical zoom levels. */
export const COAK_ITEM_EDITOR_SCALE_FACTOR = 1.5;

export const COAK_ITEM_EDITOR_MIN_SCALE = 0.33;
export const COAK_ITEM_EDITOR_MAX_SCALE = 5.4;

/** Extra scale when the pointer is over an item editor modal. */
export const COAK_ITEM_EDITOR_HOVER_SCALE_BOOST = 2.5;

/** Extra scale while an input inside the item editor modal has focus. */
export const COAK_ITEM_EDITOR_EDITING_SCALE_BOOST = 2.8;

/** Stacking order for floating constellation item editor modals. */
export const COAK_ITEM_EDITOR_STACK_BASE_Z_INDEX = 1;
export const COAK_ITEM_EDITOR_STACK_HOVER_Z_INDEX = 1000;

export type CoakItemEditorAnchor = {
  x: number;
  y: number;
  scale: number;
};

export function resolveCoakItemEditorInteractionScaleBoost(
  isHovered: boolean,
  isEditing: boolean,
): number {
  if (isEditing) {
    return COAK_ITEM_EDITOR_EDITING_SCALE_BOOST;
  }
  if (isHovered) {
    return COAK_ITEM_EDITOR_HOVER_SCALE_BOOST;
  }
  return 1;
}


export function computeCoakItemEditorScale(camera: Camera, worldPosition: Vector3): number {
  const distance = Math.max(camera.position.distanceTo(worldPosition), 0.001);
  const raw = (COAK_ITEM_EDITOR_REFERENCE_DISTANCE / distance) * COAK_ITEM_EDITOR_SCALE_FACTOR;
  return Math.min(
    COAK_ITEM_EDITOR_MAX_SCALE,
    Math.max(COAK_ITEM_EDITOR_MIN_SCALE, raw),
  );
}

export function clampCoakItemEditorAnchor(
  anchor: CoakItemEditorAnchor,
  bounds: { width: number; height: number },
  modalSize: { width: number; height: number },
): CoakItemEditorAnchor {
  const halfWidth = (modalSize.width * anchor.scale) / 2;
  const halfHeight = (modalSize.height * anchor.scale) / 2;
  const padding = 12;

  return {
    x: Math.min(
      Math.max(anchor.x, halfWidth + padding),
      bounds.width - halfWidth - padding,
    ),
    y: Math.min(
      Math.max(anchor.y, halfHeight + padding),
      bounds.height - halfHeight - padding,
    ),
    scale: anchor.scale,
  };
}
