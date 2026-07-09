// keel_web/src/modules/intelligence/navItem.tsx

// Intelligence nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const intelligenceNavItem: AppNavItem = {
  id: "intelligence",
  title: "Intelligence",
  href: "/intelligence",
  icon: <AppNavIconImage id="intelligence" />,
  accent: "blue",
  pathPrefixes: ["/intelligence"],
};
