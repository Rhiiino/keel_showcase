// keel_web/src/modules/finance/subNav.tsx

// Secondary navigation tabs for the finance module. Registered in finance/routes.tsx.

import type { ModuleSubNavItem } from "../../app/nav/moduleSubNavConfig";

export const financeModuleSubNavItems: ModuleSubNavItem[] = [
  {
    id: "transactions",
    label: "Transactions",
    href: "/finance/transactions",
    excludePrefixes: [
      "/finance/subscriptions",
      "/finance/vendors",
      "/finance/accounts",
      "/finance/tags",
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/finance/subscriptions",
  },
  {
    id: "vendors",
    label: "Vendors",
    href: "/finance/vendors",
  },
  {
    id: "accounts",
    label: "Accounts",
    href: "/finance/accounts",
  },
  {
    id: "tags",
    label: "Tags",
    href: "/finance/tags/transactions",
  },
];
