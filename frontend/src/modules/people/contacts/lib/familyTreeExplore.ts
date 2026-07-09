// stack_sandbox/frontend_web/src/modules/contacts/lib/familyTreeExplore.ts

// Explore-mode expansion helpers for the family tree.

import {
  type Contact,
  type ContactRelationship,
  type FamilyTree,
  type FamilyTreeEdge,
  type FamilyTreeNode,
} from "../api";

export const EXPLORE_SPOUSE_ANIM_MS = 420;
export const EXPLORE_CHILD_LINE_ANIM_MS = 380;
export const EXPLORE_CHILD_CARD_ANIM_MS = 220;
export const EXPLORE_CHILD_GAP_MS = 120;

export type ExploreRelatives = {
  spouseId: number | null;
  childIds: number[];
  edges: FamilyTreeEdge[];
};

export type ExploreAnimationStep =
  | { kind: "spouse" }
  | { kind: "child-line"; childIndex: number }
  | { kind: "child-card"; childIndex: number }
  | { kind: "idle" };

export type ExploreAnimation = {
  anchorContactId: number;
  spouseId: number | null;
  childIds: number[];
  step: ExploreAnimationStep;
  /** Contact ids that were already visible before this reveal sequence. */
  baselineVisibleIds: Set<number>;
};

export function familyTreeFromNodesAndEdges(
  baseTree: FamilyTree,
  nodes: FamilyTreeNode[],
  edges: FamilyTreeEdge[],
): FamilyTree {
  return {
    ...baseTree,
    nodes,
    edges,
  };
}

export function visibleContactIds(tree: FamilyTree): Set<number> {
  return new Set(tree.nodes.map((node) => node.contact.id));
}

export function getUnrevealedRelatives(
  relationships: ContactRelationship[],
  contactId: number,
  visibleIds: Set<number>,
): ExploreRelatives {
  let spouseId: number | null = null;
  let coParentId: number | null = null;
  const childIdSet = new Set<number>();
  const edges: FamilyTreeEdge[] = [];
  const edgeIds = new Set<number>();

  function addEdge(relationship: ContactRelationship) {
    if (edgeIds.has(relationship.id)) {
      return;
    }
    edgeIds.add(relationship.id);
    edges.push({
      id: relationship.id,
      from_contact_id: relationship.from_contact_id,
      to_contact_id: relationship.to_contact_id,
      relationship_type: relationship.relationship_type,
    });
  }

  for (const relationship of relationships) {
    if (relationship.relationship_type === "spouse") {
      if (relationship.from_contact_id !== contactId && relationship.to_contact_id !== contactId) {
        continue;
      }
      const otherId =
        relationship.from_contact_id === contactId
          ? relationship.to_contact_id
          : relationship.from_contact_id;
      coParentId = otherId;
      if (!visibleIds.has(otherId)) {
        spouseId = otherId;
        addEdge(relationship);
      }
    }

    if (
      relationship.relationship_type === "parent" &&
      relationship.from_contact_id === contactId &&
      !visibleIds.has(relationship.to_contact_id)
    ) {
      childIdSet.add(relationship.to_contact_id);
    }
  }

  for (const relationship of relationships) {
    if (
      relationship.relationship_type !== "parent" ||
      !childIdSet.has(relationship.to_contact_id)
    ) {
      continue;
    }

    if (
      relationship.from_contact_id === contactId ||
      (coParentId !== null && relationship.from_contact_id === coParentId)
    ) {
      addEdge(relationship);
    }
  }

  const childIds = [...childIdSet];
  childIds.sort((left, right) => left - right);
  return { spouseId, childIds, edges };
}

export function appendExploreContacts(
  tree: FamilyTree,
  newContacts: Contact[],
  anchorContactId: number,
  spouseId: number | null,
  childIds: number[],
  newEdges: FamilyTreeEdge[],
): FamilyTree {
  const nodeById = new Map(tree.nodes.map((node) => [node.contact.id, node]));
  const anchorDepth = nodeById.get(anchorContactId)?.depth ?? 0;
  const edgeKeys = new Set(
    tree.edges.map(
      (edge) =>
        `${edge.from_contact_id}-${edge.to_contact_id}-${edge.relationship_type}`,
    ),
  );

  for (const contact of newContacts) {
    if (nodeById.has(contact.id)) {
      continue;
    }
    const depth =
      contact.id === spouseId
        ? anchorDepth
        : childIds.includes(contact.id)
          ? anchorDepth + 1
          : anchorDepth + 1;
    nodeById.set(contact.id, { contact, depth });
  }

  const mergedEdges = [...tree.edges];
  for (const edge of newEdges) {
    const key = `${edge.from_contact_id}-${edge.to_contact_id}-${edge.relationship_type}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      mergedEdges.push(edge);
    }
  }

  return familyTreeFromNodesAndEdges(
    tree,
    [...nodeById.values()].sort(
      (left, right) =>
        left.depth - right.depth ||
        (left.contact.last_name ?? "").localeCompare(right.contact.last_name ?? "") ||
        (left.contact.first_name ?? "").localeCompare(right.contact.first_name ?? ""),
    ),
    mergedEdges,
  );
}

function childProgress(animation: ExploreAnimation): number {
  if (animation.step.kind === "child-line" || animation.step.kind === "child-card") {
    return animation.step.childIndex;
  }
  if (animation.step.kind === "idle") {
    return animation.childIds.length;
  }
  return -1;
}

export function shouldShowContactCard(
  contactId: number,
  animation: ExploreAnimation | null,
  revealedIds: Set<number>,
): boolean {
  if (revealedIds.has(contactId)) {
    return true;
  }
  if (!animation) {
    return false;
  }

  if (contactId === animation.spouseId) {
    return animation.step.kind !== "idle";
  }

  const childIndex = animation.childIds.indexOf(contactId);
  if (childIndex === -1) {
    return false;
  }

  if (animation.step.kind === "idle") {
    return true;
  }
  if (animation.step.kind === "spouse") {
    return false;
  }
  if (animation.step.kind === "child-line") {
    return childIndex < animation.step.childIndex;
  }
  if (animation.step.kind === "child-card") {
    return childIndex <= animation.step.childIndex;
  }

  return false;
}

export function isSpouseSliding(
  contactId: number,
  animation: ExploreAnimation | null,
): boolean {
  return Boolean(
    animation &&
      animation.spouseId === contactId &&
      animation.step.kind === "spouse",
  );
}

export function spouseSlideOffset(
  contactId: number,
  animation: ExploreAnimation | null,
  anchorX: number,
  finalX: number,
): number {
  if (!isSpouseSliding(contactId, animation)) {
    return 0;
  }
  return anchorX - finalX;
}

export function shouldAnimateConnector(
  connectorId: string,
  animation: ExploreAnimation | null,
  revealedIds: Set<number>,
): boolean {
  if (!animation || animation.step.kind === "idle") {
    return false;
  }

  const childMatch = connectorId.match(/^child-drop-(\d+)$/);
  if (childMatch) {
    const childId = Number(childMatch[1]);
    if (revealedIds.has(childId) || animation.baselineVisibleIds.has(childId)) {
      return false;
    }
    const childIndex = animation.childIds.indexOf(childId);
    return (
      childIndex !== -1 &&
      animation.step.kind === "child-line" &&
      animation.step.childIndex === childIndex
    );
  }

  if (connectorId.startsWith("spouse-") && animation.spouseId !== null) {
    if (animation.baselineVisibleIds.has(animation.spouseId)) {
      return false;
    }
    return animation.step.kind === "spouse";
  }

  if (connectorId.startsWith("cluster-bus-")) {
    const hasNewChildren = animation.childIds.some(
      (childId) => !animation.baselineVisibleIds.has(childId),
    );
    if (!hasNewChildren) {
      return false;
    }
    return (
      animation.step.kind === "child-line" &&
      animation.step.childIndex === 0
    );
  }

  return false;
}

export function shouldShowConnector(
  connectorId: string,
  animation: ExploreAnimation | null,
  revealedIds: Set<number>,
): boolean {
  const childMatch = connectorId.match(/^child-drop-(\d+)$/);
  if (childMatch) {
    const childId = Number(childMatch[1]);
    if (revealedIds.has(childId) || (animation?.baselineVisibleIds.has(childId) ?? false)) {
      return true;
    }
    if (!animation || animation.step.kind === "idle") {
      return revealedIds.has(childId);
    }
    const childIndex = animation.childIds.indexOf(childId);
    if (childIndex === -1) {
      return false;
    }
    if (animation.step.kind === "spouse") {
      return false;
    }
    return childIndex <= childProgress(animation);
  }

  if (connectorId.startsWith("spouse-")) {
    if (!animation?.spouseId) {
      return true;
    }
    if (
      animation.baselineVisibleIds.has(animation.spouseId) ||
      revealedIds.has(animation.spouseId)
    ) {
      return true;
    }
    return animation.step.kind !== "idle";
  }

  if (connectorId.startsWith("cluster-bus-")) {
    const newChildIds =
      animation?.childIds.filter((id) => !animation.baselineVisibleIds.has(id)) ?? [];
    if (newChildIds.length === 0) {
      return true;
    }
    if (!animation || animation.step.kind === "idle") {
      return true;
    }
    if (animation.step.kind === "spouse") {
      return false;
    }
    return childProgress(animation) >= 0;
  }

  return true;
}

export async function runExploreAnimationSequence(
  animation: ExploreAnimation,
  onStep: (step: ExploreAnimationStep) => void,
): Promise<void> {
  if (animation.spouseId !== null) {
    onStep({ kind: "spouse" });
    await delay(EXPLORE_SPOUSE_ANIM_MS);
  }

  for (let childIndex = 0; childIndex < animation.childIds.length; childIndex += 1) {
    onStep({ kind: "child-line", childIndex });
    await delay(EXPLORE_CHILD_LINE_ANIM_MS);
    onStep({ kind: "child-card", childIndex });
    await delay(EXPLORE_CHILD_CARD_ANIM_MS + EXPLORE_CHILD_GAP_MS);
  }

  onStep({ kind: "idle" });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
