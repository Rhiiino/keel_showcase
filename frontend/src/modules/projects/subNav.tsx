// keel_web/src/modules/projects/subNav.tsx

// Secondary navigation tabs for the projects module.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const projectsModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    excludePrefixes: ["/projects/tags"],
  },
  {
    id: "tags",
    label: "Tags",
    href: "/projects/tags",
  },
];
