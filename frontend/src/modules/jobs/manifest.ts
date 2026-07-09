// keel_web/src/modules/jobs/manifest.ts

import { jobsNavItem } from "./navItem";
import { jobsShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const jobsManifest: FeatureModuleManifest = {
  key: "jobs",
  shellRoutes: jobsShellRoutes,
  navItem: jobsNavItem,
};
