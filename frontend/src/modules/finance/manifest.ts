// keel_web/src/modules/finance/manifest.ts

import { financeNavItem } from "./navItem";
import { financeShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const financeManifest: FeatureModuleManifest = {
  key: "finance",
  shellRoutes: financeShellRoutes,
  navItem: financeNavItem,
};
