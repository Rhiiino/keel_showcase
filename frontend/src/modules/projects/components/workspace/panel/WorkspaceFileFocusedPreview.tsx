// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFileFocusedPreview.tsx

// Expanded image preview for the focused file in the workspace Files panel.

import { useQuery } from "@tanstack/react-query";

import { fetchProjectMediaBlob, projectsQueryKeys } from "../../../api";
import { useProjectMediaObjectUrl } from "../../../lib/project/media";

type WorkspaceFileFocusedPreviewProps = {
  projectId: number;
  mediaId: string;
  filename: string;
};

export function WorkspaceFileFocusedPreview({
  projectId,
  mediaId,
  filename,
}: WorkspaceFileFocusedPreviewProps) {
  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, mediaId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const objectUrl = useProjectMediaObjectUrl(
    mediaId,
    blobQuery.data instanceof Blob ? blobQuery.data : undefined,
  );

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-stone-800/80 bg-gradient-to-br from-stone-950/90 to-stone-900/50 shadow-sm">
      <div className="aspect-[16/10] w-full bg-stone-900/80">
        {blobQuery.isLoading || !objectUrl ? (
          <div className="h-full w-full animate-pulse bg-stone-800/80" aria-hidden />
        ) : blobQuery.isError ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-stone-500">
            Could not load preview.
          </div>
        ) : (
          <img
            src={objectUrl}
            alt={filename}
            className="h-full w-full object-contain"
            draggable={false}
          />
        )}
      </div>
      <p className="truncate px-3 py-2 text-sm font-medium text-stone-300">{filename}</p>
    </div>
  );
}
