// keel_web/src/modules/journal/manifest.ts

import { journalNavItem } from "./navItem";
import { journalHomeCards } from "./homeCards";
import { journalShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const journalManifest: FeatureModuleManifest = {
  key: "journal",
  shellRoutes: journalShellRoutes,
  navItem: journalNavItem,
  homeCards: journalHomeCards,
};
