// keel_web/src/modules/games/manifest.ts

import { gamesNavItem } from "./navItem";
import { gamesShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const gamesManifest: FeatureModuleManifest = {
  key: "games",
  shellRoutes: gamesShellRoutes,
  navItem: gamesNavItem,
};
