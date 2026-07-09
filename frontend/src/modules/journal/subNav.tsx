// keel_web/src/modules/journal/subNav.tsx

// Secondary navigation tabs for the journal module. Registered in journal/routes.tsx.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const journalModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "entries",
    label: "Entries",
    href: "/journal",
    excludePrefixes: ["/journal/tags"],
  },
  {
    id: "tags",
    label: "Tags",
    href: "/journal/tags",
  },
];
