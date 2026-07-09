// keel_web/src/modules/coak/lib/tabs/directory/coakDirectorySearch.ts

import { coakItemNodeId, type CoakItem } from "../../../api";
import { getCoakItemKindDefinition } from "../../coakItemKindRegistry";
import { flattenCoakTree, type CoakTreeNode } from "./coakTree";

function normalizeDirectorySearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function coakTreeNodeTitleMatchesSearch(node: CoakTreeNode, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return false;
  }

  return node.name.toLowerCase().includes(normalizedQuery);
}

function coakTreeNodeMatchesSearch(node: CoakTreeNode, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return false;
  }

  const item: CoakItem = {
    id: node.id,
    coak_record_id: 0,
    parent_id: node.parent_id,
    kind: node.kind,
    name: node.name,
    color_hex: node.color_hex,
    sort_order: node.sort_order,
    media_id: node.media_id,
    note_body: node.note_body,
    flash_front: node.flash_front,
    flash_back: node.flash_back,
    tags: node.tags ?? [],
    created_at: "",
    updated_at: "",
  };

  return getCoakItemKindDefinition(node.kind).matchesDirectorySearch(item, normalizedQuery);
}

export function findCoakNodeTitleSearchMatches(
  tree: CoakTreeNode[],
  query: string,
): string[] {
  const normalizedQuery = normalizeDirectorySearchQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  return flattenCoakTree(tree)
    .filter((node) => coakTreeNodeTitleMatchesSearch(node, normalizedQuery))
    .map((node) => coakItemNodeId(node.id));
}

export function findCoakDirectorySearchMatches(
  tree: CoakTreeNode[],
  query: string,
): string[] {
  const normalizedQuery = normalizeDirectorySearchQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  return flattenCoakTree(tree)
    .filter((node) => coakTreeNodeMatchesSearch(node, normalizedQuery))
    .map((node) => coakItemNodeId(node.id));
}

export function collectCoakSearchAncestorFolderIds(
  items: CoakItem[],
  matchNodeIds: string[],
): Set<number> {
  const folderIds = new Set<number>();
  if (matchNodeIds.length === 0) {
    return folderIds;
  }

  const itemsById = new Map(items.map((item) => [item.id, item]));

  for (const nodeId of matchNodeIds) {
    if (!nodeId.startsWith("item:")) {
      continue;
    }

    const itemId = Number.parseInt(nodeId.slice(5), 10);
    if (!Number.isFinite(itemId)) {
      continue;
    }

    let parentId = itemsById.get(itemId)?.parent_id ?? null;
    while (parentId != null) {
      const parent = itemsById.get(parentId);
      if (!parent) {
        break;
      }

      if (parent.kind === "folder") {
        folderIds.add(parentId);
      }

      parentId = parent.parent_id;
    }
  }

  return folderIds;
}
