// keel_web/src/modules/media/components/pickers/MediaObjectPickerList.tsx

// Searchable media object list for inline or modal pickers.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  buildMediaContentUrl,
  fetchAllMedia,
  fetchMediaFolderContents,
  mediaQueryKeys,
  type MediaObject,
} from "../../api";
import {
  formatByteSize,
  mediaKindLabel,
} from "../../lib/media";
import {
  filterMediaPickerBrowseFiles,
  filterMediaPickerBrowseFolders,
  matchesMediaPickerFileSearch,
} from "../../lib/mediaPickerBrowse";
import {
  paginateMediaListContents,
  paginateMediaPickerItems,
} from "../../lib/mediaPickerPagination";
import { MediaPreview } from "../shared/MediaPreview";
import { MediaPickerBreadcrumbs } from "./MediaPickerBreadcrumbs";
import { MediaPickerFolderRow } from "./MediaPickerFolderRow";

type MediaObjectPickerListPagination = {
  page: number;
  pageSize: number;
  onReset?: () => void;
};

type MediaObjectPickerListProps = {
  enabled?: boolean;
  excludeMediaIds?: string[];
  compact?: boolean;
  selectedMediaId?: string | null;
  onSelect?: (media: MediaObject) => void;
  multiSelect?: boolean;
  selectedMediaIds?: string[];
  onToggleSelect?: (mediaId: string) => void;
  onCancel?: () => void;
  pagination?: MediaObjectPickerListPagination;
  onBrowseItemCountChange?: (count: number) => void;
  enableFolderBrowse?: boolean;
  mediaFilter?: (media: MediaObject) => boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

function MediaPickerCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        event.stopPropagation();
        onChange();
      }}
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      className="h-4 w-4 shrink-0 rounded border-stone-600 bg-stone-900 text-app-accent focus:ring-app-accent/40"
    />
  );
}

function MediaPickerRow({
  media,
  compact,
  selected,
  multiSelect,
  onActivate,
  onToggleSelect,
}: {
  media: MediaObject;
  compact: boolean;
  selected: boolean;
  multiSelect: boolean;
  onActivate: () => void;
  onToggleSelect?: () => void;
}) {
  const previewUrl = buildMediaContentUrl(media.id, media.updated_at);

  return (
    <button
      type="button"
      onClick={onActivate}
      className={[
        "flex w-full items-center rounded-lg text-left transition",
        compact ? "gap-2 px-1.5 py-1" : "gap-3 border px-3 py-2",
        selected
          ? compact
            ? "bg-app-accent/15 ring-1 ring-inset ring-app-accent/50"
            : "border-app-accent/60 bg-app-accent/10 ring-1 ring-app-accent/40"
          : compact
            ? "hover:bg-stone-900"
            : "border-transparent hover:bg-stone-900/80",
      ].join(" ")}
    >
      {multiSelect ? (
        <MediaPickerCheckbox
          checked={selected}
          onChange={() => onToggleSelect?.()}
          label={`Select ${media.original_filename}`}
        />
      ) : null}
      <MediaPreview
        srcUrl={previewUrl}
        mimeType={media.mime_type}
        mediaKind={media.media_kind}
        alt={media.original_filename}
        size="list"
      />
      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate font-medium text-stone-100",
            compact ? "text-[11px] leading-tight" : "text-sm",
          ].join(" ")}
        >
          {media.original_filename}
        </p>
        {!compact ? (
          <p className="text-xs text-stone-500">
            {mediaKindLabel(media.media_kind)} · {formatByteSize(media.byte_size)}
          </p>
        ) : null}
        {compact ? (
          <p className="truncate text-[10px] text-stone-500">
            {mediaKindLabel(media.media_kind)}
            <span className="mx-1 text-stone-700">·</span>
            {formatByteSize(media.byte_size)}
          </p>
        ) : null}
      </div>
      {!compact && selected && !multiSelect ? (
        <span className="shrink-0 rounded-full bg-app-accent/20 px-2 py-1 text-xs text-stone-100 ring-1 ring-app-accent/40">
          Selected
        </span>
      ) : null}
    </button>
  );
}

export function MediaObjectPickerList({
  enabled = true,
  excludeMediaIds = [],
  compact = false,
  selectedMediaId = null,
  onSelect,
  multiSelect = false,
  selectedMediaIds = [],
  onToggleSelect,
  onCancel,
  pagination,
  onBrowseItemCountChange,
  enableFolderBrowse = true,
  mediaFilter,
  searchPlaceholder: searchPlaceholderOverride,
  emptyMessage: emptyMessageOverride,
}: MediaObjectPickerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const excluded = useMemo(() => new Set(excludeMediaIds), [excludeMediaIds]);
  const selectedSet = useMemo(() => new Set(selectedMediaIds), [selectedMediaIds]);

  const mediaQuery = useQuery({
    queryKey: mediaQueryKeys.allMedia(),
    queryFn: () => fetchAllMedia(),
    enabled,
  });

  const contentsQuery = useQuery({
    queryKey: mediaQueryKeys.contents(browseFolderId),
    queryFn: () => fetchMediaFolderContents(browseFolderId),
    enabled: enabled && enableFolderBrowse,
  });

  useEffect(() => {
    if (!enabled) {
      setSearchQuery("");
      setBrowseFolderId(null);
    }
  }, [enabled]);

  const readyMedia = useMemo(
    () =>
      (mediaQuery.data ?? []).filter(
        (media) => media.status === "ready" && !excluded.has(media.id),
      ),
    [mediaQuery.data, excluded],
  );

  const mediaById = useMemo(
    () => new Map(readyMedia.map((media) => [media.id, media])),
    [readyMedia],
  );

  const stickySelectedMedia = useMemo(() => {
    if (!multiSelect) {
      return [];
    }
    return selectedMediaIds
      .map((id) => mediaById.get(id))
      .filter((media): media is MediaObject => media !== undefined);
  }, [mediaById, multiSelect, selectedMediaIds]);

  const browseFolders = useMemo(() => {
    if (!enableFolderBrowse) {
      return [];
    }
    return filterMediaPickerBrowseFolders(contentsQuery.data?.folders ?? [], searchQuery);
  }, [contentsQuery.data?.folders, enableFolderBrowse, searchQuery]);

  const browseMedia = useMemo(() => {
    if (enableFolderBrowse) {
      return filterMediaPickerBrowseFiles({
        media: contentsQuery.data?.media ?? [],
        searchQuery,
        excludeIds: excluded,
        hideSelectedIds: multiSelect ? selectedSet : new Set<string>(),
        mediaFilter,
      });
    }
    if (!multiSelect) {
      return readyMedia.filter(
        (media) =>
          (!mediaFilter || mediaFilter(media)) &&
          matchesMediaPickerFileSearch(media, searchQuery),
      );
    }
    return readyMedia.filter(
      (media) =>
        !selectedSet.has(media.id) &&
        (!mediaFilter || mediaFilter(media)) &&
        matchesMediaPickerFileSearch(media, searchQuery),
    );
  }, [
    contentsQuery.data?.media,
    enableFolderBrowse,
    excluded,
    mediaFilter,
    multiSelect,
    readyMedia,
    searchQuery,
    selectedSet,
  ]);

  const browseItemCount = browseFolders.length + browseMedia.length;

  useEffect(() => {
    onBrowseItemCountChange?.(browseItemCount);
  }, [browseItemCount, onBrowseItemCountChange]);

  const onPaginationReset = pagination?.onReset;

  useEffect(() => {
    onPaginationReset?.();
  }, [onPaginationReset, searchQuery, browseFolderId]);

  const visibleBrowse = useMemo(() => {
    if (!pagination) {
      return {
        folders: browseFolders,
        items: browseMedia,
      };
    }
    if (enableFolderBrowse) {
      return paginateMediaListContents({
        folders: browseFolders,
        items: browseMedia,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
    }
    return {
      folders: [],
      items: paginateMediaPickerItems(browseMedia, pagination.page, pagination.pageSize),
    };
  }, [browseFolders, browseMedia, enableFolderBrowse, pagination]);

  useEffect(() => {
    if (!onCancel) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleRowActivate = (media: MediaObject) => {
    if (multiSelect) {
      onToggleSelect?.(media.id);
      return;
    }
    onSelect?.(media);
  };

  const handleOpenFolder = (folderId: string) => {
    setBrowseFolderId(folderId);
  };

  const handleNavigateFolder = (folderId: string | null) => {
    setBrowseFolderId(folderId);
  };

  const isLoading = enableFolderBrowse
    ? mediaQuery.isLoading || contentsQuery.isLoading
    : mediaQuery.isLoading;

  const emptyBrowse =
    !isLoading &&
    stickySelectedMedia.length === 0 &&
    browseItemCount === 0;

  const hasSelectedSection = multiSelect && stickySelectedMedia.length > 0;
  const breadcrumbs = contentsQuery.data?.breadcrumbs ?? [];
  const searchPlaceholder =
    searchPlaceholderOverride ??
    (enableFolderBrowse ? "Search files and folders…" : "Search files…");
  const emptyMessage =
    emptyMessageOverride ??
    (enableFolderBrowse ? "No matching files or folders." : "No matching files.");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={compact ? "shrink-0 px-2 pt-2" : "shrink-0 px-3 pt-3"}>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoFocus
          className={[
            "w-full rounded-lg bg-stone-900 text-stone-100 outline-none ring-1 ring-stone-700 focus:ring-sky-500/50",
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
          ].join(" ")}
        />
      </div>

      {enableFolderBrowse ? (
        <MediaPickerBreadcrumbs
          breadcrumbs={breadcrumbs}
          compact={compact}
          onNavigate={handleNavigateFolder}
        />
      ) : null}

      {hasSelectedSection ? (
        <div
          className={[
            "shrink-0 overflow-y-auto scrollbar-hidden border-b border-stone-800 bg-stone-950/80",
            compact ? "max-h-[40%] px-1 py-1" : "max-h-[40%] px-2 py-2",
          ].join(" ")}
        >
          <p
            className={[
              "font-medium uppercase tracking-[0.16em] text-stone-500",
              compact ? "mb-0.5 px-1 text-[10px]" : "mb-1 text-xs",
            ].join(" ")}
          >
            Selected ({stickySelectedMedia.length})
          </p>
          <ul className="space-y-0.5">
            {stickySelectedMedia.map((media) => (
              <li key={`selected-${media.id}`}>
                <MediaPickerRow
                  media={media}
                  compact={compact}
                  selected
                  multiSelect
                  onActivate={() => handleRowActivate(media)}
                  onToggleSelect={() => onToggleSelect?.(media.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden px-1 py-1">
        {isLoading ? (
          <p
            className={
              compact
                ? "px-2 py-4 text-xs text-stone-500"
                : "px-3 py-8 text-sm text-stone-500"
            }
          >
            Loading media…
          </p>
        ) : null}

        {emptyBrowse ? (
          <p
            className={
              compact
                ? "px-2 py-4 text-xs text-stone-500"
                : "px-3 py-8 text-sm text-stone-500"
            }
          >
            {emptyMessage}
          </p>
        ) : null}

        {!isLoading && browseItemCount > 0 ? (
          <>
            {hasSelectedSection ? (
              <p
                className={[
                  "font-medium uppercase tracking-[0.16em] text-stone-500",
                  compact
                    ? "mb-0.5 px-1 pt-1 text-[10px]"
                    : "mb-1 px-1 pt-2 text-xs",
                ].join(" ")}
              >
                Browse
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {visibleBrowse.folders.map((folder) => (
                <li key={`folder-${folder.id}`}>
                  <MediaPickerFolderRow
                    folder={folder}
                    compact={compact}
                    onOpen={() => handleOpenFolder(folder.id)}
                  />
                </li>
              ))}
              {visibleBrowse.items.map((media) => {
                const selected = multiSelect
                  ? selectedSet.has(media.id)
                  : media.id === selectedMediaId;
                return (
                  <li key={media.id}>
                    <MediaPickerRow
                      media={media}
                      compact={compact}
                      selected={selected}
                      multiSelect={multiSelect}
                      onActivate={() => handleRowActivate(media)}
                      onToggleSelect={() => onToggleSelect?.(media.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
