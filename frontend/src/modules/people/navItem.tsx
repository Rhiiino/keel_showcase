// keel_web/src/modules/people/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const peopleNavItem: AppNavItem = {
  id: "people",
  title: "People",
  href: "/people/contacts",
  icon: <AppNavIconImage id="people" />,
  accent: "blue",
  pathPrefixes: ["/people"],
};
