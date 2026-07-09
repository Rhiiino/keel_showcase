// keel_web/src/modules/settings/components/settingsTabRegistry.tsx

// Merged settings tabs from enabled module manifests.
// Loaded lazily to avoid circular imports while module manifests initialize.

import { buildSettingsTabRegistry } from "../../../app/modules/buildSettingsTabRegistry";
import { enabledModules, moduleManifests } from "../../../app/modules/registry";

export type {
  SettingsTabDefinition,
  SettingsTabPanelProps,
} from "../../../app/modules/settingsTabTypes";

let cachedSettingsTabs: ReturnType<typeof buildSettingsTabRegistry> | undefined;

export function getSettingsTabs() {
  if (!cachedSettingsTabs) {
    cachedSettingsTabs = buildSettingsTabRegistry(enabledModules(moduleManifests));
  }
  return cachedSettingsTabs;
}
