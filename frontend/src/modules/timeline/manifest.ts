// keel_web/src/modules/timeline/manifest.ts

import { timelineNavItem } from "./navItem";
import { timelineHomeCards } from "./homeCards";
import { timelineShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const timelineManifest: FeatureModuleManifest = {
  key: "timeline",
  shellRoutes: timelineShellRoutes,
  navItem: timelineNavItem,
  homeCards: timelineHomeCards,
};
