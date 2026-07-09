// stack_sandbox/frontend_web/src/modules/contacts/components/FamilyTreeView.tsx

// Spouse-and-child family tree layout.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchContact,
  fetchContactRelationships,
  formatContactName,
  type Contact,
  type FamilyTree,
  type FamilyTreeEdge,
} from "../api";
import { formatBirthDate, formatContactBirthDate } from "../../shared/lib/birthDate";
import { formatContactAge } from "../lib/display";
import {
  appendExploreContacts,
  EXPLORE_CHILD_CARD_ANIM_MS,
  EXPLORE_CHILD_LINE_ANIM_MS,
  EXPLORE_SPOUSE_ANIM_MS,
  getUnrevealedRelatives,
  isSpouseSliding,
  runExploreAnimationSequence,
  shouldAnimateConnector,
  shouldShowConnector,
  shouldShowContactCard,
  spouseSlideOffset,
  type ExploreAnimation,
} from "../lib/familyTreeExplore";
import { AnimatedExploreLine, AnimatedExplorePath } from "./AnimatedExplorePath";
import { ContactAvatar } from "./ContactAvatar";
import { ContactFamilyGroupPills } from "./ContactFamilyGroupPills";

type FamilyTreeViewProps = {
  tree: FamilyTree;
  contactBackLink?: {
    to: string;
    label: string;
  };
  interactionMode?: InteractionMode;
  showModeSelector?: boolean;
  lineageFocusContactId?: number | null;
};

type TreeUnit = {
  id: string;
  contacts: Contact[];
  connectorContactIds: number[];
};

type ContactPosition = {
  contact: Contact;
  x: number;
  y: number;
};

type TreeLayout = {
  width: number;
  height: number;
  contacts: ContactPosition[];
  spouseConnectors: Array<{
    id: string;
    contactIds: [number, number];
    x1: number;
    x2: number;
    y: number;
    labelX: number;
  }>;
  childConnectors: Array<{
    id: string;
    d: string;
    parentIds: number[];
    stroke: string;
  }>;
};

type SiblingCluster = {
  parentKey: string;
  parentIds: number[];
  units: TreeUnit[];
  left: number;
  right: number;
  center: number;
};

type RelationshipDirection = "parent" | "child" | "spouse";

type RelationshipPathStep = {
  fromId: number;
  toId: number;
  direction: RelationshipDirection;
};

type RelationshipResult = {
  firstSummary: string;
  secondSummary: string;
  pathSummary: string;
} | null;

export type FamilyTreeInteractionMode = "view" | "path" | "relationship" | "explore";

type InteractionMode = FamilyTreeInteractionMode;

type FamilyTreeModeSelectProps = {
  value: InteractionMode;
  onChange: (mode: InteractionMode) => void;
};

export function FamilyTreeModeSelect({ value, onChange }: FamilyTreeModeSelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as InteractionMode)}
        className={[
          "appearance-none rounded-full border border-white/[0.12]",
          "bg-gradient-to-b from-stone-800 to-stone-950 py-2 pl-4 pr-11",
          "text-sm font-semibold text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          "transition hover:border-white/[0.2] hover:from-stone-700 hover:to-stone-900",
          "focus:outline-none focus:ring-2 focus:ring-app-accent/70",
        ].join(" ")}
        aria-label="Family tree interaction mode"
      >
        <option value="view">View mode</option>
        <option value="path">Path mode</option>
        <option value="relationship">Relationship mode</option>
        <option value="explore">Explore mode</option>
      </select>
      <span className="pointer-events-none absolute right-4 text-xs text-stone-400">▼</span>
    </div>
  );
}

const CARD_WIDTH = 96;
const CARD_HEIGHT = 112;
const SPOUSE_GAP = 80;
const UNIT_GAP = 28;
const CLUSTER_GAP = 72;
const ROW_GAP = 132;
const PADDING = 24;
const FAMILY_LINE_COLORS = [
  "rgba(163, 230, 53, 0.62)",
  "rgba(56, 189, 248, 0.62)",
  "rgba(251, 146, 60, 0.62)",
  "rgba(216, 180, 254, 0.62)",
  "rgba(244, 114, 182, 0.62)",
  "rgba(45, 212, 191, 0.62)",
];

function ContactHoverPreview({ contact }: { contact: Contact }) {
  const age = formatContactAge(contact);
  const genderLabel = contact.gender
    ? contact.gender.charAt(0).toUpperCase() + contact.gender.slice(1)
    : "Unknown";
  const hasNotes = contact.notes.trim().length > 0;

  return (
    <div
      className={[
        "pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-[70] w-80",
        "-translate-x-1/2 translate-y-2 rounded-3xl border border-white/[0.12]",
        "bg-stone-950/95 p-4 text-left opacity-0 shadow-2xl shadow-black/40",
        "ring-1 ring-black/30 backdrop-blur transition duration-150",
        "group-hover:translate-y-0 group-hover:opacity-100",
        "group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
      ].join(" ")}
      role="dialog"
      aria-label={`${formatContactName(contact)} preview`}
    >
      <div className="flex items-start gap-3">
        <ContactAvatar contact={contact} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-stone-50">
            {formatContactName(contact)}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
            {genderLabel}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="uppercase tracking-wide text-stone-600">Born</dt>
          <dd className="mt-1 text-stone-200">{formatContactBirthDate(contact)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-stone-600">Age</dt>
          <dd className="mt-1 text-stone-200">{age?.label ?? "—"}</dd>
        </div>
        {contact.death_date && (
          <div className="col-span-2">
            <dt className="uppercase tracking-wide text-stone-600">Died</dt>
            <dd className="mt-1 text-stone-200">{formatBirthDate(contact.death_date)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-stone-600">Family groups</p>
        <ContactFamilyGroupPills
          groups={contact.family_groups}
          emptyLabel="No family groups"
          className="mt-2"
        />
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-stone-600">Notes</p>
        <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-stone-300">
          {hasNotes ? contact.notes : "No notes yet."}
        </p>
      </div>
    </div>
  );
}

function sortContacts(a: Contact, b: Contact): number {
  return formatContactName(a).localeCompare(formatContactName(b)) || a.id - b.id;
}

function getFirstName(contact: Contact): string {
  const firstName = contact.first_name?.trim();
  if (firstName) {
    return firstName;
  }
  return formatContactName(contact).split(" ")[0] ?? "Unnamed";
}

function possessiveName(contact: Contact): string {
  const name = formatContactName(contact);
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function getOtherContactId(edge: FamilyTreeEdge, contactId: number): number {
  return edge.from_contact_id === contactId ? edge.to_contact_id : edge.from_contact_id;
}

function contactPairId(leftId: number, rightId: number): string {
  return [leftId, rightId].sort((left, right) => left - right).join("-");
}

function unitWidth(unit: TreeUnit): number {
  return unit.contacts.length === 2 ? CARD_WIDTH * 2 + SPOUSE_GAP : CARD_WIDTH;
}

function clusterWidth(units: TreeUnit[]): number {
  if (units.length === 0) {
    return 0;
  }
  return units.reduce((sum, unit, index) => sum + unitWidth(unit) + (index > 0 ? UNIT_GAP : 0), 0);
}

function parentKey(parentIds: Iterable<number>): string {
  return [...parentIds].sort((left, right) => left - right).join("-");
}

function familyLineColor(key: string): string {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) % FAMILY_LINE_COLORS.length;
  }
  return FAMILY_LINE_COLORS[hash] ?? FAMILY_LINE_COLORS[0];
}

function buildUnitsAtDepth(
  contacts: Contact[],
  contactsAtDepthById: Map<number, Contact>,
  depthById: Map<number, number>,
  spouseEdges: FamilyTreeEdge[],
  usedContactIds: Set<number>,
): TreeUnit[] {
  const units: TreeUnit[] = [];
  const ownedContactIds = new Set(contacts.map((contact) => contact.id));

  for (const contact of [...contacts].sort(sortContacts)) {
    if (usedContactIds.has(contact.id)) {
      continue;
    }

    const spouseEdge = spouseEdges.find((edge) => {
      const spouseId = getOtherContactId(edge, contact.id);
      return (
        (edge.from_contact_id === contact.id || edge.to_contact_id === contact.id) &&
        !usedContactIds.has(spouseId) &&
        depthById.get(spouseId) === depthById.get(contact.id) &&
        contactsAtDepthById.has(spouseId)
      );
    });

    if (spouseEdge) {
      const spouse = contactsAtDepthById.get(getOtherContactId(spouseEdge, contact.id));
      if (spouse) {
        const pair = [contact, spouse].sort(sortContacts);
        usedContactIds.add(pair[0].id);
        usedContactIds.add(pair[1].id);
        units.push({
          id: contactPairId(pair[0].id, pair[1].id),
          contacts: pair,
          connectorContactIds: pair
            .filter((pairedContact) => ownedContactIds.has(pairedContact.id))
            .map((pairedContact) => pairedContact.id),
        });
        continue;
      }
    }

    usedContactIds.add(contact.id);
    units.push({
      id: String(contact.id),
      contacts: [contact],
      connectorContactIds: [contact.id],
    });
  }

  return units;
}

function buildSiblingClusters(
  contacts: Contact[],
  parentsByChildId: Map<number, Set<number>>,
  depthById: Map<number, number>,
  spouseEdges: FamilyTreeEdge[],
): SiblingCluster[] {
  const clustersByKey = new Map<string, Contact[]>();
  const contactsAtDepthById = new Map(contacts.map((contact) => [contact.id, contact]));
  const usedContactIds = new Set<number>();

  for (const contact of contacts) {
    const parents = parentsByChildId.get(contact.id);
    const key =
      parents && parents.size > 0 ? parentKey(parents) : `orphan-${contact.id}`;
    const bucket = clustersByKey.get(key) ?? [];
    bucket.push(contact);
    clustersByKey.set(key, bucket);
  }

  return [...clustersByKey.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, clusterContacts]) => {
      const parentIds = key.startsWith("orphan-") ? [] : key.split("-").map((id) => Number(id));
      return {
        parentKey: key,
        parentIds,
        units: buildUnitsAtDepth(
          clusterContacts,
          contactsAtDepthById,
          depthById,
          spouseEdges,
          usedContactIds,
        ),
        left: 0,
        right: 0,
        center: 0,
      };
    })
    .filter((cluster) => cluster.units.length > 0);
}

function placeUnit(
  unit: TreeUnit,
  x: number,
  y: number,
  contactPositions: Map<number, ContactPosition>,
  spouseConnectors: TreeLayout["spouseConnectors"],
) {
  if (unit.contacts.length === 2) {
    const [leftContact, rightContact] = unit.contacts;
    contactPositions.set(leftContact.id, { contact: leftContact, x, y });
    contactPositions.set(rightContact.id, {
      contact: rightContact,
      x: x + CARD_WIDTH + SPOUSE_GAP,
      y,
    });
    spouseConnectors.push({
      id: `spouse-${unit.id}`,
      contactIds: [leftContact.id, rightContact.id],
      x1: x + CARD_WIDTH,
      x2: x + CARD_WIDTH + SPOUSE_GAP,
      y: y + CARD_HEIGHT / 2,
      labelX: x + CARD_WIDTH + SPOUSE_GAP / 2,
    });
    return;
  }

  const [contact] = unit.contacts;
  contactPositions.set(contact.id, { contact, x, y });
}

function unitConnectorCenterX(unit: TreeUnit, contactPositions: Map<number, ContactPosition>): number {
  const connectorIds =
    unit.connectorContactIds.length > 0
      ? unit.connectorContactIds
      : unit.contacts.map((contact) => contact.id);
  const centers = connectorIds.map(
    (contactId) => (contactPositions.get(contactId)?.x ?? 0) + CARD_WIDTH / 2,
  );
  return centers.reduce((sum, value) => sum + value, 0) / centers.length;
}

function findSpouseConnectorForParents(
  parentIds: number[],
  spouseEdges: FamilyTreeEdge[],
  spouseConnectors: TreeLayout["spouseConnectors"],
): TreeLayout["spouseConnectors"][number] | undefined {
  const parentIdSet = new Set(parentIds);
  const spousePair = spouseEdges.find(
    (edge) => parentIdSet.has(edge.from_contact_id) && parentIdSet.has(edge.to_contact_id),
  );

  return spousePair
    ? spouseConnectors.find(
        (connector) =>
          connector.id ===
          `spouse-${contactPairId(spousePair.from_contact_id, spousePair.to_contact_id)}`,
      )
    : undefined;
}

function getParentAnchorX(
  parentIds: number[],
  spouseEdges: FamilyTreeEdge[],
  spouseConnectors: TreeLayout["spouseConnectors"],
  contactPositions: Map<number, ContactPosition>,
): number | null {
  const spouseConnector = findSpouseConnectorForParents(
    parentIds,
    spouseEdges,
    spouseConnectors,
  );
  if (spouseConnector) {
    return spouseConnector.labelX;
  }

  const parentPositions = parentIds
    .map((id) => contactPositions.get(id))
    .filter((position): position is ContactPosition => Boolean(position));

  if (parentPositions.length === 0) {
    return null;
  }

  return (
    parentPositions.reduce((sum, parent) => sum + parent.x + CARD_WIDTH / 2, 0) /
    parentPositions.length
  );
}

function findSelectedParentIds(
  selectedContactId: number | null,
  spouseEdges: FamilyTreeEdge[],
): number[] {
  if (selectedContactId === null) {
    return [];
  }

  const spouseEdge = spouseEdges.find(
    (edge) =>
      edge.from_contact_id === selectedContactId || edge.to_contact_id === selectedContactId,
  );

  if (!spouseEdge) {
    return [selectedContactId];
  }

  return [spouseEdge.from_contact_id, spouseEdge.to_contact_id].sort(
    (left, right) => left - right,
  );
}

function connectorHasSelectedParentIds(
  connectorParentIds: number[],
  selectedParentIds: number[],
): boolean {
  if (selectedParentIds.length === 0) {
    return false;
  }

  return selectedParentIds.every((parentId) => connectorParentIds.includes(parentId));
}

function genderedRelation(
  contact: Contact,
  maleRelation: string,
  femaleRelation: string,
  fallbackRelation: string,
): string {
  if (contact.gender === "male") {
    return maleRelation;
  }
  if (contact.gender === "female") {
    return femaleRelation;
  }
  return fallbackRelation;
}

function generationalRelation(
  contact: Contact,
  direction: "ancestor" | "descendant",
  count: number,
): string | null {
  if (count === 1) {
    return direction === "ancestor"
      ? genderedRelation(contact, "father", "mother", "parent")
      : genderedRelation(contact, "son", "daughter", "child");
  }

  if (count === 2) {
    return direction === "ancestor"
      ? genderedRelation(contact, "grandfather", "grandmother", "grandparent")
      : genderedRelation(contact, "grandson", "granddaughter", "grandchild");
  }

  if (count > 2) {
    const greatPrefix = `${"great-".repeat(count - 2)}`;
    return direction === "ancestor"
      ? genderedRelation(
          contact,
          `${greatPrefix}grandfather`,
          `${greatPrefix}grandmother`,
          `${greatPrefix}grandparent`,
        )
      : genderedRelation(
          contact,
          `${greatPrefix}grandson`,
          `${greatPrefix}granddaughter`,
          `${greatPrefix}grandchild`,
        );
  }

  return null;
}

function directionsMatch(
  directions: RelationshipDirection[],
  pattern: RelationshipDirection[],
): boolean {
  return (
    directions.length === pattern.length &&
    pattern.every((direction, index) => directions[index] === direction)
  );
}

function classifyRelationship(
  sourceContact: Contact,
  path: RelationshipPathStep[],
): string | null {
  const directions = path.map((step) => step.direction);

  if (directions.length === 0) {
    return "same person";
  }

  if (directions.length === 1 && directions[0] === "spouse") {
    return "spouse";
  }

  if (directions.every((direction) => direction === "parent")) {
    return generationalRelation(sourceContact, "ancestor", directions.length);
  }

  if (directions.every((direction) => direction === "child")) {
    return generationalRelation(sourceContact, "descendant", directions.length);
  }

  if (directionsMatch(directions, ["parent", "spouse"])) {
    return genderedRelation(sourceContact, "father-in-law", "mother-in-law", "parent-in-law");
  }

  if (directionsMatch(directions, ["spouse", "child"])) {
    return genderedRelation(sourceContact, "son-in-law", "daughter-in-law", "child-in-law");
  }

  if (directions.length === 2 && directions[0] === "child" && directions[1] === "parent") {
    return genderedRelation(sourceContact, "brother", "sister", "sibling");
  }

  if (
    directionsMatch(directions, ["spouse", "child", "parent"]) ||
    directionsMatch(directions, ["child", "parent", "spouse"])
  ) {
    return genderedRelation(sourceContact, "brother-in-law", "sister-in-law", "sibling-in-law");
  }

  if (
    directions.length === 3 &&
    directions[0] === "child" &&
    directions[1] === "parent" &&
    directions[2] === "parent"
  ) {
    return genderedRelation(sourceContact, "uncle", "aunt", "aunt/uncle");
  }

  if (
    directions.length === 3 &&
    directions[0] === "child" &&
    directions[1] === "child" &&
    directions[2] === "parent"
  ) {
    return genderedRelation(sourceContact, "nephew", "niece", "niece/nephew");
  }

  if (
    directionsMatch(directions, ["spouse", "child", "parent", "parent"]) ||
    directionsMatch(directions, ["child", "parent", "spouse", "parent"])
  ) {
    return genderedRelation(sourceContact, "uncle", "aunt", "aunt/uncle");
  }

  if (
    directionsMatch(directions, ["child", "child", "parent", "spouse"]) ||
    directionsMatch(directions, ["child", "spouse", "child", "parent"])
  ) {
    return genderedRelation(sourceContact, "nephew", "niece", "niece/nephew");
  }

  const firstParentStep = directions.findIndex((direction) => direction === "parent");
  const movesUp = firstParentStep === -1 ? 0 : firstParentStep;
  const movesDown = firstParentStep === -1 ? 0 : directions.length - firstParentStep;
  const isCousinPath =
    movesUp >= 2 &&
    movesDown >= 2 &&
    directions.slice(0, movesUp).every((direction) => direction === "child") &&
    directions.slice(movesUp).every((direction) => direction === "parent");

  if (isCousinPath) {
    return "cousin";
  }

  return null;
}

function buildRelationshipAdjacency(tree: FamilyTree): Map<number, RelationshipPathStep[]> {
  const contactIds = new Set(tree.nodes.map((node) => node.contact.id));
  const adjacency = new Map<number, RelationshipPathStep[]>(
    [...contactIds].map((contactId) => [contactId, []]),
  );

  for (const edge of tree.edges) {
    if (!contactIds.has(edge.from_contact_id) || !contactIds.has(edge.to_contact_id)) {
      continue;
    }

    if (edge.relationship_type === "parent") {
      adjacency.get(edge.from_contact_id)?.push({
        fromId: edge.from_contact_id,
        toId: edge.to_contact_id,
        direction: "parent",
      });
      adjacency.get(edge.to_contact_id)?.push({
        fromId: edge.to_contact_id,
        toId: edge.from_contact_id,
        direction: "child",
      });
    } else if (edge.relationship_type === "spouse") {
      adjacency.get(edge.from_contact_id)?.push({
        fromId: edge.from_contact_id,
        toId: edge.to_contact_id,
        direction: "spouse",
      });
      adjacency.get(edge.to_contact_id)?.push({
        fromId: edge.to_contact_id,
        toId: edge.from_contact_id,
        direction: "spouse",
      });
    }
  }

  return adjacency;
}

function findRelationshipPath(
  tree: FamilyTree,
  fromContactId: number,
  toContactId: number,
): RelationshipPathStep[] | null {
  if (fromContactId === toContactId) {
    return [];
  }

  const adjacency = buildRelationshipAdjacency(tree);
  const visitedContactIds = new Set([fromContactId]);
  const queue: Array<{ contactId: number; path: RelationshipPathStep[] }> = [
    { contactId: fromContactId, path: [] },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const step of adjacency.get(current.contactId) ?? []) {
      if (visitedContactIds.has(step.toId)) {
        continue;
      }

      const nextPath = [...current.path, step];
      if (step.toId === toContactId) {
        return nextPath;
      }

      visitedContactIds.add(step.toId);
      queue.push({ contactId: step.toId, path: nextPath });
    }
  }

  return null;
}

function describePath(
  path: RelationshipPathStep[],
  contactById: Map<number, Contact>,
): string {
  const [firstStep] = path;
  const sourceContact = firstStep ? contactById.get(firstStep.fromId) : undefined;
  if (!sourceContact) {
    return "";
  }

  const parts = [formatContactName(sourceContact)];
  for (const step of path) {
    const targetContact = contactById.get(step.toId);
    if (!targetContact) {
      continue;
    }

    const targetName = formatContactName(targetContact);
    if (step.direction === "parent") {
      parts.push(`parent of ${targetName}`);
    } else if (step.direction === "child") {
      parts.push(`child of ${targetName}`);
    } else {
      parts.push(`spouse of ${targetName}`);
    }
  }

  return parts.join(" -> ");
}

function buildRelationshipSummary(
  tree: FamilyTree,
  firstContactId: number,
  secondContactId: number,
): RelationshipResult {
  const contactById = new Map(tree.nodes.map((node) => [node.contact.id, node.contact]));
  const firstContact = contactById.get(firstContactId);
  const secondContact = contactById.get(secondContactId);

  if (!firstContact || !secondContact) {
    return null;
  }

  const firstPath = findRelationshipPath(tree, firstContactId, secondContactId);
  const secondPath = findRelationshipPath(tree, secondContactId, firstContactId);
  if (!firstPath || !secondPath) {
    return {
      firstSummary: "No relation found.",
      secondSummary: "",
      pathSummary: "",
    };
  }

  const firstRelation = classifyRelationship(firstContact, firstPath);
  const secondRelation = classifyRelationship(secondContact, secondPath);
  const firstName = formatContactName(firstContact);
  const secondName = formatContactName(secondContact);

  return {
    firstSummary: firstRelation
      ? `${firstName} is ${possessiveName(secondContact)} ${firstRelation}.`
      : `Connection from ${firstName} to ${secondName}: ${describePath(firstPath, contactById)}.`,
    secondSummary: secondRelation
      ? `${secondName} is ${possessiveName(firstContact)} ${secondRelation}.`
      : `Connection from ${secondName} to ${firstName}: ${describePath(secondPath, contactById)}.`,
    pathSummary: describePath(firstPath, contactById),
  };
}

function buildTreeLayout(tree: FamilyTree): TreeLayout {
  const contactById = new Map(tree.nodes.map((node) => [node.contact.id, node.contact]));
  const depthById = new Map(tree.nodes.map((node) => [node.contact.id, node.depth]));
  const validEdges = tree.edges.filter(
    (edge) => contactById.has(edge.from_contact_id) && contactById.has(edge.to_contact_id),
  );
  const spouseEdges = validEdges.filter((edge) => edge.relationship_type === "spouse");
  const parentEdges = validEdges.filter((edge) => edge.relationship_type === "parent");

  const parentsByChildId = new Map<number, Set<number>>();
  for (const edge of parentEdges) {
    const parents = parentsByChildId.get(edge.to_contact_id) ?? new Set<number>();
    parents.add(edge.from_contact_id);
    parentsByChildId.set(edge.to_contact_id, parents);
  }

  const contactsByDepth = new Map<number, Contact[]>();
  for (const node of tree.nodes) {
    const contacts = contactsByDepth.get(node.depth) ?? [];
    contacts.push(node.contact);
    contactsByDepth.set(node.depth, contacts);
  }

  const depths = [...contactsByDepth.keys()].sort((left, right) => left - right);
  const contactPositions = new Map<number, ContactPosition>();
  const spouseConnectors: TreeLayout["spouseConnectors"] = [];
  const clustersByDepth = new Map<number, SiblingCluster[]>();
  let diagramWidth = PADDING * 2;

  for (const depth of depths) {
    const clusters = buildSiblingClusters(
      contactsByDepth.get(depth) ?? [],
      parentsByChildId,
      depthById,
      spouseEdges,
    );
    const y = PADDING + depth * (CARD_HEIGHT + ROW_GAP);
    const placements = clusters
      .map((cluster, index) => ({
        cluster,
        desiredCenter: getParentAnchorX(
          cluster.parentIds,
          spouseEdges,
          spouseConnectors,
          contactPositions,
        ),
        index,
      }))
      .sort((left, right) => {
        if (left.desiredCenter !== null && right.desiredCenter !== null) {
          return left.desiredCenter - right.desiredCenter || left.index - right.index;
        }
        if (left.desiredCenter !== null) {
          return -1;
        }
        if (right.desiredCenter !== null) {
          return 1;
        }
        return left.index - right.index;
      });
    let cursorX = PADDING;

    for (const { cluster, desiredCenter } of placements) {
      const width = clusterWidth(cluster.units);
      const desiredLeft = desiredCenter === null ? cursorX : desiredCenter - width / 2;
      cluster.left = Math.max(cursorX, desiredLeft, PADDING);
      cluster.right = cursorX + width;
      cluster.center = cluster.left + width / 2;
      cursorX = cluster.left;

      for (const unit of cluster.units) {
        placeUnit(unit, cursorX, y, contactPositions, spouseConnectors);
        cursorX += unitWidth(unit) + UNIT_GAP;
      }

      cursorX -= UNIT_GAP;
      cluster.right = cursorX;
      cursorX += CLUSTER_GAP;
      diagramWidth = Math.max(diagramWidth, cluster.right + PADDING);
    }

    clustersByDepth.set(depth, clusters);
  }

  const childConnectors: TreeLayout["childConnectors"] = [];

  for (const depth of depths) {
    if (depth === 0) {
      continue;
    }

    const clusters = clustersByDepth.get(depth) ?? [];
    for (const cluster of clusters) {
      if (cluster.parentIds.length === 0 || cluster.units.length === 0) {
        continue;
      }

      const spouseConnector = findSpouseConnectorForParents(
        cluster.parentIds,
        spouseEdges,
        spouseConnectors,
      );

      const parentPositions = cluster.parentIds
        .map((id) => contactPositions.get(id))
        .filter((position): position is ContactPosition => Boolean(position));

      if (parentPositions.length === 0) {
        continue;
      }

      const anchorX =
        spouseConnector?.labelX ??
        parentPositions.reduce((sum, parent) => sum + parent.x + CARD_WIDTH / 2, 0) /
          parentPositions.length;
      const anchorY =
        spouseConnector?.y ??
        Math.max(...parentPositions.map((parent) => parent.y + CARD_HEIGHT / 2));

      const childCenters = cluster.units.map((unit) => unitConnectorCenterX(unit, contactPositions));
      const busLeft = Math.min(...childCenters);
      const busRight = Math.max(...childCenters);
      const childY = PADDING + depth * (CARD_HEIGHT + ROW_GAP);
      const busY = anchorY + Math.max(48, (childY - anchorY) * 0.55);
      const stroke = familyLineColor(cluster.parentKey);

      childConnectors.push({
        id: `cluster-bus-${cluster.parentKey}-${depth}`,
        d: `M ${anchorX} ${anchorY} L ${anchorX} ${busY} L ${busLeft} ${busY} L ${busRight} ${busY}`,
        parentIds: cluster.parentIds,
        stroke,
      });

      for (const unit of cluster.units) {
        for (const contactId of unit.connectorContactIds) {
          const position = contactPositions.get(contactId);
          if (!position) {
            continue;
          }
          const childX = position.x + CARD_WIDTH / 2;
          childConnectors.push({
            id: `child-drop-${contactId}`,
            d: `M ${childX} ${busY} L ${childX} ${childY}`,
            parentIds: cluster.parentIds,
            stroke,
          });
        }
      }
    }
  }

  const diagramHeight =
    PADDING * 2 + depths.length * CARD_HEIGHT + Math.max(0, depths.length - 1) * ROW_GAP;

  return {
    width: diagramWidth,
    height: diagramHeight,
    contacts: [...contactPositions.values()].sort(
      (left, right) => left.y - right.y || left.x - right.x,
    ),
    spouseConnectors,
    childConnectors,
  };
}

export function FamilyTreeView({
  tree,
  contactBackLink,
  interactionMode: interactionModeProp,
  showModeSelector = true,
  lineageFocusContactId = null,
}: FamilyTreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusCardAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const focusCardButtonRef = useRef<HTMLButtonElement | null>(null);
  const [scale, setScale] = useState(1);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [internalInteractionMode, setInternalInteractionMode] = useState<InteractionMode>("view");
  const [relationshipSelectionIds, setRelationshipSelectionIds] = useState<number[]>([]);
  const [exploreTree, setExploreTree] = useState<FamilyTree>(tree);
  const [revealedContactIds, setRevealedContactIds] = useState<Set<number>>(
    () => new Set(tree.nodes.map((node) => node.contact.id)),
  );
  const [exploredAnchorIds, setExploredAnchorIds] = useState<Set<number>>(() => new Set());
  const [exploreAnimation, setExploreAnimation] = useState<ExploreAnimation | null>(null);
  const [exploreBusyContactId, setExploreBusyContactId] = useState<number | null>(null);
  const [spouseSlideOpen, setSpouseSlideOpen] = useState(false);
  const [revealedChildCardIds, setRevealedChildCardIds] = useState<Set<number>>(() => new Set());
  const interactionMode = interactionModeProp ?? internalInteractionMode;
  const activeTree = interactionMode === "explore" ? exploreTree : tree;
  const layout = activeTree.nodes.length > 0 ? buildTreeLayout(activeTree) : null;
  const layoutWidth = layout?.width ?? 1;
  const spouseEdges = activeTree.edges.filter((edge) => edge.relationship_type === "spouse");
  const selectedParentIds =
    interactionMode === "path" ? findSelectedParentIds(selectedContactId, spouseEdges) : [];
  const relationshipResult = useMemo(() => {
    if (interactionMode !== "relationship" || relationshipSelectionIds.length !== 2) {
      return null;
    }
    return buildRelationshipSummary(
      tree,
      relationshipSelectionIds[0],
      relationshipSelectionIds[1],
    );
  }, [interactionMode, relationshipSelectionIds, tree]);

  useEffect(() => {
    if (interactionMode === "relationship") {
      setSelectedContactId(null);
    } else {
      setRelationshipSelectionIds([]);
    }
    if (interactionMode !== "path") {
      setSelectedContactId(null);
    }
  }, [interactionMode, tree.group_id]);

  useEffect(() => {
    setExploreTree(tree);
    setRevealedContactIds(new Set(tree.nodes.map((node) => node.contact.id)));
    setExploredAnchorIds(new Set());
    setExploreAnimation(null);
    setExploreBusyContactId(null);
    setSpouseSlideOpen(false);
    setRevealedChildCardIds(new Set());
  }, [interactionMode, tree]);

  useEffect(() => {
    if (exploreAnimation?.step.kind !== "spouse") {
      setSpouseSlideOpen(false);
      return;
    }

    setSpouseSlideOpen(false);
    const frameId = window.requestAnimationFrame(() => {
      setSpouseSlideOpen(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [exploreAnimation?.step, exploreAnimation?.spouseId]);

  useEffect(() => {
    if (exploreAnimation?.step.kind !== "child-card") {
      return;
    }

    const childId = exploreAnimation.childIds[exploreAnimation.step.childIndex];
    if (childId === undefined) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setRevealedChildCardIds((current) => new Set([...current, childId]));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [exploreAnimation?.step, exploreAnimation?.childIds]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || layoutWidth <= 1) {
      return;
    }

    function updateScale() {
      const availableWidth = element?.clientWidth ?? layoutWidth;
      setScale(Math.min(1, availableWidth / layoutWidth));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [layoutWidth]);

  useEffect(() => {
    if (!lineageFocusContactId) {
      return;
    }

    const timer = window.setTimeout(() => {
      (focusCardAnchorRef.current ?? focusCardButtonRef.current)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [lineageFocusContactId, layout, tree.group_id]);

  if (!layout) {
    return <p className="text-sm text-stone-500">No members in this group.</p>;
  }

  const scaledWidth = layout.width * scale;
  const scaledHeight = layout.height * scale;
  const selectedRelationshipContacts = relationshipSelectionIds.map(
    (contactId) => tree.nodes.find((node) => node.contact.id === contactId)?.contact ?? null,
  );

  async function handleExploreClick(contactId: number) {
    if (
      exploreBusyContactId !== null ||
      exploreAnimation !== null ||
      exploredAnchorIds.has(contactId)
    ) {
      return;
    }

    setExploreBusyContactId(contactId);

    try {
      const relationships = await fetchContactRelationships(contactId);
      const spouseRelationship = relationships.find(
        (relationship) =>
          relationship.relationship_type === "spouse" &&
          (relationship.from_contact_id === contactId || relationship.to_contact_id === contactId),
      );
      const spouseContactId = spouseRelationship
        ? spouseRelationship.from_contact_id === contactId
          ? spouseRelationship.to_contact_id
          : spouseRelationship.from_contact_id
        : null;
      const spouseRelationships =
        spouseContactId !== null ? await fetchContactRelationships(spouseContactId) : [];
      const relationshipRows = [...relationships, ...spouseRelationships];
      const relatives = getUnrevealedRelatives(
        relationshipRows,
        contactId,
        revealedContactIds,
      );

      if (relatives.spouseId === null && relatives.childIds.length === 0) {
        setExploredAnchorIds((current) => new Set([...current, contactId]));
        return;
      }

      const contactIdsToFetch = [
        ...(relatives.spouseId ? [relatives.spouseId] : []),
        ...relatives.childIds,
      ];
      const fetchedContacts = await Promise.all(
        contactIdsToFetch.map((id) => fetchContact(id)),
      );

      const baselineVisibleIds = new Set(revealedContactIds);
      setExploreTree((currentTree) =>
        appendExploreContacts(
          currentTree,
          fetchedContacts,
          contactId,
          relatives.spouseId,
          relatives.childIds,
          relatives.edges,
        ),
      );

      const animation: ExploreAnimation = {
        anchorContactId: contactId,
        spouseId: relatives.spouseId,
        childIds: relatives.childIds,
        step: { kind: "idle" },
        baselineVisibleIds,
      };
      setExploreAnimation(animation);

      await runExploreAnimationSequence(animation, (step) => {
        setExploreAnimation((current) => (current ? { ...current, step } : current));
      });

      setRevealedContactIds((current) => {
        const next = new Set(current);
        if (relatives.spouseId !== null) {
          next.add(relatives.spouseId);
        }
        for (const childId of relatives.childIds) {
          next.add(childId);
        }
        return next;
      });
      setExploredAnchorIds((current) => new Set([...current, contactId]));
      setExploreAnimation(null);
    } finally {
      setExploreBusyContactId(null);
    }
  }

  function handleContactClick(contactId: number) {
    if (interactionMode === "path") {
      setSelectedContactId((current) => (current === contactId ? null : contactId));
      return;
    }

    if (interactionMode === "explore") {
      void handleExploreClick(contactId);
      return;
    }

    if (interactionMode !== "relationship") {
      return;
    }

    setRelationshipSelectionIds((current) => {
      if (current.includes(contactId)) {
        return current.filter((id) => id !== contactId);
      }
      if (current.length >= 2) {
        return [contactId];
      }
      return [...current, contactId];
    });
  }

  const showToolbar = showModeSelector || interactionMode === "relationship";

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {showToolbar && (
      <div className="flex flex-wrap items-center gap-4">
        {showModeSelector && (
          <FamilyTreeModeSelect
            value={interactionMode}
            onChange={setInternalInteractionMode}
          />
        )}

        <div
          className={[
            "flex items-center gap-2 transition-all duration-300",
            interactionMode === "relationship"
              ? "pointer-events-auto max-w-32 opacity-100"
              : "pointer-events-none max-w-0 opacity-0",
          ].join(" ")}
        >
          {[0, 1].map((index) => {
            const contact = selectedRelationshipContacts[index];
            return (
              <div
                key={index}
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
                  "transition-all duration-300 ease-out",
                  interactionMode === "relationship"
                    ? "translate-x-0 scale-100 opacity-100"
                    : "-translate-x-8 scale-75 opacity-0",
                  contact
                    ? "border-app-accent/60 bg-app-accent/10"
                    : "border-dashed border-white/[0.18] bg-stone-950/70",
                ].join(" ")}
                style={{
                  transitionDelay: interactionMode === "relationship" ? `${index * 90}ms` : "0ms",
                }}
                title={contact ? formatContactName(contact) : `Selection ${index + 1}`}
              >
                {contact ? (
                  <ContactAvatar contact={contact} className="h-10 w-10" />
                ) : (
                  <span className="text-sm font-semibold text-stone-500">{index + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {interactionMode === "relationship" && relationshipResult && (
          <div className="min-w-0 flex-1 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
            <p className="truncate font-medium text-stone-100">
              {relationshipResult.firstSummary}
            </p>
            {relationshipResult.secondSummary && (
              <p className="mt-1 truncate text-stone-300">
                {relationshipResult.secondSummary}
              </p>
            )}
          </div>
        )}

        {interactionMode === "relationship" && relationshipSelectionIds.length > 0 && (
          <button
            type="button"
            onClick={() => setRelationshipSelectionIds([])}
            className="ml-auto rounded-full px-3 py-1 text-xs font-medium text-stone-400 transition hover:bg-white/[0.06] hover:text-stone-100"
          >
            Clear
          </button>
        )}
      </div>
      )}

      <div
        className="relative mx-auto"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
          }}
        >
          <svg
            aria-hidden
            className="absolute inset-0"
            height={layout.height}
            width={layout.width}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
          >
            {layout.childConnectors.map((connector) => {
              if (
                interactionMode === "explore" &&
                !shouldShowConnector(connector.id, exploreAnimation, revealedContactIds)
              ) {
                return null;
              }

              const isHighlighted = connectorHasSelectedParentIds(
                connector.parentIds,
                selectedParentIds,
              );
              const stroke = isHighlighted ? "rgba(255, 255, 255, 0.95)" : connector.stroke;
              const strokeWidth = isHighlighted ? 4 : 2;
              const animateExplore =
                interactionMode === "explore" &&
                shouldAnimateConnector(connector.id, exploreAnimation, revealedContactIds);

              if (animateExplore) {
                return (
                  <AnimatedExplorePath
                    key={connector.id}
                    id={connector.id}
                    d={connector.d}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    active
                    durationMs={EXPLORE_CHILD_LINE_ANIM_MS}
                  />
                );
              }

              return (
                <path
                  key={connector.id}
                  d={connector.d}
                  fill="none"
                  stroke={stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={strokeWidth}
                  style={{
                    filter: isHighlighted
                      ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))"
                      : undefined,
                  }}
                />
              );
            })}
            {layout.spouseConnectors.map((connector) => {
              if (
                interactionMode === "explore" &&
                !shouldShowConnector(connector.id, exploreAnimation, revealedContactIds)
              ) {
                return null;
              }

              const isSelected = connectorHasSelectedParentIds(
                connector.contactIds,
                selectedParentIds,
              );
              const stroke = isSelected
                ? "rgba(255, 255, 255, 0.95)"
                : "rgba(231, 229, 228, 0.48)";
              const strokeWidth = isSelected ? 4 : 2;
              const animateExplore =
                interactionMode === "explore" &&
                shouldAnimateConnector(connector.id, exploreAnimation, revealedContactIds);

              if (animateExplore) {
                return (
                  <AnimatedExploreLine
                    key={connector.id}
                    id={connector.id}
                    x1={connector.x1}
                    x2={connector.x2}
                    y1={connector.y}
                    y2={connector.y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    active
                    durationMs={EXPLORE_SPOUSE_ANIM_MS}
                  />
                );
              }

              return (
                <line
                  key={connector.id}
                  x1={connector.x1}
                  x2={connector.x2}
                  y1={connector.y}
                  y2={connector.y}
                  stroke={stroke}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))"
                      : undefined,
                  }}
                />
              );
            })}
          </svg>

          {layout.spouseConnectors.map((connector) => {
            if (
              interactionMode === "explore" &&
              !shouldShowConnector(connector.id, exploreAnimation, revealedContactIds)
            ) {
              return null;
            }

            return (
              <span
                key={`${connector.id}-label`}
                className="absolute z-20 rounded-full border border-stone-700 bg-stone-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-400"
                style={{
                  left: connector.labelX,
                  top: connector.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                spouse
              </span>
            );
          })}

          {layout.contacts.map(({ contact, x, y }) => {
            if (
              interactionMode === "explore" &&
              !shouldShowContactCard(contact.id, exploreAnimation, revealedContactIds)
            ) {
              return null;
            }

            const isBranchSelected = selectedContactId === contact.id;
            const isRelationshipSelected = relationshipSelectionIds.includes(contact.id);
            const isLineageFocus = lineageFocusContactId === contact.id;
            const isExploreAnchor =
              interactionMode === "explore" &&
              exploreAnimation?.anchorContactId === contact.id &&
              exploreAnimation.step.kind === "spouse";
            const isExploreBusy = interactionMode === "explore" && exploreBusyContactId === contact.id;
            const anchorPosition =
              exploreAnimation &&
              layout.contacts.find(
                (position) => position.contact.id === exploreAnimation.anchorContactId,
              );
            const spouseOffset =
              interactionMode === "explore" && isSpouseSliding(contact.id, exploreAnimation)
                ? spouseSlideOffset(
                    contact.id,
                    exploreAnimation,
                    anchorPosition?.x ?? x,
                    x,
                  )
                : 0;
            const slideX =
              interactionMode === "explore" && isSpouseSliding(contact.id, exploreAnimation)
                ? spouseSlideOpen
                  ? 0
                  : spouseOffset
                : 0;
            const isChildAppearing =
              interactionMode === "explore" &&
              exploreAnimation?.step.kind === "child-card" &&
              exploreAnimation.childIds[exploreAnimation.step.childIndex] === contact.id;
            const childCardVisible =
              !isChildAppearing || revealedChildCardIds.has(contact.id);
            const cardClassName = [
              "absolute flex flex-col items-center gap-2 rounded-2xl p-3",
              "transition-[background-color,box-shadow,opacity,transform]",
              interactionMode === "explore" ? "" : "transition hover:bg-stone-900/40",
              isLineageFocus ? "bg-app-accent/10 ring-2 ring-app-accent/60" : "",
              isBranchSelected ? "bg-white/10 ring-2 ring-white/80" : "",
              isRelationshipSelected ? "bg-app-accent/10 ring-2 ring-app-accent/60" : "",
              isExploreBusy ? "ring-2 ring-sky-300/70" : "",
            ].join(" ");
            const cardStyle = {
              left: x,
              top: y,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transform: `translateX(${slideX}px) scale(${childCardVisible ? 1 : 0.88})`,
              opacity: childCardVisible ? 1 : 0,
              transitionProperty: "transform, opacity",
              transitionDuration: isSpouseSliding(contact.id, exploreAnimation)
                ? `${EXPLORE_SPOUSE_ANIM_MS}ms`
                : isChildAppearing
                  ? `${EXPLORE_CHILD_CARD_ANIM_MS}ms`
                  : undefined,
              transitionTimingFunction: "ease-out",
              zIndex: interactionMode === "view"
                ? 40
                : isExploreAnchor
                  ? 30
                  : isSpouseSliding(contact.id, exploreAnimation)
                    ? 5
                    : 10,
            };

            if (interactionMode === "view") {
              return (
                <Link
                  key={contact.id}
                  ref={isLineageFocus ? focusCardAnchorRef : undefined}
                  to={`/people/contacts/${contact.id}`}
                  state={contactBackLink ? { contactBackLink } : undefined}
                  className={`${cardClassName} group`}
                  style={cardStyle}
                  aria-label={`Open ${getFirstName(contact)} contact`}
                >
                  <ContactAvatar contact={contact} className="h-14 w-14" />
                  <span className="max-w-full truncate text-center text-sm font-medium text-stone-100">
                    {getFirstName(contact)}
                  </span>
                  <ContactHoverPreview contact={contact} />
                </Link>
              );
            }

            return (
              <button
                key={contact.id}
                ref={isLineageFocus ? focusCardButtonRef : undefined}
                type="button"
                onClick={() => handleContactClick(contact.id)}
                disabled={interactionMode === "explore" && exploreBusyContactId !== null}
                aria-pressed={
                  interactionMode === "relationship"
                    ? isRelationshipSelected
                    : interactionMode === "path"
                      ? isBranchSelected
                      : false
                }
                aria-label={
                  interactionMode === "relationship"
                    ? `Select ${getFirstName(contact)} for relationship lookup`
                    : interactionMode === "explore"
                      ? `Explore ${getFirstName(contact)}'s spouse and children`
                      : `Highlight ${getFirstName(contact)}'s family branch`
                }
                className={cardClassName}
                style={cardStyle}
              >
                <ContactAvatar contact={contact} className="h-14 w-14" />
                <span className="max-w-full truncate text-center text-sm font-medium text-stone-100">
                  {getFirstName(contact)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
