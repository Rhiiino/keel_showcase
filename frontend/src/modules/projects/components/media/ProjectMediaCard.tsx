// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectMediaCard.tsx

// Condensed media file card with optional preview and delete action.

import { useRef } from "react";
import type { DragEvent, DragEventHandler } from "react";
import { useNavigate } from "react-router-dom";

import { useMediaRowLongPressDrag } from "../../../media/hooks/useMediaRowLongPressDrag";
import { useProjectMediaDragPreviewUrl } from "../../hooks/useProjectMediaDragPreviewUrl";
import { formatByteSize, type ProjectMedia } from "../../api";
import {
  PROJECT_ATTACHMENT_DRAG_MIME,
} from "../../lib/project/media";
import {
  applyProjectItemDragImage,
  ProjectItemDragPreview,
} from "./ProjectItemDragPreview";
import { ProjectMediaDragPreviewContent } from "./ProjectMediaDragPreviewContent";
import { ProjectMediaCardMenu } from "./ProjectMediaCardMenu";
import { ProjectMultiSelectCheckbox } from "./ProjectMultiSelectCheckbox";
import { ProjectMediaInlineFilename } from "./ProjectMediaInlineFilename";
import {
  ProjectMediaPreview,
  type ProjectCoverAppearancePreview,
} from "./ProjectMediaPreview";
import {
  PROJECT_MEDIA_CARD_BASE_CLASS,
  PROJECT_MEDIA_CARD_DEFAULT_BORDER_CLASS,
  PROJECT_MEDIA_CARD_PENDING_DELETE_CLASS,
} from "./projectMediaCardStyles";

type ProjectMediaCardProps = {
  projectId: number;
  item: ProjectMedia;
  isCover: boolean;
  onDelete?: () => void;
  deletePending?: boolean;
  draftMode?: boolean;
  filename?: string;
  onFilenameChange?: (nextFilename: string) => void;
  pendingDelete?: boolean;
  onMarkDelete?: () => void;
  onRestoreDelete?: () => void;
  onMakeCover?: () => void;
  canMakeCover?: boolean;
  multiSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  disabled?: boolean;
  coverAppearance?: ProjectCoverAppearancePreview;
  isDragging?: boolean;
  onDragStartAttachment?: (attachmentId: number) => void;
  onDragEnd?: () => void;
};

export function ProjectMediaCard({
  projectId,
  item,
  isCover,
  onDelete,
  deletePending = false,
  draftMode = false,
  filename,
  onFilenameChange,
  pendingDelete = false,
  onMarkDelete,
  onRestoreDelete,
  onMakeCover,
  canMakeCover = false,
  multiSelectMode = false,
  selected = false,
  onToggleSelect,
  disabled = false,
  coverAppearance,
  isDragging = false,
  onDragStartAttachment,
  onDragEnd,
}: ProjectMediaCardProps) {
  const navigate = useNavigate();
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const displayFilename = filename ?? item.original_filename;
  const filenameDisabled = disabled || pendingDelete || multiSelectMode;
  const canDrag =
    draftMode &&
    Boolean(onDragStartAttachment) &&
    !disabled &&
    !pendingDelete &&
    !multiSelectMode;
  const dragPreviewUrl = useProjectMediaDragPreviewUrl(projectId, item, canDrag);

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartAttachment?.(item.id),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartAttachment) {
      return;
    }
    event.dataTransfer.setData(PROJECT_ATTACHMENT_DRAG_MIME, String(item.id));
    event.dataTransfer.setData("text/plain", displayFilename);
    event.dataTransfer.effectAllowed = "move";
    applyProjectItemDragImage(event, dragPreviewRef);
  };

  const handleCardClick = () => {
    if (draftMode && multiSelectMode && onToggleSelect) {
      onToggleSelect();
    }
  };

  return (
    <article
      draggable={longPressDrag.isDraggable}
      onPointerDown={longPressDrag.rowDragHandlers.onPointerDown}
      onPointerUp={longPressDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={longPressDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleDragStart as DragEventHandler<HTMLElement>}
      onDragEnd={longPressDrag.rowDragHandlers.onDragEnd}
      onClick={handleCardClick}
      className={[
        PROJECT_MEDIA_CARD_BASE_CLASS,
        pendingDelete
          ? PROJECT_MEDIA_CARD_PENDING_DELETE_CLASS
          : PROJECT_MEDIA_CARD_DEFAULT_BORDER_CLASS,
        draftMode && multiSelectMode ? "cursor-pointer" : "",
        draftMode && multiSelectMode && selected
          ? "border-sky-400/50 ring-2 ring-sky-400/40"
          : "",
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
        isDragging ? "opacity-50" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
      ].join(" ")}
    >
      <ProjectItemDragPreview previewRef={dragPreviewRef} filename={displayFilename}>
        <ProjectMediaDragPreviewContent
          mediaKind={item.media_kind}
          previewUrl={dragPreviewUrl}
        />
      </ProjectItemDragPreview>

      <div className="relative overflow-hidden rounded-t-lg">
        {draftMode && !multiSelectMode && onMarkDelete && (
          <ProjectMediaCardMenu
            pendingDelete={pendingDelete}
            isCover={isCover}
            canMakeCover={canMakeCover}
            disabled={disabled}
            onDelete={onMarkDelete}
            onRestore={onRestoreDelete}
            onMakeCover={onMakeCover}
            onViewMedia={() => navigate(`/media/${item.mediaId}`)}
          />
        )}

        {draftMode && multiSelectMode && <ProjectMultiSelectCheckbox selected={selected} />}

        <ProjectMediaPreview
          projectId={projectId}
          item={item}
          compact
          coverAppearance={
            isCover && item.media_kind === "model_3d" ? coverAppearance : undefined
          }
        />
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        {draftMode && onFilenameChange ? (
          <div onClick={(event) => event.stopPropagation()} data-no-row-drag>
            <ProjectMediaInlineFilename
              value={displayFilename}
              onChange={onFilenameChange}
              disabled={filenameDisabled}
            />
          </div>
        ) : (
          <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-200">
            {displayFilename}
          </p>
        )}

        <p className="mt-auto pt-2 text-[10px] text-stone-500">
          {formatByteSize(item.byte_size)}
        </p>
      </div>

      {!draftMode && onDelete && (
        <button
          type="button"
          disabled={deletePending}
          onClick={onDelete}
          className="absolute right-1.5 top-1.5 rounded-md bg-stone-950/80 px-1.5 py-0.5 text-[10px] text-red-400 opacity-0 ring-1 ring-red-900/40 transition hover:bg-red-950/60 group-hover:opacity-100 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </article>
  );
}
