// keel_web/src/modules/deleted/api.ts

import { apiFetch } from "../../lib/api";

export type DeletedRecord = {
  id: string;
  entity_type: string;
  entity_id: string;
  display_label: string;
  purge_group_id: string | null;
  deleted_at: string;
  expires_at: string;
  permanently_deleted_at: string | null;
};

export type DeletedConfig = {
  retention_days: number;
  purge_schedule_hint: string;
};

export const deletedKeys = {
  all: ["deleted"] as const,
  list: () => [...deletedKeys.all, "list"] as const,
  config: () => [...deletedKeys.all, "config"] as const,
};

export function fetchDeletedRecords(): Promise<DeletedRecord[]> {
  return apiFetch<DeletedRecord[]>("/deleted", {
    credentials: "include",
  });
}

export function fetchDeletedConfig(): Promise<DeletedConfig> {
  return apiFetch<DeletedConfig>("/deleted/config", {
    credentials: "include",
  });
}

export function restoreDeletedRecord(recordId: string): Promise<void> {
  return apiFetch<void>(`/deleted/${recordId}/restore`, {
    method: "POST",
    credentials: "include",
  });
}

export function purgeDeletedRecord(recordId: string): Promise<void> {
  return apiFetch<void>(`/deleted/${recordId}`, {
    method: "DELETE",
    credentials: "include",
  });
}
