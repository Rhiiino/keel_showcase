// keel_web/src/modules/media/navItem.tsx

// Media nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const mediaNavItem: AppNavItem = {
  id: "media",
  title: "Media",
  href: "/media",
  icon: <AppNavIconImage id="media" />,
  accent: "blue",
  pathPrefixes: ["/media"],
};
