// Refcounted blob URL cache so credentialed media fetches are not revoked while still in use.

import { useEffect, useState } from "react";

type CacheEntry = {
  url: string;
  refcount: number;
  blob: Blob;
};

const cache = new Map<string, CacheEntry>();

export function projectMediaBlobUrlKey(mediaId: string): string {
  return mediaId;
}

function replaceEntry(key: string, blob: Blob): string {
  const existing = cache.get(key);
  if (existing && existing.blob === blob) {
    return existing.url;
  }
  if (existing) {
    URL.revokeObjectURL(existing.url);
    cache.delete(key);
  }
  const url = URL.createObjectURL(blob);
  cache.set(key, { url, refcount: 0, blob });
  return url;
}

/** Hold a stable object URL for one project media blob; pair with {@link releaseProjectMediaObjectUrl}. */
export function retainProjectMediaObjectUrl(
  mediaId: string,
  blob: Blob,
): string {
  const key = projectMediaBlobUrlKey(mediaId);
  const url = replaceEntry(key, blob);
  const entry = cache.get(key);
  if (entry) {
    entry.refcount += 1;
  }
  return url;
}

export function releaseProjectMediaObjectUrl(mediaId: string): void {
  const key = projectMediaBlobUrlKey(mediaId);
  const entry = cache.get(key);
  if (!entry) {
    return;
  }
  entry.refcount -= 1;
  if (entry.refcount <= 0) {
    URL.revokeObjectURL(entry.url);
    cache.delete(key);
  }
}

/**
 * React hook: stable blob URL for one project media item (shared across canvas + files UI).
 */
export function useProjectMediaObjectUrl(
  mediaId: string,
  blob: Blob | undefined,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob || !mediaId) {
      setUrl(null);
      return;
    }

    const next = retainProjectMediaObjectUrl(mediaId, blob);
    setUrl(next);

    return () => {
      releaseProjectMediaObjectUrl(mediaId);
      setUrl(null);
    };
  }, [blob, mediaId]);

  return url;
}
