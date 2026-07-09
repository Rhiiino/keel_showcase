// keel_web/src/modules/journal/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const journalNavItem: AppNavItem = {
  id: "journal",
  title: "Journal",
  href: "/journal",
  icon: <AppNavIconImage id="journal" />,
  accent: "blue",
  pathPrefixes: ["/journal"],
};
