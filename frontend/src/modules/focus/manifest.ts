// keel_web/src/modules/focus/manifest.ts

import { focusNavItem } from "./navItem";
import { focusShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const focusManifest: FeatureModuleManifest = {
  key: "focus",
  shellRoutes: focusShellRoutes,
  navItem: focusNavItem,
};
