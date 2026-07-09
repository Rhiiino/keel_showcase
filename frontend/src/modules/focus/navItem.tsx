// keel_web/src/modules/focus/navItem.tsx

// Focus nav entry for the app shell menu.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const focusNavItem: AppNavItem = {
  id: "focus",
  title: "Focus",
  href: "/focus",
  icon: <AppNavIconImage id="focus" />,
  accent: "blue",
  pathPrefixes: ["/focus"],
};
