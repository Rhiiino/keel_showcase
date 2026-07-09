// keel_web/src/modules/timeline/api.ts

// Timeline module API — life events with optional contact tagging.

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

export type TimelineEventContact = {
  id: number;
  display_name: string;
};

export type TimelineEventFigure = {
  id: number;
  display_name: string;
};

export type TimelineReminderUnit = "minutes" | "hours" | "days";

export type TimelineReminderFormValue = {
  amount: number;
  unit: TimelineReminderUnit;
};

export type TimelineEventReminder = {
  id: number;
  amount: number;
  unit: TimelineReminderUnit;
  sent_at: string | null;
};

export type TimelineTag = {
  id: number;
  name: string;
  description: string | null;
  color_hex: string;
  event_count: number;
  plan_item_count: number;
};

export type TimelineEventGalleryEntry = GalleryEntry;

export type TimelineEvent = {
  id: number;
  user_id: number;
  subject_name: string | null;
  description: string;
  start_date: string;
  end_date: string | null;
  contacts: TimelineEventContact[];
  figures: TimelineEventFigure[];
  tags: TimelineTag[];
  reminders: TimelineEventReminder[];
  created_at: string;
  updated_at: string;
};

export type TimelineEventCreatePayload = {
  subject_name?: string | null;
  description: string;
  start_date: string;
  end_date?: string | null;
  contact_ids?: number[];
  figure_ids?: number[];
  tag_ids?: number[];
  reminders?: TimelineReminderFormValue[];
};

export type TimelineEventUpdatePayload = {
  subject_name?: string | null;
  description?: string;
  start_date?: string;
  end_date?: string | null;
  contact_ids?: number[];
  figure_ids?: number[];
  tag_ids?: number[];
  reminders?: TimelineReminderFormValue[];
};

type TimelineTagCreatePayload = {
  name: string;
  description?: string | null;
  color_hex?: string | null;
};

type TimelineTagUpdatePayload = {
  name?: string;
  description?: string | null;
  color_hex?: string | null;
};

export type TimelineEventListFilters = {
  contactId?: number | null;
  contactIds?: number[];
  figureIds?: number[];
  query?: string | null;
  subjectName?: string | null;
  startDateFrom?: string | null;
  startDateTo?: string | null;
  tagIds?: number[];
};

export const timelineQueryKeys = {
  all: ["timeline"] as const,
  tags: () => [...timelineQueryKeys.all, "tags"] as const,
  events: (filters?: TimelineEventListFilters) =>
    [...timelineQueryKeys.all, "events", filters ?? {}] as const,
  calendar: (start: string, end: string) =>
    [...timelineQueryKeys.all, "calendar", start, end] as const,
  detail: (eventId: number | string) =>
    [...timelineQueryKeys.all, "detail", String(eventId)] as const,
  eventMedia: (eventId: number | string) =>
    [...timelineQueryKeys.all, "event-media", String(eventId)] as const,
  plans: (filters?: TimelinePlanListFilters) =>
    [...timelineQueryKeys.all, "plans", filters ?? {}] as const,
  planDetail: (planId: number | string) =>
    [...timelineQueryKeys.all, "plan-detail", String(planId)] as const,
};

function galleryEntryFromTimelineAttachment(
  attachment: Parameters<typeof galleryEntryFromAttachment>[0],
): TimelineEventGalleryEntry {
  return galleryEntryFromAttachment(attachment);
}

export async function fetchTimelineEvents(
  filters?: TimelineEventListFilters,
): Promise<TimelineEvent[]> {
  const params = new URLSearchParams();
  if (filters?.contactId != null) {
    params.set("contact_id", String(filters.contactId));
  }
  if (filters?.contactIds?.length) {
    for (const contactId of filters.contactIds) {
      params.append("contact_ids", String(contactId));
    }
  }
  if (filters?.figureIds?.length) {
    for (const figureId of filters.figureIds) {
      params.append("figure_ids", String(figureId));
    }
  }
  if (filters?.query?.trim()) {
    params.set("query", filters.query.trim());
  }
  if (filters?.subjectName?.trim()) {
    params.set("subject_name", filters.subjectName.trim());
  }
  if (filters?.startDateFrom) {
    params.set("start_date_from", filters.startDateFrom);
  }
  if (filters?.startDateTo) {
    params.set("start_date_to", filters.startDateTo);
  }
  if (filters?.tagIds?.length) {
    for (const tagId of filters.tagIds) {
      params.append("tag_ids", String(tagId));
    }
  }
  const query = params.toString();
  return apiFetch<TimelineEvent[]>(
    `/timeline/events${query ? `?${query}` : ""}`,
    { credentials },
  );
}

export async function fetchTimelineEvent(eventId: number | string): Promise<TimelineEvent> {
  return apiFetch<TimelineEvent>(`/timeline/events/${eventId}`, { credentials });
}

export async function createTimelineEvent(
  payload: TimelineEventCreatePayload,
): Promise<TimelineEvent> {
  return apiFetch<TimelineEvent>("/timeline/events", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateTimelineEvent(
  eventId: number | string,
  payload: TimelineEventUpdatePayload,
): Promise<TimelineEvent> {
  return apiFetch<TimelineEvent>(`/timeline/events/${eventId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteTimelineEvent(eventId: number | string): Promise<void> {
  await apiFetch<void>(`/timeline/events/${eventId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchTimelineTags(): Promise<TimelineTag[]> {
  return apiFetch<TimelineTag[]>("/timeline/tags", { credentials });
}

export function createTimelineTag(payload: TimelineTagCreatePayload): Promise<TimelineTag> {
  return apiFetch<TimelineTag>("/timeline/tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateTimelineTag(
  tagId: number,
  payload: TimelineTagUpdatePayload,
): Promise<TimelineTag> {
  return apiFetch<TimelineTag>(`/timeline/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteTimelineTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/timeline/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchTimelineEventMedia(
  eventId: number | string,
): Promise<TimelineEventGalleryEntry[]> {
  const attachments = await fetchEntityAttachments("timeline_event", Number(eventId));
  return attachments
    .filter((attachment) => attachment.role === "gallery")
    .map(galleryEntryFromTimelineAttachment);
}

export function deleteTimelineEventMedia(
  _eventId: number | string,
  attachmentId: number,
): Promise<void> {
  return deleteMediaAttachment(attachmentId);
}

export async function attachTimelineEventMediaFromMedia(
  eventId: number | string,
  mediaId: string,
): Promise<TimelineEventGalleryEntry> {
  const attachment = await createMediaAttachment(mediaId, {
    entity_type: "timeline_event",
    entity_id: Number(eventId),
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function uploadTimelineEventMedia(
  eventId: number | string,
  file: File,
): Promise<TimelineEventGalleryEntry> {
  const media = await uploadMedia(file);
  const attachment = await createMediaAttachment(media.id, {
    entity_type: "timeline_event",
    entity_id: Number(eventId),
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export type TimelinePlanItemStatus = "planned" | "done" | "skipped";

export type TimelinePlanItem = {
  id: number;
  user_id: number;
  plan_id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  sort_order: number;
  status: TimelinePlanItemStatus;
  timeline_event_id: number | null;
  tags: TimelineTag[];
  created_at: string;
  updated_at: string;
};

export type TimelinePlan = {
  id: number;
  user_id: number;
  title: string;
  start_date: string;
  end_date: string;
  notes: string;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type TimelinePlanDetail = TimelinePlan & {
  items: TimelinePlanItem[];
};

export type TimelinePlanCreatePayload = {
  title: string;
  start_date: string;
  end_date: string;
  notes?: string;
};

export type TimelinePlanUpdatePayload = {
  title?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
};

export type TimelinePlanItemCreatePayload = {
  title: string;
  description?: string;
  start_at: string;
  end_at?: string | null;
  all_day?: boolean;
  sort_order?: number;
  status?: TimelinePlanItemStatus;
  tag_ids?: number[];
};

export type TimelinePlanItemUpdatePayload = {
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string | null;
  all_day?: boolean;
  sort_order?: number;
  status?: TimelinePlanItemStatus;
  tag_ids?: number[];
};

export type TimelinePlanListFilters = {
  startDateFrom?: string | null;
  startDateTo?: string | null;
};

export type TimelineCalendarFeed = {
  events: TimelineEvent[];
  plan_items: TimelinePlanItem[];
};

export async function fetchTimelineCalendarFeed(
  start: string,
  end: string,
): Promise<TimelineCalendarFeed> {
  const params = new URLSearchParams({ start, end });
  return apiFetch<TimelineCalendarFeed>(`/timeline/calendar?${params.toString()}`, {
    credentials,
  });
}

export async function fetchTimelinePlans(
  filters?: TimelinePlanListFilters,
): Promise<TimelinePlan[]> {
  const params = new URLSearchParams();
  if (filters?.startDateFrom) {
    params.set("start_date_from", filters.startDateFrom);
  }
  if (filters?.startDateTo) {
    params.set("start_date_to", filters.startDateTo);
  }
  const query = params.toString();
  return apiFetch<TimelinePlan[]>(`/timeline/plans${query ? `?${query}` : ""}`, { credentials });
}

export async function fetchTimelinePlan(planId: number | string): Promise<TimelinePlanDetail> {
  return apiFetch<TimelinePlanDetail>(`/timeline/plans/${planId}`, { credentials });
}

export async function createTimelinePlan(payload: TimelinePlanCreatePayload): Promise<TimelinePlan> {
  return apiFetch<TimelinePlan>("/timeline/plans", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateTimelinePlan(
  planId: number | string,
  payload: TimelinePlanUpdatePayload,
): Promise<TimelinePlan> {
  return apiFetch<TimelinePlan>(`/timeline/plans/${planId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteTimelinePlan(planId: number | string): Promise<void> {
  await apiFetch<void>(`/timeline/plans/${planId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function createTimelinePlanItem(
  planId: number | string,
  payload: TimelinePlanItemCreatePayload,
): Promise<TimelinePlanItem> {
  return apiFetch<TimelinePlanItem>(`/timeline/plans/${planId}/items`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateTimelinePlanItem(
  itemId: number | string,
  payload: TimelinePlanItemUpdatePayload,
): Promise<TimelinePlanItem> {
  return apiFetch<TimelinePlanItem>(`/timeline/plan-items/${itemId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteTimelinePlanItem(itemId: number | string): Promise<void> {
  await apiFetch<void>(`/timeline/plan-items/${itemId}`, {
    method: "DELETE",
    credentials,
  });
}

export type TimelinePlanItemReorderPayload = {
  sort_order: number;
};

export async function reorderTimelinePlanItem(
  itemId: number | string,
  payload: TimelinePlanItemReorderPayload,
): Promise<TimelinePlanItem> {
  return apiFetch<TimelinePlanItem>(`/timeline/plan-items/${itemId}/reorder`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function promoteTimelinePlanItem(itemId: number | string): Promise<TimelinePlanItem> {
  return apiFetch<TimelinePlanItem>(`/timeline/plan-items/${itemId}/promote`, {
    method: "POST",
    credentials,
  });
}
