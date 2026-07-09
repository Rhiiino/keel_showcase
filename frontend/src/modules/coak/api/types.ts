// keel_web/src/modules/coak/api/types.ts

export type CoakItemKind = "folder" | "note" | "flash";

export type CoakTag = {
  id: number;
  name: string;
  description: string | null;
  color_hex: string;
  item_count: number;
};

export type CoakTagCreatePayload = {
  name: string;
  description?: string | null;
  color_hex?: string;
};

export type CoakTagUpdatePayload = {
  name?: string;
  description?: string | null;
  color_hex?: string;
};

export type CoakRecord = {
  id: number;
  name: string;
  color_hex: string;
  created_at: string;
  updated_at: string;
};

export type CoakItem = {
  id: number;
  coak_record_id: number;
  parent_id: number | null;
  kind: CoakItemKind;
  name: string;
  color_hex: string;
  sort_order: number;
  media_id: string | null;
  note_body: string;
  flash_front: string;
  flash_back: string;
  tags: CoakTag[];
  created_at: string;
  updated_at: string;
};

export type CoakNodePosition = {
  item_id: number;
  x: number;
  y: number;
  z: number;
};

export type CoakCameraState = {
  distance: number;
  polar_angle: number;
  azimuth_angle: number;
};

export type CoakPanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
};

export type CoakWorkspaceState = {
  state_version: number;
  node_positions: CoakNodePosition[];
  expanded_folder_ids: number[];
  pinned_item_ids: number[];
  camera: CoakCameraState | null;
  persisted: boolean;
};

export type CoakWorkspaceTabId =
  | "constellation"
  | "general"
  | "directory"
  | "tags"
  | "settings";

export type CoakWorkspaceWindow = {
  id: string;
  rect: CoakPanelRect;
  tabs: CoakWorkspaceTabId[];
  active_tab: CoakWorkspaceTabId;
};

export type CoakWorkspaceSettings = {
  /** @deprecated Legacy panel layout — migrated to `windows` on read. */
  panels?: Partial<Record<"constellation" | "directory", CoakPanelRect>>;
  /** @deprecated Legacy z-order — migrated to `window_order` on read. */
  panel_order?: string[];
  windows?: CoakWorkspaceWindow[];
  window_order?: string[];
  persisted: boolean;
};

export type CoakRecordCreatePayload = {
  name: string;
  color_hex?: string | null;
};

export type CoakRecordUpdatePayload = {
  name?: string;
  color_hex?: string | null;
};

export type CoakItemCreatePayload = {
  kind: CoakItemKind;
  name: string;
  parent_id?: number | null;
  color_hex?: string | null;
  sort_order?: number | null;
  media_id?: string | null;
  note_body?: string | null;
  flash_front?: string | null;
  flash_back?: string | null;
  tag_ids?: number[];
};

export type CoakItemUpdatePayload = {
  kind?: CoakItemKind;
  name?: string;
  parent_id?: number | null;
  color_hex?: string | null;
  sort_order?: number | null;
  media_id?: string | null;
  note_body?: string | null;
  flash_front?: string | null;
  flash_back?: string | null;
  tag_ids?: number[] | null;
};

export type CoakWorkspaceStatePayload = {
  state_version: number;
  node_positions: CoakNodePosition[];
  expanded_folder_ids: number[];
  pinned_item_ids: number[];
  camera: CoakCameraState | null;
};

export type CoakWorkspaceSettingsPayload = {
  windows: CoakWorkspaceWindow[];
  window_order: string[];
};

export type CoakConfigurationSettings = {
  settings: Record<string, unknown>;
  persisted: boolean;
};

export type CoakConfigurationSettingsPayload = {
  settings: Record<string, unknown>;
};

export type CoakPanelId = "constellation" | "directory";

export const COAK_WORKSPACE_STATE_VERSION = 2;

export const COAK_ORIGIN_NODE_ID = "origin";

export function coakItemNodeId(itemId: number): string {
  return `item:${itemId}`;
}

export function parseCoakItemNodeId(nodeId: string): number | null {
  if (!nodeId.startsWith("item:")) {
    return null;
  }
  const parsed = Number.parseInt(nodeId.slice("item:".length), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
