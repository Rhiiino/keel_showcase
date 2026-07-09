// keel_web/src/modules/auth/navItem.tsx

// Home nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const homeNavItem: AppNavItem = {
  id: "home",
  title: "Home",
  href: "/",
  icon: <AppNavIconImage id="home" />,
};
