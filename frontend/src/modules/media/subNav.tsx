// keel_web/src/modules/media/subNav.tsx

// Secondary navigation tabs for the media module. Registered in media/routes.tsx.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const mediaModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "browse",
    label: "Media",
    href: "/media",
    excludePrefixes: ["/media/panels"],
  },
  {
    id: "panels",
    label: "Panels",
    href: "/media/panels",
    restoreListOnly: true,
  },
];
