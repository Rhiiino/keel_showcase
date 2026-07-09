// keel_web/src/modules/services/manifest.ts

import { servicesNavItem } from "./navItem";
import { servicesShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const servicesManifest: FeatureModuleManifest = {
  key: "services",
  shellRoutes: servicesShellRoutes,
  navItem: servicesNavItem,
};
