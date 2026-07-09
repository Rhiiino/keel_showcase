// keel_web/src/modules/home/cards/slideshow/lib/homeSlideshowSettings.ts

// Normalizes home slideshow preference data from settings.

import type { HomeSlideshowSettings } from "../../../../settings/api";
import {
  DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS,
  resolveHomeSlideshowIntervalSeconds,
} from "../../../lib/slideshowInterval";

export type HomeSlideshowPrefs = {
  mediaIds: string[];
  intervalSeconds: number;
  paused: boolean;
  pausedMediaId: string | null;
};

export function resolveInitialSlideshowIndex(
  mediaIds: string[],
  paused: boolean,
  pausedMediaId: string | null | undefined,
): number {
  if (mediaIds.length === 0) {
    return 0;
  }
  if (paused && pausedMediaId) {
    const index = mediaIds.indexOf(pausedMediaId);
    if (index >= 0) {
      return index;
    }
  }
  return 0;
}

export function parseHomeSlideshowSettings(
  value: HomeSlideshowSettings | null | undefined,
): HomeSlideshowPrefs {
  const rawIds = value?.media_ids;
  const mediaIds =
    Array.isArray(rawIds) && rawIds.every((id) => typeof id === "string")
      ? rawIds.filter((id) => id.trim().length > 0)
      : [];

  const pausedMediaIdRaw = value?.paused_media_id;
  const pausedMediaId =
    typeof pausedMediaIdRaw === "string" && pausedMediaIdRaw.trim().length > 0
      ? pausedMediaIdRaw.trim()
      : null;

  return {
    mediaIds,
    intervalSeconds: resolveHomeSlideshowIntervalSeconds(value?.interval_seconds),
    paused: value?.paused === true,
    pausedMediaId,
  };
}

export function buildHomeSlideshowPatch(
  mediaIds: string[],
  intervalSeconds: number,
  paused = false,
  pausedMediaId: string | null = null,
): HomeSlideshowSettings {
  const normalizedInterval = resolveHomeSlideshowIntervalSeconds(intervalSeconds);
  const patch: HomeSlideshowSettings = { media_ids: mediaIds };
  if (
    normalizedInterval !== DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS
  ) {
    patch.interval_seconds = normalizedInterval;
  }
  if (paused) {
    patch.paused = true;
    if (pausedMediaId && mediaIds.includes(pausedMediaId)) {
      patch.paused_media_id = pausedMediaId;
    }
  }
  return patch;
}

export function buildHomeSlideshowPausePatch(
  paused: boolean,
  pausedMediaId: string | null = null,
): HomeSlideshowSettings {
  if (!paused) {
    return { paused: false };
  }
  return pausedMediaId
    ? { paused: true, paused_media_id: pausedMediaId }
    : { paused: true };
}
