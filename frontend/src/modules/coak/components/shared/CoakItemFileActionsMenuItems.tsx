// keel_web/src/modules/coak/components/shared/CoakItemFileActionsMenuItems.tsx

export const COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX = 192;

export const COAK_ITEM_FILE_ACTIONS_MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs transition disabled:opacity-50";

type CoakItemFileActionsMenuItemsProps = {
  disabled?: boolean;
  hasAttachedFile: boolean;
  confirmDeletePending?: boolean;
  onUploadFromDevice: () => void;
  onUploadFromMedia: () => void;
  onRemoveFile?: () => void | boolean;
  onActionComplete?: () => void;
};

export function CoakItemFileActionsMenuItems({
  disabled = false,
  hasAttachedFile,
  confirmDeletePending = false,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  onActionComplete,
}: CoakItemFileActionsMenuItemsProps) {
  const runAction = (action: () => void) => {
    onActionComplete?.();
    action();
  };

  const handleRemoveFile = () => {
    if (!onRemoveFile) {
      return;
    }

    const keepOpen = onRemoveFile() === false;
    if (!keepOpen) {
      onActionComplete?.();
    }
  };

  return (
    <>
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        className={`${COAK_ITEM_FILE_ACTIONS_MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onUploadFromDevice();
          onActionComplete?.();
        }}
      >
        Upload from Device
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        className={`${COAK_ITEM_FILE_ACTIONS_MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          runAction(onUploadFromMedia);
        }}
      >
        Upload from Media
      </button>
      {hasAttachedFile && onRemoveFile ? (
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          className={`${COAK_ITEM_FILE_ACTIONS_MENU_ITEM_CLASS} text-red-300 hover:bg-red-950/40`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleRemoveFile();
          }}
        >
          {confirmDeletePending ? "Confirm delete" : "Delete"}
        </button>
      ) : null}
    </>
  );
}
