// keel_web/src/modules/people/manifest.ts

import { peopleNavItem } from "./navItem";
import { peopleShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const peopleManifest: FeatureModuleManifest = {
  key: "people",
  shellRoutes: peopleShellRoutes,
  navItem: peopleNavItem,
};
