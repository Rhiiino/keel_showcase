// keel_web/src/modules/media/components/browse/MediaBreadcrumbs.tsx

// Folder path breadcrumbs above the media list table.

import type { DragEvent, ReactNode } from "react";
import { Link } from "react-router-dom";

import type { MediaFolder } from "../../api";
import { mediaFolderDropTargetKey } from "../../hooks/useMediaFileFolderDrag";
import { MEDIA_DRAG_MIME, MEDIA_FOLDER_DRAG_MIME } from "./MediaFolderRow";

type MediaBreadcrumbsProps = {
  breadcrumbs: MediaFolder[];
  isDraggingMedia?: boolean;
  dropTargetKey?: string | null;
  onDragEnterFolder?: (folderId: string | null) => void;
  onDragLeaveFolder?: (folderId: string | null) => void;
  onDropFileOnFolder?: (mediaId: string, folderId: string | null) => void;
  onDropFolderOnFolder?: (folderId: string, parentFolderId: string | null) => void;
};

type BreadcrumbTargetProps = {
  children: ReactNode;
  folderId: string | null;
  to?: string;
  isCurrent?: boolean;
  isDraggingMedia: boolean;
  isDropTarget: boolean;
  onDragEnterFolder?: (folderId: string | null) => void;
  onDragLeaveFolder?: (folderId: string | null) => void;
  onDropFileOnFolder?: (mediaId: string, folderId: string | null) => void;
  onDropFolderOnFolder?: (folderId: string, parentFolderId: string | null) => void;
};

export function MediaBreadcrumbs({
  breadcrumbs,
  isDraggingMedia = false,
  dropTargetKey = null,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropFileOnFolder,
  onDropFolderOnFolder,
}: MediaBreadcrumbsProps) {
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Media folder path" className="flex flex-wrap items-center gap-1.5 text-sm">
      <BreadcrumbTarget
        folderId={null}
        to="/media"
        isDraggingMedia={isDraggingMedia}
        isDropTarget={dropTargetKey === mediaFolderDropTargetKey(null)}
        onDragEnterFolder={onDragEnterFolder}
        onDragLeaveFolder={onDragLeaveFolder}
        onDropFileOnFolder={onDropFileOnFolder}
        onDropFolderOnFolder={onDropFolderOnFolder}
      >
        Media
      </BreadcrumbTarget>
      {breadcrumbs.map((folder, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={folder.id} className="flex items-center gap-1.5">
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            {isLast ? (
              <BreadcrumbTarget
                folderId={folder.id}
                isCurrent
                isDraggingMedia={isDraggingMedia}
                isDropTarget={dropTargetKey === mediaFolderDropTargetKey(folder.id)}
                onDragEnterFolder={onDragEnterFolder}
                onDragLeaveFolder={onDragLeaveFolder}
                onDropFileOnFolder={onDropFileOnFolder}
                onDropFolderOnFolder={onDropFolderOnFolder}
              >
                {folder.name}
              </BreadcrumbTarget>
            ) : (
              <BreadcrumbTarget
                folderId={folder.id}
                to={`/media/folders/${folder.id}`}
                isDraggingMedia={isDraggingMedia}
                isDropTarget={dropTargetKey === mediaFolderDropTargetKey(folder.id)}
                onDragEnterFolder={onDragEnterFolder}
                onDragLeaveFolder={onDragLeaveFolder}
                onDropFileOnFolder={onDropFileOnFolder}
                onDropFolderOnFolder={onDropFolderOnFolder}
              >
                {folder.name}
              </BreadcrumbTarget>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function BreadcrumbTarget({
  children,
  folderId,
  to,
  isCurrent = false,
  isDraggingMedia,
  isDropTarget,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropFileOnFolder,
  onDropFolderOnFolder,
}: BreadcrumbTargetProps) {
  const canDrop = Boolean(isDraggingMedia && (onDropFileOnFolder || onDropFolderOnFolder));
  const className = [
    "inline-flex max-w-[14rem] items-center truncate rounded px-1.5 py-0.5 transition-all duration-200 ease-out",
    isCurrent ? "font-medium text-stone-200" : "text-stone-400 hover:bg-stone-900/60 hover:text-stone-200",
    isDraggingMedia
      ? "scale-[1.02] rounded-xl border border-sky-400/30 bg-sky-500/[0.06] px-3 py-1.5 text-sky-100 shadow-sm shadow-sky-950/30 ring-1 ring-inset ring-sky-400/10"
      : "border border-transparent",
    isDropTarget
      ? "border-sky-300/70 bg-sky-400/20 text-sky-50 shadow-sky-500/20 ring-2 ring-inset ring-sky-300/60"
      : "",
  ].join(" ");

  const dragHandlers = canDrop
    ? {
        onDragOver: (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragEnterFolder?.(folderId);
        },
        onDragEnter: (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          onDragEnterFolder?.(folderId);
        },
        onDragLeave: () => {
          onDragLeaveFolder?.(folderId);
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          const mediaId = event.dataTransfer.getData(MEDIA_DRAG_MIME);
          if (mediaId) {
            onDropFileOnFolder?.(mediaId, folderId);
            return;
          }
          const droppedFolderId = event.dataTransfer.getData(MEDIA_FOLDER_DRAG_MIME);
          if (droppedFolderId && droppedFolderId !== folderId) {
            onDropFolderOnFolder?.(droppedFolderId, folderId);
          }
        },
      }
    : {};

  if (to && !isCurrent) {
    return (
      <Link to={to} className={className} {...dragHandlers}>
        <span className="truncate">{children}</span>
      </Link>
    );
  }

  return (
    <span className={className} {...dragHandlers}>
      <span className="truncate">{children}</span>
    </span>
  );
}
