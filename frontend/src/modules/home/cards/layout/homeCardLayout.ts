// keel_web/src/modules/home/cards/layout/homeCardLayout.ts

// Home dashboard card layout and merge helpers (mirrors app nav layout pattern).

import { getHomeCardRegistryIds } from "../registry";
import type { HomeCardId } from "../../../../app/modules/homeCardTypes";
import {
  isHomeCardResizable,
  resolveHomeCardSize,
} from "./homeCardResize";

export type HomeCardLayoutEntry = {
  id: HomeCardId;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export type StoredHomeCardLayoutEntry = {
  id: HomeCardId;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const DEFAULT_HOME_CARD_SLOT_HEIGHT = 380;
export const DEFAULT_HOME_CARD_STACK_GAP = 32;

export function hasStoredPosition(
  entry: Pick<StoredHomeCardLayoutEntry, "x" | "y">,
): boolean {
  return typeof entry.x === "number" && typeof entry.y === "number";
}

export function mergeHomeCardLayout(
  layout: readonly StoredHomeCardLayoutEntry[],
  registryIds: readonly HomeCardId[],
): StoredHomeCardLayoutEntry[] {
  const registrySet = new Set(registryIds);
  const merged = layout.filter((entry) => registrySet.has(entry.id));
  const presentIds = new Set(merged.map((entry) => entry.id));

  for (const id of registryIds) {
    if (!presentIds.has(id)) {
      merged.push({ id });
    }
  }

  return merged;
}

export function resolveHomeCardLayout(
  stored?: readonly StoredHomeCardLayoutEntry[] | null,
): HomeCardLayoutEntry[] {
  const merged = mergeHomeCardLayout(stored ?? [], getHomeCardRegistryIds());
  const storedById = new Map(merged.map((entry) => [entry.id, entry]));

  let maxBottom = 0;
  const resolved: HomeCardLayoutEntry[] = [];

  for (const { id } of merged) {
    const storedEntry = storedById.get(id);
    const size = resolveHomeCardSize(id, storedEntry);
    const slotHeight = size?.height ?? DEFAULT_HOME_CARD_SLOT_HEIGHT;

    if (storedEntry && hasStoredPosition(storedEntry)) {
      const x = storedEntry.x!;
      const y = storedEntry.y!;
      resolved.push({
        id,
        x,
        y,
        ...(size
          ? {
              width: size.width,
              height: size.height,
            }
          : {}),
      });
      maxBottom = Math.max(maxBottom, y + slotHeight);
      continue;
    }

    const y = resolved.length === 0 ? 0 : maxBottom + DEFAULT_HOME_CARD_STACK_GAP;
    resolved.push({
      id,
      x: 0,
      y,
      ...(size
        ? {
            width: size.width,
            height: size.height,
          }
        : {}),
    });
    maxBottom = y + slotHeight;
  }

  return resolved;
}

export function buildDefaultHomeCardLayout(): HomeCardLayoutEntry[] {
  return resolveHomeCardLayout(undefined);
}

export function layoutSignature(layout: readonly HomeCardLayoutEntry[]): string {
  return layout
    .map((entry) => {
      const sizeSuffix =
        isHomeCardResizable(entry.id) && entry.width != null && entry.height != null
          ? `:${entry.width}x${entry.height}`
          : "";
      return `${entry.id}:${entry.x},${entry.y}${sizeSuffix}`;
    })
    .join("|");
}

export function getHomeCardSlotHeight(entry: HomeCardLayoutEntry): number {
  if (isHomeCardResizable(entry.id) && entry.height != null) {
    return entry.height;
  }
  return DEFAULT_HOME_CARD_SLOT_HEIGHT;
}
