// stack_sandbox/frontend_web/src/modules/contacts/lib/relationshipDisplay.ts

// Relationship type colors, labels, and perspective-aware display helpers.

import type { ContactRelationship } from "../api";
import { formatPersonName } from "../api";

export type RelationshipTypeKey = "spouse" | "parent" | "sibling" | "friend";

export type RelationshipDisplay = {
  otherContactId: number;
  otherName: string;
  type: RelationshipTypeKey;
  typeLabel: string;
  roleLabel: string;
};

const TYPE_META: Record<
  RelationshipTypeKey,
  { label: string; accent: string; glow: string; badge: string }
> = {
  spouse: {
    label: "Spouse",
    accent: "border-rose-400/70",
    glow: "from-rose-500/10 via-rose-500/5 to-transparent",
    badge: "bg-rose-400/15 text-rose-200 ring-rose-400/25",
  },
  parent: {
    label: "Family",
    accent: "border-sky-400/70",
    glow: "from-sky-500/10 via-sky-500/5 to-transparent",
    badge: "bg-sky-400/15 text-sky-200 ring-sky-400/25",
  },
  sibling: {
    label: "Sibling",
    accent: "border-amber-400/70",
    glow: "from-amber-500/10 via-amber-500/5 to-transparent",
    badge: "bg-amber-400/15 text-amber-200 ring-amber-400/25",
  },
  friend: {
    label: "Friend",
    accent: "border-emerald-400/70",
    glow: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    badge: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/25",
  },
};

export function relationshipTypeMeta(type: string) {
  return TYPE_META[type as RelationshipTypeKey] ?? TYPE_META.friend;
}

export function parseRelationshipDisplay(
  relationship: ContactRelationship,
  perspectiveContactId: number,
): RelationshipDisplay {
  const { relationship_type, from_contact_id, to_contact_id } = relationship;
  const isFromPerspective = from_contact_id === perspectiveContactId;
  const otherContactId = isFromPerspective ? to_contact_id : from_contact_id;
  const otherName = isFromPerspective
    ? formatPersonName(relationship.to_first_name, relationship.to_last_name)
    : formatPersonName(relationship.from_first_name, relationship.from_last_name);

  if (relationship_type === "parent") {
    return {
      otherContactId,
      otherName,
      type: "parent",
      typeLabel: "Family",
      roleLabel: isFromPerspective ? "Parent of" : "Child of",
    };
  }

  if (relationship_type === "spouse") {
    return {
      otherContactId,
      otherName,
      type: "spouse",
      typeLabel: "Spouse",
      roleLabel: "Married to",
    };
  }

  const type = relationship_type as RelationshipTypeKey;
  return {
    otherContactId,
    otherName,
    type: type in TYPE_META ? type : "friend",
    typeLabel: TYPE_META[type in TYPE_META ? type : "friend"].label,
    roleLabel: relationship_type.charAt(0).toUpperCase() + relationship_type.slice(1),
  };
}
