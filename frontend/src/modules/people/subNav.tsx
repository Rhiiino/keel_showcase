// keel_web/src/modules/people/subNav.tsx

// Secondary navigation tabs for the people module. Registered in people/routes.tsx.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const peopleModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "contacts",
    label: "Contacts",
    href: "/people/contacts",
    excludePrefixes: [
      "/people/contacts/family-groups",
      "/people/contacts/family-tree",
      "/people/contacts/tags",
    ],
  },
  {
    id: "figures",
    label: "Figures",
    href: "/people/figures",
    excludePrefixes: ["/people/figures/new"],
  },
  {
    id: "groups",
    label: "Groups",
    href: "/people/contacts/family-groups",
  },
  {
    id: "tree",
    label: "Tree",
    href: "/people/contacts/family-tree",
  },
  {
    id: "tags",
    label: "Tags",
    href: "/people/contacts/tags",
  },
];
