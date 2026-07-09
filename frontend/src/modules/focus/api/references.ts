// keel_web/src/modules/focus/api/references.ts

import { apiFetch } from "../../../lib/api";
import { credentials } from "./shared";
import type {
  FocusReferenceSearchResult,
  FocusReferenceSettings,
  FocusReferenceType,
  FocusReferenceDetail,
} from "./types";

export async function fetchFocusReferenceTypes(): Promise<FocusReferenceType[]> {
  return apiFetch<FocusReferenceType[]>("/focus/reference-types", { credentials });
}

export async function searchFocusReferences(
  targetType: string,
  query: string,
): Promise<FocusReferenceSearchResult[]> {
  const params = new URLSearchParams({ type: targetType, q: query });
  return apiFetch<FocusReferenceSearchResult[]>(
    `/focus/references/search?${params.toString()}`,
    { credentials },
  );
}

export async function fetchFocusReferenceDetail(
  targetType: string,
  targetId: string,
): Promise<FocusReferenceDetail> {
  const params = new URLSearchParams({
    type: targetType,
    id: String(targetId),
  });
  return apiFetch<FocusReferenceDetail>(
    `/focus/references/detail?${params.toString()}`,
    { credentials },
  );
}

export async function fetchFocusReferenceSettings(): Promise<FocusReferenceSettings> {
  return apiFetch<FocusReferenceSettings>("/focus/reference-settings", { credentials });
}

export async function updateFocusReferenceSettings(
  reference_enabled_types: string[],
): Promise<FocusReferenceSettings> {
  return apiFetch<FocusReferenceSettings>("/focus/reference-settings", {
    method: "PATCH",
    credentials,
    body: { reference_enabled_types },
  });
}
