// keel_web/src/modules/coak/lib/tabs/settings/coakAutoOptimizeSettings.ts

import {
  COAK_CHILD_ORBIT_RADIUS,
  COAK_NODE_SPHERE_RADIUS,
} from "../constellation/coakGraphConstants";

export const COAK_CONFIGURATION_AUTO_OPTIMIZE_LAYOUT_KEY = "auto_optimize_layout";
export const COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_DISTANCE_KEY =
  "auto_optimize_connection_distance";
export const COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_ANGLE_KEY =
  "auto_optimize_connection_angle";

/** Minimum parent→child center distance (touching node spheres). */
export const COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MIN = COAK_NODE_SPHERE_RADIUS * 2;

export const COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MAX = 4;
export const COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_STEP = 0.05;
export const COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_DEFAULT = COAK_CHILD_ORBIT_RADIUS;

export const COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MIN = 0;
export const COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MAX = 180;
export const COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_STEP = 1;
export const COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_DEFAULT = 120;

export function clampCoakAutoOptimizeConnectionDistance(value: number): number {
  if (!Number.isFinite(value)) {
    return COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_DEFAULT;
  }

  return Math.min(
    COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MAX,
    Math.max(COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MIN, value),
  );
}

export function readCoakAutoOptimizeLayoutEnabled(settings: Record<string, unknown>): boolean {
  const raw = settings[COAK_CONFIGURATION_AUTO_OPTIMIZE_LAYOUT_KEY];
  return raw === true;
}

export function readCoakAutoOptimizeConnectionDistance(settings: Record<string, unknown>): number {
  const raw = settings[COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_DISTANCE_KEY];
  if (typeof raw !== "number") {
    return COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_DEFAULT;
  }

  return clampCoakAutoOptimizeConnectionDistance(raw);
}

export function clampCoakAutoOptimizeConnectionAngle(value: number): number {
  if (!Number.isFinite(value)) {
    return COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_DEFAULT;
  }

  return Math.min(
    COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MAX,
    Math.max(COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MIN, Math.round(value)),
  );
}

export function readCoakAutoOptimizeConnectionAngle(settings: Record<string, unknown>): number {
  const raw = settings[COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_ANGLE_KEY];
  if (typeof raw !== "number") {
    return COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_DEFAULT;
  }

  return clampCoakAutoOptimizeConnectionAngle(raw);
}
