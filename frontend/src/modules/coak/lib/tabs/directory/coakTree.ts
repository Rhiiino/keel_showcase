// keel_web/src/modules/coak/lib/coakTree.ts

import {
  COAK_ORIGIN_NODE_ID,
  coakItemNodeId,
  parseCoakItemNodeId,
  type CoakItem,
} from "../../../api";

export type CoakTreeNode = CoakItem & {
  children: CoakTreeNode[];
};

function sortTreeNodes(nodes: CoakTreeNode[]): CoakTreeNode[] {
  nodes.sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }
    return left.id - right.id;
  });

  for (const node of nodes) {
    sortTreeNodes(node.children);
  }

  return nodes;
}

export function buildCoakTree(items: CoakItem[]): CoakTreeNode[] {
  const nodes = new Map<number, CoakTreeNode>();
  for (const item of items) {
    nodes.set(item.id, { ...item, children: [] });
  }

  const roots: CoakTreeNode[] = [];
  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) {
      continue;
    }

    if (item.parent_id == null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(item.parent_id);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortTreeNodes(roots);
}

export function flattenCoakTree(nodes: CoakTreeNode[]): CoakTreeNode[] {
  const flattened: CoakTreeNode[] = [];
  const visit = (node: CoakTreeNode) => {
    flattened.push(node);
    for (const child of node.children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return flattened;
}

export function findCoakTreeNode(
  nodes: CoakTreeNode[],
  itemId: number,
): CoakTreeNode | null {
  for (const node of nodes) {
    if (node.id === itemId) {
      return node;
    }
    const nested = findCoakTreeNode(node.children, itemId);
    if (nested) {
      return nested;
    }
  }
  return null;
}

export function isCoakFolderExpanded(
  expandedFolderIds: number[],
  folderId: number,
): boolean {
  return expandedFolderIds.includes(folderId);
}

/** Flatten the tree the same way the directory panel renders visible rows. */
export function flattenVisibleCoakTree(
  nodes: CoakTreeNode[],
  expandedFolderIds: number[],
): CoakTreeNode[] {
  const flattened: CoakTreeNode[] = [];

  const visit = (nodeList: CoakTreeNode[]) => {
    for (const node of nodeList) {
      flattened.push(node);
      if (node.kind === "folder" && isCoakFolderExpanded(expandedFolderIds, node.id)) {
        visit(node.children);
      }
    }
  };

  visit(nodes);
  return flattened;
}

/** Direct child item ids for a constellation node (origin or item), in tree order. */
export function collectCoakDirectChildItemIds(
  items: CoakItem[],
  parentNodeId: string,
): number[] {
  const parentItemId =
    parentNodeId === COAK_ORIGIN_NODE_ID ? null : parseCoakItemNodeId(parentNodeId);

  if (parentNodeId !== COAK_ORIGIN_NODE_ID && parentItemId == null) {
    return [];
  }

  return items
    .filter((item) =>
      parentItemId == null ? item.parent_id == null : item.parent_id === parentItemId,
    )
    .sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }
      return left.id - right.id;
    })
    .map((item) => item.id);
}

export function collectCoakDirectChildNodeIds(
  items: CoakItem[],
  parentNodeId: string,
): string[] {
  return collectCoakDirectChildItemIds(items, parentNodeId).map(coakItemNodeId);
}


/** All descendant node ids for a constellation node (origin or item), depth-first. */
export function collectCoakDescendantNodeIds(
  items: CoakItem[],
  parentNodeId: string,
): string[] {
  if (parentNodeId === COAK_ORIGIN_NODE_ID) {
    return items.map((item) => coakItemNodeId(item.id));
  }

  const parentItemId = parseCoakItemNodeId(parentNodeId);
  if (parentItemId == null) {
    return [];
  }

  return collectCoakDescendantItemIds(items, parentItemId).map(coakItemNodeId);
}


/** Folder item ids for a node and every folder nested beneath it (includes the node when it is a folder). */
export function collectCoakSubtreeFolderIds(
  items: CoakItem[],
  parentNodeId: string,
): number[] {
  const folderIds: number[] = [];

  if (parentNodeId !== COAK_ORIGIN_NODE_ID) {
    const parentItemId = parseCoakItemNodeId(parentNodeId);
    if (parentItemId != null) {
      const parentItem = items.find((item) => item.id === parentItemId);
      if (parentItem?.kind === "folder") {
        folderIds.push(parentItemId);
      }
    }
  }

  const descendantItemIds =
    parentNodeId === COAK_ORIGIN_NODE_ID
      ? items.map((item) => item.id)
      : (() => {
          const parentItemId = parseCoakItemNodeId(parentNodeId);
          return parentItemId != null ? collectCoakDescendantItemIds(items, parentItemId) : [];
        })();

  for (const itemId of descendantItemIds) {
    const item = items.find((entry) => entry.id === itemId);
    if (item?.kind === "folder") {
      folderIds.push(itemId);
    }
  }

  return folderIds;
}

/** All descendant item ids for a parent, depth-first (excluding the root). */
export function collectCoakDescendantItemIds(
  items: CoakItem[],
  rootItemId: number,
): number[] {
  const childrenByParent = new Map<number, CoakItem[]>();

  for (const item of items) {
    if (item.parent_id == null) {
      continue;
    }
    const siblings = childrenByParent.get(item.parent_id) ?? [];
    siblings.push(item);
    childrenByParent.set(item.parent_id, siblings);
  }

  const descendants: number[] = [];
  const stack = [...(childrenByParent.get(rootItemId) ?? [])];

  while (stack.length > 0) {
    const child = stack.pop();
    if (!child) {
      continue;
    }
    descendants.push(child.id);
    stack.push(...(childrenByParent.get(child.id) ?? []));
  }

  return descendants;
}



export function resolveUniqueSiblingName(
  items: CoakItem[],
  parentId: number | null,
  baseName: string,
): string {
  const siblingNames = new Set(
    items
      .filter((item) => item.parent_id === parentId)
      .map((item) => item.name.trim().toLowerCase()),
  );

  const normalizedBase = baseName.trim();
  if (!siblingNames.has(normalizedBase.toLowerCase())) {
    return normalizedBase;
  }

  let index = 2;
  while (siblingNames.has(`${normalizedBase} ${index}`.toLowerCase())) {
    index += 1;
  }

  return `${normalizedBase} ${index}`;
}
