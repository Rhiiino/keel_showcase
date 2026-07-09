// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuAddSubmenu.tsx

const MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs leading-none text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50";

const MENU_ICON_SLOT_CLASS =
  "flex h-3.5 w-3.5 shrink-0 items-center justify-center text-stone-400";

const ADD_SUBMENU_WIDTH_PX = 148;

function CoakGraphMenuAddIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

type CoakGraphNodeContextMenuAddSubmenuProps = {
  submenuFlipLeft: boolean;
  disabled?: boolean;
  onAddFolder: () => void;
  onAddNote: () => void;
  onAddFlash: () => void;
};

export function CoakGraphNodeContextMenuAddSubmenu({
  submenuFlipLeft,
  disabled = false,
  onAddFolder,
  onAddNote,
  onAddFlash,
}: CoakGraphNodeContextMenuAddSubmenuProps) {
  return (
    <div className="group/add relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
      <div
        role="menuitem"
        aria-haspopup="menu"
        className={`${MENU_ITEM_CLASS} justify-between gap-2 group-hover/add:bg-stone-900/80`}
      >
        <span className={MENU_ICON_SLOT_CLASS}>
          <CoakGraphMenuAddIcon />
        </span>
        <span className="min-w-0 flex-1">Add</span>
        <span className="text-[10px] leading-none text-stone-500" aria-hidden>
          ›
        </span>
      </div>
      <div
        className={`absolute top-0 ${
          submenuFlipLeft ? "right-full flex flex-row-reverse pr-0.5" : "left-full pl-0.5"
        }`}
      >
        <div
          role="menu"
          className="pointer-events-none overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/add:pointer-events-auto group-hover/add:opacity-100"
          style={{ width: ADD_SUBMENU_WIDTH_PX }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAddFolder();
            }}
          >
            Folder
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAddNote();
            }}
          >
            Note
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAddFlash();
            }}
          >
            Flash
          </button>
        </div>
      </div>
    </div>
  );
}

export const COAK_GRAPH_ADD_SUBMENU_WIDTH_PX = ADD_SUBMENU_WIDTH_PX;
