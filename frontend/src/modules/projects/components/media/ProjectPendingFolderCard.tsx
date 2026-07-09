// keel_web/src/modules/projects/components/media/ProjectPendingFolderCard.tsx

// Unsaved folder draft card shown before Save on the project detail view.

import { useRef } from "react";
import type { DragEvent, DragEventHandler, MouseEvent } from "react";

import { useMediaRowLongPressDrag } from "../../../media/hooks/useMediaRowLongPressDrag";
import { PROJECT_PENDING_FOLDER_DRAG_MIME } from "../../lib/project/media";
import type { PendingProjectFolder } from "../../lib/project/media";
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
  PROJECT_MEDIA_CARD_PENDING_ADD_CLASS,
} from "./projectMediaCardStyles";

type ProjectPendingFolderCardProps = {
  folder: PendingProjectFolder;
  onNameChange: (nextName: string) => void;
  onOpen?: () => void;
  onRemove: () => void;
  disabled?: boolean;
  multiSelectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  draggingPendingFolderClientId?: string | null;
  onDragStartFolder?: (clientId: string) => void;
  onDragEnd?: () => void;
  onDragEnterFolder?: (dropTargetKey: string) => void;
  onDragLeaveFolder?: (dropTargetKey: string) => void;
  onDropOnFolder?: (event: DragEvent<HTMLElement>) => void;
  onOpenFolderDuringDrag?: (clientId: string) => void;
  dropTargetKey?: string;
  fileDragActive?: boolean;
};

export function ProjectPendingFolderCard({
  folder,
  onNameChange,
  onOpen,
  onRemove,
  disabled = false,
  multiSelectMode = false,
  selected = false,
  onToggleSelect,
  isDragging = false,
  isDropTarget = false,
  draggingPendingFolderClientId = null,
  onDragStartFolder,
  onDragEnd,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onOpenFolderDuringDrag,
  dropTargetKey,
  fileDragActive = false,
}: ProjectPendingFolderCardProps) {
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const skipClickRef = useRef(false);
  const canDrag = Boolean(onDragStartFolder) && !disabled && !multiSelectMode;
  const canDrop = Boolean(onDropOnFolder) && !disabled;
  const dropLayerEnabled =
    canDrop && !isDragging && draggingPendingFolderClientId !== folder.clientId;

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartFolder?.(folder.clientId),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartFolder) {
      return;
    }
    event.dataTransfer.setData(PROJECT_PENDING_FOLDER_DRAG_MIME, folder.clientId);
    event.dataTransfer.setData("text/plain", folder.name);
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
    if (!multiSelectMode && !disabled && onOpen) {
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
        PROJECT_MEDIA_CARD_PENDING_ADD_CLASS,
        isDragging ? "opacity-50" : "",
        multiSelectMode ? "cursor-pointer" : "",
        !multiSelectMode && onOpen && !disabled ? "cursor-pointer" : "",
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
            ? () => onOpenFolderDuringDrag(folder.clientId)
            : undefined
        }
      />

      <ProjectItemDragPreview
        previewRef={dragPreviewRef}
        filename={folder.name}
        variant="folder"
      >
        <ProjectFolderDragPreviewIcon />
      </ProjectItemDragPreview>

      <div className="relative">
        {!multiSelectMode && (
          <ProjectMediaCardMenu
            pendingDelete={false}
            isCover={false}
            canMakeCover={false}
            disabled={disabled}
            onDelete={onRemove}
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
        <div data-no-row-drag>
          <ProjectMediaInlineFilename
            value={folder.name}
            onChange={onNameChange}
            disabled={disabled || multiSelectMode}
          />
        </div>
      </div>
    </article>
  );
}
