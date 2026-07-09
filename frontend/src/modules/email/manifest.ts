// keel_web/src/modules/email/manifest.ts

import { emailNavItem } from "./navItem";
import { emailShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const emailManifest: FeatureModuleManifest = {
  key: "email",
  shellRoutes: emailShellRoutes,
  navItem: emailNavItem,
};
