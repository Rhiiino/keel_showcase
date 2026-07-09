// keel_web/src/modules/media/components/browse/MediaFolderRow.tsx

// One folder row in the media list table view.

import { useEffect, useRef, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { MediaFolder } from "../../api";
import {
  shouldIgnoreMediaRowDragTarget,
  useMediaRowLongPressDrag,
} from "../../hooks/useMediaRowLongPressDrag";
import { formatByteSize, formatCreatedAt } from "../../lib/media";
import { ConfirmTrashButton } from "../shared/actions";
import { MediaFolderIcon } from "../shared/icons";
import { MEDIA_LIST_GRID_CLASS, MEDIA_LIST_MIN_WIDTH_CLASS } from "./MediaListRow";

const MEDIA_DRAG_MIME = "application/x-keel-media-id";
const MEDIA_FOLDER_DRAG_MIME = "application/x-keel-media-folder-id";
const FOLDER_DRAG_OPEN_DELAY_MS = 1000;

type MediaFolderRowProps = {
  folder: MediaFolder;
  isDropTarget?: boolean;
  onDelete?: (folderId: string) => void;
  onRename?: (folderId: string, name: string) => void;
  deleteDisabled?: boolean;
  renameDisabled?: boolean;
  isDragging?: boolean;
  draggingFolderId?: string | null;
  onDropFile?: (mediaId: string, folderId: string | null) => void;
  onDropFolder?: (folderId: string, parentFolderId: string | null) => void;
  onDragStartFolder?: (folderId: string) => void;
  onDragEnd?: () => void;
  onOpenFolderDuringDrag?: (folderId: string) => void;
  onDragEnterFolder?: (folderId: string | null) => void;
  onDragLeaveFolder?: (folderId: string | null) => void;
};

export function MediaFolderRow({
  folder,
  isDropTarget = false,
  onDelete,
  onRename,
  deleteDisabled = false,
  renameDisabled = false,
  isDragging = false,
  draggingFolderId = null,
  onDropFile,
  onDropFolder,
  onDragStartFolder,
  onDragEnd,
  onOpenFolderDuringDrag,
  onDragEnterFolder,
  onDragLeaveFolder,
}: MediaFolderRowProps) {
  const navigate = useNavigate();
  const [draftName, setDraftName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const dragOpenTimerRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const folderPath = `/media/folders/${folder.id}`;
  const isEditingName = draftName !== null;

  const clearDragOpenTimer = () => {
    if (dragOpenTimerRef.current !== null) {
      window.clearTimeout(dragOpenTimerRef.current);
      dragOpenTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  useEffect(() => clearDragOpenTimer, []);

  const hasMediaDragData = (event: DragEvent<HTMLElement>) => {
    const types = Array.from(event.dataTransfer.types);
    return types.includes(MEDIA_DRAG_MIME) || types.includes(MEDIA_FOLDER_DRAG_MIME);
  };

  const scheduleDragOpen = () => {
    if (!onOpenFolderDuringDrag || dragOpenTimerRef.current !== null) {
      return;
    }
    dragOpenTimerRef.current = window.setTimeout(() => {
      dragOpenTimerRef.current = null;
      onOpenFolderDuringDrag?.(folder.id);
    }, FOLDER_DRAG_OPEN_DELAY_MS);
  };

  const startEditingName = () => {
    if (!onRename || renameDisabled) {
      return;
    }
    setDraftName(folder.name);
  };

  const discardNameEdit = () => {
    setDraftName(null);
  };

  const commitNameEdit = () => {
    if (draftName === null) {
      return;
    }
    const nextName = draftName.trim();
    setDraftName(null);
    if (!nextName || nextName === folder.name) {
      return;
    }
    onRename?.(folder.id, nextName);
  };

  const canDrag = Boolean(onDragStartFolder) && !isEditingName;

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
    didDragRef.current = true;
    event.dataTransfer.setData(MEDIA_FOLDER_DRAG_MIME, folder.id);
    event.dataTransfer.setData("text/plain", folder.name);
    event.dataTransfer.effectAllowed = "move";
    if (dragPreviewRef.current) {
      event.dataTransfer.setDragImage(dragPreviewRef.current, 17, 26);
    }
    clearDragOpenTimer();
  };

  const handleDragEnd = () => {
    clearDragOpenTimer();
    longPressDrag.rowDragHandlers.onDragEnd();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleRowClick = (event: MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current || shouldIgnoreMediaRowDragTarget(event.target)) {
      return;
    }
    navigate(folderPath);
  };

  return (
    <div
      className={[
        "relative grid border-b border-stone-800/80 transition last:border-b-0",
        MEDIA_LIST_MIN_WIDTH_CLASS,
        MEDIA_LIST_GRID_CLASS,
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging ? "opacity-50" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
        isDropTarget
          ? "bg-sky-500/[0.08] ring-2 ring-inset ring-sky-400/50"
          : "hover:bg-stone-900/40",
      ].join(" ")}
      draggable={longPressDrag.isDraggable}
      {...longPressDrag.rowDragHandlers}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleRowClick}
      onDragOver={(event) => {
        if (!onDropFile && !onDropFolder) {
          return;
        }
        if (draggingFolderId === folder.id) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragEnterFolder?.(folder.id);
        if (hasMediaDragData(event)) {
          scheduleDragOpen();
        }
      }}
      onDragEnter={(event) => {
        if (!onDropFile && !onDropFolder) {
          return;
        }
        if (draggingFolderId === folder.id) {
          return;
        }
        event.preventDefault();
        onDragEnterFolder?.(folder.id);
        if (hasMediaDragData(event)) {
          scheduleDragOpen();
        }
      }}
      onDragLeave={(event) => {
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
          return;
        }
        clearDragOpenTimer();
        onDragLeaveFolder?.(folder.id);
      }}
      onDrop={(event) => {
        if (!onDropFile && !onDropFolder) {
          return;
        }
        event.preventDefault();
        clearDragOpenTimer();
        const mediaId = event.dataTransfer.getData(MEDIA_DRAG_MIME);
        if (mediaId) {
          onDropFile?.(mediaId, folder.id);
          return;
        }
        const folderId = event.dataTransfer.getData(MEDIA_FOLDER_DRAG_MIME);
        if (folderId && folderId !== folder.id) {
          onDropFolder?.(folderId, folder.id);
        }
      }}
    >
      <div
        ref={dragPreviewRef}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] flex w-[72px] flex-col items-center gap-1 text-center"
        aria-hidden
      >
        <div className="flex h-[34px] w-[34px] items-center justify-center text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
          <MediaFolderIcon className="h-[34px] w-[34px]" />
        </div>
        <p className="line-clamp-2 w-full break-words text-[10px] font-medium leading-tight text-stone-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
          {folder.name}
        </p>
      </div>

      <div className="relative z-10 flex items-center px-4 py-3 pointer-events-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-950/40 text-amber-200 ring-1 ring-amber-800/50">
          <MediaFolderIcon className="h-6 w-6" />
        </div>
      </div>
      <div className="relative z-20 px-4 py-3.5 align-middle">
        {isEditingName ? (
          <input
            ref={inputRef}
            value={draftName}
            disabled={renameDisabled}
            onChange={(event) => setDraftName(event.target.value)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitNameEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                discardNameEdit();
              }
            }}
            onBlur={discardNameEdit}
            className="w-full rounded-md bg-stone-950/90 px-2 py-1 text-sm font-medium text-stone-100 outline-none ring-1 ring-sky-500/60"
          />
        ) : (
          <button
            type="button"
            disabled={!onRename || renameDisabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startEditingName();
            }}
            className={[
              "max-w-full truncate rounded px-0 py-0.5 text-left text-sm font-medium text-stone-100",
              onRename && !renameDisabled ? "hover:text-sky-200" : "cursor-default",
            ].join(" ")}
            title={folder.name}
          >
            {folder.name}
          </button>
        )}
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="text-sm text-stone-400">Folder</p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="text-sm text-stone-300">{formatByteSize(folder.byte_size)}</p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none" aria-hidden />
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none" aria-hidden />
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="whitespace-nowrap text-sm text-stone-400">
          {formatCreatedAt(folder.created_at)}
        </p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="whitespace-nowrap text-sm text-stone-400">
          {formatCreatedAt(folder.updated_at)}
        </p>
      </div>
      <div
        className="relative z-20 flex items-center justify-center gap-0.5 px-2 py-4"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
      >
        <span className="h-8 w-8" aria-hidden />
        {onDelete ? (
          <ConfirmTrashButton
            resetKey={folder.id}
            disabled={deleteDisabled}
            ariaLabel={`Delete folder ${folder.name}`}
            onConfirm={() => onDelete(folder.id)}
          />
        ) : null}
      </div>
    </div>
  );
}

export { MEDIA_DRAG_MIME, MEDIA_FOLDER_DRAG_MIME };
