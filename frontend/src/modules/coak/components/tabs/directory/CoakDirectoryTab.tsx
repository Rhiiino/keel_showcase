// keel_web/src/modules/coak/components/tabs/directory/CoakDirectoryTab.tsx

import { useMemo, useState, type DragEvent } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { useCoakDirectoryDragReorder } from "../../../hooks/tabs/directory/useCoakDirectoryDragReorder";
import { isCoakMultiSelectModifier } from "../../../lib/coakMultiSelect";
import { isCoakFolderExpanded, type CoakTreeNode } from "../../../lib/tabs/directory/coakTree";
import { collectCoakSearchAncestorFolderIds } from "../../../lib/tabs/directory/coakDirectorySearch";
import { coakDirectoryRowPreview } from "../../../lib/tabs/directory/coakDirectoryPreview";
import { collectCoakSiblingItemIds } from "../../../lib/tabs/directory/coakSiblingSortOrder";
import { CoakDirectoryRow, coakTreeNodeId } from "./CoakDirectoryRow";
import { CoakDirectorySearchBar } from "./CoakDirectorySearchBar";

function renderTreeNodes(
  nodes: CoakTreeNode[],
  depth: number,
  options: {
    expandedFolderIds: number[];
    searchExpandedFolderIds: Set<number>;
    highlightedNodeIds: Set<string>;
    draggingItemId: number | null;
    dropInsertIndex: number | null;
    visibleIndexById: Map<number, number>;
    visibleRowCount: number;
    disabled: boolean;
    onSelect: (nodeId: string, event?: Pick<MouseEvent, "metaKey" | "ctrlKey">) => void;
    onToggleSelect: (nodeId: string) => void;
    onToggleFolder: (folderId: number) => void;
    onRename: (itemId: number, name: string) => void;
    onPromoteNoteToFolder: (itemId: number) => void;
    onColorChange: (itemId: number, colorHex: string) => void;
    onTagsChange: (itemId: number, tagIds: number[]) => void;
    onDelete: (itemId: number) => void;
    onDropIntoFolder: (targetParentId: number | null, itemId: number) => void;
    onDragStartItem: (itemId: number, event: DragEvent<HTMLElement>) => void;
    onDragEndItem: () => void;
    onAddFolder: (parentId: number) => void;
    onAddNote: (parentId: number) => void;
    onAddFlash: (parentId: number) => void;
    setRowRef: (itemId: number, node: HTMLDivElement | null) => void;
  },
): JSX.Element[] {
  const rows: JSX.Element[] = [];

  for (const node of nodes) {
    const nodeId = coakTreeNodeId(node);
    const isFolder = node.kind === "folder";
    const expanded =
      isFolder &&
      (isCoakFolderExpanded(options.expandedFolderIds, node.id) ||
        options.searchExpandedFolderIds.has(node.id));
    const visibleIndex = options.visibleIndexById.get(node.id) ?? 0;

    rows.push(
      <CoakDirectoryRow
        key={nodeId}
        nodeId={nodeId}
        label={node.name}
        color={node.color_hex}
        kind={node.kind}
        mediaId={node.media_id}
        contentPreview={coakDirectoryRowPreview({
          kind: node.kind,
          noteBody: node.note_body,
          flashFront: node.flash_front,
          childCount: node.children.length,
        })}
        tags={node.tags ?? []}
        depth={depth}
        isSelected={options.highlightedNodeIds.has(nodeId)}
        isExpanded={expanded}
        childCount={node.children.length}
        disabled={options.disabled}
        draggableItemId={node.id}
        isDragging={options.draggingItemId === node.id}
        showInsertTop={
          options.draggingItemId !== null && options.dropInsertIndex === visibleIndex
        }
        showInsertBottom={
          options.draggingItemId !== null &&
          options.dropInsertIndex === options.visibleRowCount &&
          visibleIndex === options.visibleRowCount - 1
        }
        rowRef={(element) => options.setRowRef(node.id, element)}
        onSelect={options.onSelect}
        onToggleSelect={options.onToggleSelect}
        onToggleFolder={isFolder ? () => options.onToggleFolder(node.id) : undefined}
        onRename={(name) => options.onRename(node.id, name)}
        onPromoteToFolder={
          node.kind === "note"
            ? () => options.onPromoteNoteToFolder(node.id)
            : undefined
        }
        onColorChange={(colorHex) => options.onColorChange(node.id, colorHex)}
        onTagsChange={(tagIds) => options.onTagsChange(node.id, tagIds)}
        onDelete={() => options.onDelete(node.id)}
        onDropIntoFolder={
          isFolder ? (itemId) => options.onDropIntoFolder(node.id, itemId) : undefined
        }
        onDragStartItem={options.onDragStartItem}
        onDragEndItem={options.onDragEndItem}
        onAddFolder={isFolder ? () => options.onAddFolder(node.id) : undefined}
        onAddNote={isFolder ? () => options.onAddNote(node.id) : undefined}
        onAddFlash={isFolder ? () => options.onAddFlash(node.id) : undefined}
      />,
    );

    if (isFolder && expanded) {
      rows.push(...renderTreeNodes(node.children, depth + 1, options));
    }
  }

  return rows;
}

export function CoakDirectoryTab() {
  const [actionPending, setActionPending] = useState(false);

  const {
    items,
    tree,
    expandedFolderIds,
    directorySearchQuery,
    directorySearchMatchIds,
    isDirectorySearchActive,
    preserveConstellationSelection,
    itemEditorNodeIds,
    setDirectorySearchQuery,
    openItemEditor,
    selectDirectoryNode,
    clearDirectorySelection,
    toggleFolderExpanded,
    createFolder,
    createNote,
    createFlash,
    renameItem,
    promoteNoteToFolder,
    recolorItem,
    updateItemTags,
    moveItem,
    reorderSiblings,
    deleteItem,
    isLoading,
  } = useCoakRecordWorkspace();

  const disabled = isLoading || actionPending;

  const runAction = async (action: () => Promise<void>) => {
    setActionPending(true);
    try {
      await action();
    } finally {
      setActionPending(false);
    }
  };

  const searchExpandedFolderIds = useMemo(
    () =>
      isDirectorySearchActive
        ? collectCoakSearchAncestorFolderIds(items, directorySearchMatchIds)
        : new Set<number>(),
    [directorySearchMatchIds, isDirectorySearchActive, items],
  );

  const {
    draggingItemId,
    dropInsertIndex,
    visibleRows,
    visibleIndexById,
    setRowRef,
    handleDragStart,
    handleListDragOver,
    handleDrop,
    handleDragEnd,
  } = useCoakDirectoryDragReorder({
    items,
    tree,
    expandedFolderIds,
    searchExpandedFolderIds,
    disabled,
    reorderSiblings: (parentId, draggedId, insertIndex) =>
      runAction(() => reorderSiblings(parentId, draggedId, insertIndex)),
  });

  const handleDropIntoFolder = async (targetParentId: number | null, itemId: number) => {
    if (itemId === targetParentId) {
      return;
    }
    const siblingIds = collectCoakSiblingItemIds(items, targetParentId);
    const sortOrder = siblingIds.includes(itemId)
      ? siblingIds.length - 1
      : siblingIds.length;
    await runAction(() => moveItem(itemId, targetParentId, sortOrder));
  };

  const highlightedNodeIds = useMemo(() => {
    if (isDirectorySearchActive) {
      return new Set(directorySearchMatchIds);
    }

    if (itemEditorNodeIds.length > 0) {
      return new Set(itemEditorNodeIds);
    }

    return new Set<string>();
  }, [directorySearchMatchIds, isDirectorySearchActive, itemEditorNodeIds]);

  const handleSelectNode = (
    nodeId: string,
    event?: Pick<MouseEvent, "metaKey" | "ctrlKey">,
  ) => {
    const additive = event != null && isCoakMultiSelectModifier(event);

    if (additive || (isDirectorySearchActive && directorySearchMatchIds.length > 1)) {
      openItemEditor(nodeId, { orbit: false, replace: false });
      return;
    }

    selectDirectoryNode(nodeId);
  };

  const handleToggleSelect = (nodeId: string) => {
    openItemEditor(nodeId, { orbit: false, replace: false });
  };

  const addToFolder =
    (folderId: number, action: (parentId: number) => Promise<void>) => async () => {
      if (!isCoakFolderExpanded(expandedFolderIds, folderId)) {
        toggleFolderExpanded(folderId);
      }
      await action(folderId);
    };

  const treeOptions = {
    expandedFolderIds,
    searchExpandedFolderIds,
    highlightedNodeIds,
    draggingItemId,
    dropInsertIndex,
    visibleIndexById,
    visibleRowCount: visibleRows.length,
    disabled,
    onSelect: handleSelectNode,
    onToggleSelect: handleToggleSelect,
    onToggleFolder: toggleFolderExpanded,
    onRename: (itemId: number, name: string) => runAction(() => renameItem(itemId, name)),
    onPromoteNoteToFolder: (itemId: number) =>
      runAction(() => promoteNoteToFolder(itemId)),
    onColorChange: (itemId: number, colorHex: string) =>
      runAction(() => recolorItem(itemId, colorHex)),
    onTagsChange: (itemId: number, tagIds: number[]) =>
      runAction(() => updateItemTags(itemId, tagIds)),
    onDelete: (itemId: number) => runAction(() => deleteItem(itemId)),
    onDropIntoFolder: (targetParentId: number | null, itemId: number) => {
      void handleDropIntoFolder(targetParentId, itemId);
    },
    onDragStartItem: handleDragStart,
    onDragEndItem: handleDragEnd,
    setRowRef,
    onAddFolder: (parentId: number) =>
      void runAction(addToFolder(parentId, (id) => createFolder("New folder", id))),
    onAddNote: (parentId: number) =>
      void runAction(addToFolder(parentId, (id) => createNote("New note", id))),
    onAddFlash: (parentId: number) =>
      void runAction(addToFolder(parentId, (id) => createFlash("New flash", id))),
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-900/95">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-stone-800/80 px-3 py-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => runAction(() => createFolder("New folder"))}
          className="rounded-md border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500"
        >
          Folder
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => runAction(() => createNote("New note"))}
          className="rounded-md border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500"
        >
          Note
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => runAction(() => createFlash("New flash"))}
          className="rounded-md border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500"
        >
          Flash
        </button>
      </div>

      <CoakDirectorySearchBar
        value={directorySearchQuery}
        disabled={disabled}
        onChange={setDirectorySearchQuery}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
        onClick={() => {
          if (!preserveConstellationSelection) {
            clearDirectorySelection();
          }
        }}
        onDragOver={handleListDragOver}
        onDrop={(event) => {
          event.preventDefault();
          handleDrop();
        }}
      >
        <div className="flex min-h-full w-full flex-col gap-1">
          {tree.length > 0 ? (
            renderTreeNodes(tree, 0, treeOptions)
          ) : (
            <p className="px-1 py-3 text-xs text-stone-500">
              No items yet. Add a folder, note, or flash.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
