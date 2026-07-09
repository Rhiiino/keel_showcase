// keel_web/src/modules/media/manifest.ts

import { mediaNavItem } from "./navItem";
import { mediaShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const mediaManifest: FeatureModuleManifest = {
  key: "media",
  shellRoutes: mediaShellRoutes,
  navItem: mediaNavItem,
};
