// keel_web/src/modules/shop/components/FinanceMediaCarousel.tsx

// Horizontal media strip with drag-and-drop upload.

import { useMemo, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  buildMediaContentUrl,
  fetchMediaBlob,
  type MediaObject,
} from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";
import { type FinanceTransactionGalleryEntry } from "../api";
import { MediaCardMenu } from "../../../components/MediaCardMenu";
import { MediaLightbox, MediaTrashButton } from "../../../components/MediaLightbox";

const SCROLL_STEP_PX = 280;

function MediaDragOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-sky-500/60 bg-sky-950/20">
      <p className="text-sm font-medium text-sky-300">Drag here to upload</p>
    </div>
  );
}

type PendingUpload = {
  clientId: string;
  file: File;
  previewUrl: string;
};

type PendingMediaSelection = {
  clientId: string;
  media: MediaObject;
};

type CarouselEntry =
  | { kind: "media"; media: FinanceTransactionGalleryEntry }
  | { kind: "pending"; pending: PendingUpload }
  | { kind: "selectedMedia"; selected: PendingMediaSelection };

type LightboxState = {
  kind: "image" | "pdf";
  src: string;
  title: string;
};

type FinanceMediaCarouselProps = {
  media: FinanceTransactionGalleryEntry[];
  pendingUploads?: PendingUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueUploads?: (files: FileList | File[]) => void;
  onQueueMediaSelections?: (media: MediaObject[]) => void;
  onRemovePending?: (clientId: string) => void;
  onRemovePendingMedia?: (clientId: string) => void;
  onDeleteMedia?: (attachmentId: number) => void;
  onSetCover?: (mediaId: string) => void;
  disabled?: boolean;
  pageFileDragActive?: boolean;
};

function MediaThumb({
  entry,
  onDelete,
  onSetCover,
  onViewMedia,
  onOpenPreview,
  disabled,
}: {
  entry: CarouselEntry;
  onDelete?: () => void;
  onSetCover?: () => void;
  onViewMedia?: () => void;
  onOpenPreview?: (state: LightboxState) => void;
  disabled?: boolean;
}) {
  const previewUrl =
    entry.kind === "pending"
      ? entry.pending.previewUrl
      : entry.kind === "selectedMedia"
        ? buildMediaContentUrl(entry.selected.media.id, entry.selected.media.updated_at)
        : entry.kind === "media" && entry.media.media_kind === "image"
          ? buildMediaContentUrl(entry.media.mediaId, entry.media.updated_at)
          : null;

  const title =
    entry.kind === "media"
      ? entry.media.original_filename
      : entry.kind === "selectedMedia"
        ? entry.selected.media.original_filename
        : entry.pending.file.name;

  const isSavedMedia = entry.kind === "media";
  const canSetCover =
    !disabled &&
    isSavedMedia &&
    entry.media.media_kind === "image" &&
    Boolean(onSetCover);
  const canViewMedia = !disabled && isSavedMedia && Boolean(onViewMedia);

  const handleOpen = async () => {
    if (!onOpenPreview || disabled) {
      return;
    }
    if (entry.kind === "pending") {
      const file = entry.pending.file;
      if (file.type.startsWith("image/")) {
        onOpenPreview({ kind: "image", src: entry.pending.previewUrl, title });
      } else if (file.type === "application/pdf") {
        onOpenPreview({ kind: "pdf", src: entry.pending.previewUrl, title });
      }
      return;
    }
    if (entry.kind === "selectedMedia" && previewUrl) {
      onOpenPreview({ kind: "image", src: previewUrl, title });
      return;
    }
    if (entry.kind !== "media") {
      return;
    }
    if (entry.media.media_kind === "image" && previewUrl) {
      onOpenPreview({ kind: "image", src: previewUrl, title });
      return;
    }
    if (entry.media.media_kind === "pdf" || entry.media.mime_type === "application/pdf") {
      const blob = await fetchMediaBlob(entry.media.mediaId);
      const url = URL.createObjectURL(blob);
      onOpenPreview({ kind: "pdf", src: url, title });
    }
  };

  return (
    <div className="group relative h-28 w-24 shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handleOpen()}
        className="relative h-full w-full overflow-hidden rounded-xl bg-stone-900 text-left transition hover:opacity-95 disabled:cursor-default"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-stone-500">
            {title}
          </div>
        )}
      </button>
      {(canSetCover || canViewMedia) && (
        <MediaCardMenu
          canSetCover={canSetCover}
          disabled={disabled}
          onSetCover={onSetCover}
          onViewMedia={onViewMedia}
          className="absolute right-1.5 top-1.5 z-10"
        />
      )}
      {!disabled && onDelete && (
        <MediaTrashButton
          onClick={onDelete}
          disabled={disabled}
          className="absolute right-1.5 bottom-1.5 z-10"
        />
      )}
    </div>
  );
}

function ShopMediaAddCard({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex h-28 w-24 shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-dashed border-stone-700/80 bg-stone-950/20 text-stone-400 ring-1 ring-stone-800/30 transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200",
      ].join(" ")}
      aria-label="Add media"
    >
      <div className="flex flex-1 items-center justify-center rounded-t-lg bg-stone-950/40">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium text-stone-500">Add file</p>
      </div>
    </button>
  );
}

export function FinanceMediaCarousel({
  media,
  pendingUploads = [],
  pendingMediaSelections = [],
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePending,
  onRemovePendingMedia,
  onDeleteMedia,
  onSetCover,
  disabled = false,
  pageFileDragActive = false,
}: FinanceMediaCarouselProps) {
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries: CarouselEntry[] = useMemo(() => {
    const saved: CarouselEntry[] = media.map((m) => ({ kind: "media", media: m }));
    const pending: CarouselEntry[] = pendingUploads.map((p) => ({
      kind: "pending",
      pending: p,
    }));
    const selected: CarouselEntry[] = pendingMediaSelections.map((item) => ({
      kind: "selectedMedia",
      selected: item,
    }));
    return [...saved, ...pending, ...selected];
  }, [media, pendingUploads, pendingMediaSelections]);

  const mediaCount = entries.length;

  const handleFiles = (files: FileList | File[]) => {
    if (disabled || !onQueueUploads) {
      return;
    }
    onQueueUploads(files);
  };

  const openSourceDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || (!onQueueUploads && !onQueueMediaSelections)) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
    setSourceDialogOpen(true);
  };

  const openFilePicker = () => {
    setSourceDialogOpen(false);
    setSourceDialogAnchor(null);
    fileInputRef.current?.click();
  };

  const scrollBy = (direction: -1 | 1) => {
    scrollRef.current?.scrollBy({
      left: direction * SCROLL_STEP_PX,
      behavior: "smooth",
    });
  };

  const dropZoneHandlers = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOver(false);
      }
    },
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
  };

  const dragActive = dragOver || pageFileDragActive;
  const hasEntries = entries.length > 0;

  return (
    <section className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Media{mediaCount > 0 ? ` (${mediaCount})` : ""}
        </h2>
        <div className="flex items-center gap-2">
          {hasEntries && (
            <>
              <button
                type="button"
                disabled={disabled}
                onClick={() => scrollBy(-1)}
                aria-label="Scroll media left"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 ring-1 ring-stone-800 hover:bg-stone-900 disabled:opacity-40"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => scrollBy(1)}
                aria-label="Scroll media right"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 ring-1 ring-stone-800 hover:bg-stone-900 disabled:opacity-40"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {!hasEntries ? (
        <div
          className={[
            "relative min-h-[8rem] rounded-xl transition",
            dragActive
              ? "border-2 border-dashed border-sky-500/60 bg-sky-950/20 p-4"
              : "border-0",
          ].join(" ")}
          {...dropZoneHandlers}
        >
          {dragActive ? (
            <p className="flex min-h-[6rem] items-center justify-start text-sm font-medium text-sky-300">
              Drag here to upload
            </p>
          ) : (
            <div className="flex min-h-[6rem] items-center justify-start">
              <ShopMediaAddCard
                disabled={disabled || (!onQueueUploads && !onQueueMediaSelections)}
                onClick={openSourceDialog}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative" {...dropZoneHandlers}>
          {dragActive && <MediaDragOverlay />}
          <div
            ref={scrollRef}
            className={[
              "scrollbar-hidden flex flex-row gap-3 overflow-x-auto py-1",
              dragActive ? "rounded-xl opacity-60" : "",
            ].join(" ")}
          >
          {entries.map((entry) => {
            const handleDelete = () => {
              if (entry.kind === "pending") {
                onRemovePending?.(entry.pending.clientId);
              } else if (entry.kind === "selectedMedia") {
                onRemovePendingMedia?.(entry.selected.clientId);
              } else {
                onDeleteMedia?.(entry.media.attachmentId);
              }
            };

            return (
              <MediaThumb
                key={
                  entry.kind === "media"
                    ? `media-${entry.media.attachmentId}`
                    : entry.kind === "selectedMedia"
                      ? `selected-${entry.selected.clientId}`
                    : `pending-${entry.pending.clientId}`
                }
                entry={entry}
                disabled={disabled}
                onDelete={handleDelete}
                onSetCover={
                  entry.kind === "media"
                    ? () => onSetCover?.(entry.media.mediaId)
                    : undefined
                }
                onViewMedia={
                  entry.kind === "media"
                    ? () => navigate(`/media/${entry.media.mediaId}`)
                    : undefined
                }
                onOpenPreview={setLightbox}
              />
            );
          })}
            {(onQueueUploads || onQueueMediaSelections) && (
              <ShopMediaAddCard
                disabled={disabled}
                onClick={openSourceDialog}
              />
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title="Add media"
        anchor={sourceDialogAnchor}
        disabled={disabled}
        onSelectFromMedia={() => {
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
          setMediaDialogOpen(true);
        }}
        onUpload={openFilePicker}
        onClose={() => {
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
        }}
      />
      <MediaImagePickerDialog
        open={mediaDialogOpen}
        title="Select shop media"
        disabled={disabled}
        multiSelect
        onSelect={(mediaObjects) => {
          onQueueMediaSelections?.(mediaObjects);
          setMediaDialogOpen(false);
        }}
        onClose={() => setMediaDialogOpen(false)}
      />

      {lightbox && (
        <MediaLightbox
          kind={lightbox.kind}
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => {
            if (lightbox.src.startsWith("blob:")) {
              URL.revokeObjectURL(lightbox.src);
            }
            setLightbox(null);
          }}
        />
      )}
    </section>
  );
}

export type { PendingUpload };
export type { PendingMediaSelection };

export function createPendingUpload(file: File): PendingUpload {
  return {
    clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function createPendingMediaSelection(media: MediaObject): PendingMediaSelection {
  return {
    clientId: `${media.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    media,
  };
}
