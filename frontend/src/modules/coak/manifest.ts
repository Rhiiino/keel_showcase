// keel_web/src/modules/coak/manifest.ts

import { coakNavItem } from "./navItem";
import { coakShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const coakManifest: FeatureModuleManifest = {
  key: "coak",
  shellRoutes: coakShellRoutes,
  navItem: coakNavItem,
};
