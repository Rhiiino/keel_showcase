// keel_web/src/modules/contacts/lib/familyTreeLineage.ts

// Lineage-only family tree filtering and family-group selection.

import {
  fetchContact,
  fetchContactRelationships,
  type ContactRelationship,
  type FamilyGroup,
  type FamilyTree,
} from "../api";



export function contactIsParentInFamily(
  contactId: number,
  group: FamilyGroup,
): boolean {
  return group.father_contact_id === contactId || group.mother_contact_id === contactId;
}



function collectParentIds(
  relationships: ContactRelationship[],
  contactId: number,
): number[] {
  return relationships
    .filter(
      (relationship) =>
        relationship.relationship_type === "parent"
        && relationship.to_contact_id === contactId,
    )
    .map((relationship) => relationship.from_contact_id);
}



export async function resolveLineageFamilyKeys(
  focusContactId: number,
  allGroups: FamilyGroup[],
): Promise<string[]> {
  const groupsById = new Map(allGroups.map((group) => [group.id, group]));
  const familyKeys = new Set<string>();
  const visited = new Set<number>();
  const queue = [focusContactId];

  while (queue.length > 0) {
    const contactId = queue.shift()!;
    if (visited.has(contactId)) {
      continue;
    }
    visited.add(contactId);

    const [contact, relationships] = await Promise.all([
      fetchContact(contactId),
      fetchContactRelationships(contactId),
    ]);

    for (const groupSummary of contact.family_groups) {
      const group = groupsById.get(groupSummary.id);
      if (
        contactId === focusContactId
        && group
        && contactIsParentInFamily(focusContactId, group)
      ) {
        continue;
      }
      familyKeys.add(groupSummary.id);
    }

    for (const parentId of collectParentIds(relationships, contactId)) {
      queue.push(parentId);
    }
  }

  return [...familyKeys];
}



export function filterFamilyTreeToLineage(
  tree: FamilyTree,
  focusContactId: number,
): FamilyTree {
  const contactIds = new Set(tree.nodes.map((node) => node.contact.id));
  if (!contactIds.has(focusContactId)) {
    return tree;
  }

  const parentEdges = tree.edges.filter((edge) => edge.relationship_type === "parent");
  const spouseEdges = tree.edges.filter((edge) => edge.relationship_type === "spouse");

  const parentsByChild = new Map<number, number[]>();
  const childrenByParent = new Map<number, number[]>();
  for (const edge of parentEdges) {
    const parents = parentsByChild.get(edge.to_contact_id) ?? [];
    parents.push(edge.from_contact_id);
    parentsByChild.set(edge.to_contact_id, parents);

    const children = childrenByParent.get(edge.from_contact_id) ?? [];
    children.push(edge.to_contact_id);
    childrenByParent.set(edge.from_contact_id, children);
  }

  const ancestorIds = new Set<number>();
  const ancestorQueue = [...(parentsByChild.get(focusContactId) ?? [])];
  while (ancestorQueue.length > 0) {
    const contactId = ancestorQueue.shift()!;
    if (ancestorIds.has(contactId)) {
      continue;
    }
    ancestorIds.add(contactId);
    for (const parentId of parentsByChild.get(contactId) ?? []) {
      if (!ancestorIds.has(parentId)) {
        ancestorQueue.push(parentId);
      }
    }
  }

  const descendantIds = new Set<number>();
  const descendantQueue = [...(childrenByParent.get(focusContactId) ?? [])];
  while (descendantQueue.length > 0) {
    const contactId = descendantQueue.shift()!;
    if (descendantIds.has(contactId)) {
      continue;
    }
    descendantIds.add(contactId);
    for (const childId of childrenByParent.get(contactId) ?? []) {
      if (!descendantIds.has(childId)) {
        descendantQueue.push(childId);
      }
    }
  }

  const keepIds = new Set<number>([focusContactId, ...ancestorIds]);

  for (const edge of spouseEdges) {
    if (keepIds.has(edge.from_contact_id)) {
      keepIds.add(edge.to_contact_id);
    }
    if (keepIds.has(edge.to_contact_id)) {
      keepIds.add(edge.from_contact_id);
    }
  }

  for (const parentId of parentsByChild.get(focusContactId) ?? []) {
    for (const siblingId of childrenByParent.get(parentId) ?? []) {
      if (siblingId !== focusContactId && !descendantIds.has(siblingId)) {
        keepIds.add(siblingId);
      }
    }
  }

  for (const descendantId of descendantIds) {
    keepIds.delete(descendantId);
  }

  const filteredNodes = tree.nodes.filter((node) => keepIds.has(node.contact.id));
  const filteredEdges = tree.edges.filter(
    (edge) => keepIds.has(edge.from_contact_id) && keepIds.has(edge.to_contact_id),
  );

  if (filteredNodes.length === tree.nodes.length) {
    return tree;
  }

  return {
    ...tree,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}
