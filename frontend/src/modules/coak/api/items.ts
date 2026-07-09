// keel_web/src/modules/coak/api/items.ts

import { apiFetch } from "../../../lib/api";
import type { CoakItem, CoakItemCreatePayload, CoakItemUpdatePayload } from "./types";

const credentials: RequestCredentials = "include";



export async function fetchCoakItems(recordId: number): Promise<CoakItem[]> {
  return apiFetch<CoakItem[]>(`/coak/records/${recordId}/items`, { credentials });
}


export async function createCoakItem(
  recordId: number,
  payload: CoakItemCreatePayload,
): Promise<CoakItem> {
  return apiFetch<CoakItem>(`/coak/records/${recordId}/items`, {
    method: "POST",
    credentials,
    body: payload,
  });
}


export async function updateCoakItem(
  recordId: number,
  itemId: number,
  payload: CoakItemUpdatePayload,
): Promise<CoakItem> {
  return apiFetch<CoakItem>(`/coak/records/${recordId}/items/${itemId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}


export async function deleteCoakItem(recordId: number, itemId: number): Promise<void> {
  await apiFetch<void>(`/coak/records/${recordId}/items/${itemId}`, {
    method: "DELETE",
    credentials,
  });
}
