// keel_web/src/modules/chat/navItem.tsx

// Chat nav entry for the app shell menu. Registered via module manifest.ts.

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const chatNavItem: AppNavItem = {
  id: "chat",
  title: "Chat",
  href: "/chat",
  icon: <AppNavIconImage id="chat" />,
  accent: "blue",
  pathPrefixes: ["/chat"],
};
