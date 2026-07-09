// keel_web/src/modules/chat/manifest.ts

import { chatNavItem } from "./navItem";
import { chatShellRoutes } from "./routes";
import type { FeatureModuleManifest } from "../../app/modules/types";

export const chatManifest: FeatureModuleManifest = {
  key: "chat",
  shellRoutes: chatShellRoutes,
  navItem: chatNavItem,
};
