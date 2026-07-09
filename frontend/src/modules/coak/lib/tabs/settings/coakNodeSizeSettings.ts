// keel_web/src/modules/coak/lib/tabs/settings/coakNodeSizeSettings.ts

import {
  COAK_NODE_SPHERE_RADIUS,
  COAK_ORIGIN_NODE_RADIUS,
} from "../constellation/coakGraphConstants";

export const COAK_CONFIGURATION_NODE_SIZE_SCALE_KEY = "node_size_scale";

export const COAK_NODE_SIZE_SCALE_MIN = 0.5;
export const COAK_NODE_SIZE_SCALE_MAX = 2.5;
export const COAK_NODE_SIZE_SCALE_STEP = 0.05;
export const COAK_NODE_SIZE_SCALE_DEFAULT = 1;

export function clampCoakNodeSizeScale(value: number): number {
  if (!Number.isFinite(value)) {
    return COAK_NODE_SIZE_SCALE_DEFAULT;
  }

  return Math.min(
    COAK_NODE_SIZE_SCALE_MAX,
    Math.max(COAK_NODE_SIZE_SCALE_MIN, value),
  );
}

export function readCoakNodeSizeScale(settings: Record<string, unknown>): number {
  const raw = settings[COAK_CONFIGURATION_NODE_SIZE_SCALE_KEY];
  if (typeof raw !== "number") {
    return COAK_NODE_SIZE_SCALE_DEFAULT;
  }

  return clampCoakNodeSizeScale(raw);
}

export function resolveCoakNodeSphereRadius(settings: Record<string, unknown>): number {
  return COAK_NODE_SPHERE_RADIUS * readCoakNodeSizeScale(settings);
}

export function resolveCoakOriginNodeRadius(settings: Record<string, unknown>): number {
  return COAK_ORIGIN_NODE_RADIUS * readCoakNodeSizeScale(settings);
}

export function formatCoakNodeSizeScaleLabel(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
