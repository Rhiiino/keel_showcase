// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuOptimizeSubmenu.tsx

import type {
  CoakInlineOptimizeAngle,
  CoakOptimizeBranchAngle,
  CoakOptimizeLayoutMode,
} from "../../../../lib/tabs/constellation/coakNodeLayout";
import {
  CoakGraphMenuItemContent,
  CoakGraphMenuOptimizeIcon,
  MENU_ITEM_CLASS,
  nestedSubmenuPositionClass,
} from "./CoakGraphNodeContextMenuIcons";

const SUBMENU_WIDTH_PX = 120;
const OPTIMIZE_BRANCH_ANGLES: CoakOptimizeBranchAngle[] = [90, 120];
const INLINE_OPTIMIZE_ANGLES: CoakInlineOptimizeAngle[] = [90, 120, 180];

type CoakGraphNodeContextMenuOptimizeSubmenuProps = {
  isOrigin: boolean;
  nodeId: string;
  hasChildren: boolean;
  movementLocked: boolean;
  submenuFlipLeft: boolean;
  optimizeNodeChildren: (nodeId: string, layoutMode?: CoakOptimizeLayoutMode) => void;
  closeGraphNodeContextMenu: () => void;
};

export function CoakGraphNodeContextMenuOptimizeSubmenu({
  isOrigin,
  nodeId,
  hasChildren,
  movementLocked,
  submenuFlipLeft,
  optimizeNodeChildren,
  closeGraphNodeContextMenu,
}: CoakGraphNodeContextMenuOptimizeSubmenuProps) {
  const handleOptimizeWithMode = (layoutMode: CoakOptimizeLayoutMode) => {
    optimizeNodeChildren(nodeId, layoutMode);
    closeGraphNodeContextMenu();
  };

  if (isOrigin) {
    return (
      <button
        type="button"
        role="menuitem"
        disabled={!hasChildren || movementLocked}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          optimizeNodeChildren(nodeId);
          closeGraphNodeContextMenu();
        }}
        className={`${MENU_ITEM_CLASS} gap-2`}
      >
        <CoakGraphMenuItemContent icon={<CoakGraphMenuOptimizeIcon />} label="Optimize" />
      </button>
    );
  }

  return (
    <div
      className={`group/optimize relative z-0 hover:z-20 ${
        hasChildren && !movementLocked ? "cursor-default" : "cursor-not-allowed opacity-50"
      }`}
      aria-haspopup="menu"
      aria-disabled={!hasChildren || movementLocked}
    >
      <div
        role="menuitem"
        aria-haspopup="menu"
        className={`${MENU_ITEM_CLASS} justify-between gap-2 group-hover/optimize:bg-stone-900/80`}
      >
        <CoakGraphMenuItemContent
          icon={<CoakGraphMenuOptimizeIcon />}
          label="Optimize"
          trailing={
            hasChildren ? (
              <span className="text-[10px] leading-none text-stone-500" aria-hidden>
                ›
              </span>
            ) : null
          }
        />
      </div>
      {hasChildren && !movementLocked ? (
        <div
          className={`absolute top-0 ${
            submenuFlipLeft ? "right-full flex flex-row-reverse pr-0.5" : "left-full pl-0.5"
          }`}
        >
          <div
            role="menu"
            className="pointer-events-none w-[120px] overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/optimize:pointer-events-auto group-hover/optimize:opacity-100"
          >
            {OPTIMIZE_BRANCH_ANGLES.map((branchAngle) => (
              <button
                key={branchAngle}
                type="button"
                role="menuitem"
                className={MENU_ITEM_CLASS}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleOptimizeWithMode(branchAngle);
                }}
              >
                {branchAngle}°
              </button>
            ))}
            <div className="group/inline relative z-0 hover:z-20">
              <div
                role="menuitem"
                aria-haspopup="menu"
                className={`${MENU_ITEM_CLASS} justify-between group-hover/inline:bg-stone-900/80`}
              >
                <span>Inline</span>
                <span className="text-[10px] leading-none text-stone-500" aria-hidden>
                  ›
                </span>
              </div>
              <div className={nestedSubmenuPositionClass(submenuFlipLeft)}>
                <div
                  role="menu"
                  className="pointer-events-none w-[120px] rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/inline:pointer-events-auto group-hover/inline:opacity-100"
                >
                  {INLINE_OPTIMIZE_ANGLES.map((inlineAngle) => (
                    <button
                      key={inlineAngle}
                      type="button"
                      role="menuitem"
                      className={MENU_ITEM_CLASS}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleOptimizeWithMode({ inline: inlineAngle });
                      }}
                    >
                      {inlineAngle}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { SUBMENU_WIDTH_PX };
