// keel_web/src/app/navigation/resolveNavigationNavIcon.ts

// Resolves the app nav icon for a breadcrumb path using the same matching rules
// as the sidebar menu.

import { appNavItems } from "../nav/appNavRegistry";
import { isNavItemActive } from "../nav/appNavConfig";
import type { AppNavIconId } from "../nav/appNavIcons";

export function resolveNavigationNavIconId(
  pathname: string,
): AppNavIconId | null {
  const match = appNavItems.find((item) => isNavItemActive(pathname, item));
  if (!match) {
    return null;
  }

  return match.id as AppNavIconId;
}
