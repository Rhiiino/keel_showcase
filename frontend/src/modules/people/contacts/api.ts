// keel_web/src/modules/contacts/api.ts

// Contacts module API.

import { apiFetch } from "../../../lib/api";
import {
  createMediaAttachment,
  uploadMedia,
  type MediaObject,
} from "../../media/api";

export { formatBirthDate } from "../shared/lib/birthDate";

const credentials: RequestCredentials = "include";

export type ContactFamilyGroup = {
  id: string;
  name: string;
};

export type ContactTag = {
  id: number;
  name: string;
  color_hex: string;
  contact_count: number;
};

export type Contact = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  gender: "male" | "female" | null;
  birth_date: string | null;
  birth_date_year_known: boolean;
  death_date: string | null;
  notes: string;
  status: string;
  is_self: boolean;
  photo: MediaObject | null;
  family_groups: ContactFamilyGroup[];
  tags: ContactTag[];
  created_at: string;
  updated_at: string;
};

export type ContactGender = NonNullable<Contact["gender"]>;

export type ContactCreatePayload = {
  first_name?: string | null;
  last_name?: string | null;
  gender?: ContactGender | null;
  birth_date?: string | null;
  birth_date_year_known?: boolean;
  death_date?: string | null;
  notes?: string;
  status?: string;
  tag_ids?: number[];
};

export type ContactUpdatePayload = Partial<{
  first_name: string | null;
  last_name: string | null;
  gender: ContactGender;
  birth_date: string | null;
  birth_date_year_known: boolean;
  death_date: string | null;
  notes: string;
  status: string;
  tag_ids: number[];
}>;

export type ContactRelationship = {
  id: number;
  from_contact_id: number;
  to_contact_id: number;
  from_first_name: string | null;
  from_last_name: string | null;
  to_first_name: string | null;
  to_last_name: string | null;
  relationship_type: string;
  created_at: string;
  updated_at: string;
};

export type FamilyGroup = {
  id: string;
  name: string;
  father_contact_id: number | null;
  mother_contact_id: number | null;
  root_contact_id: number | null;
  member_count: number;
};

export type FamilyGroupDetail = FamilyGroup & {
  member_contact_ids: number[];
};

export type FamilyTreeNode = {
  contact: Contact;
  depth: number;
};

export type FamilyTreeEdge = {
  id: number;
  from_contact_id: number;
  to_contact_id: number;
  relationship_type: string;
};

export type FamilyTree = {
  group_id: string;
  root_contact_id: number | null;
  nodes: FamilyTreeNode[];
  edges: FamilyTreeEdge[];
};

export const contactsQueryKeys = {
  all: ["contacts"] as const,
  list: () => [...contactsQueryKeys.all, "list"] as const,
  detail: (id: number) => [...contactsQueryKeys.all, "detail", id] as const,
  relationships: (id: number) => [...contactsQueryKeys.all, "relationships", id] as const,
  familyGroups: () => [...contactsQueryKeys.all, "family-groups"] as const,
  familyGroup: (familyKey: string) => [...contactsQueryKeys.all, "family-group", familyKey] as const,
  familyTree: (familyKey: string) => [...contactsQueryKeys.all, "family-tree", familyKey] as const,
  mergedFamilyTree: (familyKeys: string[]) =>
    [...contactsQueryKeys.all, "merged-family-tree", [...familyKeys].sort().join(",")] as const,
  lineageFamilyKeys: (contactId: number) =>
    [...contactsQueryKeys.all, "lineage-family-keys", contactId] as const,
  tags: () => [...contactsQueryKeys.all, "tags"] as const,
};

export async function fetchContacts(): Promise<Contact[]> {
  return apiFetch<Contact[]>("/contacts", { credentials });
}

export async function fetchContact(contactId: number): Promise<Contact> {
  return apiFetch<Contact>(`/contacts/${contactId}`, { credentials });
}

export async function createContact(payload: ContactCreatePayload): Promise<Contact> {
  return apiFetch<Contact>("/contacts", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateContact(
  contactId: number,
  payload: ContactUpdatePayload,
): Promise<Contact> {
  return apiFetch<Contact>(`/contacts/${contactId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function uploadContactPhoto(
  contactId: number,
  file: File,
): Promise<Contact> {
  const media = await uploadMedia(file);
  await createMediaAttachment(media.id, {
    entity_type: "contact",
    entity_id: contactId,
    role: "photo",
  });
  return fetchContact(contactId);
}

export async function setContactPhotoFromMedia(
  contactId: number,
  mediaId: string,
): Promise<Contact> {
  await createMediaAttachment(mediaId, {
    entity_type: "contact",
    entity_id: contactId,
    role: "photo",
  });
  return fetchContact(contactId);
}

export async function fetchContactRelationships(
  contactId: number,
): Promise<ContactRelationship[]> {
  return apiFetch<ContactRelationship[]>(`/contacts/${contactId}/relationships`, {
    credentials,
  });
}

export async function createContactRelationship(payload: {
  from_contact_id: number;
  to_contact_id: number;
  relationship_type: string;
}): Promise<ContactRelationship> {
  return apiFetch<ContactRelationship>("/contacts/relationships", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function deleteContactRelationship(relationshipId: number): Promise<void> {
  return apiFetch<void>(`/contacts/relationships/${relationshipId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchFamilyGroups(): Promise<FamilyGroup[]> {
  return apiFetch<FamilyGroup[]>("/contacts/family-groups", { credentials });
}

export async function fetchFamilyGroup(familyKey: string): Promise<FamilyGroupDetail> {
  return apiFetch<FamilyGroupDetail>(
    `/contacts/family-groups/${encodeURIComponent(familyKey)}`,
    { credentials },
  );
}

export async function fetchFamilyTree(familyKey: string): Promise<FamilyTree> {
  return apiFetch<FamilyTree>(
    `/contacts/family-groups/${encodeURIComponent(familyKey)}/tree`,
    { credentials },
  );
}

export async function fetchMergedFamilyTrees(familyKeys: string[]): Promise<FamilyTree[]> {
  if (familyKeys.length === 0) {
    return [];
  }
  const params = new URLSearchParams();
  for (const familyKey of familyKeys) {
    params.append("family_keys", familyKey);
  }
  return apiFetch<FamilyTree[]>(
    `/contacts/family-groups/merged/tree?${params.toString()}`,
    { credentials },
  );
}

export async function fetchContactTags(): Promise<ContactTag[]> {
  return apiFetch<ContactTag[]>("/contacts/tags", { credentials });
}

export async function createContactTag(payload: {
  name: string;
  color_hex?: string;
}): Promise<ContactTag> {
  return apiFetch<ContactTag>("/contacts/tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateContactTag(
  tagId: number,
  payload: { name?: string; color_hex?: string },
): Promise<ContactTag> {
  return apiFetch<ContactTag>(`/contacts/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteContactTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/contacts/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}

export function contactNameFromParts(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.join(" ");
}

export function contactEditableName(
  contact: Pick<Contact, "first_name" | "last_name">,
): string {
  return contactNameFromParts(contact.first_name, contact.last_name);
}

export function parseContactFullName(fullName: string): Pick<Contact, "first_name" | "last_name"> {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { first_name: null, last_name: null };
  }
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return { first_name: trimmed, last_name: null };
  }
  return {
    first_name: trimmed.slice(0, spaceIndex),
    last_name: trimmed.slice(spaceIndex + 1).trim() || null,
  };
}

export function formatContactName(
  contact: Pick<Contact, "first_name" | "last_name"> & { id?: number },
): string {
  const name = contactNameFromParts(contact.first_name, contact.last_name);
  if (name) {
    return name;
  }
  return contact.id ? `Contact #${contact.id}` : "Unnamed contact";
}

export function formatPersonName(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}

export function contactInitials(contact: Pick<Contact, "first_name" | "last_name">): string {
  const first = contact.first_name?.trim().charAt(0) ?? "";
  const last = contact.last_name?.trim().charAt(0) ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export function relationshipLabel(
  relationship: ContactRelationship,
  perspectiveContactId: number,
): string {
  const { relationship_type, from_contact_id } = relationship;
  if (relationship_type === "parent") {
    if (from_contact_id === perspectiveContactId) {
      return `Parent of ${formatPersonName(relationship.to_first_name, relationship.to_last_name)}`;
    }
    return `Child of ${formatPersonName(relationship.from_first_name, relationship.from_last_name)}`;
  }
  if (relationship_type === "spouse") {
    const other =
      from_contact_id === perspectiveContactId
        ? formatPersonName(relationship.to_first_name, relationship.to_last_name)
        : formatPersonName(relationship.from_first_name, relationship.from_last_name);
    return `Spouse — ${other}`;
  }
  const other =
    from_contact_id === perspectiveContactId
      ? formatPersonName(relationship.to_first_name, relationship.to_last_name)
      : formatPersonName(relationship.from_first_name, relationship.from_last_name);
  return `${relationship_type} — ${other}`;
}

export const MAX_CONTACT_PHOTO_BYTES = 10 * 1024 * 1024;

export function validateContactPhotoFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Choose a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_CONTACT_PHOTO_BYTES) {
    return { ok: false, error: "Image must be 10 MB or smaller." };
  }
  return { ok: true };
}
