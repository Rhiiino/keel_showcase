// keel_web/src/modules/settings/manifest.ts

import { settingsShellRoutes } from "./routes";
import { settingsCoreTabs } from "./settingsTabs";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const settingsManifest: FeatureModuleManifest = {
  key: "settings",
  shellRoutes: settingsShellRoutes,
  settingsTabs: settingsCoreTabs,
};
