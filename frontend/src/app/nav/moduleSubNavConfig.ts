// keel_web/src/app/nav/moduleSubNavConfig.ts

// Types and path-matching helpers for module secondary navigation tabs.

export type ModuleSubNavItem = {
  id: string;
  label: string;
  href: string;
  /** Path prefixes that mark this tab active. Defaults to href. */
  matchPrefixes?: string[];
  /** When matched, these prefixes prevent this tab from being active. */
  excludePrefixes?: string[];
  /** Optional override for complex active-state rules. */
  isActive?: (pathname: string) => boolean;
  /** When true, tab links restore only the list href, not nested detail routes. */
  restoreListOnly?: boolean;
};

export function isModuleSubNavItemActive(
  pathname: string,
  item: ModuleSubNavItem,
): boolean {
  if (item.isActive) {
    return item.isActive(pathname);
  }

  if (
    item.excludePrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveActiveModuleSubNavId(
  pathname: string,
  items: readonly ModuleSubNavItem[],
): string {
  const match = items.find((item) => isModuleSubNavItemActive(pathname, item));
  return match?.id ?? items[0]?.id ?? "";
}
