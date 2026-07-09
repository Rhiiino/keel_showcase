// keel_web/src/modules/timeline/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const timelineNavItem: AppNavItem = {
  id: "timeline",
  title: "Timeline",
  href: "/timeline",
  icon: <AppNavIconImage id="timeline" />,
  accent: "blue",
  pathPrefixes: ["/timeline"],
};
