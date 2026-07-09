// keel_web/src/modules/projects/navItem.tsx

// Projects nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const projectsNavItem: AppNavItem = {
  id: "projects",
  title: "Projects",
  href: "/projects",
  icon: <AppNavIconImage id="projects" />,
  accent: "blue",
  pathPrefixes: ["/projects"],
};
