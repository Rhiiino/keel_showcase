// keel_web/src/modules/home/cards/registry.ts

// Merged home dashboard card registry from enabled module manifests.
// Loaded lazily to avoid circular imports while module manifests initialize.

import type { ComponentType } from "react";

import { buildHomeCardRegistry } from "../../../app/modules/buildHomeCardRegistry";
import {
  HOME_CARD_IDS,
  type HomeCardCategory,
  type HomeCardDefinition,
  type HomeCardId,
} from "../../../app/modules/homeCardTypes";
import { enabledModules, moduleManifests } from "../../../app/modules/registry";

export { HOME_CARD_IDS, type HomeCardCategory, type HomeCardDefinition, type HomeCardId };

let cachedRegistry: HomeCardDefinition[] | undefined;
let cachedRegistryIds: HomeCardId[] | undefined;
let cachedComponentsById: Record<HomeCardId, ComponentType> | undefined;

function loadHomeCardRegistry(): HomeCardDefinition[] {
  if (!cachedRegistry) {
    cachedRegistry = buildHomeCardRegistry(enabledModules(moduleManifests));
    cachedRegistryIds = cachedRegistry.map((entry) => entry.id);
    cachedComponentsById = Object.fromEntries(
      cachedRegistry.map((entry) => [entry.id, entry.Component]),
    ) as Record<HomeCardId, ComponentType>;
  }
  return cachedRegistry;
}

export function getHomeCardRegistry(): readonly HomeCardDefinition[] {
  return loadHomeCardRegistry();
}

export function getHomeCardRegistryIds(): readonly HomeCardId[] {
  loadHomeCardRegistry();
  return cachedRegistryIds!;
}

export function getHomeCardComponent(id: HomeCardId): ComponentType | undefined {
  loadHomeCardRegistry();
  return cachedComponentsById![id];
}
