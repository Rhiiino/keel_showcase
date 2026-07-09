// keel_web/src/modules/coak/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const coakNavItem: AppNavItem = {
  id: "coak",
  title: "C.O.A.K.",
  href: "/coak",
  icon: <AppNavIconImage id="coak" />,
  pathPrefixes: ["/coak"],
};
