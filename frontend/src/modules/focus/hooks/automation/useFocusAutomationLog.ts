// keel_web/src/modules/focus/hooks/automation/useFocusAutomationLog.ts

import { useCallback, useState } from "react";

export type FocusAutomationLogKind =
  | "session"
  | "tool_start"
  | "tool_complete"
  | "tool_failed"
  | "node_viewed"
  | "nodes_highlighted"
  | "expansion_changed"
  | "children_aligned"
  | "positions_changed"
  | "info";

export type FocusAutomationLogEntry = {
  id: string;
  timestamp: Date;
  kind: FocusAutomationLogKind;
  summary: string;
  detail?: string;
  durationMs?: number;
};

let entryCounter = 0;

function nextEntryId(): string {
  entryCounter += 1;
  return `automation-log-${entryCounter}`;
}

export function useFocusAutomationLog() {
  const [entries, setEntries] = useState<FocusAutomationLogEntry[]>([]);

  const appendEntry = useCallback((entry: Omit<FocusAutomationLogEntry, "id" | "timestamp">) => {
    setEntries((current) => [
      {
        ...entry,
        id: nextEntryId(),
        timestamp: new Date(),
      },
      ...current,
    ]);
  }, []);

  const clearLog = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    appendEntry,
    clearLog,
  };
}
