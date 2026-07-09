// keel_web/src/modules/home/cards/slideshow/HomeSlideshowEditor.tsx

// Inline editor for the home slideshow image list and rotation interval.

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import {
  buildMediaContentUrl,
  fetchMediaMetadata,
  mediaQueryKeys,
  type MediaObject,
} from "../../../media/api";
import { MediaImagePickerDialog } from "../../../media/components/pickers";
import { useHomeCardSlot } from "../layout/HomeCardCanvasContext";
import {
  MAX_HOME_SLIDESHOW_INTERVAL_SECONDS,
  MIN_HOME_SLIDESHOW_INTERVAL_SECONDS,
} from "../../lib/slideshowInterval";

type HomeSlideshowEditorProps = {
  mediaIds: string[];
  intervalSeconds: number;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (mediaIds: string[], intervalSeconds: number) => void;
  onCancel: () => void;
};

function MoveButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-stone-700/80 px-2 py-1 text-xs text-stone-300 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label === "Move up" ? "↑" : "↓"}
    </button>
  );
}

export function HomeSlideshowEditor({
  mediaIds: initialMediaIds,
  intervalSeconds: initialIntervalSeconds,
  disabled = false,
  isSaving = false,
  onSave,
  onCancel,
}: HomeSlideshowEditorProps) {
  const [draftMediaIds, setDraftMediaIds] = useState(initialMediaIds);
  const [draftIntervalSeconds, setDraftIntervalSeconds] = useState(
    initialIntervalSeconds,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const slot = useHomeCardSlot();
  const fillSlot = Boolean(slot?.fillSlot);

  const metadataQueries = useQueries({
    queries: draftMediaIds.map((mediaId) => ({
      queryKey: mediaQueryKeys.detail(mediaId),
      queryFn: () => fetchMediaMetadata(mediaId),
      staleTime: 60_000,
    })),
  });

  const metadataById = useMemo(() => {
    const map = new Map<string, MediaObject>();
    draftMediaIds.forEach((mediaId, index) => {
      const data = metadataQueries[index]?.data;
      if (data) {
        map.set(mediaId, data);
      }
    });
    return map;
  }, [draftMediaIds, metadataQueries]);

  const isBusy = disabled || isSaving;
  const hasChanges =
    draftIntervalSeconds !== initialIntervalSeconds ||
    draftMediaIds.length !== initialMediaIds.length ||
    draftMediaIds.some((id, index) => id !== initialMediaIds[index]);

  const moveItem = (index: number, delta: -1 | 1) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= draftMediaIds.length) {
      return;
    }
    setDraftMediaIds((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const removeItem = (index: number) => {
    setDraftMediaIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const appendSelectedMedia = (selected: MediaObject[]) => {
    if (selected.length === 0) {
      return;
    }
    setDraftMediaIds((current) => {
      const seen = new Set(current);
      const next = [...current];
      for (const media of selected) {
        if (!seen.has(media.id)) {
          seen.add(media.id);
          next.push(media.id);
        }
      }
      return next;
    });
    setPickerOpen(false);
  };

  return (
    <div
      data-home-card-no-drag
      className={fillSlot ? "flex h-full min-h-0 w-full flex-col" : undefined}
    >
      <div
        className={[
          "rounded-xl border border-stone-800/90 bg-stone-950/40 p-4 shadow-lg shadow-black/20",
          fillSlot ? "flex min-h-0 flex-1 flex-col" : "",
        ].join(" ")}
      >
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-100">Edit slideshow</h2>
              <p className="mt-1 text-xs text-stone-500">
                Choose images from Media and set their display order.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setPickerOpen(true)}
                className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add images
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={onCancel}
                className="rounded-lg border border-stone-800 px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy || !hasChanges}
                onClick={() => onSave(draftMediaIds, draftIntervalSeconds)}
                className="rounded-lg border border-sky-700/80 bg-sky-950/50 px-3 py-1.5 text-sm text-sky-100 hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-stone-400">
              Display time ({draftIntervalSeconds} s)
            </label>
            <input
              type="range"
              min={MIN_HOME_SLIDESHOW_INTERVAL_SECONDS}
              max={MAX_HOME_SLIDESHOW_INTERVAL_SECONDS}
              step={1}
              value={draftIntervalSeconds}
              disabled={isBusy}
              onChange={(event) =>
                setDraftIntervalSeconds(Number(event.target.value))
              }
              className="w-full accent-sky-500"
            />
          </div>
        </div>

        {draftMediaIds.length === 0 ? (
          <p className="mt-4 shrink-0 rounded-lg border border-dashed border-stone-800 px-4 py-8 text-center text-sm text-stone-500">
            No images yet. Add images from your Media library.
          </p>
        ) : (
          <ul
            className={[
              "mt-4 min-h-0 space-y-2",
              fillSlot
                ? "flex-1 overflow-y-auto overscroll-contain scrollbar-hidden"
                : "max-h-64 overflow-y-auto overscroll-contain scrollbar-hidden",
            ].join(" ")}
          >
            {draftMediaIds.map((mediaId, index) => {
              const media = metadataById.get(mediaId);
              const previewUrl = media
                ? buildMediaContentUrl(media.id, media.updated_at)
                : buildMediaContentUrl(mediaId);
              const title = media?.original_filename ?? mediaId;

              return (
                <li
                  key={`${mediaId}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-stone-800/80 bg-stone-950/60 p-2"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-stone-900">
                    <img
                      src={previewUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-200">{title}</p>
                    <p className="text-xs text-stone-500">Slide {index + 1}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <MoveButton
                      label="Move up"
                      disabled={isBusy || index === 0}
                      onClick={() => moveItem(index, -1)}
                    />
                    <MoveButton
                      label="Move down"
                      disabled={isBusy || index === draftMediaIds.length - 1}
                      onClick={() => moveItem(index, 1)}
                    />
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => removeItem(index)}
                      className="rounded-md border border-rose-900/70 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <MediaImagePickerDialog
        open={pickerOpen}
        title="Add slideshow images"
        selectLabel="Add selected"
        multiSelect
        disabled={isBusy}
        onClose={() => setPickerOpen(false)}
        onSelect={appendSelectedMedia}
      />
    </div>
  );
}
