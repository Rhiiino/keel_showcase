// keel_web/src/modules/media/hooks/useMediaPasteUpload.ts

// Queue pasted or dropped files for confirmation on the media browse page.

import { useCallback, useState } from "react";

import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { usePagePaste } from "../../projects/hooks/usePagePaste";

export type MediaUploadQueueSource = "paste" | "drop";

type QueuedMediaUpload = {
  file: File;
  source: MediaUploadQueueSource;
};

type UseMediaPasteUploadOptions = {
  pasteEnabled: boolean;
  dropEnabled: boolean;
  shouldAcceptPaste?: () => boolean;
  shouldAcceptDrop?: () => boolean;
};

export function useMediaPasteUpload({
  pasteEnabled,
  dropEnabled,
  shouldAcceptPaste,
  shouldAcceptDrop,
}: UseMediaPasteUploadOptions) {
  const [queue, setQueue] = useState<QueuedMediaUpload[]>([]);
  const pendingItem = queue[0] ?? null;

  const enqueueFiles = useCallback(
    (files: File[], source: MediaUploadQueueSource) => {
      if (files.length === 0) {
        return;
      }
      setQueue((current) => [
        ...current,
        ...files.map((file) => ({ file, source })),
      ]);
    },
    [],
  );

  usePagePaste({
    enabled: pasteEnabled,
    onPasteFiles: (files) => enqueueFiles(files, "paste"),
    shouldAcceptPaste,
  });

  usePageFileDrop({
    enabled: dropEnabled,
    onDropFiles: (files) => enqueueFiles(files, "drop"),
    shouldAcceptDrop,
  });

  const dismissPending = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return {
    pendingFile: pendingItem?.file ?? null,
    pendingSource: pendingItem?.source ?? null,
    dismissPending,
  };
}
