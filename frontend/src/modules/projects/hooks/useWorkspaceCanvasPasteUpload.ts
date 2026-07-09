// keel_web/src/modules/projects/hooks/useWorkspaceCanvasPasteUpload.ts

// Upload pasted files to project media and place matching nodes on the workspace canvas.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import {
  MAX_MEDIA_BYTES,
  projectsQueryKeys,
  uploadProjectMedia,
  type ProjectMedia,
} from "../api";
import type { ProjectFolderTarget } from "../lib/project/media/projectFileFolderDrag";
import { flowPositionForPastedFiles } from "../lib/workspace/canvas";

type UseWorkspaceCanvasPasteUploadOptions = {
  projectId: number;
  pasteUploadTarget: ProjectFolderTarget;
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
  placeMediaNodes: (
    mediaItems: ProjectMedia[],
    positions: { x: number; y: number }[],
  ) => void;
};

export function useWorkspaceCanvasPasteUpload({
  projectId,
  pasteUploadTarget,
  screenToFlowPosition,
  placeMediaNodes,
}: UseWorkspaceCanvasPasteUploadOptions) {
  const queryClient = useQueryClient();
  const pasteInFlightRef = useRef(false);

  const pasteFilesAt = useCallback(
    async (files: File[], clientX: number, clientY: number) => {
      if (pasteInFlightRef.current || files.length === 0) {
        return;
      }

      pasteInFlightRef.current = true;
      try {
        const anchor = screenToFlowPosition({ x: clientX, y: clientY });
        const uploaded: ProjectMedia[] = [];

        for (const file of files) {
          if (file.size > MAX_MEDIA_BYTES) {
            continue;
          }
          try {
            const media = await uploadProjectMedia(
              projectId,
              file,
              pasteUploadTarget.projectFolderId,
            );
            uploaded.push(media);
          } catch {
            // Skip failed uploads; the files panel reflects successful ones.
          }
        }

        if (uploaded.length === 0) {
          return;
        }

        const positions = uploaded.map((_, index) =>
          flowPositionForPastedFiles(anchor, index),
        );
        placeMediaNodes(uploaded, positions);

        void queryClient.invalidateQueries({
          queryKey: projectsQueryKeys.media(projectId),
        });
        void queryClient.invalidateQueries({
          queryKey: projectsQueryKeys.folders(projectId),
        });
      } finally {
        pasteInFlightRef.current = false;
      }
    },
    [
      pasteUploadTarget.projectFolderId,
      placeMediaNodes,
      projectId,
      queryClient,
      screenToFlowPosition,
    ],
  );

  return { pasteFilesAt };
}
