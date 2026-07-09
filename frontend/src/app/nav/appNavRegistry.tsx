// keel_web/src/app/nav/appNavRegistry.tsx

// Ordered app navigation registry derived from enabled module manifests.
// Default order and fixed separators between groups: appNavLayoutDefaults.ts

import { enabledModules, moduleManifests } from "../modules/registry";
import type { AppNavItem } from "./appNavConfig";

export const appNavItems: AppNavItem[] = enabledModules(moduleManifests)
  .map((module) => module.navItem)
  .filter((item): item is AppNavItem => item !== undefined);
