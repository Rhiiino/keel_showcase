// stack_sandbox/frontend_web/src/app/nav/appNavOrder.ts

// Merge persisted nav order with the registry when items are added or removed.

export const APP_NAV_ORDER_STORAGE_KEY = "keel.app.navOrder";

export function mergeNavOrder(
  storedIds: readonly string[],
  registryIds: readonly string[],
): string[] {
  const registrySet = new Set(registryIds);
  const merged = storedIds.filter((id) => registrySet.has(id));
  for (const id of registryIds) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  return merged;
}

export function readStoredNavOrder(
  registryIds: readonly string[],
): string[] {
  try {
    const raw = localStorage.getItem(APP_NAV_ORDER_STORAGE_KEY);
    if (!raw) {
      return [...registryIds];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string")) {
      return [...registryIds];
    }

    return mergeNavOrder(parsed, registryIds);
  } catch {
    return [...registryIds];
  }
}

export function writeStoredNavOrder(order: readonly string[]): void {
  try {
    localStorage.setItem(APP_NAV_ORDER_STORAGE_KEY, JSON.stringify([...order]));
  } catch {
    // Private browsing or quota — ignore.
  }
}
