// keel_web/src/modules/media/components/browse/MediaCarouselView.tsx

// Horizontally scrolling media carousel with centered folder/file metadata.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type MediaFolder, type MediaObject } from "../../api";
import { useHorizontalDragAutoScroll } from "../../hooks/useHorizontalDragAutoScroll";
import { mediaFolderDropTargetKey } from "../../hooks/useMediaFileFolderDrag";
import {
  formatByteSize,
  formatCreatedAt,
  isMediaObjectStatus,
  mediaKindLabel,
  mediaStatusLabel,
  mediaStatusPillClass,
} from "../../lib/media";
import {
  buildMediaBrowseItems,
  mediaBrowseItemKey,
  type MediaBrowseItem,
} from "../../lib/mediaItems";
import { ConfirmTrashButton, MediaDownloadButton } from "../shared/actions";
import { InlineEditableTitle } from "../shared/InlineEditableTitle";
import { MediaBreadcrumbs } from "./MediaBreadcrumbs";
import { MediaCarouselCard } from "./MediaCarouselCard";

const CAROUSEL_SCROLL_PADDING = "px-[calc(50%_-_6.5rem)]";

type MediaCarouselViewProps = {
  folders: MediaFolder[];
  items: MediaObject[];
  breadcrumbs: MediaFolder[];
  onDelete?: (mediaId: string) => void;
  deleteDisabled?: boolean;
  onRenameMedia?: (mediaId: string, name: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  renameDisabled?: boolean;
  draggingMediaId?: string | null;
  draggingFolderId?: string | null;
  dropTargetKey?: string | null;
  onDragStart?: (mediaId: string) => void;
  onFolderDragStart?: (folderId: string) => void;
  onDragEnd?: () => void;
  onDragEnterFolder?: (folderId: string | null) => void;
  onDragLeaveFolder?: (folderId: string | null) => void;
  onDropFileOnFolder?: (mediaId: string, folderId: string | null) => void;
  onDropFolderOnFolder?: (folderId: string, parentFolderId: string | null) => void;
  onOpenFolderDuringDrag?: (folderId: string) => void;
};

export function MediaCarouselView({
  folders,
  items,
  breadcrumbs,
  onDelete,
  deleteDisabled = false,
  onRenameMedia,
  onRenameFolder,
  renameDisabled = false,
  draggingMediaId = null,
  draggingFolderId = null,
  dropTargetKey = null,
  onDragStart,
  onFolderDragStart,
  onDragEnd,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropFileOnFolder,
  onDropFolderOnFolder,
  onOpenFolderDuringDrag,
}: MediaCarouselViewProps) {
  const browseItems = useMemo(
    () => buildMediaBrowseItems(folders, items),
    [folders, items],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const isDraggingItem = Boolean(draggingMediaId || draggingFolderId);
  const { handleDragOver, resetDragScroll } = useHorizontalDragAutoScroll(
    scrollerRef,
    isDraggingItem,
  );

  const updateActiveFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || browseItems.length === 0) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let nextIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - scrollerCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nextIndex = index;
      }
    });

    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [browseItems.length]);

  useEffect(() => {
    if (activeIndex >= browseItems.length) {
      setActiveIndex(Math.max(0, browseItems.length - 1));
    }
  }, [activeIndex, browseItems.length]);

  useEffect(() => {
    updateActiveFromScroll();
  }, [browseItems, updateActiveFromScroll]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const handleScroll = () => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updateActiveFromScroll();
    });
  };

  const handleCarouselDragEnd = () => {
    resetDragScroll();
    onDragEnd?.();
  };

  const breadcrumbProps = {
    isDraggingMedia: isDraggingItem,
    dropTargetKey,
    onDragEnterFolder,
    onDragLeaveFolder,
    onDropFileOnFolder,
    onDropFolderOnFolder,
  };

  const activeItem = browseItems[activeIndex] ?? browseItems[0];

  if (!activeItem) {
    return (
      <div className="space-y-3">
        {breadcrumbs.length > 0 ? (
          <MediaBreadcrumbs breadcrumbs={breadcrumbs} {...breadcrumbProps} />
        ) : null}
        <p className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-10 text-center text-sm text-stone-500">
          This folder is empty.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Media carousel" className="space-y-8">
      {breadcrumbs.length > 0 ? (
        <MediaBreadcrumbs breadcrumbs={breadcrumbs} {...breadcrumbProps} />
      ) : null}
      <div className="w-full">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          onDragOver={handleDragOver}
          className={[
            "overflow-x-auto overflow-y-visible scroll-smooth py-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            CAROUSEL_SCROLL_PADDING,
          ].join(" ")}
        >
          <div
            className="flex w-max snap-x snap-mandatory items-center gap-8"
            onDragOver={handleDragOver}
          >
            {browseItems.map((item, index) => (
              <MediaCarouselCard
                key={mediaBrowseItemKey(item)}
                item={item}
                index={index}
                activeIndex={activeIndex}
                cardRef={(node) => {
                  cardRefs.current[index] = node;
                }}
                isDragging={
                  item.kind === "folder"
                    ? draggingFolderId === item.folder.id
                    : draggingMediaId === item.media.id
                }
                isDropTarget={
                  item.kind === "folder"
                    ? dropTargetKey === mediaFolderDropTargetKey(item.folder.id)
                    : false
                }
                draggingFolderId={draggingFolderId}
                onDragStart={onDragStart}
                onFolderDragStart={onFolderDragStart}
                onDragEnd={handleCarouselDragEnd}
                onDragEnterFolder={onDragEnterFolder}
                onDragLeaveFolder={onDragLeaveFolder}
                onDropFileOnFolder={onDropFileOnFolder}
                onDropFolderOnFolder={onDropFolderOnFolder}
                onOpenFolderDuringDrag={onOpenFolderDuringDrag}
                onCarouselDragOver={handleDragOver}
              />
            ))}
          </div>
        </div>
      </div>

      <ActiveItemPanel
        item={activeItem}
        onDelete={onDelete}
        deleteDisabled={deleteDisabled}
        onRenameMedia={onRenameMedia}
        onRenameFolder={onRenameFolder}
        renameDisabled={renameDisabled}
      />
    </section>
  );
}

type ActiveItemPanelProps = {
  item: MediaBrowseItem;
  onDelete?: (mediaId: string) => void;
  deleteDisabled?: boolean;
  onRenameMedia?: (mediaId: string, name: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  renameDisabled?: boolean;
};

function ActiveItemPanel({
  item,
  onDelete,
  deleteDisabled = false,
  onRenameMedia,
  onRenameFolder,
  renameDisabled = false,
}: ActiveItemPanelProps) {
  if (item.kind === "folder") {
    const { folder } = item;
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-stone-800 bg-stone-950/60 p-5 shadow-xl shadow-black/20">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Current folder
          </p>
          <InlineEditableTitle
            value={folder.name}
            disabled={!onRenameFolder || renameDisabled}
            onSave={(name) => onRenameFolder?.(folder.id, name)}
          />
          <p className="mt-2 text-sm text-stone-400">Folder</p>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Created</dt>
            <dd className="mt-1 text-sm text-stone-200">
              {formatCreatedAt(folder.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Updated</dt>
            <dd className="mt-1 text-sm text-stone-200">
              {formatCreatedAt(folder.updated_at)}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  const { media } = item;
  const activeStatusClass = isMediaObjectStatus(media.status)
    ? mediaStatusPillClass(media.status)
    : "bg-stone-900/80 text-stone-300 ring-stone-700/80";

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-stone-800 bg-stone-950/60 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Current file
          </p>
          <InlineEditableTitle
            value={media.original_filename}
            disabled={!onRenameMedia || renameDisabled}
            onSave={(name) => onRenameMedia?.(media.id, name)}
          />
          <p className="mt-2 text-sm text-stone-400">{media.mime_type}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MediaDownloadButton
            mediaId={media.id}
            filename={media.original_filename}
            disabled={media.status !== "ready"}
          />
          {onDelete ? (
            <ConfirmTrashButton
              resetKey={media.id}
              disabled={deleteDisabled}
              ariaLabel={`Delete ${media.original_filename}`}
              onConfirm={() => onDelete(media.id)}
            />
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Size</dt>
          <dd className="mt-1 text-sm text-stone-200">
            {formatByteSize(media.byte_size)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Kind</dt>
          <dd className="mt-1 text-sm text-stone-200">
            {mediaKindLabel(media.media_kind)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Status</dt>
          <dd className="mt-1">
            <span
              className={[
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                activeStatusClass,
              ].join(" ")}
            >
              {mediaStatusLabel(media.status)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Created</dt>
          <dd className="mt-1 text-sm text-stone-200">
            {formatCreatedAt(media.created_at)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
