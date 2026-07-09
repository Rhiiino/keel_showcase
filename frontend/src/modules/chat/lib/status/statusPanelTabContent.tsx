// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelTabContent.tsx

// Renders status panel tab content by id — extend when adding new tabs.

import { GeneralTab, LogTab, RulesTab } from "../../components/status";
import type { StatusLogEntry } from "../../hooks/useStatusLog";
import type { StatusPanelTabId } from "./statusPanelConfig";
import { STATUS_PANEL_TAB_IDS } from "./statusPanelConfig";

export type StatusPanelTabContentProps = {
  tabId: StatusPanelTabId;
  selectedConversationId: number | null;
  onSelect: (conversationId: number) => void;
  onDeleted: (deletedId: number) => void;
  onCreated: (conversationId: number) => void;
  logEntries: StatusLogEntry[];
  onClearLog: () => void;
  isStreaming?: boolean;
};

export function StatusPanelTabContent({
  tabId,
  selectedConversationId,
  onSelect,
  onDeleted,
  onCreated,
  logEntries,
  onClearLog,
  isStreaming = false,
}: StatusPanelTabContentProps) {
  switch (tabId) {
    case STATUS_PANEL_TAB_IDS.general:
      return (
        <GeneralTab
          selectedConversationId={selectedConversationId}
          onSelect={onSelect}
          onDeleted={onDeleted}
          onCreated={onCreated}
        />
      );
    case STATUS_PANEL_TAB_IDS.rules:
      return <RulesTab />;
    case STATUS_PANEL_TAB_IDS.log:
      return (
        <LogTab
          entries={logEntries}
          onClearLog={onClearLog}
          isStreaming={isStreaming}
        />
      );
    default:
      return null;
  }
}
