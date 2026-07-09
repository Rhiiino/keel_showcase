// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/panel/workspacePanelConfig.ts

// Width and side defaults for the project workspace files panel.

import type { PanelSide } from "../../../../../components/panels/PanelRepositionGrip";

export type WorkspacePanelSide = PanelSide;

export const WORKSPACE_PANEL_DEFAULT_WIDTH = 288;
export const WORKSPACE_PANEL_MIN_WIDTH = 220;
export const WORKSPACE_PANEL_MAX_WIDTH = 520;
export const WORKSPACE_PANEL_DEFAULT_SIDE: WorkspacePanelSide = "right";
