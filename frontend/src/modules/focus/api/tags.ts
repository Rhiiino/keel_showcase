// keel_web/src/modules/focus/api/tags.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";
import type { FocusTag, FocusTagCreatePayload, FocusTagUpdatePayload } from "./types";

export async function fetchFocusTags(): Promise<FocusTag[]> {
  return apiFetch<FocusTag[]>("/focus/tags", { credentials });
}

export async function createFocusTag(
  payload: FocusTagCreatePayload,
): Promise<FocusTag> {
  return apiFetch<FocusTag>("/focus/tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateFocusTag(
  tagId: number,
  payload: FocusTagUpdatePayload,
): Promise<FocusTag> {
  return apiFetch<FocusTag>(`/focus/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteFocusTag(tagId: number): Promise<void> {
  await apiFetch<void>(`/focus/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}
