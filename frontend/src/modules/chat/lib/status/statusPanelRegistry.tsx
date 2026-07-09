// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelRegistry.tsx

// Ordered list of status panel tabs. Add new entries here to extend the panel.

import {
  STATUS_PANEL_TAB_IDS,
  type StatusPanelTab,
} from "./statusPanelConfig";

export const statusPanelTabs: StatusPanelTab[] = [
  { id: STATUS_PANEL_TAB_IDS.general, label: "General" },
  { id: STATUS_PANEL_TAB_IDS.rules, label: "Rules" },
  { id: STATUS_PANEL_TAB_IDS.log, label: "Log" },
];
