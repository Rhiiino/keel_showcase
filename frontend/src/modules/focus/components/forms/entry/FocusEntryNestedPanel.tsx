// src/modules/focus/components/forms/entry/FocusEntryNestedPanel.tsx

// Inline nested entries for an expanded focus container row.

import { useRef, type DragEvent } from "react";

import { ListInsertIndicator } from "../../../../../views/list/primitives/ListInsertIndicator";
import type { FocusEntry } from "../../../api";
import type { FocusEntryStatus } from "../../../lib/focus";
import type { FocusEntryContainerId } from "../../../lib/focusEntryTree";
import type {
  FocusEntryDragRowRect,
  FocusEntryDropTarget,
} from "../../../hooks/useFocusEntryDragController";
import { FocusEntryRow } from "./FocusEntryRow";

type FocusEntryNestedPanelProps = {
  containerId: FocusEntryContainerId;
  entries: FocusEntry[];
  loadState: "idle" | "loading" | "loaded" | "error";
  draggingEntryId: number | null;
  dropTarget: FocusEntryDropTarget | null;
  flashingEntryId: number | null;
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
  onDragStart: (
    entryId: number,
    containerId: FocusEntryContainerId,
  ) => (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onToggleExpand: (entryId: number, containerId: FocusEntryContainerId) => void;
  onDelete: (entryId: number) => void;
  onTitleChange: (entry: FocusEntry, title: string) => void;
  onNotesChange: (entry: FocusEntry, notes: string) => void;
  onStatusChange: (entry: FocusEntry, entryId: number, status: FocusEntryStatus) => void;
  onWorkOrderChange: (
    entry: FocusEntry,
    entryId: number,
    workOrder: number | null,
  ) => void;
  onOpenEntry: (entry: FocusEntry) => void;
  getEntryDraft: (entry: FocusEntry) => {
    title: string;
    notes: string;
    status: FocusEntryStatus;
    work_order: number | null;
  };
  deleteDisabled?: boolean;
  titleEditDisabled?: boolean;
};

export function FocusEntryNestedPanel({
  containerId,
  entries,
  loadState,
  draggingEntryId,
  dropTarget,
  flashingEntryId,
  expandedEntryIds,
  getContainerEntries,
  getContainerLoadState,
  getEntryContainerId,
  onListDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onToggleExpand,
  onDelete,
  onTitleChange,
  onNotesChange,
  onStatusChange,
  onWorkOrderChange,
  onOpenEntry,
  getEntryDraft,
  deleteDisabled = false,
  titleEditDisabled = false,
}: FocusEntryNestedPanelProps) {
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

  const handleDrop = (event: DragEvent<HTMLUListElement>) => {
    event.stopPropagation();
    onDrop();
  };

  if (loadState === "loading" || loadState === "idle") {
    return (
      <div className="ml-8 border-l border-sky-400/20 py-2 pl-4 text-xs text-white/40">
        Loading nested entries…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="ml-8 border-l border-rose-400/20 py-2 pl-4 text-xs text-rose-300/80">
        Could not load nested entries.
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <ul
        className="relative ml-4 border-l border-sky-400/15 py-2 pl-3"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {dropTarget?.containerId === containerId && dropTarget.insertIndex === 0 ? (
          <ListInsertIndicator position="top" />
        ) : null}
        <li className="py-2 text-xs text-white/40">This node has no children.</li>
      </ul>
    );
  }

  return (
    <ul
      className="relative ml-4 space-y-2 border-l border-sky-400/15 py-2 pl-3"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {entries.map((entry, index) => {
        const nestedContainerId = getEntryContainerId(entry);
        const canExpandContainer = nestedContainerId !== null;
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
              selected={false}
              reorderable
              isDragging={draggingEntryId === entry.id}
              flashing={flashingEntryId === entry.id}
              isDropContainerTarget={
                nestedContainerId !== null &&
                dropTarget?.containerId === nestedContainerId
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
              onToggleSelect={() => undefined}
              onStatusChange={(entryId, status) => onStatusChange(entry, entryId, status)}
              onWorkOrderChange={(entryId, workOrder) =>
                onWorkOrderChange(entry, entryId, workOrder)
              }
              onDelete={onDelete}
              onTitleChange={(_entryId, title) => onTitleChange(entry, title)}
              onNotesChange={(_entryId, notes) => onNotesChange(entry, notes)}
              onOpen={() => onOpenEntry(entry)}
              onToggleExpand={
                canExpandContainer
                  ? (entryId) => {
                      if (nestedContainerId !== null) {
                        onToggleExpand(entryId, nestedContainerId);
                      }
                    }
                  : undefined
              }
              expanded={isExpanded}
              selectDisabled
              fieldDisabled={titleEditDisabled}
              deleteDisabled={deleteDisabled}
              titleValue={draft.title}
              notesValue={draft.notes}
              statusValue={draft.status}
              workOrderValue={draft.work_order}
              nested
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
                titleEditDisabled={titleEditDisabled}
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
