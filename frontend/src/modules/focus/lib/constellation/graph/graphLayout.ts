// keel_web/src/modules/focus/lib/constellation/graph/graphLayout.ts

import {
  FOCUS_CONSTELLATION_COLLAPSED_CHILD_RADIUS,
  FOCUS_CONSTELLATION_EXPANDED_CHILD_RADIUS,
  FOCUS_CONSTELLATION_MIN_NODE_DISTANCE,
  FOCUS_CONSTELLATION_NESTED_COLLAPSED_RADIUS,
  FOCUS_CONSTELLATION_NESTED_EXPANDED_RADIUS,
  FOCUS_CONSTELLATION_ORIGIN_CLEARANCE,
  angleBetween,
  arcPosition,
  ringPosition,
  type ConstellationPoint,
} from "../layout";
import { entryNodeId, listNodeId, positionKeyForNode } from "./ids";
import { getChildEntries, nodeHasExpandableChildren } from "./nodes";
import { chooseEdgeAwareChildPosition, collectPlacedEdgeSegments } from "./edgePlacement";
import { buildVisibleGraph } from "./visibility";
import { chooseOutwardAngle } from "./outwardPlacement";
import type {
  ConstellationGraphIndexes,
  ConstellationGraphNode,
  ConstellationLayoutNode,
} from "./types";

const STANDALONE_ROOT_RADIUS = 360;

export function layoutConstellationNodesBase(
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
): ConstellationLayoutNode[] {
  const { nodesById } = buildVisibleGraph(indexes, expandedIds);
  if (!indexes.originList) {
    return [];
  }

  const layoutById = new Map<string, ConstellationLayoutNode>();
  const originNode = nodesById.get(listNodeId(indexes.originList.id));
  if (!originNode) {
    return [];
  }

  layoutById.set(originNode.id, {
    ...originNode,
    position: { x: 0, y: 0 },
    collapsedPosition: null,
    parentId: null,
    depth: 0,
  });

  const standaloneRoots = [...nodesById.values()].filter((node) => {
    return node.kind === "list" && !node.isOrigin;
  });
  standaloneRoots.forEach((node, index) => {
    layoutById.set(node.id, {
      ...node,
      position: ringPosition(
        { x: 0, y: 0 },
        index + 1,
        standaloneRoots.length + 1,
        STANDALONE_ROOT_RADIUS,
      ),
      collapsedPosition: null,
      parentId: null,
      depth: 0,
    });
  });

  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: originNode.id, depth: 0 },
    ...standaloneRoots.map((node) => ({ nodeId: node.id, depth: 0 })),
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || !expandedIds.has(current.nodeId)) {
      continue;
    }

    const parentLayout = layoutById.get(current.nodeId);
    const parentNode = nodesById.get(current.nodeId);
    if (!parentLayout || !parentNode) {
      continue;
    }

    const children = getChildEntries(parentNode, indexes);
    const isOriginChild = current.depth === 0;
    const collapsedRadius = isOriginChild
      ? FOCUS_CONSTELLATION_COLLAPSED_CHILD_RADIUS
      : FOCUS_CONSTELLATION_NESTED_COLLAPSED_RADIUS;
    const expandedRadius = isOriginChild
      ? FOCUS_CONSTELLATION_EXPANDED_CHILD_RADIUS
      : FOCUS_CONSTELLATION_NESTED_EXPANDED_RADIUS;

    children.forEach((entry, index) => {
      const childId = entryNodeId(entry.id);
      const childNode = nodesById.get(childId);
      if (!childNode || layoutById.has(childId)) {
        return;
      }

      const childCanExpand = nodeHasExpandableChildren(childNode, indexes);
      const childIsExpanded = expandedIds.has(childId);
      const grandparent = parentLayout.parentId
        ? layoutById.get(parentLayout.parentId) ?? null
        : null;
      const inheritedFanAwayAngle = grandparent
        ? angleBetween(grandparent.position, parentLayout.position)
        : null;
      const outwardAngle = childCanExpand && !parentLayout.isOrigin
        ? chooseOutwardAngle(
            parentLayout,
            grandparent,
            layoutById.values(),
            childIsExpanded ? expandedRadius : collapsedRadius,
          )
        : null;
      const fanAwayAngle = outwardAngle ?? inheritedFanAwayAngle;
      const restingPosition = outwardAngle !== null
        ? {
            x: parentLayout.position.x + Math.cos(outwardAngle) * collapsedRadius,
            y: parentLayout.position.y + Math.sin(outwardAngle) * collapsedRadius,
          }
        : fanAwayAngle === null
        ? ringPosition(
            parentLayout.position,
            index,
            children.length,
            collapsedRadius,
          )
        : arcPosition(
            parentLayout.position,
            index,
            children.length,
            collapsedRadius,
            fanAwayAngle,
          );
      const pushedPosition = outwardAngle !== null
        ? {
            x: parentLayout.position.x + Math.cos(outwardAngle) * expandedRadius,
            y: parentLayout.position.y + Math.sin(outwardAngle) * expandedRadius,
          }
        : fanAwayAngle === null
        ? ringPosition(
            parentLayout.position,
            index,
            children.length,
            expandedRadius,
          )
        : arcPosition(
            parentLayout.position,
            index,
            children.length,
            expandedRadius,
            fanAwayAngle,
          );

      layoutById.set(childId, {
        ...childNode,
        position: childCanExpand && childIsExpanded ? pushedPosition : restingPosition,
        collapsedPosition: childCanExpand ? restingPosition : null,
        parentId: current.nodeId,
        depth: current.depth + 1,
      });

      if (expandedIds.has(childId)) {
        queue.push({ nodeId: childId, depth: current.depth + 1 });
      }
    });
  }

  return relaxConstellationLayout([...layoutById.values()]);
}

function relaxConstellationLayout(nodes: ConstellationLayoutNode[]): ConstellationLayoutNode[] {
  const positions = new Map<string, ConstellationPoint>(
    nodes.map((node) => [node.id, { ...node.position }]),
  );
  const origin = nodes.find((node) => node.isOrigin);

  for (let iteration = 0; iteration < 24; iteration += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      const aPosition = positions.get(a.id);
      if (!aPosition) {
        continue;
      }

      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const bPosition = positions.get(b.id);
        if (!bPosition) {
          continue;
        }

        const minDistance =
          a.isOrigin || b.isOrigin
            ? FOCUS_CONSTELLATION_ORIGIN_CLEARANCE
            : FOCUS_CONSTELLATION_MIN_NODE_DISTANCE;
        const rawDx = bPosition.x - aPosition.x;
        const rawDy = bPosition.y - aPosition.y;
        const rawDistance = Math.hypot(rawDx, rawDy);
        const fallbackAngle = ((i + j + 1) * Math.PI) / 4;
        const dx = rawDistance < 0.001 ? Math.cos(fallbackAngle) : rawDx;
        const dy = rawDistance < 0.001 ? Math.sin(fallbackAngle) : rawDy;
        const distance = Math.max(Math.hypot(dx, dy), 0.001);

        if (distance >= minDistance) {
          continue;
        }

        const push = (minDistance - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;

        if (!a.isOrigin) {
          aPosition.x -= ux * push;
          aPosition.y -= uy * push;
        }
        if (!b.isOrigin) {
          bPosition.x += ux * push;
          bPosition.y += uy * push;
        }
      }
    }

    if (origin) {
      positions.set(origin.id, { x: 0, y: 0 });
    }
  }

  return nodes.map((node) => {
    const position = positions.get(node.id) ?? node.position;
    const delta = {
      x: position.x - node.position.x,
      y: position.y - node.position.y,
    };

    return {
      ...node,
      position,
      collapsedPosition: node.collapsedPosition
        ? {
            x: node.collapsedPosition.x + delta.x,
            y: node.collapsedPosition.y + delta.y,
          }
        : null,
    };
  });
}

export function layoutConstellationNodes(
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
  dragOffsets: ReadonlyMap<string, ConstellationPoint>,
): ConstellationLayoutNode[] {
  return layoutConstellationNodesBase(indexes, expandedIds).map((node) => {
    const offset = dragOffsets.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    };
  });
}

// Sticky layout: a node keeps its stored position (keyed by positionKeyForNode)
// once it has one, and only brand-new nodes get an initial position derived from
// their parent's current position. Connect/disconnect never moves existing nodes.
export function layoutConstellationStable(
  indexes: ConstellationGraphIndexes,
  expandedIds: ReadonlySet<string>,
  storedPositions: ReadonlyMap<string, ConstellationPoint>,
): {
  nodes: ConstellationLayoutNode[];
  assigned: Map<string, ConstellationPoint>;
} {
  const assigned = new Map<string, ConstellationPoint>();
  const layoutById = new Map<string, ConstellationLayoutNode>();

  if (!indexes.originList) {
    return { nodes: [], assigned };
  }

  const { nodesById, edges } = buildVisibleGraph(indexes, expandedIds);
  const originNode = nodesById.get(listNodeId(indexes.originList.id));
  if (!originNode) {
    return { nodes: [], assigned };
  }

  const resolvePosition = (
    node: ConstellationGraphNode,
    fallback: ConstellationPoint,
  ): ConstellationPoint => {
    const key = positionKeyForNode(node);
    const stored = storedPositions.get(key) ?? assigned.get(key);
    if (stored) {
      return stored;
    }
    assigned.set(key, fallback);
    return fallback;
  };

  const place = (
    node: ConstellationGraphNode,
    fallback: ConstellationPoint,
    parentId: string | null,
    depth: number,
  ) => {
    const position = resolvePosition(node, fallback);
    layoutById.set(node.id, {
      ...node,
      position,
      collapsedPosition: null,
      parentId,
      depth,
    });
  };

  place(originNode, { x: 0, y: 0 }, null, 0);

  const rootNodes = [...nodesById.values()].filter(
    (node) => node.kind === "list" && !node.isOrigin,
  );
  rootNodes.forEach((root, index) => {
    place(
      root,
      ringPosition({ x: 0, y: 0 }, index + 1, rootNodes.length + 1, STANDALONE_ROOT_RADIUS),
      null,
      0,
    );
  });

  const queue: ConstellationGraphNode[] = [originNode, ...rootNodes];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const parent = queue.shift();
    if (!parent || visited.has(parent.id)) {
      continue;
    }
    visited.add(parent.id);
    if (!expandedIds.has(parent.id)) {
      continue;
    }

    const parentLayout = layoutById.get(parent.id);
    if (!parentLayout) {
      continue;
    }

    const childEntries = getChildEntries(parent, indexes);
    const radius =
      parentLayout.depth === 0
        ? FOCUS_CONSTELLATION_EXPANDED_CHILD_RADIUS
        : FOCUS_CONSTELLATION_NESTED_EXPANDED_RADIUS;

    const grandparent = parentLayout.parentId
      ? layoutById.get(parentLayout.parentId) ?? null
      : null;
    const edgeSegments = collectPlacedEdgeSegments(layoutById, edges);

    childEntries.forEach((entry, index) => {
      const childNode = nodesById.get(entryNodeId(entry.id));
      if (!childNode || layoutById.has(childNode.id)) {
        return;
      }

      const positionKey = positionKeyForNode(childNode);
      const hasStoredPosition =
        storedPositions.has(positionKey) || assigned.has(positionKey);
      const fallback = hasStoredPosition
        ? ringPosition(parentLayout.position, index, childEntries.length, radius)
        : chooseEdgeAwareChildPosition({
            parentLayout,
            grandparent,
            placedNodes: layoutById.values(),
            edgeSegments,
            childNodeId: childNode.id,
            radius,
            siblingIndex: index,
            siblingCount: childEntries.length,
          });

      place(childNode, fallback, parent.id, parentLayout.depth + 1);
      queue.push(childNode);
    });
  }

  return { nodes: [...layoutById.values()], assigned };
}
