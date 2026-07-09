// keel_web/src/modules/services/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const servicesNavItem: AppNavItem = {
  id: "services",
  title: "Services",
  href: "/services",
  icon: <AppNavIconImage id="services" />,
  accent: "blue",
  pathPrefixes: ["/services"],
};
