// keel_web/src/modules/media/lib/mediaPickerPagination.ts

// Client-side pagination helpers for media picker modals.

import { useEffect, useState } from "react";

import {
  clampListPageSize,
  DEFAULT_LIST_PAGE_SIZE,
  getListTotalPages,
  paginateListItems,
} from "../../../views/list/listPagination";

export const DEFAULT_MEDIA_PICKER_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
export const MIN_MEDIA_PICKER_PAGE_SIZE = 1;
export const MAX_MEDIA_PICKER_PAGE_SIZE = 200;

export function clampMediaPickerPageSize(value: number): number {
  return clampListPageSize(value);
}

export function getMediaPickerTotalPages(itemCount: number, pageSize: number): number {
  return getListTotalPages(itemCount, pageSize);
}

export function paginateMediaPickerItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): T[] {
  return paginateListItems(items, page, pageSize);
}



export function paginateMediaListContents<
  TFolder,
  TItem,
>({
  folders,
  items,
  page,
  pageSize,
}: {
  folders: TFolder[];
  items: TItem[];
  page: number;
  pageSize: number;
}): { folders: TFolder[]; items: TItem[] } {
  const start = (Math.max(1, page) - 1) * pageSize;
  const end = start + pageSize;
  const folderCount = folders.length;

  if (end <= folderCount) {
    return { folders: folders.slice(start, end), items: [] };
  }
  if (start >= folderCount) {
    return { folders: [], items: items.slice(start - folderCount, end - folderCount) };
  }

  return {
    folders: folders.slice(start),
    items: items.slice(0, end - folderCount),
  };
}

export function useMediaPickerPagination(itemCount: number, resetWhen: unknown) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_MEDIA_PICKER_PAGE_SIZE);
  const totalPages = getMediaPickerTotalPages(itemCount, pageSize);

  useEffect(() => {
    setPage(1);
  }, [resetWhen]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const setPageSize = (next: number) => {
    setPageSizeState(clampMediaPickerPageSize(next));
    setPage(1);
  };

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
  };
}
