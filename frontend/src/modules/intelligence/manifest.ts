// keel_web/src/modules/intelligence/manifest.ts

import { intelligenceNavItem } from "./navItem";
import { intelligenceShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const intelligenceManifest: FeatureModuleManifest = {
  key: "intelligence",
  shellRoutes: intelligenceShellRoutes,
  navItem: intelligenceNavItem,
};
