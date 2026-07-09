// keel_web/src/modules/coak/lib/tabs/settings/coakOriginPulseSettings.ts

export const COAK_CONFIGURATION_ORIGIN_PULSE_KEY = "origin_pulse";

export function readCoakOriginPulseEnabled(settings: Record<string, unknown>): boolean {
  const raw = settings[COAK_CONFIGURATION_ORIGIN_PULSE_KEY];
  return raw !== false;
}
