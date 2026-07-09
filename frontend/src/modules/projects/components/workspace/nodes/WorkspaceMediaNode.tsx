// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceMediaNode.tsx

// Canvas node for project media: images, 3D models, video, and file cards.

import {
  NodeToolbar,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useState } from "react";

import {
  fetchProjectMediaBlob,
  projectsQueryKeys,
} from "../../../api";
import { useProjectMediaObjectUrl } from "../../../lib/project/media";
import type { WorkspaceMediaData } from "../../../lib/workspace";
import {
  aspectsAreClose,
  dimensionsForMediaAspect,
  resolveNodePixelSize,
} from "../../../lib/workspace";
import { useWorkspaceNodeConnectedSides } from "../../../hooks/useWorkspaceNodeConnectedSides";
import { useWorkspaceNodeHover } from "../../../hooks/useWorkspaceNodeHover";
import {
  resolveContainerShape,
  WORKSPACE_MEDIA_TITLE_RESERVE,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";
import { HERO_STL_VIEWER_OPTIONS } from "../../../../../lib/stl-viewer";
import { ProjectCoverStl } from "../../cover";
import { resolveNoteColors } from "../../../lib/workspace/node";
import {
  useWorkspaceFilesPanelMediaHighlighted,
  useWorkspaceNodeToolbarVisible,
  useWorkspaceProjectId,
  useWorkspaceRequestSave,
  useWorkspaceSelectNoteColor,
} from "../context/WorkspaceCanvasContext";
import { WorkspaceImageLightbox } from "../overlays/WorkspaceImageLightbox";
import { WorkspaceMediaToolbar } from "./WorkspaceMediaToolbar";
import {
  WorkspaceNodeContainer,
  type WorkspaceNodeMeasuredSize,
} from "./WorkspaceNodeContainer";
import { WorkspaceNodeHandlesLayer } from "./WorkspaceNodeHandlesLayer";
import { WorkspaceNodeResizer } from "./WorkspaceNodeResizer";
import { workspaceNodeShadowClass } from "../../../lib/workspace/node";

function mediaKindLabel(kind: string | undefined): string {
  switch (kind) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "model_3d":
      return "3D model";
    default:
      return "File";
  }
}

function WorkspaceMediaNodeComponent({
  id,
  data,
  selected,
  dragging,
}: NodeProps<Node<WorkspaceMediaData>>) {
  const { getNode, updateNode, updateNodeData } = useReactFlow();
  const requestSave = useWorkspaceRequestSave();
  const onSelectNodeColor = useWorkspaceSelectNoteColor();
  const projectId = useWorkspaceProjectId();
  const { border, fill } = resolveNoteColors(data.color);
  const queryClient = useQueryClient();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [nodeSize, setNodeSize] = useState<WorkspaceNodeMeasuredSize>({
    width: 0,
    height: 0,
  });
  const mediaId = data.media_id;
  const transparent = data.transparent ?? false;
  const hideChrome = data.hideChrome ?? false;
  const containerShape = resolveContainerShape(data.containerShape);
  const connectedSides = useWorkspaceNodeConnectedSides(id);
  const filesPanelHighlighted = useWorkspaceFilesPanelMediaHighlighted(mediaId);
  const toolbarVisible = useWorkspaceNodeToolbarVisible(id, selected);
  const toolbarHiddenWhileDragging = dragging && toolbarVisible;
  const nodePointerHoverEnabled = !dragging;
  const { hovered, onPointerEnter, onPointerLeave } =
    useWorkspaceNodeHover(nodePointerHoverEnabled);
  const resizerVisible = selected || hovered;

  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, mediaId),
    enabled: data.media_kind === "image" && mediaId.length > 0,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const objectUrl = useProjectMediaObjectUrl(
    mediaId,
    blobQuery.data instanceof Blob ? blobQuery.data : undefined,
  );

  const kind = data.media_kind ?? "other";

  const handleImageError = useCallback(() => {
    setImageLoadFailed(true);
    void queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.mediaBlob(mediaId),
    });
  }, [mediaId, queryClient]);

  const syncMediaAspectRatio = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (naturalWidth <= 0 || naturalHeight <= 0) {
        return;
      }

      const aspect = naturalWidth / naturalHeight;
      if (
        typeof data.mediaAspectRatio === "number" &&
        aspectsAreClose(data.mediaAspectRatio, aspect)
      ) {
        return;
      }

      const node = getNode(id);
      if (!node) {
        return;
      }

      const titleReserve =
        !hideChrome && containerShape === "box" ? WORKSPACE_MEDIA_TITLE_RESERVE : 0;

      const { width: currentWidth, height: currentHeight } =
        resolveNodePixelSize(node);
      const contentHeight = Math.max(currentHeight - titleReserve, 1);
      const currentAspect = currentWidth / contentHeight;

      if (aspectsAreClose(currentAspect, aspect)) {
        if (typeof data.mediaAspectRatio !== "number") {
          updateNodeData(id, { mediaAspectRatio: aspect });
        }
        return;
      }

      const minWidth = kind === "model_3d" ? 160 : 120;
      const minContentHeight = kind === "model_3d" ? 120 : 80;
      const { width, height } = dimensionsForMediaAspect(
        aspect,
        currentWidth,
        minWidth,
        minContentHeight,
        titleReserve,
      );

      updateNodeData(id, { mediaAspectRatio: aspect });
      updateNode(id, {
        width,
        height,
        style: { ...node.style, width, height },
      });
      requestSave();
    },
    [
      containerShape,
      data.mediaAspectRatio,
      getNode,
      hideChrome,
      id,
      kind,
      requestSave,
      updateNode,
      updateNodeData,
    ],
  );

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      setImageLoadFailed(false);
      syncMediaAspectRatio(
        event.currentTarget.naturalWidth,
        event.currentTarget.naturalHeight,
      );
    },
    [syncMediaAspectRatio],
  );

  const filename = data.original_filename ?? `Media #${mediaId}`;
  const showTransparencyToggle = kind === "image" || kind === "model_3d";

  const handleToggleTransparent = useCallback(() => {
    updateNodeData(id, { transparent: !transparent });
    requestSave();
  }, [id, transparent, updateNodeData, requestSave]);

  const handleToggleHideChrome = useCallback(() => {
    updateNodeData(id, { hideChrome: !hideChrome });
    requestSave();
  }, [hideChrome, id, updateNodeData, requestSave]);

  const handleSelectContainerShape = useCallback(
    (shape: WorkspaceContainerShape) => {
      updateNodeData(id, { containerShape: shape });
      requestSave();
    },
    [id, updateNodeData, requestSave],
  );

  const handleSelectColor = useCallback(
    (hex: string) => {
      onSelectNodeColor(id, hex);
    },
    [id, onSelectNodeColor],
  );

  return (
    <>
      <NodeToolbar
        isVisible={toolbarVisible}
        position={Position.Top}
        offset={8}
        align="center"
        className={[
          "nodrag nopan",
          toolbarHiddenWhileDragging ? "pointer-events-none opacity-0" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <WorkspaceMediaToolbar
          borderColor={border}
          showTransparency={showTransparencyToggle}
          transparent={transparent}
          hideChrome={hideChrome}
          containerShape={containerShape}
          onSelectColor={handleSelectColor}
          onSelectContainerShape={handleSelectContainerShape}
          onToggleTransparent={handleToggleTransparent}
          onToggleHideChrome={handleToggleHideChrome}
        />
      </NodeToolbar>

      <div
        className="relative h-full w-full"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <WorkspaceNodeContainer
          nodeId={id}
          shape={containerShape}
          contentLayout="media"
          hideChrome={hideChrome}
          selected={selected}
          filesPanelHighlighted={filesPanelHighlighted}
          connectedSides={connectedSides}
          accentColor={border}
          transparent={transparent}
          fillColor={transparent ? "transparent" : fill}
          borderColor={border}
          onSizeChange={setNodeSize}
          chromeClassName={
            !hideChrome && containerShape === "box"
              ? workspaceNodeShadowClass(selected, hideChrome)
              : undefined
          }
          bottomLabel={
            !hideChrome ? (
              <p className="truncate text-center text-[10px] leading-tight text-stone-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                {filename}
              </p>
            ) : undefined
          }
        >
      {kind === "image" && (
        <div className="pointer-events-none flex h-full w-full min-h-0 min-w-0 items-center justify-center">
          <div
            className="flex h-full w-full min-h-0 min-w-0 cursor-zoom-in items-center justify-center pointer-events-auto"
            onDoubleClick={() => objectUrl && setLightboxOpen(true)}
          >
          {objectUrl && !imageLoadFailed ? (
            <img
              src={objectUrl}
              alt={filename}
              className="h-full w-full object-contain object-center"
              draggable={false}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : blobQuery.isError || imageLoadFailed ? (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-red-400">
              Could not load image
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-stone-500">
              Loading…
            </div>
          )}
          </div>
        </div>
      )}

      {kind === "model_3d" && (
        <div className="pointer-events-none h-full w-full min-h-0 min-w-0">
          <ProjectCoverStl
            projectId={projectId}
            coverMediaId={mediaId}
            coverUpdatedAt={null}
            bare
            passThroughPointerEvents
            viewerOptions={HERO_STL_VIEWER_OPTIONS}
            className="h-full w-full min-h-0 min-w-0"
            fallback={
              <div className="flex h-full items-center justify-center text-xs text-stone-500">
                Loading model…
              </div>
            }
          />
        </div>
      )}

      {kind === "video" && (
        <div className="pointer-events-none h-full w-full min-h-0 min-w-0">
          <WorkspaceVideoPreview
            projectId={projectId}
            mediaId={mediaId}
            mimeType={data.mime_type}
            onAspectRatioKnown={syncMediaAspectRatio}
          />
        </div>
      )}

      {kind !== "image" && kind !== "model_3d" && kind !== "video" && (
        <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-2 p-4 pb-8 text-center">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-stone-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {hideChrome ? (
            <p className="line-clamp-2 text-xs text-stone-300">{filename}</p>
          ) : null}
          <span className="text-[10px] uppercase tracking-wide text-stone-500">
            {mediaKindLabel(kind)}
          </span>
        </div>
      )}

      {lightboxOpen && objectUrl && (
        <WorkspaceImageLightbox
          src={objectUrl}
          alt={filename}
          onClose={() => setLightboxOpen(false)}
        />
      )}
        </WorkspaceNodeContainer>

        <WorkspaceNodeHandlesLayer
          nodeId={id}
          selected={selected && !dragging}
          hideChrome={hideChrome}
          containerShape={containerShape}
          nodeSize={nodeSize}
          hovered={hovered}
        />

        <WorkspaceNodeResizer
          minWidth={kind === "model_3d" ? 160 : 120}
          minHeight={kind === "model_3d" ? 120 : 80}
          isVisible={resizerVisible}
          interactive={!dragging}
          keepAspectRatio={kind === "image" || kind === "video"}
          shape={containerShape}
          width={nodeSize.width}
          height={nodeSize.height}
        />
      </div>
    </>
  );
}

function WorkspaceVideoPreview({
  projectId,
  mediaId,
  mimeType,
  onAspectRatioKnown,
}: {
  projectId: number;
  mediaId: string;
  mimeType?: string;
  onAspectRatioKnown: (width: number, height: number) => void;
}) {
  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, mediaId),
    enabled: mediaId.length > 0,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const objectUrl = useProjectMediaObjectUrl(
    mediaId,
    blobQuery.data instanceof Blob ? blobQuery.data : undefined,
  );

  if (blobQuery.isError) {
    return (
      <div className="flex h-full items-center justify-center px-2 text-center text-xs text-red-400">
        Could not load video
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-stone-500">
        Loading video…
      </div>
    );
  }

  return (
    <video
      src={objectUrl}
      controls
      className="pointer-events-auto h-full w-full object-contain object-center bg-black"
      preload="metadata"
      onLoadedMetadata={(event) => {
        onAspectRatioKnown(
          event.currentTarget.videoWidth,
          event.currentTarget.videoHeight,
        );
      }}
    >
      {mimeType && <source src={objectUrl} type={mimeType} />}
    </video>
  );
}

export const WorkspaceMediaNode = memo(WorkspaceMediaNodeComponent);
