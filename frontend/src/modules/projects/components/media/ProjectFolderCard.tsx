// keel_web/src/modules/projects/components/media/ProjectFolderCard.tsx

// Folder card matching project media card footprint with inline rename and drag-and-drop.

import { useRef } from "react";
import type { DragEvent, DragEventHandler, MouseEvent } from "react";

import type { ProjectFolder } from "../../api";
import { useMediaRowLongPressDrag } from "../../../media/hooks/useMediaRowLongPressDrag";
import { PROJECT_FOLDER_DRAG_MIME } from "../../lib/project/media";
import { isProjectCardInteractiveTarget } from "../../lib/project/media/projectCardInteraction";
import { projectFolderDropTargetAttr } from "../../lib/project/media/projectFileFolderDragSession";
import { ProjectFolderCardDropLayer } from "./ProjectFolderCardDropLayer";
import { ProjectFolderDragPreviewIcon } from "./ProjectFolderDragPreviewIcon";
import { ProjectMediaCardMenu } from "./ProjectMediaCardMenu";
import { ProjectMediaInlineFilename } from "./ProjectMediaInlineFilename";
import {
  applyProjectItemDragImage,
  ProjectItemDragPreview,
} from "./ProjectItemDragPreview";
import { ProjectMultiSelectCheckbox } from "./ProjectMultiSelectCheckbox";
import {
  PROJECT_MEDIA_CARD_BASE_CLASS,
  PROJECT_MEDIA_CARD_DEFAULT_BORDER_CLASS,
  PROJECT_MEDIA_CARD_PENDING_DELETE_CLASS,
} from "./projectMediaCardStyles";

type ProjectFolderCardProps = {
  folder: ProjectFolder;
  filename?: string;
  onFilenameChange?: (nextName: string) => void;
  pendingDelete?: boolean;
  onMarkDelete?: () => void;
  onRestoreDelete?: () => void;
  onOpen?: () => void;
  disabled?: boolean;
  multiSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  draggingFolderId?: string | null;
  onDragStartFolder?: (folderId: string) => void;
  onDragEnd?: () => void;
  onDragEnterFolder?: (dropTargetKey: string) => void;
  onDragLeaveFolder?: (dropTargetKey: string) => void;
  onDropOnFolder?: (event: DragEvent<HTMLElement>) => void;
  onOpenFolderDuringDrag?: (folderId: string) => void;
  dropTargetKey?: string;
  fileDragActive?: boolean;
};

export function ProjectFolderCard({
  folder,
  filename,
  onFilenameChange,
  pendingDelete = false,
  onMarkDelete,
  onRestoreDelete,
  onOpen,
  disabled = false,
  multiSelectMode = false,
  selected = false,
  onToggleSelect,
  isDragging = false,
  isDropTarget = false,
  draggingFolderId = null,
  onDragStartFolder,
  onDragEnd,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onOpenFolderDuringDrag,
  dropTargetKey,
  fileDragActive = false,
}: ProjectFolderCardProps) {
  const displayName = filename ?? folder.name;
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const skipClickRef = useRef(false);
  const canDrag =
    Boolean(onDragStartFolder) && !disabled && !pendingDelete && !multiSelectMode;
  const canDrop = Boolean(onDropOnFolder) && !disabled && !pendingDelete;
  const dropLayerEnabled =
    canDrop && !isDragging && draggingFolderId !== folder.id;

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartFolder?.(folder.id),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartFolder) {
      return;
    }
    event.dataTransfer.setData(PROJECT_FOLDER_DRAG_MIME, folder.id);
    event.dataTransfer.setData("text/plain", displayName);
    event.dataTransfer.effectAllowed = "move";
    applyProjectItemDragImage(event, dragPreviewRef);
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (isProjectCardInteractiveTarget(event.target)) {
      return;
    }
    if (multiSelectMode && onToggleSelect) {
      onToggleSelect();
      return;
    }
    if (!multiSelectMode && !disabled && !pendingDelete && onOpen) {
      onOpen();
    }
  };

  const handleDragEnd = () => {
    longPressDrag.rowDragHandlers.onDragEnd();
    skipClickRef.current = true;
  };

  return (
    <article
      {...{ [projectFolderDropTargetAttr]: dropTargetKey ?? undefined }}
      draggable={longPressDrag.isDraggable}
      onPointerDown={longPressDrag.rowDragHandlers.onPointerDown}
      onPointerUp={longPressDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={longPressDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleDragStart as DragEventHandler<HTMLElement>}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={[
        PROJECT_MEDIA_CARD_BASE_CLASS,
        pendingDelete
          ? PROJECT_MEDIA_CARD_PENDING_DELETE_CLASS
          : PROJECT_MEDIA_CARD_DEFAULT_BORDER_CLASS,
        isDragging ? "opacity-50" : "",
        multiSelectMode ? "cursor-pointer" : "",
        !multiSelectMode && onOpen && !disabled && !pendingDelete
          ? "cursor-pointer"
          : "",
        multiSelectMode && selected
          ? "border-sky-400/50 ring-2 ring-sky-400/40"
          : "",
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
      ].join(" ")}
    >
      <ProjectFolderCardDropLayer
        enabled={dropLayerEnabled}
        active={fileDragActive}
        isDropTarget={isDropTarget}
        dropTargetKey={dropTargetKey}
        onDragEnterFolder={onDragEnterFolder}
        onDragLeaveFolder={onDragLeaveFolder}
        onDropOnFolder={onDropOnFolder}
        onOpenFolderDuringDrag={
          onOpenFolderDuringDrag
            ? () => onOpenFolderDuringDrag(folder.id)
            : undefined
        }
      />

      <ProjectItemDragPreview
        previewRef={dragPreviewRef}
        filename={displayName}
        variant="folder"
      >
        <ProjectFolderDragPreviewIcon />
      </ProjectItemDragPreview>

      <div className="relative">
        {!multiSelectMode && (
          <ProjectMediaCardMenu
            pendingDelete={pendingDelete}
            isCover={false}
            canMakeCover={false}
            disabled={disabled}
            onDelete={() => onMarkDelete?.()}
            onRestore={() => onRestoreDelete?.()}
          />
        )}

        {multiSelectMode && <ProjectMultiSelectCheckbox selected={selected} />}

        <div
          className="relative flex aspect-[16/10] w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-amber-950/30 via-stone-950 to-stone-950 ring-inset ring-stone-800/40 transition group-hover:from-amber-900/20"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-amber-300/80"
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        {onFilenameChange ? (
          <div data-no-row-drag>
            <ProjectMediaInlineFilename
              value={displayName}
              onChange={onFilenameChange}
              disabled={disabled || pendingDelete || multiSelectMode}
            />
          </div>
        ) : (
          <p
            data-no-row-drag
            className="line-clamp-2 text-xs font-medium leading-snug text-stone-200"
          >
            {displayName}
          </p>
        )}
      </div>
    </article>
  );
}
