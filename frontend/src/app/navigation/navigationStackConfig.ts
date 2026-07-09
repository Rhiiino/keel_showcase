// stack_sandbox/frontend_web/src/app/navigation/navigationStackConfig.ts

// Page-key identifiers for navigation state capture/restore.

export { DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES as DEFAULT_NAVIGATION_STACK_MAX_ENTRIES } from "./breadcrumbMaxEntries";

export const NAVIGATION_PAGE_KEYS = {
  projectWorkspace: "project-workspace",
  agents: "agents",
  chat: "chat",
} as const;

export type NavigationPageKey =
  (typeof NAVIGATION_PAGE_KEYS)[keyof typeof NAVIGATION_PAGE_KEYS];
