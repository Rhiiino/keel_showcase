// keel_web/src/app/shell/AppShellWallpaper.tsx

// Optional user wallpaper behind authenticated shell content (below breadcrumb).
// Uses a credentialed blob URL (media requires auth) and caches bytes for the
// pre-React loading bootstrap. Clears the bootstrap layer once ready to paint.

import { useEffect, useState } from "react";

import { fetchMediaBlob, buildMediaContentUrl } from "../../modules/media/api";
import { useBackgroundSettings } from "../../modules/settings/components/context";
import {
  clearShellWallpaperBootstrap,
  writeCachedShellWallpaper,
} from "../../modules/settings/lib/background";

export function AppShellWallpaper() {
  const { enabled, mediaId, mediaUpdatedAt } = useBackgroundSettings();
  const [loadFailed, setLoadFailed] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const imageUrl =
    enabled && mediaId ? buildMediaContentUrl(mediaId, mediaUpdatedAt) : null;

  useEffect(() => {
    if (!imageUrl || !mediaId) {
      setLoadFailed(false);
      setObjectUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      clearShellWallpaperBootstrap();
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setLoadFailed(false);

    const clearBootstrap = () => {
      if (!cancelled) {
        clearShellWallpaperBootstrap();
      }
    };

    void fetchMediaBlob(mediaId)
      .then(async (blob) => {
        if (cancelled || blob.size === 0) {
          throw new Error("empty wallpaper blob");
        }
        await writeCachedShellWallpaper(imageUrl, blob);
        if (cancelled) {
          return;
        }
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return createdUrl;
        });
        window.requestAnimationFrame(clearBootstrap);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
        clearBootstrap();
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [imageUrl, mediaId]);

  if (!imageUrl || loadFailed || !objectUrl) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="app-shell-wallpaper pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: `url("${objectUrl}")` }}
    />
  );
}
