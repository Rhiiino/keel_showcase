// keel_web/src/modules/home/cards/alive/lib/aliveTimerDisplayModes.ts

// Display mode registry for the home alive-timer card.

export const ALIVE_TIMER_DISPLAY_MODES = [
  "calendar",
  "seconds",
  "days",
] as const;

export type AliveTimerDisplayMode = (typeof ALIVE_TIMER_DISPLAY_MODES)[number];

const MODE_LABELS: Record<AliveTimerDisplayMode, string> = {
  calendar: "Calendar",
  seconds: "Total seconds",
  days: "Total days",
};

const STORAGE_KEY = "home-alive-timer-display-mode";

export function getAliveTimerDisplayModeLabel(mode: AliveTimerDisplayMode): string {
  return MODE_LABELS[mode];
}

export function cycleAliveTimerDisplayMode(
  current: AliveTimerDisplayMode,
): AliveTimerDisplayMode {
  const index = ALIVE_TIMER_DISPLAY_MODES.indexOf(current);
  const nextIndex = (index + 1) % ALIVE_TIMER_DISPLAY_MODES.length;
  return ALIVE_TIMER_DISPLAY_MODES[nextIndex];
}

export function readStoredAliveTimerDisplayMode(): AliveTimerDisplayMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return ALIVE_TIMER_DISPLAY_MODES.includes(stored as AliveTimerDisplayMode)
    ? (stored as AliveTimerDisplayMode)
    : null;
}

export function writeStoredAliveTimerDisplayMode(mode: AliveTimerDisplayMode): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
