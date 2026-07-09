// keel_web/src/modules/media/components/panels/MediaPanelTileBack.tsx

// Styled metadata face for a flipped panel tile.

import type { MediaPanelItem } from "../../api";
import {
  formatByteSize,
  formatCreatedAt,
  isMediaObjectStatus,
  mediaKindLabel,
  mediaStatusLabel,
  mediaStatusPillClass,
} from "../../lib/media";
import { MediaDownloadButton } from "../shared/actions";
import { MediaKindIcon } from "../shared/icons";

type MediaPanelTileBackProps = {
  item: MediaPanelItem;
  editMode: boolean;
  onFlipBack: () => void;
};

export function MediaPanelTileBack({ item, editMode, onFlipBack }: MediaPanelTileBackProps) {
  const { media } = item;
  const activeStatusClass = isMediaObjectStatus(media.status)
    ? mediaStatusPillClass(media.status)
    : "bg-stone-900/80 text-stone-300 ring-stone-700/80";

  return (
    <div
      role="button"
      tabIndex={editMode ? -1 : 0}
      onClick={onFlipBack}
      onKeyDown={(event) => {
        if (!editMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onFlipBack();
        }
      }}
      className={[
        "absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-stone-800/90 bg-gradient-to-br from-stone-950 via-stone-950/95 to-stone-900/90 p-3 text-left shadow-inner shadow-black/30 sm:p-4",
        editMode ? "cursor-default" : "cursor-pointer",
      ].join(" ")}
      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-sky-300/70">
              Current file
            </p>
            <h3
              className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-50 sm:text-base"
              title={media.original_filename}
            >
              {media.original_filename}
            </h3>
            <p className="mt-1 truncate text-[11px] text-stone-500">{media.mime_type}</p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-900/80 ring-1 ring-white/[0.08]"
            onClick={(event) => event.stopPropagation()}
          >
            <MediaKindIcon mediaKind={media.media_kind} className="h-5 w-5" />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl border border-stone-800/80 bg-stone-950/50 p-2.5 sm:gap-y-3 sm:p-3">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-stone-500">Kind</dt>
            <dd className="mt-0.5 text-xs font-medium text-stone-200">
              {mediaKindLabel(media.media_kind)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-stone-500">Size</dt>
            <dd className="mt-0.5 text-xs font-medium text-stone-200">
              {formatByteSize(media.byte_size)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-stone-500">Status</dt>
            <dd className="mt-0.5">
              <span
                className={[
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                  activeStatusClass,
                ].join(" ")}
              >
                {mediaStatusLabel(media.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-stone-500">Created</dt>
            <dd className="mt-0.5 text-xs font-medium text-stone-200">
              {formatCreatedAt(media.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-2 flex justify-end border-t border-stone-800/70 pt-2">
        <div onClick={(event) => event.stopPropagation()}>
          <MediaDownloadButton
            mediaId={media.id}
            filename={media.original_filename}
            variant="icon"
            disabled={media.status !== "ready"}
          />
        </div>
      </div>
    </div>
  );
}
