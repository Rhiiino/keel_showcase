// keel_web/src/modules/auth/manifest.ts

import { homeNavItem } from "./navItem";
import { authLoginRoute } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const authManifest: FeatureModuleManifest = {
  key: "auth",
  publicRoutes: authLoginRoute,
  navItem: homeNavItem,
};
