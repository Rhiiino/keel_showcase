// keel_web/src/views/list/types.ts

import type { ReactNode } from "react";

import type {
  ListColumnSortState,
  ListSortAccessor,
} from "./primitives/listColumnSort";

export type ListColumnDef<TColumn extends string = string> = {
  id: TColumn;
  label: string;
  /** Data columns are sortable by default. Set false for action/spacer columns. */
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

export type ListViewProps<TItem, TColumn extends string> = {
  items: readonly TItem[];
  columns: readonly ListColumnDef<TColumn>[];
  getSortValue: ListSortAccessor<TItem, TColumn>;
  defaultSort: ListColumnSortState<TColumn>;
  gridClassName: string;
  tableWidthClassName?: string;
  renderRow: (item: TItem) => ReactNode;
  emptyMessage?: string;
  pagination?: boolean;
  paginationResetKey?: unknown;
  /** Content above the table inside the bordered shell (e.g. breadcrumbs). */
  headerSlot?: ReactNode;
  /** Row rendered immediately after the header row (e.g. tag draft row). */
  afterHeader?: ReactNode;
  /** Rows rendered before data rows but after header (e.g. inline folder create). */
  beforeRows?: ReactNode;
  /** Rows rendered after data rows (e.g. media add folder/upload footer). */
  afterRows?: ReactNode;
  /** When true, skip the empty-state message (e.g. tag draft row visible). */
  suppressEmptyState?: boolean;
  /** When true, the bordered shell shrinks to column content instead of spanning full width. */
  fitToContent?: boolean;
  getRowKey: (item: TItem) => string | number;
};

export type TagsListColumnId =
  | "color"
  | "name"
  | "description"
  | "preview"
  | "count"
  | "planItemCount";

export type TagsListViewProps<TTag> = {
  tags: readonly TTag[];
  countColumnLabel: string;
  secondaryCountColumnLabel?: string;
  showDescription?: boolean;
  showPreview?: boolean;
  getSortValue: ListSortAccessor<TTag, TagsListColumnId>;
  defaultSort?: ListColumnSortState<TagsListColumnId>;
  gridClassName: string;
  tableWidthClassName?: string;
  renderRow: (tag: TTag) => ReactNode;
  draftRow?: ReactNode;
  emptyMessage?: string;
  paginationResetKey?: unknown;
  getTagKey: (tag: TTag) => string | number;
};
