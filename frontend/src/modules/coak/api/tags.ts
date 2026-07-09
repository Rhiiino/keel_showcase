// keel_web/src/modules/coak/api/tags.ts

import { apiFetch } from "../../../lib/api";
import type { CoakTag, CoakTagCreatePayload, CoakTagUpdatePayload } from "./types";

const credentials: RequestCredentials = "include";

export async function fetchCoakTags(recordId: number): Promise<CoakTag[]> {
  return apiFetch<CoakTag[]>(`/coak/records/${recordId}/tags`, { credentials });
}

export async function createCoakTag(
  recordId: number,
  payload: CoakTagCreatePayload,
): Promise<CoakTag> {
  return apiFetch<CoakTag>(`/coak/records/${recordId}/tags`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateCoakTag(
  recordId: number,
  tagId: number,
  payload: CoakTagUpdatePayload,
): Promise<CoakTag> {
  return apiFetch<CoakTag>(`/coak/records/${recordId}/tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteCoakTag(recordId: number, tagId: number): Promise<void> {
  return apiFetch<void>(`/coak/records/${recordId}/tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}
