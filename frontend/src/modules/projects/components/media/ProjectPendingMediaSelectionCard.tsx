// keel_web/src/modules/projects/components/media/ProjectPendingMediaSelectionCard.tsx

// Staged media-library selection shown before Save on the project detail view.

import { useRef } from "react";
import type { DragEvent, DragEventHandler } from "react";

import { buildMediaContentUrl } from "../../../media/api";
import { useMediaRowLongPressDrag } from "../../../media/hooks/useMediaRowLongPressDrag";
import { formatByteSize } from "../../api";
import type { PendingMediaSelection } from "../../lib/project/media";
import {
  PROJECT_PENDING_SELECTION_DRAG_MIME,
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

type ProjectPendingMediaSelectionCardProps = {
  item: PendingMediaSelection;
  disabled?: boolean;
  onRemove: () => void;
  isDragging?: boolean;
  onDragStartSelection?: (clientId: string) => void;
  onDragEnd?: () => void;
};

export function ProjectPendingMediaSelectionCard({
  item,
  disabled = false,
  onRemove,
  isDragging = false,
  onDragStartSelection,
  onDragEnd,
}: ProjectPendingMediaSelectionCardProps) {
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const media = item.media;
  const previewUrl = buildMediaContentUrl(media.id, media.updated_at);
  const mediaKind =
    media.media_kind === "image" ||
    media.media_kind === "video" ||
    media.media_kind === "model_3d"
      ? media.media_kind
      : "other";
  const dragPreviewUrl =
    mediaKind === "image" || mediaKind === "video" ? previewUrl : null;

  const canDrag = Boolean(onDragStartSelection) && !disabled;

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartSelection?.(item.clientId),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartSelection) {
      return;
    }
    event.dataTransfer.setData(PROJECT_PENDING_SELECTION_DRAG_MIME, item.clientId);
    event.dataTransfer.setData("text/plain", media.original_filename);
    event.dataTransfer.effectAllowed = "move";
    applyProjectItemDragImage(event, dragPreviewRef);
  };

  return (
    <article
      draggable={longPressDrag.isDraggable}
      onPointerDown={longPressDrag.rowDragHandlers.onPointerDown}
      onPointerUp={longPressDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={longPressDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleDragStart as DragEventHandler<HTMLElement>}
      className={[
        PROJECT_MEDIA_CARD_BASE_CLASS,
        PROJECT_MEDIA_CARD_PENDING_ADD_CLASS,
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
        isDragging ? "opacity-50" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
      ].join(" ")}
    >
      <ProjectItemDragPreview previewRef={dragPreviewRef} filename={media.original_filename}>
        <ProjectMediaDragPreviewContent mediaKind={mediaKind} previewUrl={dragPreviewUrl} />
      </ProjectItemDragPreview>

      <div className="relative">
        <ProjectMediaCardMenu
          pendingDelete={false}
          isCover={false}
          canMakeCover={false}
          disabled={disabled}
          onDelete={onRemove}
        />

        <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-stone-950 ring-inset ring-stone-800/40">
          {mediaKind === "image" ? (
            <img src={previewUrl} alt="" draggable={false} className="h-full w-full object-cover" />
          ) : mediaKind === "video" ? (
            <video
              src={previewUrl}
              muted
              playsInline
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-800/80 via-stone-900 to-stone-950" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-200">
          {media.original_filename}
        </p>
        <p className="mt-auto pt-2 text-[10px] text-stone-500">
          {formatByteSize(media.byte_size)}
        </p>
      </div>
    </article>
  );
}
