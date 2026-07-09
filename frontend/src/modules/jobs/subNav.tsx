// keel_web/src/modules/jobs/subNav.tsx

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const jobsModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "runs",
    label: "Runs",
    href: "/jobs",
    excludePrefixes: ["/jobs/schedules", "/jobs/tasks"],
  },
  {
    id: "schedules",
    label: "Schedules",
    href: "/jobs/schedules",
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/jobs/tasks",
  },
];
