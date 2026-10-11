// keel_web/src/app/shell/AppShellWallpaper.tsx

// Optional user wallpaper behind authenticated shell content (below breadcrumb).

import { useEffect, useState } from "react";

import { buildMediaContentUrl } from "../../modules/media/api";
import { useBackgroundSettings } from "../../modules/settings/components/context";

export function AppShellWallpaper() {
  const { enabled, mediaId, mediaUpdatedAt } = useBackgroundSettings();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [mediaId, mediaUpdatedAt]);

  if (!enabled || !mediaId || loadFailed) {
    return null;
  }

  const imageUrl = buildMediaContentUrl(mediaId, mediaUpdatedAt);

  return (
    <div
      aria-hidden
      className="app-shell-wallpaper pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: `url("${imageUrl}")` }}
    >
      <img
        src={imageUrl}
        alt=""
        className="hidden"
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}
