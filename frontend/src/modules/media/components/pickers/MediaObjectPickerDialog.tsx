// keel_web/src/modules/media/components/pickers/MediaObjectPickerDialog.tsx

// Searchable modal for choosing one or more existing media objects.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ListPagination } from "../../../../views/list/ListPaginationBar";
import { fetchAllMedia, mediaQueryKeys, type MediaObject } from "../../api";
import { useMediaPickerPagination } from "../../lib/mediaPickerPagination";
import { MediaObjectPickerList } from "./MediaObjectPickerList";

type MediaObjectPickerDialogBaseProps = {
  open: boolean;
  title: string;
  selectLabel?: string;
  description?: string;
  disabled?: boolean;
  excludeMediaIds?: string[];
  mediaFilter?: (media: MediaObject) => boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  overlayZIndexClass?: string;
  onClose: () => void;
};

type MediaObjectPickerDialogSingleProps = MediaObjectPickerDialogBaseProps & {
  multiSelect?: false;
  onSelect: (media: MediaObject) => void;
};

type MediaObjectPickerDialogMultiProps = MediaObjectPickerDialogBaseProps & {
  multiSelect: true;
  onSelect: (media: MediaObject[]) => void;
};

type MediaObjectPickerDialogProps =
  | MediaObjectPickerDialogSingleProps
  | MediaObjectPickerDialogMultiProps;

export function MediaObjectPickerDialog(props: MediaObjectPickerDialogProps) {
  const {
    open,
    title,
    selectLabel,
    description,
    disabled = false,
    excludeMediaIds = [],
    mediaFilter,
    searchPlaceholder,
    emptyMessage,
    overlayZIndexClass = "z-[70]",
    onClose,
  } = props;
  const multiSelect = props.multiSelect === true;

  const [selectedMedia, setSelectedMedia] = useState<MediaObject | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [browseItemCount, setBrowseItemCount] = useState(0);

  const { page, pageSize, totalPages, setPage, setPageSize } = useMediaPickerPagination(
    browseItemCount,
    open,
  );

  const handleBrowseItemCountChange = useCallback((count: number) => {
    setBrowseItemCount(count);
  }, []);

  const resetPaginationPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const mediaQuery = useQuery({
    queryKey: mediaQueryKeys.allMedia(),
    queryFn: () => fetchAllMedia(),
    enabled: open,
  });

  const mediaById = useMemo(() => {
    const map = new Map<string, MediaObject>();
    for (const media of mediaQuery.data ?? []) {
      map.set(media.id, media);
    }
    return map;
  }, [mediaQuery.data]);

  useEffect(() => {
    if (!open) {
      setSelectedMedia(null);
      setSelectedMediaIds([]);
      setBrowseItemCount(0);
    }
  }, [open]);

  const toggleSelected = (mediaId: string) => {
    setSelectedMediaIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId],
    );
  };

  const confirmLabel =
    multiSelect && selectedMediaIds.length > 0
      ? `${selectLabel ?? "Select"} (${selectedMediaIds.length})`
      : (selectLabel ?? (multiSelect ? "Select" : "Add to panel"));

  const canConfirm = multiSelect
    ? selectedMediaIds.length > 0
    : selectedMedia !== null;

  const handleConfirm = () => {
    if (multiSelect) {
      const selected = selectedMediaIds
        .map((id) => mediaById.get(id))
        .filter((media): media is MediaObject => media !== undefined);
      if (selected.length > 0) {
        props.onSelect(selected);
      }
      return;
    }
    if (selectedMedia) {
      props.onSelect(selectedMedia);
    }
  };

  const helperText =
    description ??
    (multiSelect ? "Browse folders, select one or more files, then confirm." : null);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/70 p-4 ${overlayZIndexClass}`}
    >
      <button
        type="button"
        aria-label="Close picker"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[85vh] max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl">
        <div className="shrink-0 border-b border-stone-800 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-stone-50">{title}</h2>
              {helperText ? (
                <p className="mt-1 text-sm text-stone-500">{helperText}</p>
              ) : null}
            </div>
            {!mediaQuery.isLoading ? (
              <ListPagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                disabled={disabled}
              />
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MediaObjectPickerList
            excludeMediaIds={excludeMediaIds}
            multiSelect={multiSelect}
            selectedMediaIds={selectedMediaIds}
            onToggleSelect={toggleSelected}
            selectedMediaId={selectedMedia?.id ?? null}
            onSelect={setSelectedMedia}
            onCancel={onClose}
            pagination={{ page, pageSize, onReset: resetPaginationPage }}
            onBrowseItemCountChange={handleBrowseItemCountChange}
            mediaFilter={mediaFilter}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-stone-800 bg-stone-950 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-400 hover:text-stone-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={disabled || !canConfirm}
            onClick={handleConfirm}
            className="btn-accent-subtle"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
