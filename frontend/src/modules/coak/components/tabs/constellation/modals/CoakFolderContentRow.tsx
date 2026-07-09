// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakFolderContentRow.tsx

import { useEffect, useRef, useState, type DragEvent } from "react";

import { ListInsertIndicator } from "../../../../../../views/list/primitives/ListInsertIndicator";
import { useConfirmDeleteAction } from "../../../../../../hooks/useConfirmDeleteAction";
import { coakItemKindListGlyph } from "../../../../lib/coakItemKindRegistry";
import {
  COAK_ITEM_EDITOR_FOLDER_ITEM_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ROW_CONFIRM_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ROW_DELETE_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ROW_TITLE_CLASS,
} from "../../../../lib/tabs/constellation/coakItemEditorStyles";
import type { CoakTreeNode } from "../../../../lib/tabs/directory/coakTree";
import { CoakGraphMenuTrashIcon } from "../graph/CoakGraphNodeContextMenuIcons";

type CoakFolderContentRowProps = {
  child: CoakTreeNode;
  disabled?: boolean;
  autoFocusTitle?: boolean;
  isDragging?: boolean;
  showInsertTop?: boolean;
  showInsertBottom?: boolean;
  rowRef?: (node: HTMLLIElement | null) => void;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onTitleFocusApplied?: () => void;
};

function CoakFolderContentRowConfirmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M9.5 9a3.5 3.5 0 1 1 5 5M12 17h.01"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoakFolderContentRow({
  child,
  disabled = false,
  autoFocusTitle = false,
  isDragging = false,
  showInsertTop = false,
  showInsertBottom = false,
  rowRef,
  onDragStart,
  onDragEnd,
  onSelect,
  onRename,
  onDelete,
  onTitleFocusApplied,
}: CoakFolderContentRowProps) {
  const [draftName, setDraftName] = useState(child.name);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(child.id);

  useEffect(() => {
    setDraftName(child.name);
  }, [child.id, child.name]);

  useEffect(() => {
    if (!autoFocusTitle) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      onTitleFocusApplied?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [autoFocusTitle, child.id, onTitleFocusApplied]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== child.name) {
      onRename(trimmed);
      return;
    }
    setDraftName(child.name);
  };

  return (
    <li
      ref={rowRef}
      className="relative"
    >
      {showInsertTop ? <ListInsertIndicator position="top" tone="lime" /> : null}
      {showInsertBottom ? <ListInsertIndicator position="bottom" tone="lime" /> : null}
      <div
        ref={containerRef}
        draggable={!disabled && onDragStart != null}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={[
          COAK_ITEM_EDITOR_FOLDER_ITEM_CLASS,
          isDragging ? "cursor-grabbing opacity-40" : onDragStart != null ? "cursor-grab" : "",
        ].join(" ")}
        onClick={() => {
          if (disabled) {
            return;
          }
          onSelect();
        }}
      >
        <span className="shrink-0 text-[10px] text-stone-400">
          {coakItemKindListGlyph(child.kind)}
        </span>
        <input
          ref={titleInputRef}
          value={draftName}
          disabled={disabled}
          draggable={false}
          aria-label={`Rename ${child.name}`}
          placeholder="Untitled"
          className={COAK_ITEM_EDITOR_FOLDER_ROW_TITLE_CLASS}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onDragStart={(event) => event.preventDefault()}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            disabled={disabled}
            aria-label="Delete"
            onClick={() => {
              if (confirmPending) {
                return;
              }
              handleClick(() => {
                onDelete();
              });
            }}
            className={[
              COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS,
              COAK_ITEM_EDITOR_FOLDER_ROW_DELETE_CLASS,
            ].join(" ")}
          >
            <CoakGraphMenuTrashIcon />
          </button>
          {confirmPending ? (
            <button
              type="button"
              disabled={disabled}
              aria-label="Confirm delete"
              onClick={() => {
                handleClick(() => {
                  onDelete();
                });
              }}
              className={[
                COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS,
                COAK_ITEM_EDITOR_FOLDER_ROW_CONFIRM_CLASS,
              ].join(" ")}
            >
              <CoakFolderContentRowConfirmIcon />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
