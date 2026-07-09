// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectPendingMediaCard.tsx

// Staged local file card shown before Save on the project detail display view.

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, DragEventHandler } from "react";

import { useMediaRowLongPressDrag } from "../../../media/hooks/useMediaRowLongPressDrag";
import { formatByteSize } from "../../api";
import type { PendingMediaUpload } from "../../lib/project/media";
import {
  inferMediaKindFromFile,
  PROJECT_PENDING_UPLOAD_DRAG_MIME,
} from "../../lib/project/media";
import { ProjectMediaCardMenu } from "./ProjectMediaCardMenu";
import {
  applyProjectItemDragImage,
  ProjectItemDragPreview,
} from "./ProjectItemDragPreview";
import { ProjectMediaDragPreviewContent } from "./ProjectMediaDragPreviewContent";
import {
  PROJECT_MEDIA_CARD_BASE_CLASS,
  PROJECT_MEDIA_CARD_PENDING_ADD_CLASS,
} from "./projectMediaCardStyles";

type ProjectPendingMediaCardProps = {
  item: PendingMediaUpload;
  isCover?: boolean;
  canMakeCover?: boolean;
  onMakeCover?: () => void;
  disabled?: boolean;
  onRemove: () => void;
  isDragging?: boolean;
  onDragStartUpload?: (clientId: string) => void;
  onDragEnd?: () => void;
};

export function ProjectPendingMediaCard({
  item,
  isCover = false,
  canMakeCover = false,
  onMakeCover,
  disabled = false,
  onRemove,
  isDragging = false,
  onDragStartUpload,
  onDragEnd,
}: ProjectPendingMediaCardProps) {
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const mediaKind = inferMediaKindFromFile(item.file);
  const previewUrl = useMemo(
    () =>
      mediaKind === "image" || mediaKind === "video"
        ? URL.createObjectURL(item.file)
        : null,
    [item.file, mediaKind],
  );
  const [previewFailed, setPreviewFailed] = useState(false);
  const canDrag = Boolean(onDragStartUpload) && !disabled && !item.error;

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartUpload?.(item.clientId),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartUpload) {
      return;
    }
    event.dataTransfer.setData(PROJECT_PENDING_UPLOAD_DRAG_MIME, item.clientId);
    event.dataTransfer.setData("text/plain", item.file.name);
    event.dataTransfer.effectAllowed = "move";
    applyProjectItemDragImage(event, dragPreviewRef);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <article
      draggable={longPressDrag.isDraggable}
      onPointerDown={longPressDrag.rowDragHandlers.onPointerDown}
      onPointerUp={longPressDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={longPressDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleDragStart as DragEventHandler<HTMLElement>}
      className={[
        PROJECT_MEDIA_CARD_BASE_CLASS,
        item.error
          ? "border-red-500/80 ring-2 ring-inset ring-red-500/50"
          : PROJECT_MEDIA_CARD_PENDING_ADD_CLASS,
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
        isDragging ? "opacity-50" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
      ].join(" ")}
    >
      <ProjectItemDragPreview previewRef={dragPreviewRef} filename={item.file.name}>
        <ProjectMediaDragPreviewContent mediaKind={mediaKind} previewUrl={previewUrl} />
      </ProjectItemDragPreview>

      <div className="relative">
        <ProjectMediaCardMenu
          pendingDelete={false}
          isCover={isCover}
          canMakeCover={canMakeCover}
          disabled={disabled}
          onDelete={onRemove}
          onMakeCover={onMakeCover}
        />

        <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-stone-950 ring-inset ring-stone-800/40">
          {previewUrl && !previewFailed ? (
            mediaKind === "image" ? (
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                onError={() => setPreviewFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                muted
                playsInline
                draggable={false}
                onError={() => setPreviewFailed(true)}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-800/80 via-stone-900 to-stone-950" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-200">
          {item.file.name}
        </p>

        {item.error ? (
          <p className="mt-1 text-[10px] leading-snug text-red-400">{item.error}</p>
        ) : (
          <p className="mt-auto pt-2 text-[10px] text-stone-500">
            {formatByteSize(item.file.size)}
          </p>
        )}
      </div>
    </article>
  );
}
