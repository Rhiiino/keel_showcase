// keel_web/src/app/modules/buildHomeCardRegistry.ts

// Merges home dashboard card contributions from enabled module manifests.

import type { HomeCardDefinition } from "./homeCardTypes";
import type { FeatureModuleManifest } from "./types";

export function buildHomeCardRegistry(
  modules: readonly FeatureModuleManifest[],
): HomeCardDefinition[] {
  return modules.flatMap((module) => module.homeCards ?? []);
}
