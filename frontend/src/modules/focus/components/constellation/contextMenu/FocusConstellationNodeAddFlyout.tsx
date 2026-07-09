// src/modules/focus/components/constellation/contextMenu/FocusConstellationNodeAddFlyout.tsx

import { useState } from "react";

import {
  FOCUS_ENTRY_ADD_MODES,
  FOCUS_ENTRY_ADD_MODE_LABELS,
  type FocusEntryAddMode,
} from "../../../lib/focus";
import {
  AddTitlePanel,
  FLYOUT_ITEM_ACTIVE_CLASS,
  FLYOUT_ITEM_CLASS,
  FLYOUT_PANEL_CLASS,
  LinkExistingListPanel,
} from "./FocusConstellationContextMenuFlyouts";
import type { FocusConstellationFlowNode } from "../node";

type FocusConstellationNodeAddFlyoutProps = {
  node: FocusConstellationFlowNode;
  parentListId: number;
  excludedLinkedListIds: number[];
  activeMode: FocusEntryAddMode | null;
  onActiveModeChange: (mode: FocusEntryAddMode | null) => void;
  disabled?: boolean;
  pending?: boolean;
  onCreateTask: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onCreateLinkedList: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onLinkExistingList: (
    node: FocusConstellationFlowNode,
    listId: number,
    title: string,
  ) => Promise<void>;
  onAddRecord: (node: FocusConstellationFlowNode) => void;
  onClose: () => void;
  onPinFlyout: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function FocusConstellationNodeAddFlyout({
  node,
  parentListId,
  excludedLinkedListIds,
  activeMode,
  onActiveModeChange,
  disabled,
  pending,
  onCreateTask,
  onCreateLinkedList,
  onLinkExistingList,
  onAddRecord,
  onClose,
  onPinFlyout,
  onMouseEnter,
  onMouseLeave,
}: FocusConstellationNodeAddFlyoutProps) {
  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || Boolean(pending) || Boolean(disabled);
  const hasLinkPanel = activeMode === "link_existing";
  const hasTitlePanel = activeMode === "task" || activeMode === "create_list";

  const handleModeSelect = (mode: FocusEntryAddMode) => {
    if (mode === "add_record") {
      onAddRecord(node);
      onClose();
      return;
    }
    onPinFlyout();
    onActiveModeChange(mode);
  };

  const handleSubmitTitle = async (title: string) => {
    if (isBusy) {
      return;
    }
    setSubmitting(true);
    try {
      if (activeMode === "task") {
        await onCreateTask(node, title);
      } else if (activeMode === "create_list") {
        await onCreateLinkedList(node, title);
      } else {
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkList = async (listId: number, listTitle: string) => {
    if (isBusy) {
      return;
    }
    setSubmitting(true);
    try {
      await onLinkExistingList(node, listId, listTitle);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="-ml-px flex items-start"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        role="group"
        aria-label="Add node options"
        className={[
          FLYOUT_PANEL_CLASS,
          "w-[9.5rem] shrink-0 py-1",
          hasLinkPanel || hasTitlePanel ? "rounded-r-none" : "",
        ].join(" ")}
      >
        {FOCUS_ENTRY_ADD_MODES.map((mode) => {
          const isActive = activeMode === mode;
          const isTitleMode = mode === "task" || mode === "create_list";

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
          mode={activeMode}
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
          parentListId={parentListId}
          excludedLinkedListIds={excludedLinkedListIds}
          pending={isBusy}
          disabled={disabled}
          onSelect={(listId, listTitle) => {
            void handleLinkList(listId, listTitle);
          }}
          className="-ml-px rounded-l-none"
        />
      ) : null}
    </div>
  );
}
