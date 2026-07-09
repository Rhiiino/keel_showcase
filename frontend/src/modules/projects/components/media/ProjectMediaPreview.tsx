// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectMediaPreview.tsx

// Lazy-loaded preview for project media cards (image, video, or 3D model).

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { FILE_STL_VIEWER_OPTIONS } from "../../../../lib/stl-viewer";
import {
  fetchProjectMediaBlob,
  projectsQueryKeys,
  type ProjectMedia,
} from "../../api";
import { useProjectMediaObjectUrl } from "../../lib/project/media";
import { ProjectCoverModelGlow, ProjectCoverStl } from "../cover";

export type ProjectCoverAppearancePreview = {
  coverGlowColorHex: string | null;
  coverModelColorHex: string | null;
  coverModelBrightness: number;
};

type ProjectMediaPreviewProps = {
  projectId: number;
  item: ProjectMedia;
  compact?: boolean;
  /** When set, the cover STL uses project appearance (brightness, color, glow). */
  coverAppearance?: ProjectCoverAppearancePreview;
};

function PreviewFallback() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-stone-800/80 via-stone-900 to-stone-950" />
  );
}

function LoadingPreview() {
  return (
    <div className="h-full w-full animate-pulse bg-stone-900" aria-hidden />
  );
}

function ImagePreview({
  mediaId,
  blob,
}: {
  mediaId: string;
  blob: Blob;
}) {
  const objectUrl = useProjectMediaObjectUrl(mediaId, blob);

  if (!objectUrl) {
    return <LoadingPreview />;
  }

  return (
    <img
      src={objectUrl}
      alt=""
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

function VideoPreview({
  mediaId,
  blob,
}: {
  mediaId: string;
  blob: Blob;
}) {
  const objectUrl = useProjectMediaObjectUrl(mediaId, blob);

  if (!objectUrl) {
    return <LoadingPreview />;
  }

  return (
    <video
      src={objectUrl}
      className="h-full w-full object-cover"
      muted
      playsInline
      preload="metadata"
    />
  );
}

export function ProjectMediaPreview({
  projectId,
  item,
  compact = false,
  coverAppearance,
}: ProjectMediaPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shouldFetchBlob =
    isVisible && (item.media_kind === "image" || item.media_kind === "video");

  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(item.mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, item.mediaId),
    enabled: shouldFetchBlob,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  let preview: ReactNode = <PreviewFallback />;

  if (item.media_kind === "model_3d") {
    preview = isVisible ? (
      <div className="relative h-full w-full overflow-hidden">
        {coverAppearance && (
          <ProjectCoverModelGlow
            colorHex={coverAppearance.coverGlowColorHex}
            variant="card"
          />
        )}
        <div className={coverAppearance ? "relative z-[1] h-full w-full" : "h-full w-full"}>
          <ProjectCoverStl
            key={
              coverAppearance
                ? `${item.mediaId}-${coverAppearance.coverModelBrightness}`
                : item.mediaId
            }
            projectId={projectId}
            coverMediaId={item.mediaId}
            coverUpdatedAt={item.updated_at}
            fallback={<PreviewFallback />}
            viewerOptions={FILE_STL_VIEWER_OPTIONS}
            modelColorHex={coverAppearance?.coverModelColorHex}
            modelBrightness={coverAppearance?.coverModelBrightness}
          />
        </div>
      </div>
    ) : (
      <LoadingPreview />
    );
  } else if (item.media_kind === "image" || item.media_kind === "video") {
    if (!isVisible) {
      preview = <LoadingPreview />;
    } else if (blobQuery.isLoading) {
      preview = <LoadingPreview />;
    } else if (blobQuery.isError || !blobQuery.data) {
      preview = <PreviewFallback />;
    } else if (item.media_kind === "image") {
      preview = (
        <ImagePreview mediaId={item.mediaId} blob={blobQuery.data} />
      );
    } else {
      preview = (
        <VideoPreview mediaId={item.mediaId} blob={blobQuery.data} />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative overflow-hidden bg-stone-950",
        compact
          ? "aspect-[16/10] rounded-t-lg ring-inset ring-stone-800/40"
          : "aspect-[4/3] rounded-lg ring-1 ring-stone-800/60",
      ].join(" ")}
    >
      {preview}
    </div>
  );
}
