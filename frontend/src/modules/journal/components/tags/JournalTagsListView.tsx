// keel_web/src/modules/journal/components/tags/JournalTagsListView.tsx

import type { Ref } from "react";

import { TagsListView } from "../../../../views/list/TagsListView";
import type { JournalTag } from "../../api";
import { getJournalTagSortValue } from "../../lib/journalTagListSort";
import {
  JOURNAL_TAG_LIST_GRID_CLASS,
  JOURNAL_TAG_LIST_TABLE_WIDTH_CLASS,
  JournalTagDraftRow,
  JournalTagListRow,
} from "./JournalTagListRow";

type JournalTagDraft = {
  name: string;
  colorHex: string;
};

type JournalTagsListViewProps = {
  tags: JournalTag[];
  draftTag?: JournalTagDraft | null;
  draftInputRef?: Ref<HTMLInputElement | null>;
  onDraftNameChange?: (name: string) => void;
  onDraftColorChange?: (colorHex: string) => void;
  onDraftCommit?: () => void;
  onDraftCancel?: () => void;
  onRename: (tagId: number, name: string) => void;
  onColorChange: (tagId: number, colorHex: string) => void;
  onDelete?: (tagId: number) => void;
  rowDisabled?: boolean;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function JournalTagsListView({
  tags,
  draftTag = null,
  draftInputRef,
  onDraftNameChange,
  onDraftColorChange,
  onDraftCommit,
  onDraftCancel,
  onRename,
  onColorChange,
  onDelete,
  rowDisabled = false,
  deleteDisabled = false,
  emptyMessage = "No tags yet.",
  paginationResetKey,
}: JournalTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <JournalTagDraftRow
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
      countColumnLabel="Entries"
      showDescription={false}
      getSortValue={getJournalTagSortValue}
      gridClassName={JOURNAL_TAG_LIST_GRID_CLASS}
      tableWidthClassName={JOURNAL_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <JournalTagListRow
          tag={tag}
          disabled={rowDisabled}
          onRename={onRename}
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
