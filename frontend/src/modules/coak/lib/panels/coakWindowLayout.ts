// keel_web/src/modules/coak/lib/panels/coakWindowLayout.ts

export {
  COAK_ALL_TAB_IDS,
  coakTabLabel,
  createCoakWindowId,
  createDefaultWorkspaceLayout,
  defaultCombinedWindowSize,
  defaultTornOutWindowSize,
  findCoakWindow,
  getCoakWindowZIndex,
  isCoakWorkspaceTabId,
  layoutToWorkspaceSettingsPayload,
  normalizeCoakWorkspaceLayout,
  normalizeWindowOrder,
  removeEmptyWindows,
  sanitizeLayoutForPersist,
  type CoakWorkspaceLayout,
  type CoakWorkspaceTabId,
} from "./coakWorkspaceLayoutModel";
export {
  bringWindowToFrontInLayout,
  mergeWindowsInLayout,
  moveTabBetweenWindowsInLayout,
  reorderTabInLayout,
  setActiveTabInLayout,
  setWindowRectInLayout,
  tearOutTabInLayout,
} from "./coakWorkspaceLayoutOps";
