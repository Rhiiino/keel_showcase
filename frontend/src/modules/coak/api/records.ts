// keel_web/src/modules/coak/api/records.ts

import { apiFetch } from "../../../lib/api";
import type {
  CoakRecord,
  CoakRecordCreatePayload,
  CoakRecordUpdatePayload,
} from "./types";

const credentials: RequestCredentials = "include";



export async function fetchCoakRecords(): Promise<CoakRecord[]> {
  return apiFetch<CoakRecord[]>("/coak/records", { credentials });
}


export async function fetchCoakRecord(recordId: number): Promise<CoakRecord> {
  return apiFetch<CoakRecord>(`/coak/records/${recordId}`, { credentials });
}


export async function createCoakRecord(payload: CoakRecordCreatePayload): Promise<CoakRecord> {
  return apiFetch<CoakRecord>("/coak/records", {
    method: "POST",
    credentials,
    body: payload,
  });
}


export async function updateCoakRecord(
  recordId: number,
  payload: CoakRecordUpdatePayload,
): Promise<CoakRecord> {
  return apiFetch<CoakRecord>(`/coak/records/${recordId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}


export async function deleteCoakRecord(recordId: number): Promise<void> {
  await apiFetch<void>(`/coak/records/${recordId}`, {
    method: "DELETE",
    credentials,
  });
}
