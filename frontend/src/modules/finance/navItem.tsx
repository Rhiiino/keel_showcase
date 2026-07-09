// keel_web/src/modules/finance/navItem.tsx

// Finance nav entry for the app shell menu. Registered via finance/manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const financeNavItem: AppNavItem = {
  id: "finance",
  title: "Finance",
  href: "/finance",
  icon: <AppNavIconImage id="finance" />,
  accent: "blue",
  pathPrefixes: ["/finance"],
};
