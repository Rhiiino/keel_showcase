// keel_web/src/modules/timeline/components/tags/TimelineTagsListView.tsx

import type { Ref } from "react";

import { TagsListView } from "../../../../views/list/TagsListView";
import type { TimelineTag } from "../../api";
import { getTimelineTagSortValue } from "../../lib/timelineTagListSort";
import {
  TIMELINE_TAG_LIST_GRID_CLASS,
  TIMELINE_TAG_LIST_TABLE_WIDTH_CLASS,
  TimelineTagDraftRow,
  TimelineTagListRow,
} from "./TimelineTagListRow";

type TimelineTagDraft = {
  name: string;
  colorHex: string;
};

type TimelineTagsListViewProps = {
  tags: TimelineTag[];
  draftTag?: TimelineTagDraft | null;
  draftInputRef?: Ref<HTMLInputElement | null>;
  onDraftNameChange?: (name: string) => void;
  onDraftColorChange?: (colorHex: string) => void;
  onDraftCommit?: () => void;
  onDraftCancel?: () => void;
  onRename: (tagId: number, name: string) => void;
  onDescriptionChange: (tagId: number, description: string | null) => void;
  onColorChange: (tagId: number, colorHex: string) => void;
  onDelete?: (tagId: number) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function TimelineTagsListView({
  tags,
  draftTag = null,
  draftInputRef,
  onDraftNameChange,
  onDraftColorChange,
  onDraftCommit,
  onDraftCancel,
  onRename,
  onDescriptionChange,
  onColorChange,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
  emptyMessage = "No tags yet.",
  paginationResetKey,
}: TimelineTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <TimelineTagDraftRow
        name={draftTag.name}
        colorHex={draftTag.colorHex}
        disabled={rowDisabled}
        inputRef={draftInputRef}
        onNameChange={onDraftNameChange}
        onColorChange={onDraftColorChange}
        onCommit={onDraftCommit}
        onCancel={onDraftCancel}
      />
    ) : null;

  return (
    <TagsListView
      tags={tags}
      countColumnLabel="Events"
      secondaryCountColumnLabel="Plan items"
      showDescription
      getSortValue={getTimelineTagSortValue}
      gridClassName={TIMELINE_TAG_LIST_GRID_CLASS}
      tableWidthClassName={TIMELINE_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <TimelineTagListRow
          tag={tag}
          disabled={rowDisabled}
          onRename={onRename}
          onDescriptionChange={onDescriptionChange}
          onColorChange={onColorChange}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      draftRow={draftRow}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
      getTagKey={(tag) => tag.id}
    />
  );
}
