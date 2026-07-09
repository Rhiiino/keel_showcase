// keel_web/src/components/keelPersona/playbackHandlers.ts

import type { PointerEvent } from "react";

function noopEvent(_event: PointerEvent<HTMLElement> | PointerEvent<HTMLDivElement>): void {}

function noopElementEvent(_elementId: string, _event: PointerEvent<HTMLElement>): void {}

function noopCorner(
  _elementId: string,
  _cornerIndex: number,
  _event: PointerEvent<HTMLElement>,
): void {}

function noopDimensions(_elementId: string, _width: number, _height: number): void {}

function noopContextMenu(_elementId: string, _event: React.MouseEvent<HTMLElement>): void {}

/** No-op pointer handlers for read-only persona playback (loading overlays, previews). */
export const KEEL_PERSONA_PLAYBACK_HANDLERS = {
  onDotPointerDown: noopElementEvent,
  onPolygonBodyPointerDown: noopElementEvent,
  onPolygonCornerPointerDown: noopCorner,
  onGlassBodyPointerDown: noopElementEvent,
  onGlassCornerPointerDown: noopCorner,
  onLineBodyPointerDown: noopElementEvent,
  onLineRotatePointerDown: noopElementEvent,
  onMediaBodyPointerDown: noopElementEvent,
  onMediaRotatePointerDown: noopElementEvent,
  onMediaScalePointerDown: noopElementEvent,
  onMediaNaturalDimensions: noopDimensions,
  onPointerMove: noopElementEvent,
  onPointerUp: noopElementEvent,
  onContextMenu: noopContextMenu,
  onCanvasPointerDown: noopEvent,
  onKeelBasePointerDown: noopEvent,
  onKeelBasePointerMove: noopEvent,
  onKeelBasePointerUp: noopEvent,
} as const;
