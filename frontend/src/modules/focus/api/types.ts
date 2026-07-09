// keel_web/src/modules/focus/api/types.ts

import type {
  FocusConstellationCanvasTone,
  FocusConstellationConfigPanelPosition,
  FocusConstellationConnectionColor,
  FocusConstellationConnectionStyle,
  FocusConstellationListNodeStyle,
  FocusConstellationNodeShape,
  FocusEntryKind,
  FocusEntryStatus,
  FocusListStatus,
  FocusNodeKind,
  FocusNodeStatus,
} from "../lib/focus";

export type FocusTag = {
  id: number;
  name: string;
  color_hex: string;
};

export type FocusReferenceTarget = {
  target_type: string;
  target_id: string;
  title: string;
  subtitle: string | null;
  is_missing: boolean;
  web_path: string | null;
  mime_type?: string | null;
  media_kind?: string | null;
  content_updated_at?: string | null;
};

export type FocusNode = {
  id: number;
  user_id: number;
  parent_id: number | null;
  kind: FocusNodeKind;
  sort_order: number;
  title: string;
  notes: string | null;
  status: string | null;
  completed_at: string | null;
  work_order: number | null;
  node_color_hex: string | null;
  title_font_key: string | null;
  is_origin: boolean;
  reference_target: FocusReferenceTarget | null;
  show_reference_content: boolean;
  child_count: number;
  tags: FocusTag[];
  children: FocusNode[];
  created_at: string;
  updated_at: string;
};

export type FocusLinkedListSummary = {
  id: number;
  title: string;
  notes: string;
  node_color_hex: string | null;
  title_font_key: string | null;
  entry_count: number;
  work_order: number | null;
  tags: FocusTag[];
};

/** @deprecated Legacy shape — backed by list nodes. */
export type FocusEntry = {
  id: number;
  user_id: number;
  list_id: number;
  kind: FocusEntryKind;
  linked_list_id: number | null;
  linked_list: FocusLinkedListSummary | null;
  title: string;
  notes: string;
  status: string;
  work_order: number | null;
  tags: FocusTag[];
  sort_order: number;
  child_count: number;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  reference_target_type?: string | null;
  reference_target_id?: string | null;
  reference_is_missing?: boolean;
  reference_mime_type?: string | null;
  reference_media_kind?: string | null;
  reference_content_updated_at?: string | null;
  show_reference_content?: boolean;
};

/** @deprecated Legacy shape — backed by list nodes. */
export type FocusList = {
  id: number;
  user_id: number;
  parent_id: number | null;
  title: string;
  notes: string;
  status: string;
  work_order: number | null;
  sort_order: number;
  node_color_hex: string | null;
  title_font_key: string | null;
  is_origin: boolean;
  item_count: number;
  tags: FocusTag[];
  created_at: string;
  updated_at: string;
};

export type FocusListDetail = FocusList & {
  kind: FocusNodeKind;
  reference_target: FocusReferenceTarget | null;
  entries: FocusEntry[];
};

export type FocusListCreatePayload = {
  title: string;
  notes?: string;
  status?: FocusNodeStatus;
  work_order?: number | null;
  sort_order?: number;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  tag_ids?: number[];
  parent_id?: number | null;
};

export type FocusListUpdatePayload = {
  title?: string;
  notes?: string;
  status?: FocusNodeStatus;
  work_order?: number | null;
  sort_order?: number;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  tag_ids?: number[];
  parent_id?: number | null;
};

export type FocusLinkedListCreateInline = {
  notes?: string;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  tag_ids?: number[];
};

export type FocusEntryCreatePayload = {
  title: string;
  list_id: number;
  kind?: FocusEntryKind;
  notes?: string;
  status?: FocusEntryStatus;
  work_order?: number | null;
  sort_order?: number;
  linked_list_id?: number;
  linked_list?: FocusLinkedListCreateInline;
};

export type FocusEntryUpdatePayload = {
  title?: string;
  notes?: string;
  list_id?: number | null;
  status?: FocusEntryStatus;
  work_order?: number | null;
  sort_order?: number;
};

export type FocusEntryReorderEntry = {
  id: number;
  sort_order: number;
};

export type FocusNodeCreatePayload = {
  kind: FocusNodeKind;
  title: string;
  parent_id?: number | null;
  sort_order?: number;
  notes?: string;
  status?: FocusNodeStatus;
  work_order?: number | null;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  is_origin?: boolean;
  tag_ids?: number[];
  reference_target_type?: string;
  reference_target_id?: string;
  show_reference_content?: boolean;
};

export type FocusNodeUpdatePayload = {
  kind?: FocusNodeKind;
  title?: string;
  parent_id?: number | null;
  sort_order?: number;
  notes?: string;
  status?: FocusNodeStatus;
  work_order?: number | null;
  node_color_hex?: string | null;
  title_font_key?: string | null;
  is_origin?: boolean;
  tag_ids?: number[];
  reference_target_type?: string | null;
  reference_target_id?: string | null;
  show_reference_content?: boolean | null;
};

export type FocusNodeTimeEntryStatus = "running" | "paused" | "ended";

export type FocusNodeTimeEntry = {
  id: number;
  user_id: number;
  node_id: number;
  status: FocusNodeTimeEntryStatus;
  started_at: string;
  last_paused_at: string | null;
  ended_at: string | null;
  accumulated_paused_seconds: number;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export type FocusNodeTimerState = {
  node_id: number;
  active_entry: FocusNodeTimeEntry | null;
  elapsed_seconds: number;
};

export type FocusTagCreatePayload = {
  name: string;
  color_hex?: string;
};

export type FocusTagUpdatePayload = {
  name?: string;
  color_hex?: string;
};

export type FocusReferenceType = {
  target_type: string;
  display_name: string;
  user_scoped: boolean;
  enabled: boolean;
};

export type FocusReferenceSearchResult = {
  target_type: string;
  target_id: string;
  title: string;
  subtitle: string | null;
};

export type FocusReferenceProperty = {
  key: string;
  label: string;
  value: string;
};

export type FocusReferenceDetail = {
  target_type: string;
  target_id: string;
  title: string;
  is_missing: boolean;
  properties: FocusReferenceProperty[];
};

export type FocusReferenceSettings = {
  reference_enabled_types: string[];
};

export type FocusConstellationNodePosition = {
  key: string;
  x: number;
  y: number;
};

export type FocusConstellationWorkOrderBadgeAngle = {
  key: string;
  angle: number;
};

export type FocusConstellationViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type FocusConstellationState = {
  state_version: number;
  node_positions: FocusConstellationNodePosition[];
  work_order_badge_angles: FocusConstellationWorkOrderBadgeAngle[];
  expanded_ids: string[];
  standalone_list_ids: number[];
  viewport: FocusConstellationViewport | null;
};

export type FocusConstellationSettingsPayload = {
  node_shape: FocusConstellationNodeShape;
  canvas_tone: FocusConstellationCanvasTone;
  connection_color: FocusConstellationConnectionColor;
  connection_style: FocusConstellationConnectionStyle;
  list_node_style: FocusConstellationListNodeStyle;
  label_font_key: string;
  node_size_multiplier: number;
  title_size_px: number;
  unlink_distance_multiplier: number;
  config_open: boolean;
  config_position: FocusConstellationConfigPanelPosition;
  notes_panel_position: FocusConstellationConfigPanelPosition;
  node_info_enabled: boolean;
};

export type FocusConstellationSettings = FocusConstellationSettingsPayload & {
  persisted: boolean;
};

export type FocusNodeListFilters = {
  parent_id?: number | null;
  roots_only?: boolean;
  kind?: FocusNodeKind;
  kinds?: FocusNodeKind[];
  status?: FocusNodeStatus;
  hub_lists_only?: boolean;
};

export type { FocusListStatus };
