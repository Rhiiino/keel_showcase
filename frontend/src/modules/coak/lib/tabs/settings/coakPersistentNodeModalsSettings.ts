// keel_web/src/modules/coak/lib/tabs/settings/coakPersistentNodeModalsSettings.ts

export const COAK_CONFIGURATION_PERSISTENT_NODE_MODALS_KEY = "persistent_node_modals";

export function readCoakPersistentNodeModalsEnabled(settings: Record<string, unknown>): boolean {
  const raw = settings[COAK_CONFIGURATION_PERSISTENT_NODE_MODALS_KEY];
  return raw === true;
}
