// src/modules/focus/components/constellation/contextMenu/FocusConstellationPaneContextMenu.tsx

// Right-click context menu for empty constellation canvas space.

import { useEffect, useRef, useState } from "react";

import type { FocusList } from "../../../api";
import {
  FOCUS_ENTRY_ADD_MODE_LABELS,
  FOCUS_STANDALONE_LIST_ADD_MODES,
  type FocusEntryAddMode,
} from "../../../lib/focus";
import {
  AddTitlePanel,
  FLYOUT_ITEM_ACTIVE_CLASS,
  FLYOUT_ITEM_CLASS,
  FLYOUT_PANEL_CLASS,
  LinkExistingListPanel,
} from "./FocusConstellationContextMenuFlyouts";
import {
  CONTEXT_MENU_ITEM_CLASS,
  CONTEXT_MENU_PANEL_CLASS,
} from "./FocusConstellationContextMenuStyles";

export type FocusConstellationPaneContextMenuState = {
  clientX: number;
  clientY: number;
  flowX: number;
  flowY: number;
} | null;

type FocusConstellationPaneContextMenuProps = {
  menu: FocusConstellationPaneContextMenuState;
  onClose: () => void;
  linkableLists: FocusList[];
  pending?: boolean;
  onCreateStandaloneList: (title: string) => Promise<void>;
  onLinkStandaloneList: (listId: number) => Promise<void>;
};

function PaneAddNodeFlyoutChain({
  activeMode,
  onActiveModeChange,
  linkableLists,
  disabled,
  pending,
  onCreateStandaloneList,
  onLinkStandaloneList,
  onClose,
}: {
  activeMode: FocusEntryAddMode | null;
  onActiveModeChange: (mode: FocusEntryAddMode | null) => void;
  linkableLists: FocusList[];
  disabled?: boolean;
  pending?: boolean;
  onCreateStandaloneList: (title: string) => Promise<void>;
  onLinkStandaloneList: (listId: number) => Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || Boolean(pending) || Boolean(disabled);
  const hasLinkPanel = activeMode === "link_existing";
  const hasTitlePanel = activeMode === "create_list";

  const handleModeSelect = (mode: FocusEntryAddMode) => {
    onActiveModeChange(mode);
  };

  const handleSubmitTitle = async (title: string) => {
    if (isBusy || activeMode !== "create_list") {
      return;
    }
    setSubmitting(true);
    try {
      await onCreateStandaloneList(title);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkList = async (listId: number) => {
    if (isBusy) {
      return;
    }
    setSubmitting(true);
    try {
      await onLinkStandaloneList(listId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="-ml-px flex items-start">
      <div
        role="group"
        aria-label="Add node options"
        className={[
          FLYOUT_PANEL_CLASS,
          "w-[9.5rem] shrink-0 py-1",
          hasLinkPanel || hasTitlePanel ? "rounded-r-none" : "",
        ].join(" ")}
      >
        {FOCUS_STANDALONE_LIST_ADD_MODES.map((mode) => {
          const isActive = activeMode === mode;
          const isTitleMode = mode === "create_list";

          return (
            <button
              key={mode}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleModeSelect(mode)}
              className={[
                isActive ? FLYOUT_ITEM_ACTIVE_CLASS : FLYOUT_ITEM_CLASS,
                isActive && isTitleMode ? "rounded-r-none" : "",
              ].join(" ")}
            >
              {FOCUS_ENTRY_ADD_MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>

      {hasTitlePanel ? (
        <AddTitlePanel
          mode="create_list"
          pending={isBusy}
          disabled={disabled}
          onSubmit={(title) => {
            void handleSubmitTitle(title);
          }}
          className="-ml-px rounded-l-none"
        />
      ) : null}

      {hasLinkPanel ? (
        <LinkExistingListPanel
          candidateLists={linkableLists}
          pending={isBusy}
          disabled={disabled}
          onSelect={(listId) => {
            void handleLinkList(listId);
          }}
          emptyMessage="No unlinked lists are available to add."
          className="-ml-px rounded-l-none"
        />
      ) : null}
    </div>
  );
}

export function FocusConstellationPaneContextMenu({
  menu,
  onClose,
  linkableLists,
  pending = false,
  onCreateStandaloneList,
  onLinkStandaloneList,
}: FocusConstellationPaneContextMenuProps) {
  const menuShellRef = useRef<HTMLDivElement>(null);
  const [addFlyoutOpen, setAddFlyoutOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<FocusEntryAddMode | null>(null);

  const resetAddFlyout = () => {
    setAddFlyoutOpen(false);
    setActiveMode(null);
  };

  useEffect(() => {
    resetAddFlyout();
  }, [menu?.clientX, menu?.clientY]);

  useEffect(() => {
    if (!menu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        menuShellRef.current &&
        target instanceof Node &&
        menuShellRef.current.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return (
    <div
      ref={menuShellRef}
      className="fixed z-[100] flex items-start"
      style={{ left: menu.clientX, top: menu.clientY }}
    >
      <div
        role="menu"
        aria-label="Canvas actions"
        className={CONTEXT_MENU_PANEL_CLASS}
      >
        <button
          type="button"
          role="menuitem"
          aria-expanded={addFlyoutOpen}
          onClick={() => {
            setAddFlyoutOpen((current) => {
              if (current) {
                setActiveMode(null);
              }
              return !current;
            });
          }}
          className={addFlyoutOpen ? FLYOUT_ITEM_ACTIVE_CLASS : CONTEXT_MENU_ITEM_CLASS}
        >
          Add node
        </button>
      </div>

      {addFlyoutOpen ? (
        <PaneAddNodeFlyoutChain
          activeMode={activeMode}
          onActiveModeChange={setActiveMode}
          linkableLists={linkableLists}
          pending={pending}
          onCreateStandaloneList={onCreateStandaloneList}
          onLinkStandaloneList={onLinkStandaloneList}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}
