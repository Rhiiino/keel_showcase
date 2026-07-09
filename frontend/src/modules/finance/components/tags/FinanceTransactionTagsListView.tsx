// keel_web/src/modules/shop/components/tags/FinanceTransactionTagsListView.tsx

import type { Ref } from "react";

import { TagsListView } from "../../../../views/list/TagsListView";
import type { FinanceTransactionTag } from "../../api";
import { getFinanceTransactionTagSortValue } from "../../lib/transactionTagListSort";
import {
  FINANCE_TAG_LIST_GRID_CLASS,
  FINANCE_TAG_LIST_TABLE_WIDTH_CLASS,
  FinanceTagDraftRow,
  FinanceTransactionTagListRow,
} from "./FinanceTransactionTagListRow";

type FinanceTagDraft = {
  name: string;
  colorHex: string;
};

type FinanceTransactionTagsListViewProps = {
  tags: FinanceTransactionTag[];
  draftTag?: FinanceTagDraft | null;
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

export function FinanceTransactionTagsListView({
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
}: FinanceTransactionTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <FinanceTagDraftRow
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
      countColumnLabel="Items"
      showDescription
      getSortValue={getFinanceTransactionTagSortValue}
      gridClassName={FINANCE_TAG_LIST_GRID_CLASS}
      tableWidthClassName={FINANCE_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <FinanceTransactionTagListRow
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
