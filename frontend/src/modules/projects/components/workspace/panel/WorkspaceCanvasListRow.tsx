// keel_web/src/modules/projects/components/workspace/panel/WorkspaceCanvasListRow.tsx

// Canvas row for the workspace side panel Canvases tab.

import type { MouseEvent as ReactMouseEvent } from "react";

import type { ProjectCanvas } from "../../../api";
import { useWorkspaceRowInlineRename } from "../../../hooks/useWorkspaceRowInlineRename";
import { WorkspaceFileRowMenu } from "./WorkspaceFileRowMenu";
import {
  formatCanvasUpdatedAt,
  WORKSPACE_CANVAS_LIST_GRID_CLASS,
} from "./workspaceCanvasListStyles";
import {
  WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS,
  WORKSPACE_FILE_PANEL_TITLE_CLASS,
  workspaceFilePanelRowClassName,
} from "./workspaceFilePanelRowStyles";

type WorkspaceCanvasListRowProps = {
  canvas: ProjectCanvas;
  active?: boolean;
  disabled?: boolean;
  deleteDisabled?: boolean;
  noteCount?: number;
  onSelect?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  autoRename?: boolean;
  onAutoRenameHandled?: () => void;
};

function CanvasTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 9h10M7 12.5h6" />
    </svg>
  );
}

export function WorkspaceCanvasListRow({
  canvas,
  active = false,
  disabled = false,
  deleteDisabled = false,
  noteCount = 0,
  onSelect,
  onRename,
  onDelete,
  onSetDefault,
  autoRename = false,
  onAutoRenameHandled,
}: WorkspaceCanvasListRowProps) {
  const inlineRename = useWorkspaceRowInlineRename({
    value: canvas.name,
    onCommit: (name) => onRename?.(name),
    disabled: disabled || !onRename,
    autoEdit: autoRename,
    onAutoEditHandled: onAutoRenameHandled,
  });

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (inlineRename.isEditing || disabled) {
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, input")) {
      return;
    }
    onSelect?.();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (disabled || inlineRename.isEditing) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={workspaceFilePanelRowClassName({
        highlighted: active,
        interactive: true,
      })}
    >
      <div className={`${WORKSPACE_CANVAS_LIST_GRID_CLASS} w-full min-w-0`}>
        <div className="flex min-w-0 items-start gap-2">
          <CanvasTabIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
          <div className="min-w-0 flex-1">
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
                aria-label="Canvas name"
              />
            ) : (
              <div className={WORKSPACE_FILE_PANEL_TITLE_CLASS}>{canvas.name}</div>
            )}
            {canvas.is_default ? (
              <div className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-sky-300/80">
                Default
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="text-center text-[11px] font-medium tabular-nums text-stone-300"
          aria-label={`${noteCount} notes`}
        >
          {noteCount}
        </div>

        <div
          className="min-w-0 text-[10px] leading-snug text-stone-500"
          title={formatCanvasUpdatedAt(canvas.updated_at)}
        >
          {formatCanvasUpdatedAt(canvas.updated_at)}
        </div>

        <div className="flex justify-end">
          <WorkspaceFileRowMenu
            disabled={disabled}
            onRename={onRename ? inlineRename.startEditing : undefined}
            onDelete={deleteDisabled ? undefined : onDelete}
            extraActions={
              onSetDefault && !canvas.is_default
                ? [{ label: "Set as default", onSelect: onSetDefault }]
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
