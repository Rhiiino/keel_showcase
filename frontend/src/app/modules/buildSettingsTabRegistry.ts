// keel_web/src/app/modules/buildSettingsTabRegistry.ts

// Merges settings sidebar tab contributions from enabled module manifests.

import type { SettingsTabDefinition } from "./settingsTabTypes";
import type { FeatureModuleManifest } from "./types";

export function buildSettingsTabRegistry(
  modules: readonly FeatureModuleManifest[],
): SettingsTabDefinition[] {
  return modules.flatMap((module) => module.settingsTabs ?? []);
}
