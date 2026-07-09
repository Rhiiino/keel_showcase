// keel_web/src/modules/agents/navItem.tsx

// Agents nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const agentsNavItem: AppNavItem = {
  id: "agents",
  title: "Agents",
  href: "/agents",
  icon: <AppNavIconImage id="agents" />,
  accent: "lime",
  pathPrefixes: ["/agents"],
};
