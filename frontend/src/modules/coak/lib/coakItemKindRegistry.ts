// keel_web/src/modules/coak/lib/coakItemKindRegistry.ts

import type { CoakItem, CoakItemKind } from "../api";
import type { CoakNodeVisualStyle } from "./tabs/settings/coakNodeVisualSettings";
import { truncateCoakDirectoryPreview } from "./tabs/directory/coakDirectoryPreview";

export const COAK_ITEM_KINDS: readonly CoakItemKind[] = ["folder", "note", "flash"] as const;

export type CoakItemKindDefinition = {
  label: string;
  listGlyph: string;
  defaultVisualStyle: CoakNodeVisualStyle;
  canAcceptChildren: boolean;
  supportsFileAttachment: boolean;
  supportsPromotionToFolder: boolean;
  createDefaultName: string;
  directoryPreview: (options: {
    noteBody?: string;
    flashFront?: string;
    childCount?: number;
  }) => string;
  matchesDirectorySearch: (item: CoakItem, normalizedQuery: string) => boolean;
};

const COAK_ITEM_KIND_REGISTRY: Record<CoakItemKind, CoakItemKindDefinition> = {
  folder: {
    label: "Folder",
    listGlyph: "▸",
    defaultVisualStyle: "folder",
    canAcceptChildren: true,
    supportsFileAttachment: true,
    supportsPromotionToFolder: false,
    createDefaultName: "New folder",
    directoryPreview: ({ childCount }) =>
      childCount != null && childCount > 0
        ? `${childCount} ${childCount === 1 ? "item" : "items"}`
        : "",
    matchesDirectorySearch: (item, normalizedQuery) =>
      item.name.toLowerCase().includes(normalizedQuery),
  },
  note: {
    label: "Note",
    listGlyph: "✎",
    defaultVisualStyle: "note",
    canAcceptChildren: false,
    supportsFileAttachment: true,
    supportsPromotionToFolder: true,
    createDefaultName: "New note",
    directoryPreview: ({ noteBody }) => truncateCoakDirectoryPreview(noteBody ?? ""),
    matchesDirectorySearch: (item, normalizedQuery) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.note_body.toLowerCase().includes(normalizedQuery),
  },
  flash: {
    label: "Flash",
    listGlyph: "⚡",
    defaultVisualStyle: "note",
    canAcceptChildren: false,
    supportsFileAttachment: true,
    supportsPromotionToFolder: false,
    createDefaultName: "New flash",
    directoryPreview: ({ flashFront }) => truncateCoakDirectoryPreview(flashFront ?? ""),
    matchesDirectorySearch: (item, normalizedQuery) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.flash_front.toLowerCase().includes(normalizedQuery) ||
      item.flash_back.toLowerCase().includes(normalizedQuery),
  },
};

export function getCoakItemKindDefinition(kind: CoakItemKind): CoakItemKindDefinition {
  return COAK_ITEM_KIND_REGISTRY[kind];
}

export function coakItemSupportsFileAttachment(kind: CoakItemKind): boolean {
  return COAK_ITEM_KIND_REGISTRY[kind].supportsFileAttachment;
}

export function coakItemKindLabel(kind: CoakItemKind): string {
  return COAK_ITEM_KIND_REGISTRY[kind].label;
}

export function coakItemKindListGlyph(kind: CoakItemKind): string {
  return COAK_ITEM_KIND_REGISTRY[kind].listGlyph;
}

export const COAK_ITEM_KIND_LABELS: Record<CoakItemKind, string> = Object.fromEntries(
  COAK_ITEM_KINDS.map((kind) => [kind, COAK_ITEM_KIND_REGISTRY[kind].label]),
) as Record<CoakItemKind, string>;

export const COAK_NODE_VISUAL_DEFAULTS: Record<CoakItemKind, CoakNodeVisualStyle> =
  Object.fromEntries(
    COAK_ITEM_KINDS.map((kind) => [kind, COAK_ITEM_KIND_REGISTRY[kind].defaultVisualStyle]),
  ) as Record<CoakItemKind, CoakNodeVisualStyle>;
