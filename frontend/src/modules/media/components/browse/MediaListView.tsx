// keel_web/src/modules/media/components/browse/MediaListView.tsx

// Table-style list of media folders and files.

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";

import { ListView } from "../../../../views/list/ListView";
import type { ListColumnDef } from "../../../../views/list/types";
import type { MediaFolder, MediaObject } from "../../api";
import { mediaFolderDropTargetKey } from "../../hooks/useMediaFileFolderDrag";
import {
  getMediaListEntryKey,
  getMediaListSortValue,
  MEDIA_LIST_DEFAULT_SORT,
  type MediaListEntry,
  type MediaListSortColumn,
} from "../../lib/mediaListSort";
import { ListPagination } from "../../../../views/list/ListPaginationBar";
import {
  paginateMediaListContents,
  useMediaPickerPagination,
} from "../../lib/mediaPickerPagination";
import { MediaFileIcon, MediaFolderIcon } from "../shared/icons";
import { MediaBreadcrumbs } from "./MediaBreadcrumbs";
import {
  MEDIA_DRAG_MIME,
  MEDIA_FOLDER_DRAG_MIME,
  MediaFolderRow,
} from "./MediaFolderRow";
import {
  MEDIA_LIST_GRID_CLASS,
  MEDIA_LIST_MIN_WIDTH_CLASS,
  MediaListRow,
} from "./MediaListRow";

const MEDIA_COLUMNS: ListColumnDef<MediaListSortColumn | "preview" | "actions">[] = [
  { id: "preview", label: "Preview", sortable: false },
  { id: "name", label: "Name" },
  { id: "type", label: "Type" },
  { id: "size", label: "Size" },
  { id: "attached", label: "Attached" },
  { id: "status", label: "Status" },
  { id: "created", label: "Created" },
  { id: "updated", label: "Updated" },
  { id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" },
];

type MediaListViewProps = {
  folders: MediaFolder[];
  items: MediaObject[];
  breadcrumbs: MediaFolder[];
  currentFolderId?: string | null;
  onDelete?: (mediaId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRenameMedia?: (mediaId: string, name: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  onCreateFolder?: (name: string) => void;
  onUploadFile?: (files: File[]) => void;
  deleteDisabled?: boolean;
  folderDeleteDisabled?: boolean;
  renameDisabled?: boolean;
  createFolderDisabled?: boolean;
  uploadDisabled?: boolean;
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

export function MediaListView({
  folders,
  items,
  breadcrumbs,
  currentFolderId = null,
  onDelete,
  onDeleteFolder,
  onRenameMedia,
  onRenameFolder,
  onCreateFolder,
  onUploadFile,
  deleteDisabled = false,
  folderDeleteDisabled = false,
  renameDisabled = false,
  createFolderDisabled = false,
  uploadDisabled = false,
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
}: MediaListViewProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCurrentFolderDropTarget, setIsCurrentFolderDropTarget] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const listItemCount = folders.length + items.length;
  const { page, pageSize, totalPages, setPage, setPageSize } = useMediaPickerPagination(
    listItemCount,
    currentFolderId,
  );
  const paginatedContents = useMemo(
    () =>
      paginateMediaListContents({
        folders,
        items,
        page,
        pageSize,
      }),
    [folders, items, page, pageSize],
  );
  const visibleEntries = useMemo((): MediaListEntry[] => {
    return [
      ...paginatedContents.folders.map(
        (folder): MediaListEntry => ({ kind: "folder", folder }),
      ),
      ...paginatedContents.items.map((item): MediaListEntry => ({ kind: "file", item })),
    ];
  }, [paginatedContents.folders, paginatedContents.items]);

  const isDraggingItem = Boolean(draggingMediaId || draggingFolderId);
  const canDropIntoCurrentFolder =
    isDraggingItem && draggingFolderId !== currentFolderId && folders.length === 0;

  useEffect(() => {
    if (isCreatingFolder) {
      newFolderInputRef.current?.focus();
    }
  }, [isCreatingFolder]);

  const discardNewFolder = () => {
    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  const commitNewFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      discardNewFolder();
      return;
    }
    onCreateFolder?.(trimmedName);
    discardNewFolder();
  };

  const clearCurrentFolderDropTarget = () => {
    setIsCurrentFolderDropTarget(false);
  };

  const handleDropIntoCurrentFolder = (event: DragEvent<HTMLDivElement>) => {
    if (!canDropIntoCurrentFolder) {
      return;
    }
    event.preventDefault();
    clearCurrentFolderDropTarget();
    const mediaId = event.dataTransfer.getData(MEDIA_DRAG_MIME);
    if (mediaId) {
      onDropFileOnFolder?.(mediaId, currentFolderId);
      return;
    }
    const folderId = event.dataTransfer.getData(MEDIA_FOLDER_DRAG_MIME);
    if (folderId && folderId !== currentFolderId) {
      onDropFolderOnFolder?.(folderId, currentFolderId);
    }
  };

  return (
    <div className="w-fit max-w-full">
      <ListView
        items={visibleEntries}
        columns={MEDIA_COLUMNS}
        getSortValue={(entry, column) => {
          if (column === "preview" || column === "actions") {
            return null;
          }
          return getMediaListSortValue(entry, column);
        }}
        defaultSort={MEDIA_LIST_DEFAULT_SORT}
        gridClassName={[
          "grid text-xs font-medium uppercase tracking-wide text-stone-500",
          MEDIA_LIST_MIN_WIDTH_CLASS,
          MEDIA_LIST_GRID_CLASS,
        ].join(" ")}
        tableWidthClassName={MEDIA_LIST_MIN_WIDTH_CLASS}
        renderRow={(entry) =>
          entry.kind === "folder" ? (
            <MediaFolderRow
              folder={entry.folder}
              isDropTarget={dropTargetKey === mediaFolderDropTargetKey(entry.folder.id)}
              onDelete={onDeleteFolder}
              onRename={onRenameFolder}
              deleteDisabled={folderDeleteDisabled}
              renameDisabled={renameDisabled}
              isDragging={draggingFolderId === entry.folder.id}
              draggingFolderId={draggingFolderId}
              onDropFile={onDropFileOnFolder}
              onDropFolder={onDropFolderOnFolder}
              onDragStartFolder={onFolderDragStart}
              onDragEnd={onDragEnd}
              onOpenFolderDuringDrag={onOpenFolderDuringDrag}
              onDragEnterFolder={onDragEnterFolder}
              onDragLeaveFolder={onDragLeaveFolder}
            />
          ) : (
            <MediaListRow
              item={entry.item}
              onDelete={onDelete}
              onRename={onRenameMedia}
              deleteDisabled={deleteDisabled}
              renameDisabled={renameDisabled}
              isDragging={draggingMediaId === entry.item.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          )
        }
        getRowKey={getMediaListEntryKey}
        pagination={false}
        suppressEmptyState
        paginationResetKey={[currentFolderId, page, pageSize, listItemCount]}
        headerSlot={
          <>
            <MediaBreadcrumbs
              breadcrumbs={breadcrumbs}
              isDraggingMedia={Boolean(draggingMediaId || draggingFolderId)}
              dropTargetKey={dropTargetKey}
              onDragEnterFolder={onDragEnterFolder}
              onDragLeaveFolder={onDragLeaveFolder}
              onDropFileOnFolder={onDropFileOnFolder}
              onDropFolderOnFolder={onDropFolderOnFolder}
            />
            <div
              className={[
                "flex items-center justify-end gap-4 border-b border-stone-800 px-4 py-2.5",
                MEDIA_LIST_MIN_WIDTH_CLASS,
              ].join(" ")}
            >
              <ListPagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        }
        beforeRows={
          <div
            className={[
              "pointer-events-none absolute left-0 right-0 top-20 z-30 px-4 py-2 opacity-0 transition duration-200",
              MEDIA_LIST_MIN_WIDTH_CLASS,
              canDropIntoCurrentFolder ? "pointer-events-auto opacity-100" : "",
            ].join(" ")}
            onDragOver={(event) => {
              if (!canDropIntoCurrentFolder) {
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setIsCurrentFolderDropTarget(true);
            }}
            onDragEnter={(event) => {
              if (!canDropIntoCurrentFolder) {
                return;
              }
              event.preventDefault();
              setIsCurrentFolderDropTarget(true);
            }}
            onDragLeave={(event) => {
              const relatedTarget = event.relatedTarget;
              if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
                return;
              }
              clearCurrentFolderDropTarget();
            }}
            onDrop={handleDropIntoCurrentFolder}
            aria-label="Drop here to move into this folder"
          >
            <div
              className={[
                "h-1 rounded-full transition duration-200",
                isCurrentFolderDropTarget
                  ? "bg-lime-300/85 shadow-[0_0_14px_rgba(163,230,53,0.22)]"
                  : "bg-lime-300/35 shadow-[0_0_10px_rgba(163,230,53,0.12)]",
              ].join(" ")}
            />
          </div>
        }
        afterRows={
          <>
            {isCreatingFolder ? (
              <div
                className={[
                  "grid border-b border-stone-800/80 bg-stone-950/50",
                  MEDIA_LIST_MIN_WIDTH_CLASS,
                  MEDIA_LIST_GRID_CLASS,
                ].join(" ")}
              >
                <div className="flex items-center px-4 py-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-950/40 text-amber-200 ring-1 ring-amber-800/50">
                    <MediaFolderIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="px-4 py-3.5 align-middle">
                  <input
                    ref={newFolderInputRef}
                    value={newFolderName}
                    disabled={createFolderDisabled}
                    placeholder="Folder name"
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitNewFolder();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        discardNewFolder();
                      }
                    }}
                    onBlur={discardNewFolder}
                    className="w-full rounded-md bg-stone-950/90 px-2 py-1 text-sm font-medium text-stone-100 outline-none ring-1 ring-sky-500/60 placeholder:text-stone-600"
                  />
                </div>
                <div className="px-4 py-4 text-sm text-stone-400">Folder</div>
                <div className="px-4 py-4" aria-hidden />
                <div className="px-4 py-4" aria-hidden />
                <div className="px-4 py-4" aria-hidden />
                <div className="px-4 py-4" aria-hidden />
                <div className="px-4 py-4" aria-hidden />
                <div className="px-2 py-4" aria-hidden />
              </div>
            ) : null}
            <div
              className={["grid grid-cols-2 last:border-b-0", MEDIA_LIST_MIN_WIDTH_CLASS].join(" ")}
            >
              <button
                type="button"
                disabled={!onCreateFolder || createFolderDisabled}
                onClick={() => {
                  setIsCreatingFolder(true);
                  setNewFolderName("");
                }}
                className={[
                  "group flex items-center justify-center gap-3 border-r border-stone-800/80 px-5 py-5 transition",
                  "bg-amber-950/[0.12] hover:bg-amber-950/25 disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/50 text-amber-200 ring-1 ring-amber-700/50 transition group-hover:bg-amber-900/60 group-hover:ring-amber-500/50">
                  <MediaFolderIcon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-stone-200 group-hover:text-amber-50">
                  Add folder
                </span>
              </button>
              <button
                type="button"
                disabled={!onUploadFile || uploadDisabled}
                onClick={() => uploadInputRef.current?.click()}
                className={[
                  "group flex items-center justify-center gap-3 px-5 py-5 transition",
                  "bg-sky-950/[0.12] hover:bg-sky-950/25 disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950/50 text-sky-200 ring-1 ring-sky-700/50 transition group-hover:bg-sky-900/60 group-hover:ring-sky-500/50">
                  <MediaFileIcon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-stone-200 group-hover:text-sky-50">
                  Upload file
                </span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files ? Array.from(event.target.files) : [];
                  event.target.value = "";
                  if (files.length > 0) {
                    onUploadFile?.(files);
                  }
                }}
              />
            </div>
          </>
        }
      />
    </div>
  );
}
