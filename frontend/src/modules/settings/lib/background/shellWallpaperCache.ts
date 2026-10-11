// Cache the shell wallpaper as bytes so the mobile/desktop loading screen can
// paint it without a live authenticated media request (CSS url() often 401s).

/** Keep in sync with the inline bootstrap in index.html. */
export const SHELL_WALLPAPER_CACHE_NAME = "keel-shell-wallpaper-v1";
/** Synthetic same-origin key used inside the Cache Storage bucket. */
export const SHELL_WALLPAPER_CACHE_REQUEST = "/__keel_shell_wallpaper__";

function wallpaperCacheAvailable(): boolean {
  return typeof window !== "undefined" && typeof caches !== "undefined";
}

export async function clearCachedShellWallpaper(): Promise<void> {
  if (!wallpaperCacheAvailable()) {
    return;
  }

  try {
    await caches.delete(SHELL_WALLPAPER_CACHE_NAME);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export async function writeCachedShellWallpaper(
  sourceUrl: string,
  blob: Blob,
): Promise<void> {
  if (!wallpaperCacheAvailable() || !sourceUrl || blob.size === 0) {
    return;
  }

  try {
    const cache = await caches.open(SHELL_WALLPAPER_CACHE_NAME);
    const headers = new Headers({
      "Content-Type": blob.type || "image/jpeg",
      "X-Keel-Wallpaper-Source": sourceUrl,
    });
    await cache.put(
      SHELL_WALLPAPER_CACHE_REQUEST,
      new Response(blob, { status: 200, headers }),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** Return a blob: object URL for the cached wallpaper, or null. */
export async function readCachedShellWallpaperObjectUrl(): Promise<string | null> {
  if (!wallpaperCacheAvailable()) {
    return null;
  }

  try {
    const cache = await caches.open(SHELL_WALLPAPER_CACHE_NAME);
    const response = await cache.match(SHELL_WALLPAPER_CACHE_REQUEST);
    if (!response || !response.ok) {
      return null;
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      return null;
    }
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Prefer Cache Storage; otherwise credentialed-fetch the API media URL and
 * refresh the cache. Returns a blob: object URL suitable for CSS backgrounds.
 */
export async function resolveShellWallpaperObjectUrl(
  sourceUrl: string | null | undefined,
): Promise<string | null> {
  const cached = await readCachedShellWallpaperObjectUrl();
  if (cached) {
    return cached;
  }

  if (!sourceUrl || typeof fetch === "undefined") {
    return null;
  }

  try {
    const response = await fetch(sourceUrl, {
      credentials: "include",
      mode: "cors",
    });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      return null;
    }
    await writeCachedShellWallpaper(sourceUrl, blob);
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
