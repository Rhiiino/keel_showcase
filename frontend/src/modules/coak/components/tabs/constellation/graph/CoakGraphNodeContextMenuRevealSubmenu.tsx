// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuRevealSubmenu.tsx

import {
  CoakGraphMenuRevealIcon,
  MENU_ICON_SLOT_CLASS,
  MENU_ITEM_CLASS,
} from "./CoakGraphNodeContextMenuIcons";

const REVEAL_SUBMENU_WIDTH_PX = 148;

type CoakGraphNodeContextMenuRevealSubmenuProps = {
  submenuFlipLeft: boolean;
  disabled?: boolean;
  onImmediate: () => void;
  onLineage: () => void;
};

export function CoakGraphNodeContextMenuRevealSubmenu({
  submenuFlipLeft,
  disabled = false,
  onImmediate,
  onLineage,
}: CoakGraphNodeContextMenuRevealSubmenuProps) {
  return (
    <div className="group/reveal relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
      <div
        role="menuitem"
        aria-haspopup="menu"
        className={`${MENU_ITEM_CLASS} justify-between gap-2 group-hover/reveal:bg-stone-900/80`}
      >
        <span className={MENU_ICON_SLOT_CLASS}>
          <CoakGraphMenuRevealIcon />
        </span>
        <span className="min-w-0 flex-1">Reveal</span>
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
          className="pointer-events-none overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/reveal:pointer-events-auto group-hover/reveal:opacity-100"
          style={{ width: REVEAL_SUBMENU_WIDTH_PX }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onImmediate();
            }}
          >
            Immediate
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className={MENU_ITEM_CLASS}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onLineage();
            }}
          >
            Lineage
          </button>
        </div>
      </div>
    </div>
  );
}

export const COAK_GRAPH_REVEAL_SUBMENU_WIDTH_PX = REVEAL_SUBMENU_WIDTH_PX;
