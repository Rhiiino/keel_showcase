// keel_web/src/modules/contacts/components/tags/ContactTagsListView.tsx

import type { Ref } from "react";

import { TagsListView } from "../../../../../views/list/TagsListView";
import type { ContactTag } from "../../api";
import { getContactTagSortValue } from "../../lib/contactTagListSort";
import {
  CONTACT_TAG_LIST_GRID_CLASS,
  CONTACT_TAG_LIST_TABLE_WIDTH_CLASS,
  ContactTagDraftRow,
  ContactTagListRow,
} from "./ContactTagListRow";

type ContactTagDraft = {
  name: string;
  colorHex: string;
};

type ContactTagsListViewProps = {
  tags: ContactTag[];
  draftTag?: ContactTagDraft | null;
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

export function ContactTagsListView({
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
}: ContactTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <ContactTagDraftRow
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
      countColumnLabel="Contacts"
      showDescription={false}
      getSortValue={getContactTagSortValue}
      gridClassName={CONTACT_TAG_LIST_GRID_CLASS}
      tableWidthClassName={CONTACT_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <ContactTagListRow
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
