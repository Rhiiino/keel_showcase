// keel_web/src/modules/focus/lib/constellation/modalOrigin.ts

// Screen-space origin helpers for constellation modals.

export type FocusConstellationModalOrigin = {
  x: number;
  y: number;
};

export const FOCUS_CONSTELLATION_MODAL_REVEAL_MS = 460;
export const FOCUS_CONSTELLATION_MODAL_MIN_SCALE = 0.38;

export function resolveViewportCenter(): FocusConstellationModalOrigin {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

export function resolveModalMotionOffset(
  origin: FocusConstellationModalOrigin | null | undefined,
): { x: number; y: number } {
  const center = resolveViewportCenter();
  const resolved = origin ?? center;
  return {
    x: resolved.x - center.x,
    y: resolved.y - center.y,
  };
}
