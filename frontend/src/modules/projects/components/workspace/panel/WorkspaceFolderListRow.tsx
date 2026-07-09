// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFolderListRow.tsx

// Folder row for the workspace files side panel.

import { useRef } from "react";
import type { DragEvent, DragEventHandler } from "react";

import { useMediaRowLongPressDrag } from "../../../../media/hooks/useMediaRowLongPressDrag";
import type { ProjectFolder } from "../../../api";
import { useWorkspaceRowInlineRename } from "../../../hooks/useWorkspaceRowInlineRename";
import {
  hasProjectDragData,
  PROJECT_FOLDER_DRAG_MIME,
  PROJECT_FOLDER_DRAG_OPEN_DELAY_MS,
} from "../../../lib/project/media";
import { projectFolderDropTargetAttr } from "../../../lib/project/media/projectFileFolderDragSession";

import { WorkspaceFileRowMenu } from "./WorkspaceFileRowMenu";
import {
  WORKSPACE_FILE_LIST_CANVAS_COUNT_CLASS,
  WORKSPACE_FILE_LIST_MENU_SLOT_CLASS,
  WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS,
} from "./workspaceFileListStyles";
import {
  WORKSPACE_FILE_PANEL_META_CLASS,
  WORKSPACE_FILE_PANEL_PREVIEW_CLASS,
  WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS,
  WORKSPACE_FILE_PANEL_TITLE_CLASS,
  workspaceFilePanelRowClassName,
} from "./workspaceFilePanelRowStyles";

type WorkspaceFolderListRowProps = {
  folder: ProjectFolder;
  disabled?: boolean;
  isDeleting?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  draggingFolderId?: string | null;
  dropTargetKey?: string;
  onOpen?: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  autoRename?: boolean;
  onAutoRenameHandled?: () => void;
  renameDisabled?: boolean;
  onDragStartFolder?: (folderId: string) => void;
  onDragEnd?: () => void;
  onDragEnterFolder?: (dropTargetKey: string) => void;
  onDragLeaveFolder?: (dropTargetKey: string) => void;
  onDropOnFolder?: (event: DragEvent<HTMLElement>) => void;
  onOpenFolderDuringDrag?: (folderId: string) => void;
};

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function WorkspaceFolderListRow({
  folder,
  disabled = false,
  isDeleting = false,
  isDragging = false,
  isDropTarget = false,
  draggingFolderId = null,
  dropTargetKey,
  onOpen,
  onDelete,
  onRename,
  autoRename = false,
  onAutoRenameHandled,
  renameDisabled = false,
  onDragStartFolder,
  onDragEnd,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onOpenFolderDuringDrag,
}: WorkspaceFolderListRowProps) {
  const dragOpenTimerRef = useRef<number | null>(null);
  const skipClickRef = useRef(false);
  const inlineRename = useWorkspaceRowInlineRename({
    value: folder.name,
    onCommit: (name) => onRename?.(name),
    disabled: disabled || renameDisabled || !onRename,
    autoEdit: autoRename,
    onAutoEditHandled: onAutoRenameHandled,
  });
  const canDrag = Boolean(onDragStartFolder) && !disabled && !inlineRename.isEditing;
  const canDrop = Boolean(onDropOnFolder) && !disabled;

  const clearDragOpenTimer = () => {
    if (dragOpenTimerRef.current !== null) {
      window.clearTimeout(dragOpenTimerRef.current);
      dragOpenTimerRef.current = null;
    }
  };

  const scheduleDragOpen = () => {
    if (!onOpenFolderDuringDrag || dragOpenTimerRef.current !== null) {
      return;
    }
    dragOpenTimerRef.current = window.setTimeout(() => {
      dragOpenTimerRef.current = null;
      onOpenFolderDuringDrag(folder.id);
    }, PROJECT_FOLDER_DRAG_OPEN_DELAY_MS);
  };

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStartFolder?.(folder.id),
    onDragEnd: () => {
      clearDragOpenTimer();
      onDragEnd?.();
    },
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartFolder) {
      return;
    }
    event.dataTransfer.setData(PROJECT_FOLDER_DRAG_MIME, folder.id);
    event.dataTransfer.setData("text/plain", folder.name);
    event.dataTransfer.effectAllowed = "move";
    clearDragOpenTimer();
  };

  const handleClick = () => {
    if (inlineRename.isEditing) {
      return;
    }
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (draggingFolderId === folder.id) {
      return;
    }
    onOpen?.();
  };

  const handleDragEnd = () => {
    clearDragOpenTimer();
    longPressDrag.rowDragHandlers.onDragEnd();
    skipClickRef.current = true;
  };

  const dropHandlers = canDrop
    ? {
        onDragOver: (event: DragEvent<HTMLDivElement>) => {
          if (!hasProjectDragData(event) || draggingFolderId === folder.id) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (dropTargetKey) {
            onDragEnterFolder?.(dropTargetKey);
          }
          scheduleDragOpen();
        },
        onDragEnter: (event: DragEvent<HTMLDivElement>) => {
          if (!hasProjectDragData(event) || draggingFolderId === folder.id) {
            return;
          }
          event.preventDefault();
          if (dropTargetKey) {
            onDragEnterFolder?.(dropTargetKey);
          }
          scheduleDragOpen();
        },
        onDragLeave: () => {
          clearDragOpenTimer();
          if (dropTargetKey) {
            onDragLeaveFolder?.(dropTargetKey);
          }
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          if (!hasProjectDragData(event)) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          clearDragOpenTimer();
          skipClickRef.current = true;
          onDropOnFolder?.(event);
        },
      }
    : {};

  return (
    <div
      {...{ [projectFolderDropTargetAttr]: dropTargetKey ?? undefined }}
      draggable={longPressDrag.isDraggable}
      onPointerDown={longPressDrag.rowDragHandlers.onPointerDown}
      onPointerUp={longPressDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={longPressDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleDragStart as DragEventHandler<HTMLElement>}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={workspaceFilePanelRowClassName({
        isDropTarget,
        canDrag,
        isDeleting,
        isDragging,
        interactive: true,
      })}
      {...dropHandlers}
    >
      <div className={`${WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS} w-full min-w-0`}>
        <span
          className={[
            WORKSPACE_FILE_PANEL_PREVIEW_CLASS,
            "bg-gradient-to-br from-amber-950/70 via-amber-950/40 to-stone-900/80 text-amber-200 ring-amber-700/40",
          ].join(" ")}
        >
          <FolderIcon className="h-6 w-6 drop-shadow-sm" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
          {inlineRename.isEditing ? (
            <input
              ref={inlineRename.inputRef}
              value={inlineRename.draftName ?? ""}
              disabled={disabled || renameDisabled}
              data-no-row-drag
              onChange={(event) => inlineRename.setDraftName(event.target.value)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  inlineRename.commitEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  inlineRename.discardEdit();
                }
              }}
              onBlur={inlineRename.commitEdit}
              className={WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS}
            />
          ) : (
            <span className={WORKSPACE_FILE_PANEL_TITLE_CLASS} title={folder.name}>
              {folder.name}
            </span>
          )}

          {isDeleting ? (
            <span className={WORKSPACE_FILE_PANEL_META_CLASS}>Deleting…</span>
          ) : null}
        </div>

        <div className={WORKSPACE_FILE_LIST_CANVAS_COUNT_CLASS} aria-hidden />

        {onDelete ? (
          <div className={WORKSPACE_FILE_LIST_MENU_SLOT_CLASS}>
            <WorkspaceFileRowMenu
              disabled={disabled || isDeleting || inlineRename.isEditing}
              ariaLabel="Folder options"
              onRename={onRename ? inlineRename.startEditing : undefined}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
