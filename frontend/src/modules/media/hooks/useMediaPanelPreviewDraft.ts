// keel_web/src/modules/media/hooks/useMediaPanelPreviewDraft.ts

// Local panel tile preview state with debounced persistence.

import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaPanelItem } from "../api";
import {
  panelTilePreviewEqual,
  panelTilePreviewFromItem,
  type PanelTilePreview,
} from "../lib/panelTilePreview";

const SAVE_DEBOUNCE_MS = 450;

type UseMediaPanelPreviewDraftOptions = {
  items: MediaPanelItem[];
  onSave: (itemId: string, preview: PanelTilePreview) => void;
};

export function useMediaPanelPreviewDraft({
  items,
  onSave,
}: UseMediaPanelPreviewDraftOptions) {
  const [drafts, setDrafts] = useState<Record<string, PanelTilePreview>>({});
  const timersRef = useRef<Record<string, number>>({});
  const savedRef = useRef<Record<string, PanelTilePreview>>({});

  useEffect(() => {
    const nextSaved: Record<string, PanelTilePreview> = {};
    for (const item of items) {
      nextSaved[item.id] = panelTilePreviewFromItem(item);
    }
    savedRef.current = nextSaved;

    setDrafts((current) => {
      const next: Record<string, PanelTilePreview> = {};
      for (const item of items) {
        const saved = nextSaved[item.id];
        const draft = current[item.id];
        next[item.id] =
          draft && panelTilePreviewEqual(draft, saved) ? saved : (draft ?? saved);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timersRef.current)) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const getPreview = useCallback(
    (item: MediaPanelItem): PanelTilePreview => {
      return drafts[item.id] ?? panelTilePreviewFromItem(item);
    },
    [drafts],
  );

  const updatePreview = useCallback(
    (itemId: string, preview: PanelTilePreview) => {
      setDrafts((current) => ({
        ...current,
        [itemId]: preview,
      }));

      const existingTimer = timersRef.current[itemId];
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer);
      }

      timersRef.current[itemId] = window.setTimeout(() => {
        delete timersRef.current[itemId];
        const saved = savedRef.current[itemId];
        if (saved && panelTilePreviewEqual(saved, preview)) {
          return;
        }
        onSave(itemId, preview);
      }, SAVE_DEBOUNCE_MS);
    },
    [onSave],
  );

  return {
    getPreview,
    updatePreview,
  };
}
