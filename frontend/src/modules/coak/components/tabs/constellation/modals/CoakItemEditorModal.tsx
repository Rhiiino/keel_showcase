// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakItemEditorModal.tsx

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";

import { parseCoakItemNodeId, type CoakItem } from "../../../../api";
import { CoakItemFileMenu } from "../../../shared/CoakItemFileMenu";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakItemFilePicker } from "../../../../hooks/tabs/directory/useCoakItemFilePicker";
import { coakItemSupportsFileAttachment } from "../../../../lib/coakItemKindRegistry";
import { normalizeHexColor } from "../../../../lib/tabs/constellation/coakNodeLayout";
import {
  COAK_ITEM_EDITOR_FILE_MENU_BUTTON_CLASS,
  COAK_ITEM_EDITOR_HEADER_CLASS,
  COAK_ITEM_EDITOR_INNER_CLASS,
  COAK_ITEM_EDITOR_KIND_CHIP,
  COAK_ITEM_EDITOR_KIND_CHIP_CLASS,
  COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
  COAK_ITEM_EDITOR_TITLE_INPUT_CLASS,
  coakItemEditorKindAccentBarClass,
  coakItemEditorKindShellClass,
} from "../../../../lib/tabs/constellation/coakItemEditorStyles";
import { isCoakItemEditorInteractiveTarget } from "../../../../lib/tabs/constellation/coakItemEditorDrag";
import { useConfirmDeleteAction } from "../../../../../../hooks/useConfirmDeleteAction";
import { CoakTvModalFrame } from "./CoakTvModalFrame";
import { CoakItemInlineTags } from "../../../tags/CoakItemInlineTags";
import { CoakFlashItemEditorBody } from "./CoakFlashItemEditorBody";
import { CoakFolderItemEditorBody } from "./CoakFolderItemEditorBody";
import { CoakItemMediaPreview } from "./CoakItemMediaPreview";
import { CoakNoteItemEditorBody } from "./CoakNoteItemEditorBody";

type CoakItemEditorModalProps = {
  nodeId: string;
  open: boolean;
  onExitComplete?: () => void;
  /** Portal file-picker overlays to document.body (constellation floating modals sit inside CSS transforms). */
  portalFilePickerDialogs?: boolean;
};

function CoakItemEditorTitleField({
  value,
  disabled,
  onChange,
  onCommit,
  placeholder,
  inputRef,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef as RefObject<HTMLInputElement> | undefined}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      aria-label="Item name"
      placeholder={placeholder}
      className={COAK_ITEM_EDITOR_TITLE_INPUT_CLASS}
    />
  );
}

function CoakItemEditorBodyContent({
  item,
  disabled,
  open,
  shouldFocusTitle,
}: {
  item: CoakItem;
  disabled?: boolean;
  open: boolean;
  shouldFocusTitle?: boolean;
}) {
  if (item.kind === "note") {
    return (
      <CoakNoteItemEditorBody
        item={item}
        disabled={disabled}
        open={open}
        shouldFocusBody={open && !shouldFocusTitle}
      />
    );
  }

  if (item.kind === "flash") {
    return (
      <CoakFlashItemEditorBody
        item={item}
        disabled={disabled}
        open={open}
        shouldFocusQuestion={open && !shouldFocusTitle}
      />
    );
  }

  return <CoakFolderItemEditorBody item={item} disabled={disabled} />;
}

export function CoakItemEditorModal({
  nodeId,
  open,
  onExitComplete,
  portalFilePickerDialogs = false,
}: CoakItemEditorModalProps) {
  const {
    items,
    isLoading,
    itemEditorTitleFocusNodeId,
    clearItemEditorTitleFocus,
    renameItem,
    updateItemTags,
    attachFileToItem,
    attachMediaToItem,
    replaceItemFile,
    replaceItemMedia,
    removeItemFile,
    openGraphNodeContextMenu,
  } = useCoakRecordWorkspace();
  const itemId = parseCoakItemNodeId(nodeId);
  const item = items.find((entry) => entry.id === itemId) ?? null;
  const shouldFocusTitle = open && itemEditorTitleFocusNodeId === nodeId;
  const [draftTitle, setDraftTitle] = useState(item?.name ?? "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { confirmPending, handleClick } = useConfirmDeleteAction(
    itemId != null ? `item-file-${itemId}` : undefined,
  );

  useEffect(() => {
    if (item) {
      setDraftTitle(item.name);
    }
  }, [item?.id, item?.name]);

  useEffect(() => {
    if (!open || !shouldFocusTitle || !item) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      clearItemEditorTitleFocus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [clearItemEditorTitleFocus, item, open, shouldFocusTitle]);

  const filePicker = useCoakItemFilePicker({
    disabled: isLoading,
    hasAttachedFile: item?.media_id != null,
    portalDialogs: portalFilePickerDialogs,
    mediaPickerZIndexClass: portalFilePickerDialogs ? "z-[600]" : "z-[70]",
    onAttachFile: async (file) => {
      if (itemId != null) {
        await attachFileToItem(itemId, file);
      }
    },
    onAttachMedia: async (media) => {
      if (itemId != null) {
        await attachMediaToItem(itemId, media);
      }
    },
    onReplaceFile: async (file) => {
      if (itemId != null) {
        await replaceItemFile(itemId, file);
      }
    },
    onReplaceMedia: async (media) => {
      if (itemId != null) {
        await replaceItemMedia(itemId, media);
      }
    },
  });

  const commitTitle = useCallback(async () => {
    if (!item) {
      return;
    }
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === item.name) {
      setDraftTitle(item.name);
      return;
    }
    await renameItem(item.id, trimmed);
  }, [draftTitle, item, renameItem]);

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isCoakItemEditorInteractiveTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openGraphNodeContextMenu(nodeId, event.clientX, event.clientY);
    },
    [nodeId, openGraphNodeContextMenu],
  );

  if (itemId == null) {
    return null;
  }

  if (!item) {
    return <>{filePicker.filePickerDialogs}</>;
  }

  const titlePlaceholder =
    item.kind === "folder"
      ? "Folder name"
      : item.kind === "flash"
        ? "Untitled flash"
        : "Untitled note";

  const supportsFile = coakItemSupportsFileAttachment(item.kind);
  const kindChip = COAK_ITEM_EDITOR_KIND_CHIP[item.kind];

  return (
    <CoakTvModalFrame
      open={open}
      onExitComplete={onExitComplete}
      className={["w-[17rem]", coakItemEditorKindShellClass(item.kind)].join(" ")}
      accentBarClass={coakItemEditorKindAccentBarClass(item.kind)}
      style={
        item.kind === "flash"
          ? ({
              ["--coak-flash-accent" as string]: normalizeHexColor(item.color_hex || "#f59e0b"),
            } as CSSProperties)
          : undefined
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${item.name}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        <div className={COAK_ITEM_EDITOR_INNER_CLASS}>
          <div className={COAK_ITEM_EDITOR_HEADER_CLASS}>
            <div className="min-w-0 flex-1">
              <span className={[COAK_ITEM_EDITOR_KIND_CHIP_CLASS, kindChip.className].join(" ")}>
                {kindChip.label}
              </span>
              <CoakItemEditorTitleField
                value={draftTitle}
                disabled={isLoading}
                onChange={setDraftTitle}
                inputRef={titleInputRef}
                onCommit={() => {
                  void commitTitle();
                }}
                placeholder={titlePlaceholder}
              />
              <div className="mt-2">
                <CoakItemInlineTags
                  tagIds={(item.tags ?? []).map((tag) => tag.id)}
                  disabled={isLoading}
                  onTagIdsChange={(tagIds: number[]) => {
                    void updateItemTags(item.id, tagIds);
                  }}
                />
              </div>
            </div>
            {supportsFile ? (
              <CoakItemFileMenu
                ariaLabel={`File options for ${item.name}`}
                disabled={isLoading || filePicker.controlsDisabled}
                hasAttachedFile={item.media_id != null}
                onUploadFromDevice={filePicker.openUploadFromDevice}
                onUploadFromMedia={filePicker.openUploadFromMedia}
                confirmDeletePending={confirmPending}
                buttonClassName={COAK_ITEM_EDITOR_FILE_MENU_BUTTON_CLASS}
                onRemoveFile={() => {
                  handleClick(() => {
                    void removeItemFile(item.id);
                  });
                  return !confirmPending ? false : undefined;
                }}
              />
            ) : null}
          </div>

          {filePicker.actionPending ? (
            <div
              className={[
                COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
                "flex aspect-[4/3] items-center justify-center text-xs text-stone-400",
              ].join(" ")}
            >
              Uploading file…
            </div>
          ) : null}

          {!filePicker.actionPending && item.media_id ? (
            <CoakItemMediaPreview
              key={item.media_id}
              mediaId={item.media_id}
              alt={item.name}
              fileActions={
                supportsFile
                  ? {
                      disabled: isLoading || filePicker.controlsDisabled,
                      confirmDeletePending: confirmPending,
                      onUploadFromDevice: filePicker.openUploadFromDevice,
                      onUploadFromMedia: filePicker.openUploadFromMedia,
                      onRemoveFile: () => {
                        handleClick(() => {
                          void removeItemFile(item.id);
                        });
                        return !confirmPending ? false : undefined;
                      },
                    }
                  : undefined
              }
            />
          ) : null}

          {filePicker.actionError ? (
            <p className="text-xs text-red-400">{filePicker.actionError}</p>
          ) : null}

          <div className={item.kind === "folder" ? "min-h-0 max-h-[50vh] overflow-y-auto" : undefined}>
            <CoakItemEditorBodyContent
              item={item}
              disabled={isLoading}
              open={open}
              shouldFocusTitle={shouldFocusTitle}
            />
          </div>
        </div>
      </div>
      {filePicker.filePickerDialogs}
    </CoakTvModalFrame>
  );
}
