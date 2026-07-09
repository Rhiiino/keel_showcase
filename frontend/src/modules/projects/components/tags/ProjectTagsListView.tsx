// keel_web/src/modules/projects/components/tags/ProjectTagsListView.tsx

import type { Ref } from "react";

import { TagsListView } from "../../../../views/list/TagsListView";
import type { ProjectTag } from "../../api";
import { getProjectTagSortValue } from "../../lib/projectTagListSort";
import {
  PROJECT_TAG_LIST_GRID_CLASS,
  PROJECT_TAG_LIST_TABLE_WIDTH_CLASS,
  ProjectTagDraftRow,
  ProjectTagListRow,
} from "./ProjectTagListRow";

type ProjectTagDraft = {
  name: string;
  colorHex: string;
};

type ProjectTagsListViewProps = {
  tags: ProjectTag[];
  draftTag?: ProjectTagDraft | null;
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

export function ProjectTagsListView({
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
}: ProjectTagsListViewProps) {
  const draftRow =
    draftTag && onDraftNameChange && onDraftColorChange && onDraftCommit && onDraftCancel ? (
      <ProjectTagDraftRow
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
      countColumnLabel="Projects"
      showDescription
      getSortValue={getProjectTagSortValue}
      gridClassName={PROJECT_TAG_LIST_GRID_CLASS}
      tableWidthClassName={PROJECT_TAG_LIST_TABLE_WIDTH_CLASS}
      renderRow={(tag) => (
        <ProjectTagListRow
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
