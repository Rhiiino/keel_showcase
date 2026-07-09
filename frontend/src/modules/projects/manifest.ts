// keel_web/src/modules/projects/manifest.ts

import { projectsNavItem } from "./navItem";
import { projectsShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const projectsManifest: FeatureModuleManifest = {
  key: "projects",
  shellRoutes: projectsShellRoutes,
  navItem: projectsNavItem,
};
