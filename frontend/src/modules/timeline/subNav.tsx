// keel_web/src/modules/timeline/subNav.tsx

// Secondary navigation tabs for the timeline module. Registered in timeline/routes.tsx.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const timelineModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "calendar",
    label: "Calendar",
    href: "/timeline/calendar",
  },
  {
    id: "events",
    label: "Events",
    href: "/timeline",
    excludePrefixes: ["/timeline/calendar", "/timeline/tags", "/timeline/plan"],
  },
  {
    id: "plan",
    label: "Plan",
    href: "/timeline/plan",
  },
  {
    id: "tags",
    label: "Tags",
    href: "/timeline/tags",
  },
];
