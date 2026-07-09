// keel_web/src/modules/home/lib/slideshowInterval.ts

// Resolves how long each home slideshow image stays visible before rotating.

export const DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS = 8;
export const MIN_HOME_SLIDESHOW_INTERVAL_SECONDS = 2;
export const MAX_HOME_SLIDESHOW_INTERVAL_SECONDS = 60;

export function resolveHomeSlideshowIntervalSeconds(
  value: number | null | undefined,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_HOME_SLIDESHOW_INTERVAL_SECONDS,
    Math.max(MIN_HOME_SLIDESHOW_INTERVAL_SECONDS, rounded),
  );
}
