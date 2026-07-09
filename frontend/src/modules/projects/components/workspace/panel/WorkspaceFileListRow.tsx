// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFileListRow.tsx

// Saved project media row with canvas pointer drag and folder drop targets.

import { useRef } from "react";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";

import { useMediaRowLongPressDrag } from "../../../../media/hooks/useMediaRowLongPressDrag";
import { isProjectCardInteractiveTarget } from "../../../lib/project/media/projectCardInteraction";
import { formatByteSize, type ProjectMedia } from "../../../api";
import { useWorkspaceRowInlineRename } from "../../../hooks/useWorkspaceRowInlineRename";
import { PROJECT_ATTACHMENT_DRAG_MIME } from "../../../lib/project/media";
import {
  beginWorkspaceMediaPointerDragAt,
  type WorkspaceMediaDragPayload,
} from "../../../lib/workspace";
import { WorkspaceFileRowMenu } from "./WorkspaceFileRowMenu";
import { WorkspaceFileThumbnail } from "./WorkspaceFileThumbnail";
import {
  WORKSPACE_FILE_LIST_CANVAS_COUNT_CLASS,
  WORKSPACE_FILE_LIST_MENU_SLOT_CLASS,
  WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS,
} from "./workspaceFileListStyles";
import {
  WORKSPACE_FILE_PANEL_META_CLASS,
  WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS,
  WORKSPACE_FILE_PANEL_TITLE_CLASS,
  workspaceFilePanelRowClassName,
} from "./workspaceFilePanelRowStyles";

const CANVAS_DRAG_MOVE_THRESHOLD_PX = 8;

type WorkspaceFileListRowProps = {
  projectId: number;
  item: ProjectMedia;
  highlighted?: boolean;
  disabled?: boolean;
  isDeleting?: boolean;
  isDragging?: boolean;
  onFocus?: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  renameDisabled?: boolean;
  onDragStartAttachment?: (attachmentId: number) => void;
  onDragEnd?: () => void;
  canvasCopyCount?: number;
};

export function WorkspaceFileListRow({
  projectId,
  item,
  highlighted = false,
  disabled = false,
  isDeleting = false,
  isDragging = false,
  onFocus,
  onDelete,
  onRename,
  renameDisabled = false,
  onDragStartAttachment,
  onDragEnd,
  canvasCopyCount = 0,
}: WorkspaceFileListRowProps) {
  const pointerSessionRef = useRef<{
    payload: WorkspaceMediaDragPayload;
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const inlineRename = useWorkspaceRowInlineRename({
    value: item.original_filename,
    onCommit: (name) => onRename?.(name),
    disabled: disabled || renameDisabled || !onRename,
  });

  const canDrag = !disabled && !inlineRename.isEditing;

  const folderDrag = useMediaRowLongPressDrag({
    enabled: Boolean(onDragStartAttachment) && canDrag,
    requireLongPress: true,
    onDragStart: () => onDragStartAttachment?.(item.id),
    onDragEnd,
  });

  const handleHtmlDragStart = (event: DragEvent<HTMLDivElement>) => {
    folderDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStartAttachment) {
      return;
    }
    event.dataTransfer.setData(PROJECT_ATTACHMENT_DRAG_MIME, String(item.id));
    event.dataTransfer.setData("text/plain", item.original_filename);
    event.dataTransfer.effectAllowed = "move";
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    folderDrag.rowDragHandlers.onPointerDown(event);
    if (inlineRename.isEditing) {
      return;
    }
    if (disabled || event.button !== 0 || isProjectCardInteractiveTarget(event.target)) {
      return;
    }

    pointerSessionRef.current = {
      payload: {
        mediaId: item.mediaId,
        attachmentId: item.id,
        original_filename: item.original_filename,
        media_kind: item.media_kind,
        mime_type: item.mime_type,
      },
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pointerId: event.pointerId,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = pointerSessionRef.current;
      if (!session || moveEvent.pointerId !== session.pointerId) {
        return;
      }

      if (folderDrag.isDragArmed) {
        return;
      }

      const distance = Math.hypot(
        moveEvent.clientX - session.startX,
        moveEvent.clientY - session.startY,
      );
      if (distance > CANVAS_DRAG_MOVE_THRESHOLD_PX) {
        session.moved = true;
        pointerSessionRef.current = null;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("pointercancel", handlePointerUp);
        beginWorkspaceMediaPointerDragAt(
          session.payload,
          session.pointerId,
          moveEvent.clientX,
          moveEvent.clientY,
          { onTap: onFocus },
        );
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const session = pointerSessionRef.current;
      if (!session || upEvent.pointerId !== session.pointerId) {
        return;
      }
      pointerSessionRef.current = null;
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      if (!session.moved) {
        onFocus?.();
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <div
      draggable={folderDrag.isDraggable}
      onPointerDown={handlePointerDown}
      onPointerUp={folderDrag.rowDragHandlers.onPointerUp}
      onPointerCancel={folderDrag.rowDragHandlers.onPointerCancel}
      onDragStart={handleHtmlDragStart}
      onDragEnd={folderDrag.rowDragHandlers.onDragEnd}
      className={workspaceFilePanelRowClassName({
        highlighted,
        canDrag,
        isDeleting,
        isDragging,
        interactive: true,
      })}
    >
      <div className={`${WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS} w-full min-w-0`}>
        <WorkspaceFileThumbnail
        projectId={projectId}
        mediaId={item.mediaId}
        mediaKind={item.media_kind}
        highlighted={highlighted}
        />

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
          <span className={WORKSPACE_FILE_PANEL_TITLE_CLASS} title={item.original_filename}>
            {item.original_filename}
          </span>
        )}

        <span className={WORKSPACE_FILE_PANEL_META_CLASS}>
          {isDeleting ? "Deleting…" : formatByteSize(item.byte_size)}
        </span>
        </div>

        <div
          className={WORKSPACE_FILE_LIST_CANVAS_COUNT_CLASS}
          aria-label={`${canvasCopyCount} on canvas`}
          title={`${canvasCopyCount} on canvas`}
        >
          {canvasCopyCount}
        </div>

        {onDelete ? (
          <div className={WORKSPACE_FILE_LIST_MENU_SLOT_CLASS}>
            <WorkspaceFileRowMenu
              disabled={disabled || isDeleting || inlineRename.isEditing}
              onRename={onRename ? inlineRename.startEditing : undefined}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
