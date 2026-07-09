// keel_web/src/modules/media/components/browse/MediaListRow.tsx

// One media object row in the list table view.

import { useEffect, useRef, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { buildMediaContentUrl, type MediaObject } from "../../api";
import {
  shouldIgnoreMediaRowDragTarget,
  useMediaRowLongPressDrag,
} from "../../hooks/useMediaRowLongPressDrag";
import {
  formatByteSize,
  formatCreatedAt,
  isMediaObjectStatus,
  mediaStatusLabel,
  mediaStatusPillClass,
} from "../../lib/media";
import { ConfirmTrashButton, MediaDownloadButton } from "../shared/actions";
import { MediaPreview } from "../shared/MediaPreview";
import { MEDIA_DRAG_MIME } from "./MediaFolderRow";

export const MEDIA_LIST_GRID_CLASS =
  "grid-cols-[5rem_minmax(0,1.5fr)_minmax(0,10rem)_6rem_5rem_6rem_12rem_12rem_5.5rem]";

export const MEDIA_LIST_MIN_WIDTH_CLASS = "min-w-[63rem]";

type MediaListRowProps = {
  item: MediaObject;
  onDelete?: (mediaId: string) => void;
  onRename?: (mediaId: string, name: string) => void;
  deleteDisabled?: boolean;
  renameDisabled?: boolean;
  isDragging?: boolean;
  onDragStart?: (mediaId: string) => void;
  onDragEnd?: () => void;
};

export function MediaListRow({
  item,
  onDelete,
  onRename,
  deleteDisabled = false,
  renameDisabled = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: MediaListRowProps) {
  const navigate = useNavigate();
  const [draftName, setDraftName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);
  const statusLabel = mediaStatusLabel(item.status);
  const statusPillClass = isMediaObjectStatus(item.status)
    ? mediaStatusPillClass(item.status)
    : "bg-stone-900/80 text-stone-300 ring-stone-700/80";

  const previewUrl =
    item.status === "ready"
      ? buildMediaContentUrl(item.id, item.updated_at)
      : null;

  const detailPath = `/media/${item.id}`;
  const isEditingName = draftName !== null;

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  const startEditingName = () => {
    if (!onRename || renameDisabled) {
      return;
    }
    setDraftName(item.original_filename);
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
    if (!nextName || nextName === item.original_filename) {
      return;
    }
    onRename?.(item.id, nextName);
  };

  const canDrag = Boolean(onDragStart) && !isEditingName;

  const longPressDrag = useMediaRowLongPressDrag({
    enabled: canDrag,
    requireLongPress: false,
    onDragStart: () => onDragStart?.(item.id),
    onDragEnd,
  });

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    longPressDrag.rowDragHandlers.onDragStart(event);
    if (event.defaultPrevented || !onDragStart) {
      return;
    }
    didDragRef.current = true;
    event.dataTransfer.setData(MEDIA_DRAG_MIME, item.id);
    event.dataTransfer.setData("text/plain", item.original_filename);
    event.dataTransfer.effectAllowed = "move";
    if (dragPreviewRef.current) {
      event.dataTransfer.setDragImage(dragPreviewRef.current, 17, 17);
    }
  };

  const handleDragEnd = () => {
    longPressDrag.rowDragHandlers.onDragEnd();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleRowClick = (event: MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current || shouldIgnoreMediaRowDragTarget(event.target)) {
      return;
    }
    navigate(detailPath);
  };

  return (
    <div
      draggable={longPressDrag.isDraggable}
      {...longPressDrag.rowDragHandlers}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleRowClick}
      className={[
        "relative grid border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        MEDIA_LIST_MIN_WIDTH_CLASS,
        MEDIA_LIST_GRID_CLASS,
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging ? "opacity-50" : "",
        longPressDrag.isDragArmed ? "ring-2 ring-inset ring-sky-400/40" : "",
      ].join(" ")}
    >
      <div
        ref={dragPreviewRef}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-[34px] w-[34px] overflow-hidden rounded-md"
        aria-hidden
      >
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={item.mime_type}
          mediaKind={item.media_kind}
          alt={item.original_filename}
          size="list"
        />
      </div>

      <div
        ref={previewRef}
        className="relative z-10 px-4 py-3 align-middle pointer-events-none"
      >
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={item.mime_type}
          mediaKind={item.media_kind}
          alt={item.original_filename}
          size="list"
        />
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
            title={item.original_filename}
          >
            {item.original_filename}
          </button>
        )}
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="truncate text-sm text-stone-400" title={item.mime_type}>
          {item.mime_type}
        </p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="text-sm text-stone-300">{formatByteSize(item.byte_size)}</p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="text-sm tabular-nums text-stone-300">
          {item.attachment_count ?? 0}
        </p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            statusPillClass,
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="whitespace-nowrap text-sm text-stone-400">
          {formatCreatedAt(item.created_at)}
        </p>
      </div>
      <div className="relative z-10 px-4 py-4 align-middle pointer-events-none">
        <p className="whitespace-nowrap text-sm text-stone-400">
          {formatCreatedAt(item.updated_at)}
        </p>
      </div>
      <div
        className="relative z-20 flex items-center justify-center gap-0.5 px-2 py-4"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
      >
        <MediaDownloadButton
          mediaId={item.id}
          filename={item.original_filename}
          disabled={item.status !== "ready"}
        />
        {onDelete ? (
          <ConfirmTrashButton
            resetKey={item.id}
            disabled={deleteDisabled}
            ariaLabel={`Delete ${item.original_filename}`}
            onConfirm={() => onDelete(item.id)}
          />
        ) : null}
      </div>
    </div>
  );
}
