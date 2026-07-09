// keel_web/src/modules/home/manifest.ts

import { homeShellRoutes } from "./routes";
import { homeModuleHomeCards } from "./homeCards";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const homeManifest: FeatureModuleManifest = {
  key: "home",
  shellRoutes: homeShellRoutes,
  homeCards: homeModuleHomeCards,
};
