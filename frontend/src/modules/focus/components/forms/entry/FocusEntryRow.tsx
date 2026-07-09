// src/modules/focus/components/forms/entry/FocusEntryRow.tsx

// Single focus entry row (task or linked list).

import { useEffect, useState, type DragEvent } from "react";

import { ListDragHandle } from "../../../../../views/list/primitives/ListDragHandle";
import type { FocusEntry } from "../../../api";
import {
  focusEntryDisplayTitle,
  focusEntryLinkedListNodeColor,
  isFocusEntryKind,
  isFocusEntryStatus,
  type FocusEntryStatus,
} from "../../../lib/focus";
import { focusListLinkEntryRowSurface } from "../../../lib/appearance";
import { FocusEntryInlineTitle } from "./FocusEntryInlineTitle";
import { FocusNodeStatusSelect } from "../fields";
import { FocusWorkOrderInput } from "../fields";
import { formatElapsedTime, FOCUS_NODE_TIMER_PILL_SURFACE_CLASS } from "../timer/FocusNodeTimerControls";
import { FocusListIcon } from "../../shared/icons";
import { TrashIcon } from "../../shared/icons";
import { useFocusNodeTimer } from "../../../hooks/useFocusNodeTimer";

type FocusEntryRowProps = {
  entry: FocusEntry;
  selected: boolean;
  onToggleSelect: (entryId: number, selected: boolean) => void;
  onStatusChange: (entryId: number, status: FocusEntryStatus) => void;
  onWorkOrderChange: (entryId: number, workOrder: number | null) => void;
  onDelete: (entryId: number) => void;
  onTitleChange: (entryId: number, title: string) => void;
  onNotesChange: (entryId: number, notes: string) => void;
  onOpen: () => void;
  onToggleExpand?: (entryId: number) => void;
  expanded?: boolean;
  selectDisabled?: boolean;
  fieldDisabled?: boolean;
  deleteDisabled?: boolean;
  reorderable?: boolean;
  isDragging?: boolean;
  flashing?: boolean;
  isDropContainerTarget?: boolean;
  onHandleDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onHandleDragEnd?: () => void;
  rowRef?: (node: HTMLLIElement | null) => void;
  nested?: boolean;
  titleValue?: string;
  notesValue?: string;
  statusValue?: FocusEntryStatus;
  workOrderValue?: number | null;
};

function FocusItemIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h9M8 12h9M8 17h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 7h.01M4.75 12h.01M4.75 17h.01" />
    </svg>
  );
}

function FocusRecordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4.75h7l3 3v11.5H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4.75V8h3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12h5M9.5 15.5h3" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 12s3.25-6 9.25-6 9.25 6 9.25 6-3.25 6-9.25 6-9.25-6-9.25-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PauseIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="7" y="6" width="3.5" height="12" rx="1.25" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1.25" />
    </svg>
  );
}

function PlayIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 6.2v11.6a1 1 0 0 0 1.52.86l9.5-5.8a1 1 0 0 0 0-1.72l-9.5-5.8A1 1 0 0 0 8 6.2Z" />
    </svg>
  );
}

function EndXIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
      <path strokeLinecap="round" d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

function FocusEntryInlineNotes({
  value,
  disabled,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  onCommit: (nextNotes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const commitEdit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) {
      onCommit(next);
    }
  };

  if (editing && !disabled) {
    return (
      <textarea
        value={draft}
        autoFocus
        rows={2}
        maxLength={2000}
        aria-label="Entry notes"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
            setEditing(false);
          }
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            commitEdit();
          }
        }}
        className="mt-1 min-h-10 w-full resize-y rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-xs leading-relaxed text-white/80 outline-none focus:border-sky-400/35 focus:ring-1 focus:ring-sky-400/25"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="mt-1 block min-h-5 w-full truncate rounded-md text-left text-xs leading-relaxed text-white/40 transition hover:bg-white/[0.03] hover:text-white/58 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/40"
    >
      {value || "Add notes…"}
    </button>
  );
}

function FocusEntryRowTimer({
  nodeId,
  disabled,
}: {
  nodeId: number | null;
  disabled?: boolean;
}) {
  const timer = useFocusNodeTimer({
    nodeId: nodeId ?? 0,
    historyEnabled: false,
  });
  const activeEntry = timer.activeEntry;

  if (!activeEntry) {
    return null;
  }

  const actionDisabled = disabled || timer.isTimerLoading || timer.timerActionPending;
  const isPaused = activeEntry.status === "paused";

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span
        className={[
          FOCUS_NODE_TIMER_PILL_SURFACE_CLASS,
          "min-w-[5.75rem] px-3 py-1.5 text-center text-base",
        ].join(" ")}
        title={isPaused ? "Timer paused" : "Timer running"}
      >
        {formatElapsedTime(timer.elapsedSeconds)}
      </span>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={actionDisabled}
          onClick={() => {
            if (isPaused) {
              timer.onResumeTimer();
              return;
            }
            timer.onPauseTimer();
          }}
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
          title={isPaused ? "Resume" : "Pause"}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-amber-200/25 bg-amber-300/15 text-amber-100/90 transition hover:bg-amber-300/25 hover:text-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button
          type="button"
          disabled={actionDisabled}
          onClick={timer.onEndTimer}
          aria-label="End timer"
          title="End"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-rose-300/30 bg-rose-500/20 text-rose-100 transition hover:bg-rose-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          <EndXIcon />
        </button>
      </div>
    </div>
  );
}

export function FocusEntryRow({
  entry,
  selected,
  onToggleSelect,
  onStatusChange,
  onWorkOrderChange,
  onDelete,
  onTitleChange,
  onNotesChange,
  onOpen,
  onToggleExpand,
  expanded = false,
  selectDisabled = false,
  fieldDisabled = false,
  deleteDisabled = false,
  reorderable = false,
  isDragging = false,
  flashing = false,
  isDropContainerTarget = false,
  onHandleDragStart,
  onHandleDragEnd,
  rowRef,
  nested = false,
  titleValue,
  notesValue,
  statusValue,
  workOrderValue,
}: FocusEntryRowProps) {
  const kind = isFocusEntryKind(entry.kind) ? entry.kind : "task";
  const isListLink = kind === "list_link";
  const isRecord = kind === "record";
  const canExpandContainer =
    (isListLink && entry.linked_list_id !== null) ||
    isRecord;
  const status = statusValue ?? (isFocusEntryStatus(entry.status) ? entry.status : "active");
  const workOrder = workOrderValue !== undefined ? workOrderValue : entry.work_order;
  const isCompleted = status === "completed";
  const isArchived = status === "archived";
  const displayTitle = titleValue ?? focusEntryDisplayTitle(entry);
  const notes = notesValue ?? entry.notes;
  const timerNodeId = isListLink && entry.linked_list_id !== null ? entry.linked_list_id : entry.id;
  const listLinkSurface = isListLink
    ? focusListLinkEntryRowSurface(focusEntryLinkedListNodeColor(entry), {
        selected,
      })
    : null;

  const rowSurfaceClass = (() => {
    if (isListLink) {
      return "";
    }
    if (isCompleted) {
      return "bg-gradient-to-br from-emerald-500/[0.14] via-emerald-500/[0.05] to-transparent ring-emerald-400/25 hover:from-emerald-500/[0.18] hover:ring-emerald-400/35";
    }
    if (isArchived) {
      return "bg-gradient-to-br from-white/[0.02] via-transparent to-transparent ring-white/[0.04] opacity-80 hover:opacity-90 hover:ring-white/[0.06]";
    }
    return "bg-gradient-to-br from-white/[0.045] via-white/[0.02] to-transparent ring-white/[0.05] hover:from-white/[0.06] hover:ring-white/[0.08]";
  })();

  const rowSelectedClass = (() => {
    if (!selected || isListLink) {
      return "";
    }
    if (isCompleted) {
      return "from-emerald-500/[0.2] ring-emerald-400/40";
    }
    if (isArchived) {
      return "opacity-95 ring-white/[0.08]";
    }
    return "from-white/[0.07] ring-white/[0.1]";
  })();

  return (
    <li
      ref={rowRef}
      style={listLinkSurface?.style}
      className={[
        "group grid grid-cols-[1.5rem_1.5rem_1.5rem_1.5rem_minmax(0,1fr)_9rem_7rem_5rem_2rem_2rem] items-center gap-2 rounded-xl px-3 py-2.5 transition-colors duration-200",
        listLinkSurface?.className ??
          ["ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]", rowSurfaceClass].join(
            " ",
          ),
        isDragging ? "opacity-50" : "",
        flashing
          ? "bg-lime-400/[0.12] ring-lime-300/70 shadow-[0_0_18px_rgba(163,230,53,0.22)]"
          : "",
        isDropContainerTarget && !flashing
          ? "ring-lime-300/45 shadow-[0_0_14px_rgba(163,230,53,0.14)]"
          : "",
        rowSelectedClass,
        nested ? "ml-4" : "",
      ].join(" ")}
    >
      <div className="flex h-6 w-6 items-center justify-center">
        {reorderable && onHandleDragStart && onHandleDragEnd ? (
          <ListDragHandle
            isDragging={isDragging}
            ariaLabel={`Drag to reorder ${entry.title}`}
            onDragStart={onHandleDragStart}
            onDragEnd={onHandleDragEnd}
          />
        ) : null}
      </div>

      <div className="flex h-6 w-6 items-center justify-center">
        {canExpandContainer && onToggleExpand ? (
          <button
            type="button"
            onClick={() => onToggleExpand(entry.id)}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${entry.title}` : `Expand ${entry.title}`}
            className="rounded-md p-1 text-sky-200/70 transition hover:bg-sky-500/10 hover:text-sky-100"
          >
            <svg
              viewBox="0 0 24 24"
              className={[
                "h-4 w-4 transition-transform",
                expanded ? "rotate-90" : "",
              ].join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>

      <span
        className={[
          "flex h-6 w-6 items-center justify-center rounded-lg",
          isListLink
            ? "bg-sky-400/10 text-sky-200/85"
            : isRecord
              ? "bg-violet-400/10 text-violet-200/85"
              : "bg-white/[0.05] text-white/55",
        ].join(" ")}
        title={isListLink ? "List" : isRecord ? "Record" : "Item"}
      >
        {isListLink ? (
          <FocusListIcon className="h-4 w-4" />
        ) : isRecord ? (
          <FocusRecordIcon />
        ) : (
          <FocusItemIcon />
        )}
      </span>

      <input
        type="checkbox"
        checked={selected}
        disabled={selectDisabled}
        onChange={(event) => onToggleSelect(entry.id, event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-white/15 bg-white/[0.03] text-sky-400 focus:ring-sky-400/30"
        aria-label={`Select ${entry.title}`}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <FocusEntryInlineTitle
            value={displayTitle}
            disabled={fieldDisabled}
            onCommit={(nextTitle) => onTitleChange(entry.id, nextTitle)}
            className={[
              isListLink
                ? "text-sky-100/95"
                : isCompleted
                  ? "text-emerald-300/75 line-through"
                  : isArchived
                    ? "text-white/45"
                    : "text-white/88",
            ].join(" ")}
            inputClassName={[
              isListLink
                ? "text-sky-100/95"
                : isCompleted
                  ? "text-emerald-300/75"
                  : isArchived
                    ? "text-white/45"
                    : "text-white/95",
            ].join(" ")}
          />
        </div>
        <FocusEntryInlineNotes
          value={notes}
          disabled={fieldDisabled}
          onCommit={(nextNotes) => onNotesChange(entry.id, nextNotes)}
        />
      </div>

      <div className="flex items-center justify-end">
        <FocusEntryRowTimer nodeId={timerNodeId} disabled={fieldDisabled} />
      </div>

      <FocusNodeStatusSelect
        id={`focus-entry-status-${entry.id}`}
        value={status}
        disabled={fieldDisabled}
        onChange={(next) => onStatusChange(entry.id, next)}
        className="w-full"
        selectClassName="!w-full min-w-0"
      />
      <FocusWorkOrderInput
        id={`focus-entry-work-order-${entry.id}`}
        value={workOrder}
        disabled={fieldDisabled}
        onChange={(next) => onWorkOrderChange(entry.id, next)}
        className="!w-full"
      />

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${displayTitle}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-sky-200"
      >
        <EyeIcon />
      </button>

      <button
        type="button"
        disabled={deleteDisabled}
        onClick={() => onDelete(entry.id)}
        aria-label={`Delete ${entry.title}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-rose-300 disabled:opacity-40"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
