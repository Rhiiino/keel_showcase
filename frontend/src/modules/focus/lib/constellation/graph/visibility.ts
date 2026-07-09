// keel_web/src/modules/focus/lib/constellation/graph/visibility.ts

import { entryNodeId, positionKeyForNode } from "./ids";
import { standaloneRootLists } from "./indexes";
import type { ConstellationPoint } from "../layout";
import {
  buildEntryGraphNode,
  buildListGraphNode,
  findEntryById,
  getChildEntries,
  nodeHasExpandableChildren,
} from "./nodes";
import type {
  ConstellationGraphIndexes,
  ConstellationGraphNode,
  ConstellationEdge,
  ConstellationLayoutNode,
} from "./types";

export function buildVisibleGraph(
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): {
  nodesById: Map<string, ConstellationGraphNode>;
  edges: ConstellationEdge[];
} {
  const nodesById = new Map<string, ConstellationGraphNode>();
  const edges: ConstellationEdge[] = [];

  if (!indexes.originList) {
    return { nodesById, edges };
  }

  const originNode = buildListGraphNode(indexes.originList, true);
  nodesById.set(originNode.id, originNode);
  const rootNodes = standaloneRootLists(indexes).map((list) =>
    buildListGraphNode(list, false),
  );
  for (const rootNode of rootNodes) {
    nodesById.set(rootNode.id, rootNode);
  }

  const queue: Array<{ node: ConstellationGraphNode; depth: number }> = [
    { node: originNode, depth: 0 },
    ...rootNodes.map((node) => ({ node, depth: 0 })),
  ];
  const visited = new Set<string>([originNode.id, ...rootNodes.map((node) => node.id)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || !expandedIds.has(current.node.id)) {
      continue;
    }

    const children = getChildEntries(current.node, indexes);
    children.forEach((entry, index) => {
      const childNode = buildEntryGraphNode(entry);
      if (!visited.has(childNode.id)) {
        visited.add(childNode.id);
        nodesById.set(childNode.id, childNode);
        queue.push({ node: childNode, depth: current.depth + 1 });
      }

      edges.push({
        id: `${current.node.id}->${childNode.id}:${index}`,
        source: current.node.id,
        target: childNode.id,
      });
    });
  }

  return { nodesById, edges };
}

export function resolveGraphNodeById(
  nodeId: string,
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): ConstellationGraphNode | null {
  const { nodesById } = buildVisibleGraph(indexes, expandedIds);
  const visible = nodesById.get(nodeId);
  if (visible) {
    return visible;
  }

  if (nodeId.startsWith("list:")) {
    const listId = Number(nodeId.slice("list:".length));
    const list = indexes.listsById.get(listId);
    if (!list) {
      return null;
    }
    return buildListGraphNode(list, list.is_origin);
  }

  if (nodeId.startsWith("entry:")) {
    const entryId = Number(nodeId.slice("entry:".length));
    const entry = findEntryById(indexes, entryId);
    return entry ? buildEntryGraphNode(entry) : null;
  }

  return null;
}

export function canExpandNodeById(
  nodeId: string,
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): boolean {
  const node = resolveGraphNodeById(nodeId, indexes, expandedIds);
  return node ? nodeHasExpandableChildren(node, indexes) : false;
}

export function resolveGraphNodeByIndexes(
  nodeId: string,
  indexes: ConstellationGraphIndexes,
): ConstellationGraphNode | null {
  if (nodeId.startsWith("list:")) {
    const listId = Number(nodeId.slice("list:".length));
    const list = indexes.listsById.get(listId);
    if (!list) {
      return null;
    }
    return buildListGraphNode(list, list.is_origin);
  }

  if (nodeId.startsWith("entry:")) {
    const entryId = Number(nodeId.slice("entry:".length));
    const entry = findEntryById(indexes, entryId);
    return entry ? buildEntryGraphNode(entry) : null;
  }

  return null;
}

export function collectGraphDescendantNodeIds(
  rootId: string,
  indexes: ConstellationGraphIndexes,
): string[] {
  const rootNode = resolveGraphNodeByIndexes(rootId, indexes);
  if (!rootNode) {
    return [];
  }

  const descendants: string[] = [];
  const queue = getChildEntries(rootNode, indexes).map((entry) => entryNodeId(entry.id));

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    descendants.push(currentId);
    const currentNode = resolveGraphNodeByIndexes(currentId, indexes);
    if (!currentNode) {
      continue;
    }
    for (const entry of getChildEntries(currentNode, indexes)) {
      queue.push(entryNodeId(entry.id));
    }
  }

  return descendants;
}

export function resolveConstellationNodePosition(
  nodeId: string,
  indexes: ConstellationGraphIndexes,
  storedPositions: ReadonlyMap<string, ConstellationPoint>,
  livePositions: ReadonlyMap<string, ConstellationPoint>,
): ConstellationPoint | null {
  const live = livePositions.get(nodeId);
  if (live) {
    return live;
  }

  const graphNode = resolveGraphNodeByIndexes(nodeId, indexes);
  if (!graphNode) {
    return null;
  }

  return storedPositions.get(positionKeyForNode(graphNode)) ?? null;
}

export function collectDescendantNodeIds(
  rootId: string,
  nodes: ReadonlyArray<{ id: string; data: { parentId: string | null } }>,
): string[] {
  const childrenByParent = new Map<string, string[]>();

  for (const node of nodes) {
    if (!node.data.parentId) {
      continue;
    }
    const siblings = childrenByParent.get(node.data.parentId) ?? [];
    siblings.push(node.id);
    childrenByParent.set(node.data.parentId, siblings);
  }

  const descendants: string[] = [];
  const queue = [...(childrenByParent.get(rootId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    descendants.push(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return descendants;
}

export function collectDescendantExpandedIds(
  rootId: string,
  expandedIds: ReadonlySet<string>,
  indexes: ConstellationGraphIndexes,
  nodesById: Map<string, ConstellationGraphNode>,
): string[] {
  const descendants: string[] = [];
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || !expandedIds.has(currentId)) {
      continue;
    }

    const node = nodesById.get(currentId);
    if (!node) {
      continue;
    }

    for (const entry of getChildEntries(node, indexes)) {
      const childId = entryNodeId(entry.id);
      if (expandedIds.has(childId)) {
        descendants.push(childId);
        queue.push(childId);
      }
    }
  }

  return descendants;
}

export function constellationEdgePairKey(source: string, target: string): string {
  return `${source}->${target}`;
}

export function collectConstellationPathFromOrigin(
  targetNodeId: string,
  layoutNodes: ReadonlyArray<
    Pick<ConstellationLayoutNode, "id" | "parentId" | "isOrigin">
  >,
): {
  nodeIds: ReadonlySet<string>;
  edgePairs: ReadonlySet<string>;
  orderedNodeIds: readonly string[];
  orderedEdgePairs: readonly string[];
} {
  const layoutById = new Map(layoutNodes.map((node) => [node.id, node]));
  const pathNodeIds: string[] = [];
  const edgePairs: string[] = [];

  let current = layoutById.get(targetNodeId) ?? null;
  while (current) {
    pathNodeIds.unshift(current.id);
    if (!current.parentId) {
      break;
    }
    edgePairs.unshift(constellationEdgePairKey(current.parentId, current.id));
    current = layoutById.get(current.parentId) ?? null;
  }

  const includesOrigin = pathNodeIds.some(
    (nodeId) => layoutById.get(nodeId)?.isOrigin,
  );
  if (!includesOrigin) {
    return {
      nodeIds: new Set(),
      edgePairs: new Set(),
      orderedNodeIds: [],
      orderedEdgePairs: [],
    };
  }

  return {
    nodeIds: new Set(pathNodeIds),
    edgePairs: new Set(edgePairs),
    orderedNodeIds: pathNodeIds,
    orderedEdgePairs: edgePairs,
  };
}


export function collectLineageExpansionLevels(
  rootId: string,
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): string[][] {
  const levels: string[][] = [];
  const simulated = new Set(expandedIds);
  let frontier = [rootId];
  const visited = new Set<string>();

  while (frontier.length > 0) {
    const toExpand: string[] = [];

    for (const id of frontier) {
      if (visited.has(id)) {
        continue;
      }
      visited.add(id);

      if (canExpandNodeById(id, indexes, simulated) && !simulated.has(id)) {
        toExpand.push(id);
        simulated.add(id);
      }
    }

    if (toExpand.length > 0) {
      levels.push(toExpand);
    }

    const nextFrontier: string[] = [];
    for (const id of frontier) {
      if (!simulated.has(id)) {
        continue;
      }
      const node = resolveGraphNodeById(id, indexes, simulated);
      if (!node) {
        continue;
      }
      for (const entry of getChildEntries(node, indexes)) {
        const childId = entryNodeId(entry.id);
        if (!visited.has(childId)) {
          nextFrontier.push(childId);
        }
      }
    }

    frontier = nextFrontier;
  }

  return levels;
}



// ----- Scoped constellation view
export function isScopedConstellationContainerGraphNode(
  node: ConstellationGraphNode,
): boolean {
  if (node.isOrigin) {
    return false;
  }
  if (node.kind === "list") {
    return true;
  }
  return (
    node.kind === "entry" &&
    (node.entryKind === "record" || node.entryKind === "list_link")
  );
}

export function buildScopedVisibleGraph(
  scopeRootId: string,
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): {
  nodesById: Map<string, ConstellationGraphNode>;
  edges: ConstellationEdge[];
} | null {
  const scopeRoot = resolveGraphNodeByIndexes(scopeRootId, indexes);
  if (!scopeRoot || !isScopedConstellationContainerGraphNode(scopeRoot)) {
    return null;
  }

  const nodesById = new Map<string, ConstellationGraphNode>();
  const edges: ConstellationEdge[] = [];
  nodesById.set(scopeRoot.id, scopeRoot);

  const queue: ConstellationGraphNode[] = [scopeRoot];
  const visited = new Set<string>([scopeRoot.id]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || !expandedIds.has(current.id)) {
      continue;
    }

    const children = getChildEntries(current, indexes);
    children.forEach((entry, index) => {
      const childNode = buildEntryGraphNode(entry);
      if (!visited.has(childNode.id)) {
        visited.add(childNode.id);
        nodesById.set(childNode.id, childNode);
        queue.push(childNode);
      }

      edges.push({
        id: `${current.id}->${childNode.id}:${index}`,
        source: current.id,
        target: childNode.id,
      });
    });
  }

  return { nodesById, edges };
}

export function collectScopedVisibleNodeIds(
  scopeRootId: string,
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): ReadonlySet<string> | null {
  const scoped = buildScopedVisibleGraph(scopeRootId, indexes, expandedIds);
  if (!scoped) {
    return null;
  }
  return new Set(scoped.nodesById.keys());
}

export function filterLayoutNodesToScope(
  layoutNodes: ReadonlyArray<ConstellationLayoutNode>,
  scopedNodeIds: ReadonlySet<string>,
): ConstellationLayoutNode[] {
  return layoutNodes.filter((node) => scopedNodeIds.has(node.id));
}
