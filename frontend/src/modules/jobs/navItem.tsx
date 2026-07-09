// keel_web/src/modules/jobs/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const jobsNavItem: AppNavItem = {
  id: "jobs",
  title: "Jobs",
  href: "/jobs",
  icon: <AppNavIconImage id="jobs" />,
  pathPrefixes: ["/jobs"],
};
