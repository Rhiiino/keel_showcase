// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuFileSubmenu.tsx

import {
  CoakGraphMenuFileIcon,
  MENU_ICON_SLOT_CLASS,
  MENU_ITEM_CLASS,
  nestedSubmenuPositionClass,
} from "./CoakGraphNodeContextMenuIcons";

const FILE_SUBMENU_WIDTH_PX = 192;

type CoakGraphNodeContextMenuFileSubmenuProps = {
  submenuFlipLeft: boolean;
  disabled?: boolean;
  hasAttachedFile: boolean;
  onUploadFromDevice: () => void;
  onUploadFromMedia: () => void;
  onRemoveFile: () => void;
  fileConfirmPending?: boolean;
};

export function CoakGraphNodeContextMenuFileSubmenu({
  submenuFlipLeft,
  disabled = false,
  hasAttachedFile,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  fileConfirmPending = false,
}: CoakGraphNodeContextMenuFileSubmenuProps) {
  return (
    <div className="group/file relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
      <div
        role="menuitem"
        aria-haspopup="menu"
        className={`${MENU_ITEM_CLASS} justify-between gap-2 group-hover/file:bg-stone-900/80`}
      >
        <span className={MENU_ICON_SLOT_CLASS}>
          <CoakGraphMenuFileIcon />
        </span>
        <span className="min-w-0 flex-1">File</span>
        <span className="text-[10px] leading-none text-stone-500" aria-hidden>
          ›
        </span>
      </div>
      <div className={nestedSubmenuPositionClass(submenuFlipLeft)}>
        <div
          role="menu"
          className="pointer-events-none rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/file:pointer-events-auto group-hover/file:opacity-100"
          style={{ width: FILE_SUBMENU_WIDTH_PX }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onUploadFromDevice();
            }}
          >
            Upload from Device
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onUploadFromMedia();
            }}
          >
            Upload from Media
          </button>
          {hasAttachedFile ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${MENU_ITEM_CLASS} text-red-300 hover:bg-red-950/40`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemoveFile();
              }}
            >
              {fileConfirmPending ? "Confirm delete" : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const COAK_GRAPH_FILE_SUBMENU_WIDTH_PX = FILE_SUBMENU_WIDTH_PX;
