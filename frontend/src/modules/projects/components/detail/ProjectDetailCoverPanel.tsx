// keel_web/src/modules/projects/components/detail/ProjectDetailCoverPanel.tsx

// Borderless cover preview for the project detail layout (image or interactive 3D).

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { HERO_STL_VIEWER_OPTIONS } from "../../../../lib/stl-viewer";
import type { Project } from "../../api";
import {
  inferMediaKindFromFile,
  isCoverEligiblePendingFile,
} from "../../lib/project/media";
import {
  projectMediaKindLabel,
  projectMediaKindPillClass,
} from "../../lib/project/media";
import { isImageCoverProject } from "../../lib/project/appearance";
import {
  CoverImageFrame,
  PROJECT_COVER_IMAGE_CLASS,
  PROJECT_COVER_IMAGE_FRAME_CLASS,
  ProjectCoverImage,
  ProjectCoverModelGlow,
  ProjectCoverStl,
} from "../cover";
import { CoverImagePanSurface } from "./CoverImagePanSurface";
import { ProjectDetailCoverImageFraming } from "./ProjectDetailCoverImageFraming";

type ProjectDetailCoverPanelProps = {
  project: Project;
  localCoverFile?: File | null;
  coverImageScale?: number;
  coverImagePositionX?: number;
  coverImagePositionY?: number;
  onCoverImageScaleChange?: (nextScale: number) => void;
  onCoverImagePositionChange?: (nextX: number, nextY: number) => void;
  framingDisabled?: boolean;
  className?: string;
};

function CoverFallback() {
  return <div className="h-full w-full" aria-hidden />;
}

function LocalCoverImage({
  file,
  className,
  frameScale,
  framePositionX,
  framePositionY,
}: {
  file: File;
  className?: string;
  frameScale?: number;
  framePositionX?: number;
  framePositionY?: number;
}) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (failed) {
    return <CoverFallback />;
  }

  const image = (
    <img
      src={previewUrl}
      alt=""
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
    />
  );

  if (
    frameScale === undefined &&
    framePositionX === undefined &&
    framePositionY === undefined
  ) {
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

function LocalCoverPlaceholder({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const mediaKind = inferMediaKindFromFile(file);

  return (
    <div
      className={[
        "flex h-full min-h-[inherit] w-full flex-col items-center justify-center bg-gradient-to-br from-stone-800/80 via-stone-900 to-stone-950 px-4 text-center",
        className ?? "",
      ].join(" ")}
    >
      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
          projectMediaKindPillClass(mediaKind),
        ].join(" ")}
      >
        {projectMediaKindLabel(mediaKind)}
      </span>
      <p className="mt-3 text-sm text-stone-500">
        Cover preview available after Create
      </p>
    </div>
  );
}

function ImageCoverPreview({
  children,
  showFraming,
  coverImageScale,
  coverImagePositionX,
  coverImagePositionY,
  onCoverImageScaleChange,
  onCoverImagePositionChange,
  framingDisabled,
  className,
}: {
  children: ReactNode;
  showFraming: boolean;
  coverImageScale: number;
  coverImagePositionX: number;
  coverImagePositionY: number;
  onCoverImageScaleChange?: (nextScale: number) => void;
  onCoverImagePositionChange?: (nextX: number, nextY: number) => void;
  framingDisabled?: boolean;
  className?: string;
}) {
  const panEnabled =
    showFraming && Boolean(onCoverImagePositionChange) && !framingDisabled;

  const coverContent =
    panEnabled && onCoverImagePositionChange ? (
      <CoverImagePanSurface
        positionX={coverImagePositionX}
        positionY={coverImagePositionY}
        scale={coverImageScale}
        disabled={framingDisabled}
        onPositionChange={onCoverImagePositionChange}
      >
        {children}
      </CoverImagePanSurface>
    ) : (
      children
    );

  return (
    <div
      className={[
        "relative min-h-[200px] overflow-hidden sm:min-h-[240px]",
        className ?? "",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 overflow-hidden",
          PROJECT_COVER_IMAGE_FRAME_CLASS,
        ].join(" ")}
      >
        {coverContent}
      </div>
      {showFraming && onCoverImageScaleChange && (
        <ProjectDetailCoverImageFraming
          scale={coverImageScale}
          disabled={framingDisabled}
          onScaleChange={onCoverImageScaleChange}
        />
      )}
    </div>
  );
}

export function ProjectDetailCoverPanel({
  project,
  localCoverFile = null,
  coverImageScale = 1,
  coverImagePositionX = 50,
  coverImagePositionY = 50,
  onCoverImageScaleChange,
  onCoverImagePositionChange,
  framingDisabled = false,
  className,
}: ProjectDetailCoverPanelProps) {
  const showImageFraming =
    Boolean(onCoverImageScaleChange) &&
    Boolean(onCoverImagePositionChange) &&
    (isImageCoverProject(project) ||
      (localCoverFile !== null &&
        inferMediaKindFromFile(localCoverFile) === "image"));

  if (localCoverFile && isCoverEligiblePendingFile(localCoverFile)) {
    const localKind = inferMediaKindFromFile(localCoverFile);

    if (localKind === "image") {
      return (
        <ImageCoverPreview
          showFraming={showImageFraming}
          coverImageScale={coverImageScale}
          coverImagePositionX={coverImagePositionX}
          coverImagePositionY={coverImagePositionY}
          onCoverImageScaleChange={onCoverImageScaleChange}
          onCoverImagePositionChange={onCoverImagePositionChange}
          framingDisabled={framingDisabled}
          className={className}
        >
          <LocalCoverImage
            file={localCoverFile}
            frameScale={coverImageScale}
            framePositionX={coverImagePositionX}
            framePositionY={coverImagePositionY}
            className={PROJECT_COVER_IMAGE_CLASS}
          />
        </ImageCoverPreview>
      );
    }

    if (localKind === "model_3d") {
      return (
        <div
          className={[
            "relative flex min-h-[220px] items-center justify-center overflow-visible sm:min-h-[260px]",
            className ?? "",
          ].join(" ")}
        >
          <ProjectCoverModelGlow
            colorHex={project.cover_glow_color_hex}
            variant="hero"
          />
          <div className="relative z-10 aspect-square w-full max-w-[360px]">
            <LocalCoverPlaceholder file={localCoverFile} className="rounded-lg" />
          </div>
        </div>
      );
    }
  }

  const isModelCover =
    project.cover_media_kind === "model_3d" && project.cover_media_id !== null;

  if (!project.has_cover) {
    return (
      <div
        className={[
          "flex min-h-[180px] items-center justify-center text-sm text-stone-600",
          className ?? "",
        ].join(" ")}
      >
        No cover set
      </div>
    );
  }

  if (isModelCover && project.id > 0) {
    return (
      <div
        className={[
          "relative flex min-h-[220px] items-center justify-center overflow-visible sm:min-h-[260px]",
          className ?? "",
        ].join(" ")}
      >
        <ProjectCoverModelGlow
          colorHex={project.cover_glow_color_hex}
          variant="hero"
        />
        <div className="relative z-10 aspect-square w-full max-w-[360px]">
          <ProjectCoverStl
            projectId={project.id}
            coverMediaId={project.cover_media_id!}
            coverUpdatedAt={project.cover_updated_at}
            modelColorHex={project.cover_model_color_hex}
            modelBrightness={project.cover_model_brightness}
            fallback={<CoverFallback />}
            bare
            viewerOptions={HERO_STL_VIEWER_OPTIONS}
            className="h-full w-full cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>
    );
  }

  if (project.id > 0) {
    return (
      <ImageCoverPreview
        showFraming={showImageFraming}
        coverImageScale={coverImageScale}
        coverImagePositionX={coverImagePositionX}
        coverImagePositionY={coverImagePositionY}
        onCoverImageScaleChange={onCoverImageScaleChange}
        onCoverImagePositionChange={onCoverImagePositionChange}
        framingDisabled={framingDisabled}
        className={className}
      >
        <ProjectCoverImage
          projectId={project.id}
          coverMediaId={project.cover_media_id}
          hasCover={project.has_cover}
          coverUpdatedAt={project.cover_updated_at}
          frameScale={coverImageScale}
          framePositionX={coverImagePositionX}
          framePositionY={coverImagePositionY}
          alt=""
          fallback={<CoverFallback />}
          bare
        />
      </ImageCoverPreview>
    );
  }

  return (
    <div
      className={[
        "flex min-h-[180px] items-center justify-center text-sm text-stone-600",
        className ?? "",
      ].join(" ")}
    >
      No cover set
    </div>
  );
}
