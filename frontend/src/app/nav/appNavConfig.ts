// stack_sandbox/frontend_web/src/app/nav/appNavConfig.ts

// App navigation types, layout constants, and path-matching helpers.
// Modules define their own nav items; the ordered registry lives in app/nav/appNavRegistry.tsx.

import type { ReactNode } from "react";

export type NavAccent = "lime" | "blue";

export type AppNavItem = {
  id: string;
  title: string;
  href: string;
  icon: ReactNode;
  comingSoon?: boolean;
  /** Icon rail + label highlight color when this item is active. Defaults to lime. */
  accent?: NavAccent;
  /** Extra path prefixes that highlight this item (in addition to href matching). */
  pathPrefixes?: string[];
};

/** Shared nav row height — icon rail and label rows must match. */
export const NAV_ROW_CLASS = "flex h-11 shrink-0 items-center";

/** Logo block height — matches Keel header block in the label panel. */
export const NAV_LOGO_BLOCK_CLASS = "flex h-20 shrink-0 items-center";

/** Fixed leading slot that keeps every icon aligned to the collapsed rail column. */
export const NAV_ICON_SLOT_CLASS =
  "flex w-[4.25rem] shrink-0 items-center justify-center";

/** Icon button hit area inside each nav row. */
export const NAV_ICON_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-xl transition";

/** PNG icon size inside nav icon buttons. */
export const NAV_ICON_IMAGE_CLASS = "h-[1.54rem] w-[1.54rem] object-contain";

/** Full repeat interval for the nav accent wave (ms). */
export const APP_NAV_WAVE_CYCLE_MS = 12_000;

/** Delay between each menu item's wave pulse, bottom → top (ms). */
export const APP_NAV_WAVE_STEP_MS = 280;

export function buildNavWaveDelays(
  rows: ReadonlyArray<{ kind: string; key: string }>,
): Map<string, number> {
  const itemCount = rows.reduce(
    (count, row) => (row.kind === "item" ? count + 1 : count),
    0,
  );
  const delays = new Map<string, number>();
  let itemIndex = 0;

  for (const row of rows) {
    if (row.kind !== "item") {
      continue;
    }

    delays.set(row.key, (itemCount - 1 - itemIndex) * APP_NAV_WAVE_STEP_MS);
    itemIndex += 1;
  }

  return delays;
}

/** Rail control / logo image size. */
export const NAV_RAIL_IMAGE_CLASS = "h-[1.8rem] w-[1.8rem] object-contain";

/** Nav menu item label text — midway between text-sm and the prior compact size. */
export const NAV_ROW_LABEL_CLASS = "text-[0.7875rem]";

/** Collapsed rail width (px) — fixed; matches the 4.25rem icon slot. */
export const APP_NAV_RAIL_WIDTH = 68;

/** Default / min / max width (px) for the expanded, resizable nav panel. */
export const APP_NAV_DEFAULT_WIDTH = 288;
/** Narrowest expanded width — icon rail plus a short label strip. */
export const APP_NAV_MIN_WIDTH = 200;
export const APP_NAV_MAX_WIDTH = 420;

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  if (pathname === item.href) {
    return true;
  }

  if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return (
    item.pathPrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ?? false
  );
}

export function resolveActiveNavId(
  pathname: string,
  items: readonly AppNavItem[],
): string {
  const match = items.find((item) => isNavItemActive(pathname, item));
  return match?.id ?? items[0]?.id ?? "home";
}

export function getNavItemHref(
  items: readonly AppNavItem[],
  id: string,
): string | undefined {
  const item = items.find((entry) => entry.id === id);
  if (!item || item.comingSoon) {
    return undefined;
  }
  return item.href;
}
