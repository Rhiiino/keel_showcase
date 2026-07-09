// keel_web/src/modules/projects/components/cover/ProjectCoverImage.tsx

// Loads a project cover via credentialed fetch and renders it as a blob URL.

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  fetchProjectMediaBlob,
  projectsQueryKeys,
} from "../../api";
import { useProjectMediaObjectUrl } from "../../lib/project/media";
import { CoverImageFrame } from "./CoverImageFrame";
import { PROJECT_COVER_IMAGE_CLASS } from "./coverImageDisplay";

type ProjectCoverImageProps = {
  projectId: number;
  coverMediaId: string | null;
  hasCover: boolean;
  coverUpdatedAt: string | null;
  alt: string;
  className?: string;
  fallback: ReactNode;
  /** When true, loading state has no gradient chrome (detail hero). */
  bare?: boolean;
  frameScale?: number | null;
  framePositionX?: number | null;
  framePositionY?: number | null;
};

export function ProjectCoverImage({
  projectId,
  coverMediaId,
  hasCover,
  alt,
  className = PROJECT_COVER_IMAGE_CLASS,
  fallback,
  bare = false,
  frameScale = null,
  framePositionX = null,
  framePositionY = null,
}: ProjectCoverImageProps) {
  const usesMediaCover = hasCover && coverMediaId !== null;

  const mediaBlobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(coverMediaId ?? "none"),
    queryFn: () => fetchProjectMediaBlob(projectId, coverMediaId!),
    enabled: usesMediaCover,
    staleTime: Infinity,
    retry: 2,
  });

  const blob = mediaBlobQuery.data;

  const objectUrl = useProjectMediaObjectUrl(
    coverMediaId ?? "",
    usesMediaCover ? blob : undefined,
  );

  if (!hasCover) {
    return <>{fallback}</>;
  }

  if (mediaBlobQuery.isLoading && !objectUrl) {
    if (bare) {
      return (
        <div
          className={["h-full w-full", className ?? ""].join(" ")}
          aria-hidden
        />
      );
    }

    return (
      <div
        className={[
          "animate-pulse bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950",
          className ?? "",
        ].join(" ")}
        aria-hidden
      />
    );
  }

  if (mediaBlobQuery.isError || !objectUrl) {
    return <>{fallback}</>;
  }

  const image = (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      draggable={false}
    />
  );

  if (frameScale === null && framePositionX === null && framePositionY === null) {
    return image;
  }

  return (
    <CoverImageFrame
      scale={frameScale}
      positionX={framePositionX}
      positionY={framePositionY}
      imageClassName="h-full w-full"
    >
      {image}
    </CoverImageFrame>
  );
}
