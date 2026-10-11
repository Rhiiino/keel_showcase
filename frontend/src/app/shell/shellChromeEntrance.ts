// keel_web/src/app/shell/shellChromeEntrance.ts

// Timing for the one-shot AppShell chrome entrance (nav → header → content).

export const SHELL_ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

/** Nav slides in from the left. */
export const SHELL_ENTRANCE_NAV = {
  duration: 0.48,
  delay: 0,
} as const;

/** Breadcrumb/header slides in from the top after the nav. */
export const SHELL_ENTRANCE_HEADER = {
  duration: 0.4,
  delay: 0.4,
} as const;

/** Fixed header height — keep in sync with AppHeader `h-10`. */
export const APP_HEADER_HEIGHT_PX = 40;

/** Page content fades in after the header. */
export const SHELL_ENTRANCE_CONTENT = {
  duration: 0.36,
  delay: 0.74,
} as const;

/** When the centered entrance spinner should start fading out. */
export function shellEntranceSpinnerHideMs(): number {
  return Math.round(SHELL_ENTRANCE_CONTENT.delay * 1000);
}

/** When chrome entrance is fully complete. */
export function shellEntranceCompleteMs(): number {
  return Math.round(
    (SHELL_ENTRANCE_CONTENT.delay + SHELL_ENTRANCE_CONTENT.duration) * 1000,
  );
}
