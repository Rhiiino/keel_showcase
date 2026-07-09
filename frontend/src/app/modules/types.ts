// keel_web/src/app/modules/types.ts

// Shared manifest types for feature module registration in the app shell.

import type { ReactNode } from "react";

import type { HomeCardDefinition } from "./homeCardTypes";
import type { SettingsTabDefinition } from "./settingsTabTypes";
import type { AppNavItem } from "../nav/appNavConfig";

export type FeatureModuleManifest = {
  /** Module key — matches FEATURE_KEY, route prefix, and nav id. */
  key: string;
  /** Default true; Phase 5 wires deploy-time env gates. */
  enabled?: boolean;
  /** Dev-time assertion only — enabled modules must list these keys. */
  dependsOn?: string[];
  /** Routes inside RequireAuth → AppShell. */
  shellRoutes?: ReactNode;
  /** Routes outside auth guard (e.g. /login). */
  publicRoutes?: ReactNode;
  navItem?: AppNavItem;
  /** Phase 3 — home dashboard card contributions. */
  homeCards?: HomeCardDefinition[];
  /** Phase 3 — settings sidebar tab contributions. */
  settingsTabs?: SettingsTabDefinition[];
};
