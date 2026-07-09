// keel_web/src/views/list/TagsListView.tsx

import { useMemo } from "react";

import { ListView } from "./ListView";
import type { ListColumnDef, TagsListColumnId, TagsListViewProps } from "./types";

const DEFAULT_TAGS_SORT = { column: "name" as const, direction: "asc" as const };

type TagsListColumn = TagsListColumnId | "actions";

export function TagsListView<TTag>({
  tags,
  countColumnLabel,
  secondaryCountColumnLabel,
  showDescription = false,
  showPreview = true,
  getSortValue,
  defaultSort = DEFAULT_TAGS_SORT,
  gridClassName,
  tableWidthClassName,
  renderRow,
  draftRow,
  emptyMessage = "No tags yet.",
  paginationResetKey,
  getTagKey,
}: TagsListViewProps<TTag>) {
  const columns = useMemo((): ListColumnDef<TagsListColumn>[] => {
    const defs: ListColumnDef<TagsListColumn>[] = [
      { id: "color", label: "Color" },
      { id: "name", label: "Name" },
    ];

    if (showDescription) {
      defs.push({ id: "description", label: "Description" });
    }

    if (showPreview) {
      defs.push({ id: "preview", label: "Preview" });
    }

    defs.push({
      id: "count",
      label: countColumnLabel,
      headerClassName: "justify-center px-4 py-3 text-center",
    });

    if (secondaryCountColumnLabel) {
      defs.push({
        id: "planItemCount",
        label: secondaryCountColumnLabel,
        headerClassName: "justify-center px-4 py-3 text-center",
      });
    }

    defs.push({ id: "actions", label: "", sortable: false, headerClassName: "px-2 py-3" });

    return defs;
  }, [countColumnLabel, secondaryCountColumnLabel, showDescription, showPreview]);

  return (
    <ListView<TTag, TagsListColumn>
      items={tags}
      columns={columns}
      getSortValue={(tag, column) => {
        if (column === "actions") {
          return null;
        }
        return getSortValue(tag, column);
      }}
      defaultSort={defaultSort}
      gridClassName={gridClassName}
      tableWidthClassName={tableWidthClassName}
      renderRow={renderRow}
      getRowKey={getTagKey}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey ?? tags.length}
      afterHeader={draftRow ?? undefined}
      suppressEmptyState={Boolean(draftRow) && tags.length === 0}
    />
  );
}
