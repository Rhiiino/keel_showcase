// keel_web/src/modules/coak/lib/tabs/settings/coakSettingsSearch.ts

import { COAK_ITEM_KIND_LABELS, COAK_ITEM_KINDS } from "../../coakItemKindRegistry";
import { COAK_CONSTELLATION_BACKGROUND_LABELS } from "./coakBackgroundSettings";
import { COAK_SETTINGS_INFO } from "./coakSettingsInfoCopy";

export type CoakSettingsSearchEntry = {
  id: string;
  label: string;
  sectionTitle: string;
  keywords: readonly string[];
};

function buildCoakSettingsSearchEntry(
  id: string,
  label: string,
  sectionTitle: string,
  ...extraKeywords: string[]
): CoakSettingsSearchEntry {
  return { id, label, sectionTitle, keywords: extraKeywords };
}

const BACKGROUND_KEYWORDS = Object.values(COAK_CONSTELLATION_BACKGROUND_LABELS);

const NODE_VISUAL_ENTRIES: CoakSettingsSearchEntry[] = COAK_ITEM_KINDS.map((kind) =>
  buildCoakSettingsSearchEntry(
    `node-visual-${kind}`,
    `${COAK_ITEM_KIND_LABELS[kind]} node visual`,
    "Node visuals",
    COAK_ITEM_KIND_LABELS[kind],
    kind,
    "visual",
    "sphere",
    "style",
    "folder",
    "note",
    "wire",
    "stripe",
    "facet",
    "ring",
  ),
);

export const COAK_SETTINGS_SEARCH_ENTRIES: readonly CoakSettingsSearchEntry[] = [
  buildCoakSettingsSearchEntry(
    "section-connection-appearance",
    "Connection appearance",
    "Connection appearance",
    "connection",
    "appearance",
    "lines",
    "linking",
  ),
  buildCoakSettingsSearchEntry(
    "connection-color",
    "Connection color",
    "Connection appearance",
    COAK_SETTINGS_INFO.connectionColor,
    "connection",
    "color",
  ),
  buildCoakSettingsSearchEntry(
    "title-color",
    "Title color",
    "Connection appearance",
    COAK_SETTINGS_INFO.titleColor,
    "title",
    "label",
    "name",
    "color",
  ),
  buildCoakSettingsSearchEntry(
    "connection-width",
    "Connection width",
    "Connection appearance",
    COAK_SETTINGS_INFO.connectionWidth,
    "connection",
    "width",
    "thickness",
    "lines",
  ),
  buildCoakSettingsSearchEntry(
    "origin-pulse",
    "Origin pulse",
    "Connection appearance",
    COAK_SETTINGS_INFO.originPulse,
    "origin",
    "pulse",
    "animate",
    "wave",
  ),
  buildCoakSettingsSearchEntry(
    "node-revolve-speed",
    "Spin speed",
    "Connection appearance",
    COAK_SETTINGS_INFO.nodeRevolveSpeed,
    "spin",
    "revolve",
    "speed",
    "orbit",
    "rotate",
  ),
  buildCoakSettingsSearchEntry(
    "section-auto-optimize-layout",
    "Auto-optimize layout",
    "Auto-optimize layout",
    "auto",
    "optimize",
    "layout",
    "dragging",
  ),
  buildCoakSettingsSearchEntry(
    "auto-optimize-enable",
    "Enable auto-optimize layout",
    "Auto-optimize layout",
    COAK_SETTINGS_INFO.autoOptimizeLayout,
    "enable",
    "auto",
    "optimize",
    "layout",
  ),
  buildCoakSettingsSearchEntry(
    "auto-optimize-connection-distance",
    "Connection distance",
    "Auto-optimize layout",
    COAK_SETTINGS_INFO.autoOptimizeConnectionDistance,
    "connection",
    "distance",
    "spacing",
    "children",
  ),
  buildCoakSettingsSearchEntry(
    "auto-optimize-connection-angle",
    "Connection angle",
    "Auto-optimize layout",
    COAK_SETTINGS_INFO.autoOptimizeConnectionAngle,
    "connection",
    "angle",
    "branch",
    "sibling",
    "degrees",
  ),
  buildCoakSettingsSearchEntry(
    "section-constellation-background",
    "Constellation background",
    "Constellation background",
    "constellation",
    "background",
    "sky",
    "gradient",
  ),
  buildCoakSettingsSearchEntry(
    "constellation-background",
    "Background",
    "Constellation background",
    COAK_SETTINGS_INFO.constellationBackground,
    "background",
    "preset",
    ...BACKGROUND_KEYWORDS,
    "storm",
    "rain",
    "lightning",
  ),
  buildCoakSettingsSearchEntry(
    "section-constellation-editors",
    "Constellation editors",
    "Constellation editors",
    "constellation",
    "editors",
    "modals",
  ),
  buildCoakSettingsSearchEntry(
    "persistent-node-modals",
    "Always show node editors",
    "Constellation editors",
    COAK_SETTINGS_INFO.persistentNodeModals,
    "persistent",
    "always",
    "node",
    "editors",
    "modals",
  ),
  buildCoakSettingsSearchEntry(
    "item-editor-enlarge",
    "Enlarge editors on hover",
    "Constellation editors",
    COAK_SETTINGS_INFO.itemEditorEnlarge,
    "enlarge",
    "hover",
    "editor",
    "modal",
    "scale",
  ),
  buildCoakSettingsSearchEntry(
    "section-node-visuals",
    "Node visuals",
    "Node visuals",
    "node",
    "visual",
    "sphere",
    "appearance",
  ),
  buildCoakSettingsSearchEntry(
    "node-size",
    "Node size",
    "Node visuals",
    COAK_SETTINGS_INFO.nodeSize,
    "node",
    "size",
    "diameter",
    "scale",
  ),
  ...NODE_VISUAL_ENTRIES,
] as const;

function normalizeCoakSettingsSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function coakSettingsSearchEntryText(entry: CoakSettingsSearchEntry): string {
  return [entry.label, entry.sectionTitle, ...entry.keywords].join(" ").toLowerCase();
}

export function findCoakSettingsSearchMatches(query: string): string[] {
  const normalizedQuery = normalizeCoakSettingsSearchQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  return COAK_SETTINGS_SEARCH_ENTRIES.filter((entry) =>
    coakSettingsSearchEntryText(entry).includes(normalizedQuery),
  ).map((entry) => entry.id);
}

export function scrollCoakSettingsSearchTargetIntoView(
  container: HTMLElement,
  target: HTMLElement,
): void {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;

  container.scrollTo({
    top: container.scrollTop + (targetCenterY - containerCenterY),
    behavior: "smooth",
  });
}
