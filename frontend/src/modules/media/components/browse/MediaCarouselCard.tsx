// keel_web/src/modules/media/components/browse/MediaCarouselCard.tsx

// One folder or file card in the media browse carousel.

import { useEffect, useRef } from "react";
import type { DragEvent } from "react";
import { Link } from "react-router-dom";

import { buildMediaContentUrl } from "../../api";
import { formatByteSize } from "../../lib/media";
import type { MediaBrowseItem } from "../../lib/mediaItems";
import { MediaFolderIcon } from "../shared/icons";
import { MediaPreview } from "../shared/MediaPreview";
import {
  MEDIA_DRAG_MIME,
  MEDIA_FOLDER_DRAG_MIME,
} from "./MediaFolderRow";

export const MEDIA_CAROUSEL_CARD_CLASS = "h-64 w-52";
const FOLDER_DRAG_OPEN_DELAY_MS = 1000;

type MediaCarouselCardProps = {
  item: MediaBrowseItem;
  index: number;
  activeIndex: number;
  cardRef: (node: HTMLDivElement | null) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  draggingFolderId?: string | null;
  onDragStart?: (mediaId: string) => void;
  onFolderDragStart?: (folderId: string) => void;
  onDragEnd?: () => void;
  onDragEnterFolder?: (folderId: string | null) => void;
  onDragLeaveFolder?: (folderId: string | null) => void;
  onDropFileOnFolder?: (mediaId: string, folderId: string | null) => void;
  onDropFolderOnFolder?: (folderId: string, parentFolderId: string | null) => void;
  onOpenFolderDuringDrag?: (folderId: string) => void;
  onCarouselDragOver?: (event: DragEvent<HTMLElement>) => void;
};

function hasMediaDragData(event: DragEvent<HTMLElement>) {
  const types = Array.from(event.dataTransfer.types);
  return types.includes(MEDIA_DRAG_MIME) || types.includes(MEDIA_FOLDER_DRAG_MIME);
}

export function MediaCarouselCard({
  item,
  index,
  activeIndex,
  cardRef,
  isDragging = false,
  isDropTarget = false,
  draggingFolderId = null,
  onDragStart,
  onFolderDragStart,
  onDragEnd,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropFileOnFolder,
  onDropFolderOnFolder,
  onOpenFolderDuringDrag,
  onCarouselDragOver,
}: MediaCarouselCardProps) {
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const dragOpenTimerRef = useRef<number | null>(null);

  const distance = Math.abs(index - activeIndex);
  const isActive = index === activeIndex;
  const scaleClass =
    distance === 0
      ? "scale-125 opacity-100"
      : distance === 1
        ? "scale-100 opacity-85"
        : "scale-90 opacity-60";

  const clearDragOpenTimer = () => {
    if (dragOpenTimerRef.current !== null) {
      window.clearTimeout(dragOpenTimerRef.current);
      dragOpenTimerRef.current = null;
    }
  };

  useEffect(() => clearDragOpenTimer, []);

  const scheduleDragOpen = (folderId: string) => {
    if (!onOpenFolderDuringDrag || dragOpenTimerRef.current !== null) {
      return;
    }
    dragOpenTimerRef.current = window.setTimeout(() => {
      dragOpenTimerRef.current = null;
      onOpenFolderDuringDrag(folderId);
    }, FOLDER_DRAG_OPEN_DELAY_MS);
  };

  const handleDragEnd = () => {
    clearDragOpenTimer();
    onDragEnd?.();
  };

  if (item.kind === "folder") {
    const { folder } = item;
    const canDrag = Boolean(onFolderDragStart);
    const canDrop = Boolean(onDropFileOnFolder || onDropFolderOnFolder);

    return (
      <div
        ref={cardRef}
        draggable={canDrag}
        onDragStart={(event) => {
          if (!onFolderDragStart) {
            return;
          }
          event.dataTransfer.setData(MEDIA_FOLDER_DRAG_MIME, folder.id);
          event.dataTransfer.setData("text/plain", folder.name);
          event.dataTransfer.effectAllowed = "move";
          if (dragPreviewRef.current) {
            event.dataTransfer.setDragImage(dragPreviewRef.current, 17, 26);
          }
          onFolderDragStart(folder.id);
        }}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => {
          onCarouselDragOver?.(event);
          if (!canDrop || draggingFolderId === folder.id) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragEnterFolder?.(folder.id);
          if (hasMediaDragData(event)) {
            scheduleDragOpen(folder.id);
          }
        }}
        onDragEnter={(event) => {
          if (!canDrop || draggingFolderId === folder.id) {
            return;
          }
          event.preventDefault();
          onDragEnterFolder?.(folder.id);
          if (hasMediaDragData(event)) {
            scheduleDragOpen(folder.id);
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
          if (!canDrop) {
            return;
          }
          event.preventDefault();
          clearDragOpenTimer();
          const mediaId = event.dataTransfer.getData(MEDIA_DRAG_MIME);
          if (mediaId) {
            onDropFileOnFolder?.(mediaId, folder.id);
            return;
          }
          const folderId = event.dataTransfer.getData(MEDIA_FOLDER_DRAG_MIME);
          if (folderId && folderId !== folder.id) {
            onDropFolderOnFolder?.(folderId, folder.id);
          }
        }}
        className={[
          "group relative flex shrink-0 snap-center flex-col items-center justify-center overflow-hidden rounded-2xl bg-amber-950/30 shadow-2xl shadow-black/30 ring-1 ring-amber-800/40",
          MEDIA_CAROUSEL_CARD_CLASS,
          "transition-[transform,opacity,box-shadow,ring-color] duration-300 ease-out hover:opacity-100 hover:ring-amber-500/70",
          scaleClass,
          isDragging ? "opacity-50" : "",
          isDropTarget
            ? "z-30 ring-2 ring-sky-400/70 ring-offset-2 ring-offset-stone-950"
            : isActive
              ? "z-20 shadow-amber-950/30 ring-amber-400/60"
              : "z-10",
        ].join(" ")}
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
        <Link
          to={`/media/folders/${folder.id}`}
          draggable={false}
          aria-label={`Open folder ${folder.name}`}
          aria-current={isActive ? "true" : undefined}
          className="absolute inset-0 z-0"
        />
        <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center">
          <MediaFolderIcon className="h-16 w-16 text-amber-200" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3">
          <p className="truncate text-sm font-medium text-stone-50">{folder.name}</p>
          <p className="mt-0.5 text-xs text-stone-300">Folder</p>
        </div>
      </div>
    );
  }

  const { media } = item;
  const previewUrl =
    media.status === "ready"
      ? buildMediaContentUrl(media.id, media.updated_at)
      : null;

  return (
    <div
      ref={cardRef}
      draggable={Boolean(onDragStart)}
      onDragStart={(event) => {
        if (!onDragStart) {
          return;
        }
        event.dataTransfer.setData(MEDIA_DRAG_MIME, media.id);
        event.dataTransfer.setData("text/plain", media.original_filename);
        event.dataTransfer.effectAllowed = "move";
        if (dragPreviewRef.current) {
          event.dataTransfer.setDragImage(dragPreviewRef.current, 17, 17);
        }
        onDragStart(media.id);
      }}
      onDragEnd={handleDragEnd}
      onDragOver={onCarouselDragOver}
      className={[
        "group relative flex shrink-0 snap-center flex-col overflow-hidden rounded-2xl bg-stone-900/80 shadow-2xl shadow-black/30 ring-1 ring-white/[0.08]",
        MEDIA_CAROUSEL_CARD_CLASS,
        "transition-[transform,opacity,box-shadow,ring-color] duration-300 ease-out hover:opacity-100 hover:ring-stone-500/80",
        scaleClass,
        isDragging ? "opacity-50" : "",
        isActive ? "z-20 shadow-sky-950/30 ring-sky-400/60" : "z-10",
      ].join(" ")}
    >
      <div
        ref={dragPreviewRef}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-[34px] w-[34px] overflow-hidden rounded-md"
        aria-hidden
      >
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={media.mime_type}
          mediaKind={media.media_kind}
          alt={media.original_filename}
          size="list"
        />
      </div>
      <Link
        to={`/media/${media.id}`}
        draggable={false}
        aria-label={`Open ${media.original_filename}`}
        aria-current={isActive ? "true" : undefined}
        className="absolute inset-0 z-0"
      />
      <div className="pointer-events-none relative z-10 h-full w-full">
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={media.mime_type}
          mediaKind={media.media_kind}
          alt={media.original_filename}
          size="carousel"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3">
        <p className="truncate text-sm font-medium text-stone-50">
          {media.original_filename}
        </p>
        <p className="mt-0.5 text-xs text-stone-300">
          {formatByteSize(media.byte_size)}
        </p>
      </div>
    </div>
  );
}
