// keel_web/src/modules/coak/lib/panels/coakPanelSettings.ts

import type { CoakPanelId, CoakPanelRect, CoakWorkspaceSettings } from "../../api";

const DEFAULT_PANEL_ORDER: CoakPanelId[] = ["constellation", "directory"];

export function normalizeCoakPanelId(panelId: string): CoakPanelId | null {
  if (panelId === "constellation" || panelId === "directory") {
    return panelId;
  }
  if (panelId === "focus") {
    return "constellation";
  }
  return null;
}

export function normalizeCoakWorkspaceSettings(
  settings: CoakWorkspaceSettings,
): {
  panels: Partial<Record<CoakPanelId, CoakPanelRect>>;
  panel_order: CoakPanelId[];
} {
  const panels: Partial<Record<CoakPanelId, CoakPanelRect>> = {};

  for (const [panelId, rect] of Object.entries(settings.panels ?? {})) {
    const normalizedId = normalizeCoakPanelId(panelId);
    if (normalizedId && rect) {
      panels[normalizedId] = rect;
    }
  }

  const rawOrder = settings.panel_order ?? DEFAULT_PANEL_ORDER;
  const panelOrder: CoakPanelId[] = [];
  for (const panelId of rawOrder) {
    const normalizedId = normalizeCoakPanelId(panelId);
    if (normalizedId && !panelOrder.includes(normalizedId)) {
      panelOrder.push(normalizedId);
    }
  }

  for (const panelId of DEFAULT_PANEL_ORDER) {
    if (!panelOrder.includes(panelId)) {
      panelOrder.push(panelId);
    }
  }

  return {
    panels,
    panel_order: panelOrder,
  };
}
