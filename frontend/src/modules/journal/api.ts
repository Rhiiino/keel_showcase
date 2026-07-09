// keel_web/src/modules/journal/api.ts

// Journal module API — personal journal entries with tags.

import { apiFetch } from "../../lib/api";
import {
  createMediaAttachment,
  deleteMediaAttachment,
  fetchEntityAttachments,
  galleryEntryFromAttachment,
  uploadMedia,
  type GalleryEntry,
} from "../media/api";

const credentials: RequestCredentials = "include";

export type JournalTag = {
  id: number;
  name: string;
  color_hex: string;
  entry_count: number;
};

export type JournalEntry = {
  id: number;
  user_id: number;
  entry_date: string;
  content: string;
  tags: JournalTag[];
  created_at: string;
  updated_at: string;
};

export type JournalEntryGalleryEntry = GalleryEntry;

export type JournalEntryCreatePayload = {
  entry_date: string;
  content: string;
  tag_ids?: number[];
};

export type JournalEntryUpdatePayload = {
  entry_date?: string;
  content?: string;
  tag_ids?: number[];
};

type JournalTagCreatePayload = {
  name: string;
  color_hex?: string | null;
};

type JournalTagUpdatePayload = {
  name?: string;
  color_hex?: string | null;
};

export type JournalEntryListFilters = {
  query?: string | null;
  entryDateFrom?: string | null;
  entryDateTo?: string | null;
  tagIds?: number[];
};

export const journalQueryKeys = {
  all: ["journal"] as const,
  tags: () => [...journalQueryKeys.all, "tags"] as const,
  entries: (filters?: JournalEntryListFilters) =>
    [...journalQueryKeys.all, "entries", filters ?? {}] as const,
  detail: (entryId: number | string) =>
    [...journalQueryKeys.all, "detail", String(entryId)] as const,
  entryMedia: (entryId: number | string) =>
    [...journalQueryKeys.all, "entry-media", String(entryId)] as const,
};

export async function fetchJournalEntries(
  filters?: JournalEntryListFilters,
): Promise<JournalEntry[]> {
  const params = new URLSearchParams();
  if (filters?.query?.trim()) {
    params.set("query", filters.query.trim());
  }
  if (filters?.entryDateFrom) {
    params.set("entry_date_from", filters.entryDateFrom);
  }
  if (filters?.entryDateTo) {
    params.set("entry_date_to", filters.entryDateTo);
  }
  if (filters?.tagIds?.length) {
    for (const tagId of filters.tagIds) {
      params.append("tag_ids", String(tagId));
    }
  }
  const query = params.toString();
  return apiFetch<JournalEntry[]>(
    `/journal/entries${query ? `?${query}` : ""}`,
    { credentials },
  );
}

export async function fetchJournalEntry(entryId: number | string): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/journal/entries/${entryId}`, { credentials });
}

export async function createJournalEntry(
  payload: JournalEntryCreatePayload,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>("/journal/entries", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateJournalEntry(
  entryId: number | string,
  payload: JournalEntryUpdatePayload,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/journal/entries/${entryId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteJournalEntry(entryId: number | string): Promise<void> {
  await apiFetch<void>(`/journal/entries/${entryId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchJournalTags(): Promise<JournalTag[]> {
  return apiFetch<JournalTag[]>("/journal/tags", { credentials });
}

export function createJournalTag(payload: JournalTagCreatePayload): Promise<JournalTag> {
  return apiFetch<JournalTag>("/journal/tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateJournalTag(
  tagId: number,
  payload: JournalTagUpdatePayload,
): Promise<JournalTag> {
  return apiFetch<JournalTag>(`/journal/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteJournalTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/journal/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchJournalEntryMedia(
  entryId: number | string,
): Promise<JournalEntryGalleryEntry[]> {
  const attachments = await fetchEntityAttachments("journal_entry", Number(entryId));
  return attachments
    .filter((attachment) => attachment.role === "gallery")
    .map(galleryEntryFromAttachment);
}

export function deleteJournalEntryMedia(
  _entryId: number | string,
  attachmentId: number,
): Promise<void> {
  return deleteMediaAttachment(attachmentId);
}

export async function attachJournalEntryMediaFromMedia(
  entryId: number | string,
  mediaId: string,
): Promise<JournalEntryGalleryEntry> {
  const attachment = await createMediaAttachment(mediaId, {
    entity_type: "journal_entry",
    entity_id: Number(entryId),
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function uploadJournalEntryMedia(
  entryId: number | string,
  file: File,
): Promise<JournalEntryGalleryEntry> {
  const media = await uploadMedia(file);
  const attachment = await createMediaAttachment(media.id, {
    entity_type: "journal_entry",
    entity_id: Number(entryId),
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}
