// keel_web/src/modules/coak/components/CoakDirectoryRow.tsx

import { useEffect, useRef, useState, type DragEvent } from "react";

import { ListInsertIndicator } from "../../../../../views/list/primitives/ListInsertIndicator";
import { useConfirmDeleteAction } from "../../../../../hooks/useConfirmDeleteAction";
import { COAK_ORIGIN_NODE_ID, coakItemNodeId, type CoakItemKind, type CoakTag } from "../../../api";
import { CoakItemInlineTags } from "../../tags/CoakItemInlineTags";
import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { useCoakItemFilePicker } from "../../../hooks/tabs/directory/useCoakItemFilePicker";
import { coakItemSupportsFileAttachment } from "../../../lib/coakItemKindRegistry";
import { normalizeHexColor } from "../../../lib/tabs/constellation/coakNodeLayout";
import type { CoakTreeNode } from "../../../lib/tabs/directory/coakTree";
import { CoakDirectoryRowMenu } from "./CoakDirectoryRowMenu";

const DIRECTORY_ROW_INDENT_PX = 16;

type CoakDirectoryRowProps = {
  nodeId: string;
  label: string;
  color: string;
  kind: "origin" | CoakItemKind;
  mediaId?: string | null;
  contentPreview?: string;
  tags?: CoakTag[];
  onTagsChange?: (tagIds: number[]) => void;
  depth: number;
  isSelected: boolean;
  isExpanded?: boolean;
  childCount?: number;
  disabled?: boolean;
  onSelect: (nodeId: string, event?: Pick<MouseEvent, "metaKey" | "ctrlKey">) => void;
  onToggleSelect?: (nodeId: string) => void;
  onToggleFolder?: () => void;
  onRename?: (name: string) => void;
  onColorChange?: (colorHex: string) => void;
  onDelete?: () => void;
  onDropIntoFolder?: (itemId: number) => void;
  draggableItemId?: number | null;
  isDragging?: boolean;
  showInsertTop?: boolean;
  showInsertBottom?: boolean;
  rowRef?: (node: HTMLDivElement | null) => void;
  onDragStartItem?: (itemId: number, event: DragEvent<HTMLElement>) => void;
  onDragEndItem?: () => void;
  onAddFolder?: () => void;
  onAddNote?: () => void;
  onAddFlash?: () => void;
  onPromoteToFolder?: () => void;
};

function RowColorPicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (colorHex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-stone-700 transition hover:ring-stone-500 disabled:opacity-50"
        aria-label="Change color"
      >
        <span
          className="h-4 w-4 rounded-full ring-1 ring-inset ring-white/10"
          style={{ backgroundColor: value }}
        />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeHexColor(event.target.value))}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </>
  );
}

function DirectoryRowKindIcon({ kind }: { kind: CoakDirectoryRowProps["kind"] }) {
  if (kind === "origin") {
    return (
      <span className="text-sm leading-none text-stone-400" aria-hidden>
        ◎
      </span>
    );
  }

  if (kind === "folder") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
        />
      </svg>
    );
  }

  if (kind === "flash") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </svg>
  );
}

function FolderExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      aria-hidden
    >
      {expanded ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
      )}
    </svg>
  );
}

const DIRECTORY_ROW_LEADING_SLOT_CLASS =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center";

function DirectoryRowSelectCheckbox({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <input
      type="checkbox"
      data-no-row-nav
      checked={checked}
      disabled={disabled}
      aria-label={`Select ${label}`}
      onChange={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-stone-600 bg-stone-950 text-lime-400 accent-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}



type DirectoryRowTitleInputProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  onEditingChange: (isEditing: boolean) => void;
};

function DirectoryRowTitleInput({
  value,
  disabled,
  onChange,
  onCommit,
  onEditingChange,
}: DirectoryRowTitleInputProps) {
  return (
    <input
      data-no-row-nav
      value={value}
      disabled={disabled}
      draggable={false}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => onEditingChange(true)}
      onBlur={() => {
        onEditingChange(false);
        onCommit(value);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        event.stopPropagation();
        onEditingChange(true);
      }}
      onDragStart={(event) => event.preventDefault()}
      className="block w-full min-w-0 bg-transparent text-sm text-stone-200 outline-none"
    />
  );
}

export function CoakDirectoryRow({
  nodeId,
  label,
  color,
  kind,
  contentPreview = "",
  tags = [],
  onTagsChange,
  depth,
  isSelected,
  isExpanded = false,
  childCount = 0,
  disabled = false,
  onSelect,
  onToggleSelect,
  onToggleFolder,
  onRename,
  onColorChange,
  onDelete,
  onDropIntoFolder,
  draggableItemId = null,
  isDragging = false,
  showInsertTop = false,
  showInsertBottom = false,
  rowRef,
  onDragStartItem,
  onDragEndItem,
  onAddFolder,
  onAddNote,
  onAddFlash,
  onPromoteToFolder,
  mediaId = null,
}: CoakDirectoryRowProps) {
  const {
    attachFileToItem,
    attachMediaToItem,
    replaceItemFile,
    replaceItemMedia,
    removeItemFile,
  } = useCoakRecordWorkspace();
  const [draftName, setDraftName] = useState(label);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(nodeId);
  const {
    confirmPending: fileConfirmPending,
    handleClick: handleFileDeleteClick,
  } = useConfirmDeleteAction(draggableItemId != null ? `item-file-${draggableItemId}` : undefined);
  const showAddMenu = kind === "folder" && onAddFolder != null;
  const showFileMenu = kind !== "origin" && coakItemSupportsFileAttachment(kind);

  const filePicker = useCoakItemFilePicker({
    disabled,
    hasAttachedFile: mediaId != null,
    onAttachFile: async (file) => {
      if (draggableItemId != null) {
        await attachFileToItem(draggableItemId, file);
      }
    },
    onAttachMedia: async (media) => {
      if (draggableItemId != null) {
        await attachMediaToItem(draggableItemId, media);
      }
    },
    onReplaceFile: async (file) => {
      if (draggableItemId != null) {
        await replaceItemFile(draggableItemId, file);
      }
    },
    onReplaceMedia: async (media) => {
      if (draggableItemId != null) {
        await replaceItemMedia(draggableItemId, media);
      }
    },
  });

  useEffect(() => {
    setDraftName(label);
  }, [label]);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if ((kind !== "folder" && kind !== "origin") || onDropIntoFolder == null) {
      return;
    }
    if (!event.dataTransfer.types.includes("application/x-coak-item-id")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (onDropIntoFolder == null) {
      return;
    }
    const raw = event.dataTransfer.getData("application/x-coak-item-id");
    const itemId = Number.parseInt(raw, 10);
    if (!Number.isFinite(itemId)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onDropIntoFolder(itemId);
  };

  const menuDisabled = disabled;
  const rowIndentPx = depth * DIRECTORY_ROW_INDENT_PX;
  const showRowMenu =
    kind !== "origin" &&
    (showAddMenu || showFileMenu || onDelete != null || onPromoteToFolder != null);

  return (
    <div
      ref={(node) => {
        rowRef?.(node);
      }}
      className="relative flex w-full flex-col gap-1"
      style={{
        marginLeft: rowIndentPx,
        width: rowIndentPx > 0 ? `calc(100% - ${rowIndentPx}px)` : "100%",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {showInsertTop ? <ListInsertIndicator position="top" tone="lime" /> : null}
      {showInsertBottom ? <ListInsertIndicator position="bottom" tone="lime" /> : null}
      <div
        ref={containerRef}
        tabIndex={onRename ? -1 : 0}
        draggable={draggableItemId != null && !isEditingTitle && !disabled}
        onDragStart={(event) => {
          if (draggableItemId == null || !onDragStartItem) {
            return;
          }
          onDragStartItem(draggableItemId, event);
        }}
        onDragEnd={() => onDragEndItem?.()}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("[data-no-row-nav]")
          ) {
            return;
          }
          event.stopPropagation();
          onSelect(nodeId, event);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(nodeId);
          }
        }}
        className={[
          "flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition",
          isSelected
            ? "border-lime-400/50 bg-lime-400/10"
            : "border-stone-700/60 bg-stone-900/70 hover:border-stone-600 hover:bg-stone-800/80",
          isDragging ? "cursor-grabbing opacity-40" : draggableItemId != null ? "cursor-grab" : "",
          isDragOver ? "border-cyan-400/60 bg-cyan-400/10" : "",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        {kind === "folder" && childCount > 0 ? (
          <button
            type="button"
            data-no-row-nav
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFolder?.();
            }}
            className={[
              DIRECTORY_ROW_LEADING_SLOT_CLASS,
              "rounded-md text-stone-300 transition",
              disabled
                ? "opacity-50"
                : "hover:bg-stone-800/90 hover:text-stone-100",
            ].join(" ")}
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            <FolderExpandIcon expanded={isExpanded} />
          </button>
        ) : (
          <span className={[DIRECTORY_ROW_LEADING_SLOT_CLASS, "text-stone-300"].join(" ")}>
            <DirectoryRowKindIcon kind={kind} />
          </span>
        )}

        {onColorChange ? (
          <RowColorPicker value={color} disabled={disabled} onChange={onColorChange} />
        ) : (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        )}

        <div className="min-w-0 flex-1">
          {onRename ? (
            <DirectoryRowTitleInput
              value={draftName}
              disabled={disabled}
              onChange={setDraftName}
              onEditingChange={setIsEditingTitle}
              onCommit={(nextValue) => {
                const trimmed = nextValue.trim();
                if (trimmed && trimmed !== label) {
                  onRename(trimmed);
                } else {
                  setDraftName(label);
                }
              }}
            />
          ) : (
            <span className="block w-full min-w-0 truncate text-sm text-stone-200">{label}</span>
          )}
          {onTagsChange ? (
            <div className="mt-1" data-no-row-nav>
              <CoakItemInlineTags
                tagIds={tags.map((tag) => tag.id)}
                disabled={disabled}
                compact
                onTagIdsChange={onTagsChange}
              />
            </div>
          ) : null}
          <span className="block w-full min-w-0 truncate text-[11px] text-stone-500">
            {contentPreview || "\u00A0"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onToggleSelect ? (
            <DirectoryRowSelectCheckbox
              label={label}
              checked={isSelected}
              disabled={disabled}
              onToggle={() => onToggleSelect(nodeId)}
            />
          ) : null}
          {showRowMenu ? (
            <div data-no-row-nav>
              <CoakDirectoryRowMenu
                ariaLabel={`Options for ${label}`}
                disabled={menuDisabled || filePicker.controlsDisabled}
                showAddMenu={showAddMenu}
                showFileMenu={showFileMenu}
                hasAttachedFile={mediaId != null}
                onAddFolder={onAddFolder}
                onAddNote={onAddNote}
                onAddFlash={onAddFlash}
                onUploadFromDevice={filePicker.openUploadFromDevice}
                onUploadFromMedia={filePicker.openUploadFromMedia}
                fileConfirmPending={fileConfirmPending}
                onRemoveFile={
                  draggableItemId != null
                    ? () => {
                        handleFileDeleteClick(() => {
                          void removeItemFile(draggableItemId);
                        });
                        return !fileConfirmPending ? false : undefined;
                      }
                    : undefined
                }
                onPromoteToFolder={onPromoteToFolder}
                onDelete={
                  onDelete
                    ? () => {
                        handleClick(onDelete);
                        return !confirmPending ? false : undefined;
                      }
                    : undefined
                }
                confirmPending={confirmPending}
              />
            </div>
          ) : null}
        </div>
      </div>
      {filePicker.filePickerDialogs}
    </div>
  );
}

export function coakTreeNodeId(node: CoakTreeNode): string {
  return coakItemNodeId(node.id);
}

export function coakOriginRowId(): string {
  return COAK_ORIGIN_NODE_ID;
}
