// keel_web/src/modules/games/navItem.tsx

import { AppNavIconImage } from "../../app/nav/appNavIcons";
import type { AppNavItem } from "../../app/nav/appNavConfig";

export const gamesNavItem: AppNavItem = {
  id: "games",
  title: "Games",
  href: "/games",
  icon: <AppNavIconImage id="games" />,
  accent: "lime",
  pathPrefixes: ["/games"],
};
