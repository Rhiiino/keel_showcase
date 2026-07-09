// src/modules/focus/components/forms/editors/FocusListEditorEntryList.tsx

// Focus list entry rows — staged reorder, selection, and nested panels.

import { useRef, type DragEvent } from "react";

import { ListInsertIndicator } from "../../../../../views/list/primitives/ListInsertIndicator";
import type { FocusEntry } from "../../../api";
import { type FocusEntryStatus } from "../../../lib/focus";
import type {
  FocusEntryContainerId,
} from "../../../lib/focusEntryTree";
import type {
  FocusEntryDragRowRect,
  FocusEntryDropTarget,
} from "../../../hooks/useFocusEntryDragController";
import { FocusEntryNestedPanel } from "../entry";
import { FocusEntryRow } from "../entry";

export type FocusListEditorEntryListProps = {
  containerId: FocusEntryContainerId;
  entries: FocusEntry[];
  draggingEntryId: number | null;
  dropTarget: FocusEntryDropTarget | null;
  flashingEntryId: number | null;
  selectedEntryIds: Set<number>;
  expandedEntryIds: Set<number>;
  getContainerEntries: (containerId: FocusEntryContainerId) => FocusEntry[];
  getContainerLoadState: (containerId: FocusEntryContainerId) => "idle" | "loading" | "loaded" | "error";
  getEntryContainerId: (entry: FocusEntry) => number | null;
  onListDragOver: (params: {
    containerId: FocusEntryContainerId;
    event: DragEvent<HTMLElement>;
    rowRects: FocusEntryDragRowRect[];
    hoverContainer: {
      entryId: number;
      containerId: FocusEntryContainerId;
      expanded: boolean;
    } | null;
  }) => void;
  onDrop: () => void;
  onToggleExpand: (entryId: number, containerId: FocusEntryContainerId) => void;
  onDragStart: (
    entryId: number,
    containerId: FocusEntryContainerId,
  ) => (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onToggleSelect: (entryId: number, checked: boolean) => void;
  onStatusChange: (
    entry: FocusEntry,
    entryId: number,
    status: FocusEntryStatus,
  ) => void;
  onWorkOrderChange: (
    entry: FocusEntry,
    entryId: number,
    workOrder: number | null,
  ) => void;
  onDelete: (entryId: number) => void;
  onTitleChange: (entry: FocusEntry, title: string) => void;
  onNotesChange: (entry: FocusEntry, notes: string) => void;
  onOpenEntry: (entry: FocusEntry) => void;
  getEntryDraft: (entry: FocusEntry) => {
    title: string;
    notes: string;
    status: FocusEntryStatus;
    work_order: number | null;
  };
  selectDisabled: boolean;
  fieldDisabled: boolean;
  deleteDisabled: boolean;
};

export function FocusListEditorEntryList({
  containerId,
  entries,
  draggingEntryId,
  dropTarget,
  flashingEntryId,
  selectedEntryIds,
  expandedEntryIds,
  getContainerEntries,
  getContainerLoadState,
  getEntryContainerId,
  onListDragOver,
  onDrop,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onToggleSelect,
  onStatusChange,
  onWorkOrderChange,
  onDelete,
  onTitleChange,
  onNotesChange,
  onOpenEntry,
  getEntryDraft,
  selectDisabled,
  fieldDisabled,
  deleteDisabled,
}: FocusListEditorEntryListProps) {
  const rowRefs = useRef(new Map<number, HTMLLIElement>());

  const buildRowRects = () =>
    entries.flatMap((entry): FocusEntryDragRowRect[] => {
      const row = rowRefs.current.get(entry.id);
      if (!row) {
        return [];
      }
      const rect = row.getBoundingClientRect();
      return [{ entryId: entry.id, top: rect.top, bottom: rect.bottom }];
    });

  const findHoverContainer = (clientY: number, rowRects: FocusEntryDragRowRect[]) => {
    const hovered = rowRects.find(
      (rect) => clientY >= rect.top && clientY <= rect.bottom,
    );
    if (!hovered) {
      return null;
    }

    const entry = entries.find((row) => row.id === hovered.entryId);
    if (!entry) {
      return null;
    }

    const nestedContainerId = getEntryContainerId(entry);
    if (nestedContainerId === null) {
      return null;
    }

    return {
      entryId: entry.id,
      containerId: nestedContainerId,
      expanded: expandedEntryIds.has(entry.id),
    };
  };

  const handleDragOver = (event: DragEvent<HTMLUListElement>) => {
    event.stopPropagation();
    const rowRects = buildRowRects();
    onListDragOver({
      containerId,
      event,
      rowRects,
      hoverContainer: findHoverContainer(event.clientY, rowRects),
    });
  };

  if (entries.length === 0) {
    return (
      <ul
        className="relative rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40"
        onDragOver={handleDragOver}
        onDrop={onDrop}
      >
        {dropTarget?.containerId === containerId && dropTarget.insertIndex === 0 ? (
          <ListInsertIndicator position="top" />
        ) : null}
        <li>This list is empty.</li>
      </ul>
    );
  }

  return (
    <ul
      className="relative space-y-2"
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      {entries.map((entry, index) => {
        const nestedContainerId = getEntryContainerId(entry);
        const isExpanded = expandedEntryIds.has(entry.id);
        const draft = getEntryDraft(entry);

        return (
          <div key={entry.id} className="relative space-y-2">
            {dropTarget?.containerId === containerId &&
            dropTarget.insertIndex === index ? (
              <ListInsertIndicator position="top" />
            ) : null}
            <FocusEntryRow
              entry={entry}
              selected={selectedEntryIds.has(entry.id)}
              reorderable
              isDragging={draggingEntryId === entry.id}
              flashing={flashingEntryId === entry.id}
              isDropContainerTarget={
                nestedContainerId !== null &&
                dropTarget?.containerId === nestedContainerId
              }
              expanded={isExpanded}
              onToggleExpand={
                nestedContainerId !== null
                  ? (entryId) => {
                      onToggleExpand(entryId, nestedContainerId);
                    }
                  : undefined
              }
              rowRef={(node) => {
                if (node) {
                  rowRefs.current.set(entry.id, node);
                } else {
                  rowRefs.current.delete(entry.id);
                }
              }}
              onHandleDragStart={onDragStart(entry.id, containerId)}
              onHandleDragEnd={onDragEnd}
              onToggleSelect={onToggleSelect}
              onStatusChange={(entryId, status) =>
                onStatusChange(entry, entryId, status)
              }
              onWorkOrderChange={(entryId, work_order) =>
                onWorkOrderChange(entry, entryId, work_order)
              }
              onDelete={onDelete}
              onTitleChange={(_entryId, title) => onTitleChange(entry, title)}
              onNotesChange={(_entryId, notes) => onNotesChange(entry, notes)}
              onOpen={() => onOpenEntry(entry)}
              titleValue={draft.title}
              notesValue={draft.notes}
              statusValue={draft.status}
              workOrderValue={draft.work_order}
              selectDisabled={selectDisabled}
              fieldDisabled={fieldDisabled}
              deleteDisabled={deleteDisabled}
            />
            {isExpanded && nestedContainerId !== null ? (
              <FocusEntryNestedPanel
                containerId={nestedContainerId}
                entries={getContainerEntries(nestedContainerId)}
                loadState={getContainerLoadState(nestedContainerId)}
                draggingEntryId={draggingEntryId}
                dropTarget={dropTarget}
                flashingEntryId={flashingEntryId}
                expandedEntryIds={expandedEntryIds}
                getContainerEntries={getContainerEntries}
                getContainerLoadState={getContainerLoadState}
                getEntryContainerId={getEntryContainerId}
                onListDragOver={onListDragOver}
                onDrop={onDrop}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onToggleExpand={onToggleExpand}
                onDelete={onDelete}
                onTitleChange={onTitleChange}
                onNotesChange={onNotesChange}
                onStatusChange={onStatusChange}
                onWorkOrderChange={onWorkOrderChange}
                onOpenEntry={onOpenEntry}
                getEntryDraft={getEntryDraft}
                deleteDisabled={deleteDisabled}
                titleEditDisabled={fieldDisabled}
              />
            ) : null}
          </div>
        );
      })}
      {dropTarget?.containerId === containerId &&
      dropTarget.insertIndex === entries.length ? (
        <ListInsertIndicator position="bottom" />
      ) : null}
    </ul>
  );
}
