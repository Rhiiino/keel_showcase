// keel_web/src/modules/coak/lib/coakGraphConstants.ts

export const COAK_NODE_SPHERE_RADIUS = 1 / 3;

/** Ring node border thickness as a fraction of node radius. */
export const COAK_RING_NODE_BORDER_WIDTH_RATIO = 0.08;

/** Origin sphere radius at the constellation center (about one-third of the prior visual size). */
export const COAK_ORIGIN_NODE_RADIUS = COAK_NODE_SPHERE_RADIUS / 3;

/** Parent→child center distance in auto-layout. */
export const COAK_CHILD_ORBIT_RADIUS = COAK_NODE_SPHERE_RADIUS * 2;

/** Gap between sphere surfaces when Optimize → Inline chains direct children. */
export const COAK_OPTIMIZE_INLINE_GAP = COAK_NODE_SPHERE_RADIUS * 0.35;

/** Fallback when no configuration color is available. Matches Focus constellation silver. */
export const COAK_CONNECTION_COLOR = "#c0ccda";

/** Parent → child edge gradient for constellation connection strokes. */
export const COAK_CONNECTION_GRADIENT_SOURCE_OPACITY = 1;
export const COAK_CONNECTION_GRADIENT_TARGET_OPACITY = 0.06;

/** Orbit zoom limits — camera dolleys toward/from the fixed origin target. */
export const COAK_CAMERA_MIN_DISTANCE = 1.4;
export const COAK_CAMERA_MAX_DISTANCE = 28;

/** Scroll-wheel reel speed while dragging a child (distance units per normalized wheel delta). */
export const COAK_DRAG_REEL_SPEED = 0.0032;

/** Frame-rate-independent reel easing (higher = snappier). */
export const COAK_DRAG_REEL_SMOOTHING = 16;

/** Blender-style world axis colors: X red, Y green, Z blue. */
export const COAK_WORLD_AXIS_COLORS = {
  x: "#E62626",
  y: "#43A047",
  z: "#418BDC",
} as const;

/** Half-length of the axis rail guide shown while dragging on a locked axis. */
export const COAK_AXIS_DRAG_RAIL_HALF_LENGTH = 24;

/** Revolve guide rings sit slightly outside the parent sphere so they do not touch it. */
export const COAK_CHILD_REVOLVE_RAIL_RADIUS_PADDING = 1.12;

/** Visible tube radius for Revolve guide rings. */
export const COAK_CHILD_REVOLVE_RAIL_TUBE_RADIUS = 0.02;

/** Invisible hit target tube radius for Revolve guide rings. */
export const COAK_CHILD_REVOLVE_RAIL_HIT_TUBE_RADIUS = 0.09;

/** Click-vs-drag threshold before Revolve mode dismisses on canvas miss. */
export const COAK_CHILD_REVOLVE_DISMISS_THRESHOLD_PX = 4;
