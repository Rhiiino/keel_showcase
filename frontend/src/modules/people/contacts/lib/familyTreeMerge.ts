// stack_sandbox/frontend_web/src/modules/contacts/lib/familyTreeMerge.ts

// Merge selected family group trees into connected subgraphs.

import {
  formatContactName,
  type FamilyTree,
  type FamilyTreeEdge,
} from "../api";

function edgeKey(edge: FamilyTreeEdge): string {
  return `${edge.from_contact_id}-${edge.to_contact_id}-${edge.relationship_type}`;
}

function findRootContact(memberIds: Set<number>, edges: FamilyTreeEdge[]): number {
  const children = new Set(
    edges
      .filter((edge) => edge.relationship_type === "parent")
      .map((edge) => edge.to_contact_id),
  );
  const roots = [...memberIds].filter((id) => !children.has(id));
  return roots.length > 0 ? Math.min(...roots) : Math.min(...memberIds);
}

function buildDepthMap(
  memberIds: Set<number>,
  edges: FamilyTreeEdge[],
  rootContactId?: number | null,
): Map<number, number> {
  const weighted = new Map<number, Array<[number, number]>>();
  for (const id of memberIds) {
    weighted.set(id, []);
  }

  for (const edge of edges) {
    const fromId = edge.from_contact_id;
    const toId = edge.to_contact_id;
    if (!memberIds.has(fromId) || !memberIds.has(toId)) {
      continue;
    }

    if (edge.relationship_type === "parent") {
      weighted.get(fromId)!.push([toId, 1]);
      weighted.get(toId)!.push([fromId, -1]);
    } else if (edge.relationship_type === "spouse" || edge.relationship_type === "sibling") {
      weighted.get(fromId)!.push([toId, 0]);
      weighted.get(toId)!.push([fromId, 0]);
    }
  }

  const start =
    rootContactId !== undefined &&
    rootContactId !== null &&
    memberIds.has(rootContactId)
      ? rootContactId
      : findRootContact(memberIds, edges);

  const depths = new Map<number, number>();
  depths.set(start, 0);
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current)!;
    for (const [neighbor, delta] of weighted.get(current) ?? []) {
      if (depths.has(neighbor)) {
        continue;
      }
      depths.set(neighbor, currentDepth + delta);
      queue.push(neighbor);
    }
  }

  for (const id of memberIds) {
    depths.set(id, depths.get(id) ?? 0);
  }

  const minDepth = Math.min(...depths.values());
  if (minDepth < 0) {
    for (const [id, depth] of depths) {
      depths.set(id, depth - minDepth);
    }
  }

  return depths;
}

function findConnectedComponents(
  contactIds: number[],
  edges: FamilyTreeEdge[],
): number[][] {
  const parent = new Map<number, number>();
  for (const id of contactIds) {
    parent.set(id, id);
  }

  function find(id: number): number {
    const currentParent = parent.get(id)!;
    if (currentParent !== id) {
      parent.set(id, find(currentParent));
    }
    return parent.get(id)!;
  }

  function union(leftId: number, rightId: number) {
    const leftRoot = find(leftId);
    const rightRoot = find(rightId);
    if (leftRoot !== rightRoot) {
      parent.set(rightRoot, leftRoot);
    }
  }

  for (const edge of edges) {
    union(edge.from_contact_id, edge.to_contact_id);
  }

  const buckets = new Map<number, number[]>();
  for (const id of contactIds) {
    const root = find(id);
    const bucket = buckets.get(root) ?? [];
    bucket.push(id);
    buckets.set(root, bucket);
  }

  return [...buckets.values()].map((ids) => ids.sort((left, right) => left - right));
}

export function mergeFamilyTrees(trees: FamilyTree[]): FamilyTree[] {
  if (trees.length === 0) {
    return [];
  }

  const contactsById = new Map(trees.flatMap((tree) => tree.nodes.map((node) => [node.contact.id, node.contact] as const)));
  const edgesByKey = new Map<string, FamilyTreeEdge>();

  for (const tree of trees) {
    for (const edge of tree.edges) {
      const key = edgeKey(edge);
      if (!edgesByKey.has(key)) {
        edgesByKey.set(key, edge);
      }
    }
  }

  const contactIds = [...contactsById.keys()];
  const edges = [...edgesByKey.values()];
  const components = findConnectedComponents(contactIds, edges);

  return components.map((componentIds, index) => {
    const componentIdSet = new Set(componentIds);
    const componentEdges = edges.filter(
      (edge) =>
        componentIdSet.has(edge.from_contact_id) && componentIdSet.has(edge.to_contact_id),
    );
    const depths = buildDepthMap(componentIdSet, componentEdges);
    const nodes = componentIds
      .map((id) => ({
        contact: contactsById.get(id)!,
        depth: depths.get(id) ?? 0,
      }))
      .sort(
        (left, right) =>
          left.depth - right.depth ||
          formatContactName(left.contact).localeCompare(formatContactName(right.contact)),
      );

    return {
      group_id: `merged-${index + 1}`,
      root_contact_id: findRootContact(componentIdSet, componentEdges),
      nodes,
      edges: componentEdges,
    };
  });
}
