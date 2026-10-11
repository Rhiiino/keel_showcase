// Early shell wallpaper bootstrap — mirrors theme's pre-React paint so a stored
// wallpaper is visible before AppShell mounts (avoids a theme-then-wallpaper flash).

import type { ShellBackgroundSettings } from "../../api";
import { buildMediaContentUrl } from "../../../media/api";
import {
  readStoredShellBackground,
  SHELL_BACKGROUND_STORAGE_KEY,
} from "./shellBackgroundSettings";
import {
  clearCachedShellWallpaper,
  resolveShellWallpaperObjectUrl,
} from "./shellWallpaperCache";

export const SHELL_WALLPAPER_URL_STORAGE_KEY = "keel.app.shellBackgroundUrl";
export const SHELL_WALLPAPER_BOOTSTRAP_ELEMENT_ID = "keel-shell-wallpaper-bootstrap";
export const SHELL_LOADING_BOOTSTRAP_ELEMENT_ID = "keel-shell-loading-bootstrap";

/** localStorage key used by the inline index.html script (keep in sync). */
export { SHELL_BACKGROUND_STORAGE_KEY as SHELL_BACKGROUND_STORAGE_KEY_FOR_HTML };

export function buildShellWallpaperUrl(
  settings: Pick<ShellBackgroundSettings, "enabled" | "media_id" | "media_updated_at">,
): string | null {
  if (!settings.enabled || !settings.media_id) {
    return null;
  }
  return buildMediaContentUrl(settings.media_id, settings.media_updated_at);
}

export function readStoredShellWallpaperUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const url = window.localStorage.getItem(SHELL_WALLPAPER_URL_STORAGE_KEY);
    return url && url.trim() ? url.trim() : null;
  } catch {
    return null;
  }
}

export function writeStoredShellWallpaperUrl(url: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!url) {
      window.localStorage.removeItem(SHELL_WALLPAPER_URL_STORAGE_KEY);
      void clearCachedShellWallpaper();
      return;
    }
    window.localStorage.setItem(SHELL_WALLPAPER_URL_STORAGE_KEY, url);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

/** Persist the bootstrap URL from current shell-background settings. */
export function syncStoredShellWallpaperUrl(
  settings: ShellBackgroundSettings = readStoredShellBackground(),
): string | null {
  const url = buildShellWallpaperUrl(settings);
  writeStoredShellWallpaperUrl(url);
  return url;
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

/** Match AppRoutes mobile detection for early wallpaper/loading bootstrap. */
export function isMobileBootstrapClient(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
      return true;
    }
  } catch {
    // ignore
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

function shouldBootstrapShellChrome(pathname: string = window.location.pathname): boolean {
  return !isLoginPath(pathname) || isMobileBootstrapClient();
}

export function preloadShellWallpaper(url: string): void {
  if (typeof window === "undefined" || !url) {
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = url;
}

function cssUrlValue(url: string): string {
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

/** Segmented Keel-green spinner markup for pre-React bootstrap (keep in sync with KeelBrandSpinner). */
function buildShellLoadingSpinnerHtml(): string {
  const segments = Array.from({ length: 12 }, (_, index) => {
    const delay = ((index / 12) * -1.05).toFixed(3);
    const angle = (360 / 12) * index;
    return (
      `<g transform="rotate(${angle} 40 40)">` +
      `<rect class="keel-brand-spinner__segment" style="animation-delay:${delay}s" ` +
      `x="37" y="8" width="6" height="14" rx="3" fill="url(#keelBootstrapSpinnerFill)"/>` +
      `</g>`
    );
  }).join("");

  return (
    `<div class="keel-brand-spinner" style="width:80px;height:80px" role="status" aria-label="Loading">` +
    `<div class="keel-brand-spinner__ring" style="width:100%;height:100%">` +
    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" style="display:block;width:100%;height:100%">` +
    `<defs>` +
    `<linearGradient id="keelBootstrapSpinnerFill" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#d9f99d"/>` +
    `<stop offset="45%" stop-color="#bef264"/>` +
    `<stop offset="100%" stop-color="#34d399"/>` +
    `</linearGradient>` +
    `<filter id="keelBootstrapSpinnerGlow" x="-40%" y="-40%" width="180%" height="180%">` +
    `<feGaussianBlur stdDeviation="1.2" result="blur"/>` +
    `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>` +
    `</defs>` +
    `<circle cx="40" cy="40" r="28" stroke="rgba(190,242,100,0.12)" stroke-width="1.5"/>` +
    `<g filter="url(#keelBootstrapSpinnerGlow)">` +
    segments +
    `</g></svg></div></div>`
  );
}

function markShellLoadingActive(active: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  if (active) {
    document.documentElement.setAttribute("data-shell-loading", "1");
  } else {
    document.documentElement.removeAttribute("data-shell-loading");
  }
}

function paintWallpaperBackground(element: HTMLElement | null, objectUrl: string): void {
  if (!element) {
    return;
  }
  element.style.backgroundSize = "cover";
  element.style.backgroundPosition = "center";
  element.style.backgroundRepeat = "no-repeat";
  element.style.backgroundImage = cssUrlValue(objectUrl);
}

/** Resolve cached/credentialed wallpaper bytes and paint bootstrap layers. */
export function paintShellWallpaperBootstrapLayers(
  sourceUrl: string | null,
): Promise<string | null> {
  if (!sourceUrl || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return resolveShellWallpaperObjectUrl(sourceUrl).then((objectUrl) => {
    if (!objectUrl) {
      return null;
    }
    paintWallpaperBackground(
      document.getElementById(SHELL_WALLPAPER_BOOTSTRAP_ELEMENT_ID),
      objectUrl,
    );
    paintWallpaperBackground(
      document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID),
      objectUrl,
    );
    return objectUrl;
  });
}

/** True when the loading host already has a wallpaper background painted. */
export function shellLoadingBootstrapHasWallpaper(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const host = document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID);
  if (!host) {
    return true;
  }
  const backgroundImage = host.style.backgroundImage;
  return Boolean(backgroundImage && backgroundImage !== "none");
}

/**
 * Wait briefly for wallpaper bytes to paint behind the spinner (cache or fetch).
 * Resolves immediately if there is no wallpaper URL or paint already happened.
 */
export function waitForShellWallpaperBootstrapPaint(timeoutMs = 1200): Promise<void> {
  const sourceUrl =
    typeof window !== "undefined"
      ? window.__KEEL_SHELL_WALLPAPER_URL__ ?? readStoredShellWallpaperUrl()
      : null;

  if (!sourceUrl || shellLoadingBootstrapHasWallpaper()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    const timerId = window.setTimeout(finish, timeoutMs);
    void paintShellWallpaperBootstrapLayers(sourceUrl).finally(() => {
      window.clearTimeout(timerId);
      finish();
    });
  });
}

export function applyShellLoadingBootstrap(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (!shouldBootstrapShellChrome()) {
    clearShellLoadingBootstrap();
    return;
  }

  const existing = document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID);
  if (existing) {
    markShellLoadingActive(true);
    return;
  }

  markShellLoadingActive(true);

  const host = document.createElement("div");
  host.id = SHELL_LOADING_BOOTSTRAP_ELEMENT_ID;
  host.style.cssText =
    "position:fixed;inset:0;z-index:50;display:flex;align-items:center;" +
    "justify-content:center;pointer-events:none;";
  host.innerHTML = buildShellLoadingSpinnerHtml();
  document.body.appendChild(host);
}

export function clearShellLoadingBootstrap(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID)?.remove();
  markShellLoadingActive(false);
}

export function applyShellWallpaperBootstrap(url: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const existing = document.getElementById(SHELL_WALLPAPER_BOOTSTRAP_ELEMENT_ID);
  const allowBootstrap = shouldBootstrapShellChrome();

  if (!url || !allowBootstrap) {
    existing?.remove();
    document.documentElement.removeAttribute("data-shell-wallpaper");
    if (!allowBootstrap) {
      clearShellLoadingBootstrap();
    }
    return;
  }

  window.__KEEL_SHELL_WALLPAPER_URL__ = url;
  document.documentElement.setAttribute("data-shell-wallpaper", "pending");
  applyShellLoadingBootstrap();

  let layer = existing;
  if (!layer) {
    layer = document.createElement("div");
    layer.id = SHELL_WALLPAPER_BOOTSTRAP_ELEMENT_ID;
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:0",
      "pointer-events:none",
      "background-size:cover",
      "background-position:center",
      "background-repeat:no-repeat",
    ].join(";");
    document.body.insertBefore(layer, document.body.firstChild);
  }

  // Paint from Cache Storage / credentialed fetch — bare API urls often 401 as CSS backgrounds.
  paintShellWallpaperBootstrapLayers(url);
}

export function clearShellWallpaperBootstrap(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(SHELL_WALLPAPER_BOOTSTRAP_ELEMENT_ID)?.remove();
  document.documentElement.removeAttribute("data-shell-wallpaper");
}

/**
 * Sync stored URL from settings and apply the pre-React wallpaper layer.
 * Safe to call from main.tsx before React mounts.
 */
export function bootstrapShellWallpaperFromStorage(): string | null {
  const url = syncStoredShellWallpaperUrl();
  applyShellWallpaperBootstrap(url);
  if (shouldBootstrapShellChrome()) {
    applyShellLoadingBootstrap();
  }
  return url;
}
