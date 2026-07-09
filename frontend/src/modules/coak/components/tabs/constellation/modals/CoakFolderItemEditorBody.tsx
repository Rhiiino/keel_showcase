// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakFolderItemEditorBody.tsx

import { useCallback, useMemo, useState } from "react";

import { coakItemNodeId } from "../../../../api";
import type { CoakItem } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakSiblingListReorder } from "../../../../hooks/tabs/useCoakSiblingListReorder";
import { COAK_ITEM_EDITOR_SECTION_LABEL_CLASS } from "../../../../lib/tabs/constellation/coakItemEditorStyles";
import { findCoakTreeNode } from "../../../../lib/tabs/directory/coakTree";
import { CoakFolderContentAddRow } from "./CoakFolderContentAddRow";
import { CoakFolderContentRow } from "./CoakFolderContentRow";
import { CoakItemNodeBodyEditor } from "./CoakItemNodeBodyEditor";

type CoakFolderItemEditorBodyProps = {
  item: CoakItem;
  disabled?: boolean;
};

export function CoakFolderItemEditorBody({ item, disabled }: CoakFolderItemEditorBodyProps) {
  const {
    tree,
    selectDirectoryNode,
    createChildItem,
    renameItem,
    deleteItem,
    reorderSiblings,
    isLoading,
  } = useCoakRecordWorkspace();
  const treeNode = findCoakTreeNode(tree, item.id);
  const children = treeNode?.children ?? [];
  const siblingIds = useMemo(() => children.map((child) => child.id), [children]);
  const [titleFocusItemId, setTitleFocusItemId] = useState<number | null>(null);
  const rowActionsDisabled = disabled || isLoading;

  const handleReorder = useCallback(
    async (childId: number, insertIndex: number) => {
      await reorderSiblings(item.id, childId, insertIndex);
    },
    [item.id, reorderSiblings],
  );

  const {
    draggingItemId,
    dropInsertIndex,
    setRowRef,
    handleDragStart,
    handleListDragOver,
    handleDrop,
    handleDragEnd,
  } = useCoakSiblingListReorder({
    siblingIds,
    disabled: rowActionsDisabled,
    onReorder: handleReorder,
  });

  const handleCreateChild = useCallback(
    async (kind: "folder" | "note" | "flash") => {
      const created = await createChildItem(kind, item.id);
      setTitleFocusItemId(created.id);
    },
    [createChildItem, item.id],
  );

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <CoakItemNodeBodyEditor item={item} disabled={rowActionsDisabled} />

      <div className="min-h-0">
      <p className={COAK_ITEM_EDITOR_SECTION_LABEL_CLASS}>Contents</p>
      <ul
        className="space-y-1.5"
        onDragOver={handleListDragOver}
        onDrop={(event) => {
          event.preventDefault();
          handleDrop();
        }}
      >
        {children.map((child, index) => (
          <CoakFolderContentRow
            key={child.id}
            child={child}
            disabled={rowActionsDisabled}
            autoFocusTitle={titleFocusItemId === child.id}
            isDragging={draggingItemId === child.id}
            showInsertTop={draggingItemId !== null && dropInsertIndex === index}
            showInsertBottom={
              draggingItemId !== null &&
              dropInsertIndex === children.length &&
              index === children.length - 1
            }
            rowRef={(node) => setRowRef(child.id, node)}
            onDragStart={(event) => handleDragStart(child.id, event)}
            onDragEnd={handleDragEnd}
            onSelect={() => {
              if (titleFocusItemId === child.id) {
                setTitleFocusItemId(null);
              }
              selectDirectoryNode(coakItemNodeId(child.id));
            }}
            onRename={(name) => {
              void renameItem(child.id, name);
              if (titleFocusItemId === child.id) {
                setTitleFocusItemId(null);
              }
            }}
            onDelete={() => {
              void deleteItem(child.id);
              if (titleFocusItemId === child.id) {
                setTitleFocusItemId(null);
              }
            }}
            onTitleFocusApplied={() => {
              if (titleFocusItemId === child.id) {
                setTitleFocusItemId(null);
              }
            }}
          />
        ))}
        <CoakFolderContentAddRow
          disabled={rowActionsDisabled}
          onAddFolder={() => {
            void handleCreateChild("folder");
          }}
          onAddNote={() => {
            void handleCreateChild("note");
          }}
          onAddFlash={() => {
            void handleCreateChild("flash");
          }}
        />
      </ul>
      </div>
    </div>
  );
}
