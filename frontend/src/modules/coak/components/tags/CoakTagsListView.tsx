// keel_web/src/modules/coak/components/tags/CoakTagsListView.tsx

import type { RefObject } from "react";

import { TagsListView } from "../../../../views/list/TagsListView";
import type { CoakTag } from "../../api";
import { getCoakTagSortValue } from "../../lib/coakTagListSort";
import {
  COAK_TAG_LIST_GRID_CLASS,
  COAK_TAG_LIST_TABLE_WIDTH_CLASS,
  CoakTagDraftRow,
  CoakTagListRow,
} from "./CoakTagListRow";

type CoakTagDraft = {
  name: string;
  colorHex: string;
};

type CoakTagsListViewProps = {
  tags: CoakTag[];
  draftTag?: CoakTagDraft | null;
  draftInputRef?: RefObject<HTMLInputElement>;
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

export function CoakTagsListView({
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
}: CoakTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <CoakTagDraftRow
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
      countColumnLabel="Nodes"
      showDescription
      showPreview={false}
      getSortValue={getCoakTagSortValue}
      gridClassName={COAK_TAG_LIST_GRID_CLASS}
      tableWidthClassName={COAK_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <CoakTagListRow
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
