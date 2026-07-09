// keel_web/src/app/nav/moduleSubNavStorage.ts

// Persist the last visited route per module secondary-nav section.

import {
  isModuleSubNavItemActive,
  type ModuleSubNavItem,
} from "./moduleSubNavConfig";

type ModuleSubNavPathMap = Record<string, string>;

function storageKey(moduleId: string): string {
  return `keel.moduleSubNav.${moduleId}`;
}

function readPathMap(moduleId: string): ModuleSubNavPathMap {
  try {
    const raw = localStorage.getItem(storageKey(moduleId));
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as ModuleSubNavPathMap;
  } catch {
    return {};
  }
}

function writePathMap(moduleId: string, map: ModuleSubNavPathMap): void {
  try {
    localStorage.setItem(storageKey(moduleId), JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function readModuleSubNavPath(
  moduleId: string,
  sectionId: string,
): string | null {
  const stored = readPathMap(moduleId)[sectionId];
  return typeof stored === "string" && stored.length > 0 ? stored : null;
}

export function writeModuleSubNavPath(
  moduleId: string,
  sectionId: string,
  path: string,
): void {
  const map = readPathMap(moduleId);
  map[sectionId] = path;
  writePathMap(moduleId, map);
}

export function resolveModuleSubNavHref(
  moduleId: string,
  item: ModuleSubNavItem,
): string {
  const stored = readModuleSubNavPath(moduleId, item.id);
  if (!stored) {
    return item.href;
  }

  const pathname = stored.split("?")[0] ?? stored;
  if (item.restoreListOnly && pathname !== item.href) {
    return item.href;
  }

  if (isModuleSubNavItemActive(pathname, item)) {
    return stored;
  }

  return item.href;
}

export function rememberModuleSubNavLocation(
  moduleId: string,
  items: readonly ModuleSubNavItem[],
  pathname: string,
  search: string,
): void {
  const activeSectionId = items.find((item) =>
    isModuleSubNavItemActive(pathname, item),
  )?.id;
  if (!activeSectionId) {
    return;
  }

  writeModuleSubNavPath(moduleId, activeSectionId, `${pathname}${search}`);
}
