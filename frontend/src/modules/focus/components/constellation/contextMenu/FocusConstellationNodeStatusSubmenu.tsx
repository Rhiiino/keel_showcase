// src/modules/focus/components/constellation/contextMenu/FocusConstellationNodeStatusSubmenu.tsx

import {
  FOCUS_NODE_STATUSES,
  FOCUS_NODE_STATUS_COLORS,
  FOCUS_NODE_STATUS_LABELS,
  type FocusNodeStatus,
} from "../../../lib/focus";
import { ChevronRightIcon } from "./FocusConstellationContextMenuIcons";
import { CONTEXT_MENU_ITEM_CLASS } from "./FocusConstellationContextMenuStyles";
import { useFocusConstellationSubmenuHover } from "./useFocusConstellationSubmenuHover";

function StatusDot({ status }: { status: FocusNodeStatus }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
      style={{ backgroundColor: FOCUS_NODE_STATUS_COLORS[status] }}
      aria-hidden
    />
  );
}

type FocusConstellationNodeStatusSubmenuProps = {
  currentStatus: FocusNodeStatus;
  onSelect: (status: FocusNodeStatus) => void;
};

export function FocusConstellationNodeStatusSubmenu({
  currentStatus,
  onSelect,
}: FocusConstellationNodeStatusSubmenuProps) {
  const { open, openSubmenu, scheduleClose } = useFocusConstellationSubmenuHover();

  return (
    <div
      className="relative"
      onMouseEnter={openSubmenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={openSubmenu}
        className={`${CONTEXT_MENU_ITEM_CLASS} items-center justify-between gap-3`}
      >
        <span className="flex items-center gap-2">
          <StatusDot status={currentStatus} />
          Status
        </span>
        <span className="flex items-center gap-2 text-white/45">
          {FOCUS_NODE_STATUS_LABELS[currentStatus]}
          <ChevronRightIcon />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Set status"
          className="absolute left-full top-0 z-[110] -ml-px min-w-[8.5rem] rounded-lg border border-white/[0.08] bg-stone-900/85 py-1 shadow-[0_10px_36px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          onMouseEnter={openSubmenu}
          onMouseLeave={scheduleClose}
        >
          {FOCUS_NODE_STATUSES.map((status) => {
            const selected = status === currentStatus;
            return (
              <button
                key={status}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => onSelect(status)}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition",
                  selected
                    ? "bg-white/[0.1] text-white"
                    : "text-white/72 hover:bg-white/[0.06] hover:text-white/92",
                ].join(" ")}
              >
                <StatusDot status={status} />
                {FOCUS_NODE_STATUS_LABELS[status]}
                {selected ? (
                  <svg
                    viewBox="0 0 20 20"
                    className="ml-auto h-3.5 w-3.5 text-sky-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M5 10.5L8.5 14L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
