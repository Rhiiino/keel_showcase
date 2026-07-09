// keel_web/src/modules/coak/lib/tabs/settings/coakNodeRevolveSpeedSettings.ts

export const COAK_CONFIGURATION_NODE_REVOLVE_SPEED_KEY = "node_revolve_speed";

export const COAK_NODE_REVOLVE_SPEED_MIN = 0.2;
export const COAK_NODE_REVOLVE_SPEED_MAX = 4;
export const COAK_NODE_REVOLVE_SPEED_STEP = 0.1;
export const COAK_NODE_REVOLVE_SPEED_DEFAULT = 1.2;

export function clampCoakNodeRevolveSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return COAK_NODE_REVOLVE_SPEED_DEFAULT;
  }
  return Math.min(
    COAK_NODE_REVOLVE_SPEED_MAX,
    Math.max(COAK_NODE_REVOLVE_SPEED_MIN, value),
  );
}

export function readCoakNodeRevolveSpeed(settings: Record<string, unknown>): number {
  const raw = settings[COAK_CONFIGURATION_NODE_REVOLVE_SPEED_KEY];
  if (typeof raw !== "number") {
    return COAK_NODE_REVOLVE_SPEED_DEFAULT;
  }
  return clampCoakNodeRevolveSpeed(raw);
}
