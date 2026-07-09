// keel_web/src/lib/keelPersona/preloadKeelPersonaMedia.ts

import { KEEL_PERSONA_PRELOAD_MEDIA } from "./mediaAssets";

const PRELOAD_TIMEOUT_MS = 4000;

let preloadPromise: Promise<void> | null = null;
const preloadedUrls = new Set<string>();

function preloadImage(src: string): Promise<void> {
  if (preloadedUrls.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      preloadedUrls.add(src);
      resolve();
    }, PRELOAD_TIMEOUT_MS);

    image.onload = () => {
      window.clearTimeout(timeoutId);
      preloadedUrls.add(src);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error(`Failed to preload Keel Persona media: ${src}`));
    };
    image.src = src;
  });
}

export function preloadKeelPersonaMediaUrls(urls: readonly string[]): Promise<void> {
  const pending = urls.filter((url) => !preloadedUrls.has(url));
  if (pending.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(pending.map(preloadImage)).then(() => undefined);
}

export function preloadKeelPersonaMedia(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = preloadKeelPersonaMediaUrls(KEEL_PERSONA_PRELOAD_MEDIA);
  }

  return preloadPromise;
}
