// keel_web/src/modules/coak/api/queryKeys.ts

import type { CoakRecord } from "./types";

export const coakQueryKeys = {
  all: ["coak"] as const,
  records: () => [...coakQueryKeys.all, "records"] as const,
  record: (recordId: number | string) =>
    [...coakQueryKeys.all, "record", String(recordId)] as const,
  items: (recordId: number | string) =>
    [...coakQueryKeys.all, "items", String(recordId)] as const,
  workspaceState: (recordId: number | string) =>
    [...coakQueryKeys.all, "workspace-state", String(recordId)] as const,
  workspaceSettings: (recordId: number | string) =>
    [...coakQueryKeys.all, "workspace-settings", String(recordId)] as const,
  configurationSettings: (recordId: number | string) =>
    [...coakQueryKeys.all, "configuration-settings", String(recordId)] as const,
  tags: (recordId: number | string) =>
    [...coakQueryKeys.all, "tags", String(recordId)] as const,
};

export function coakRecordPath(record: Pick<CoakRecord, "id">): string {
  return `/coak/${record.id}`;
}
