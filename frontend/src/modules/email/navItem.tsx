// keel_web/src/modules/email/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const emailNavItem: AppNavItem = {
  id: "email",
  title: "Email",
  href: "/email",
  icon: <AppNavIconImage id="email" />,
  accent: "blue",
  pathPrefixes: ["/email"],
};
