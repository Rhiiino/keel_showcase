// keel_web/src/hooks/keelPersona/useKeelClipMediaReady.ts

import { useEffect, useState } from "react";

import { getKeelClip } from "../../lib/keelPersona/clipRegistry";
import { resolveKeelClipMediaUrls } from "../../lib/keelPersona/clipMediaPreload";
import { KEEL_PERSONA_PROMOTED_ELEMENTS } from "../../lib/keelPersona/promotedDesign";
import { preloadKeelPersonaMediaUrls } from "../../lib/keelPersona/preloadKeelPersonaMedia";

export function useKeelClipMediaReady(clipId: string, enabled = true): boolean {
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    const clip = getKeelClip(clipId);
    if (!clip) {
      setReady(true);
      return;
    }

    const urls = resolveKeelClipMediaUrls(clip, KEEL_PERSONA_PROMOTED_ELEMENTS);

    void preloadKeelPersonaMediaUrls(urls)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clipId, enabled]);

  return ready;
}
