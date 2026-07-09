// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakFolderContentAddRow.tsx

import { useEffect, useRef, useState } from "react";

import {
  COAK_ITEM_EDITOR_FOLDER_ADD_MENU_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ADD_ROW_CLASS,
  COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS,
} from "../../../../lib/tabs/constellation/coakItemEditorStyles";

type CoakFolderContentAddRowProps = {
  disabled?: boolean;
  onAddFolder: () => void;
  onAddNote: () => void;
  onAddFlash: () => void;
};

function CoakFolderContentAddIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const ADD_MENU_ITEM_CLASS =
  "flex w-full items-center px-2.5 py-1.5 text-left text-xs text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50";

export function CoakFolderContentAddRow({
  disabled = false,
  onAddFolder,
  onAddNote,
  onAddFlash,
}: CoakFolderContentAddRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (rowRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const handleAdd = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <li ref={rowRef} className="relative">
      {menuOpen ? (
        <div
          role="menu"
          className={COAK_ITEM_EDITOR_FOLDER_ADD_MENU_CLASS}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={ADD_MENU_ITEM_CLASS}
            onClick={() => handleAdd(onAddFolder)}
          >
            Folder
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={ADD_MENU_ITEM_CLASS}
            onClick={() => handleAdd(onAddNote)}
          >
            Note
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={ADD_MENU_ITEM_CLASS}
            onClick={() => handleAdd(onAddFlash)}
          >
            Flash
          </button>
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        aria-label="Add item"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((current) => !current);
        }}
        className={COAK_ITEM_EDITOR_FOLDER_ADD_ROW_CLASS}
      >
        <span className={[COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS, "text-stone-400"].join(" ")}>
          <CoakFolderContentAddIcon />
        </span>
      </button>
    </li>
  );
}
