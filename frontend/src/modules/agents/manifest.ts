// keel_web/src/modules/agents/manifest.ts

import { agentsNavItem } from "./navItem";
import { agentsShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const agentsManifest: FeatureModuleManifest = {
  key: "agents",
  shellRoutes: agentsShellRoutes,
  navItem: agentsNavItem,
};
