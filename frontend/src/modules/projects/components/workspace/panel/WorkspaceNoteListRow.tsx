// keel_web/src/modules/projects/components/workspace/panel/WorkspaceNoteListRow.tsx

// Note card row for the workspace side panel Notes tab.

import type { MouseEvent as ReactMouseEvent } from "react";

import { useWorkspaceRowInlineRename } from "../../../hooks/useWorkspaceRowInlineRename";
import { WorkspaceFileRowMenu } from "./WorkspaceFileRowMenu";
import {
  WORKSPACE_FILE_PANEL_META_CLASS,
  WORKSPACE_FILE_PANEL_PREVIEW_CLASS,
  WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS,
  WORKSPACE_FILE_PANEL_TITLE_CLASS,
  workspaceFilePanelRowClassName,
} from "./workspaceFilePanelRowStyles";
import type { WorkspacePanelNote } from "../context/WorkspaceViewContext";

const NOTE_PREVIEW_WORD_LIMIT = 10;

type WorkspaceNoteListRowProps = {
  note: WorkspacePanelNote;
  highlighted?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
};

function truncateWords(value: string, limit: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "No content";
  }
  if (words.length <= limit) {
    return words.join(" ");
  }
  return `${words.slice(0, limit).join(" ")}...`;
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 3.75h9.25L18 6.5v13.75H6z" />
      <path d="M15 3.75V7h3" />
      <path d="M8.75 10h6.5M8.75 13h6.5M8.75 16h4.5" />
    </svg>
  );
}

function NoteVisibilityIcon({ hidden, className }: { hidden: boolean; className?: string }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58A2 2 0 0 0 12 16a2 2 0 0 0 1.42-.58" />
        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-2.16 3.19" />
        <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12.5C2.73 16.89 7 20 12 20a10.94 10.94 0 0 0 2.12-.21" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5Z" />
      <circle cx="13" cy="12.5" r="2.75" />
    </svg>
  );
}

export function WorkspaceNoteListRow({
  note,
  highlighted = false,
  disabled = false,
  onFocus,
  onRename,
  onDelete,
  onToggleVisibility,
}: WorkspaceNoteListRowProps) {
  const inlineRename = useWorkspaceRowInlineRename({
    value: note.title,
    onCommit: (name) => onRename?.(name),
    disabled: disabled || !onRename,
  });

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (inlineRename.isEditing || disabled) {
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, input")) {
      return;
    }
    onFocus?.();
  };

  return (
    <div
      onClick={handleClick}
      style={{ borderColor: note.borderColor }}
      className={workspaceFilePanelRowClassName({
        highlighted,
        interactive: true,
      })}
    >
      <span
        className={[
          WORKSPACE_FILE_PANEL_PREVIEW_CLASS,
          "bg-gradient-to-br from-violet-950/75 via-sky-950/35 to-stone-900/85 text-sky-200 ring-sky-700/30",
          note.hidden ? "opacity-50" : "",
        ].join(" ")}
      >
        <NoteIcon className="h-6 w-6 drop-shadow-sm" />
      </span>

      <div
        className={[
          "flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5",
          note.hidden ? "opacity-60" : "",
        ].join(" ")}
      >
        {inlineRename.isEditing ? (
          <input
            ref={inlineRename.inputRef}
            value={inlineRename.draftName ?? ""}
            disabled={disabled}
            data-no-row-drag
            onChange={(event) => inlineRename.setDraftName(event.target.value)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                inlineRename.commitEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                inlineRename.discardEdit();
              }
            }}
            onBlur={inlineRename.commitEdit}
            className={WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS}
          />
        ) : (
          <span className={WORKSPACE_FILE_PANEL_TITLE_CLASS} title={note.title}>
            {note.title}
          </span>
        )}

        <span className={WORKSPACE_FILE_PANEL_META_CLASS} title={note.text}>
          {truncateWords(note.text, NOTE_PREVIEW_WORD_LIMIT)}
        </span>
      </div>

      <div className="flex shrink-0 items-start gap-0.5 pt-0.5">
        {onToggleVisibility ? (
          <button
            type="button"
            disabled={disabled || inlineRename.isEditing}
            data-no-row-drag
            aria-label={note.hidden ? "Show note on canvas and grid" : "Hide note from canvas and grid"}
            aria-pressed={note.hidden}
            title={note.hidden ? "Hidden from canvas and grid" : "Visible on canvas and grid"}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onToggleVisibility();
            }}
            className={[
              "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
              disabled || inlineRename.isEditing
                ? "cursor-not-allowed opacity-50"
                : note.hidden
                  ? "text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
            ].join(" ")}
          >
            <NoteVisibilityIcon hidden={note.hidden} className="h-4 w-4" />
          </button>
        ) : null}

        {onDelete ? (
          <WorkspaceFileRowMenu
            disabled={disabled || inlineRename.isEditing}
            ariaLabel="Note options"
            onRename={onRename ? inlineRename.startEditing : undefined}
            onDelete={onDelete}
          />
        ) : null}
      </div>
    </div>
  );
}
