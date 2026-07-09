// stack_sandbox/frontend_web/src/modules/chat/hooks/useStatusLog.ts

// Runtime-only status log for the chat Status Panel Log tab (clears on refresh).

import { useCallback, useState } from "react";

export type StatusLogKind =
  | "user_message"
  | "agent_selected"
  | "tool_call_start"
  | "tool_call_result"
  | "assistant_message"
  | "done"
  | "error"
  | "info";

export type StatusLogEntry = {
  id: string;
  timestamp: Date;
  kind: StatusLogKind;
  summary: string;
  detail?: string;
  meta?: Record<string, unknown>;
};

function formatDurationMs(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "";
  }
  const ms = Math.round(seconds * 1000);
  return `${ms}ms`;
}

export function formatStatusLogEntry(
  eventName: string,
  data: Record<string, unknown>,
): Omit<StatusLogEntry, "id" | "timestamp"> {
  switch (eventName) {
    case "user_message": {
      const id = data.id as number;
      const content = (data.content as string) ?? "";
      const preview =
        content.length > 80 ? `${content.slice(0, 77)}…` : content;
      return {
        kind: "user_message",
        summary: `User message saved (#${id})`,
        detail: preview || undefined,
        meta: data,
      };
    }
    case "agent_selected": {
      const agentId = data.agent_id as string;
      const delegated = Boolean(data.delegated);
      return {
        kind: "agent_selected",
        summary: delegated
          ? `Delegated to ${agentId}`
          : `Agent: ${agentId}`,
        meta: data,
      };
    }
    case "tool_call_start": {
      const toolName = data.tool_name as string;
      const category = data.category as string | null;
      return {
        kind: "tool_call_start",
        summary: `Tool started: ${toolName}`,
        detail: category ? `category: ${category}` : undefined,
        meta: data,
      };
    }
    case "tool_call_result": {
      const toolName = data.tool_name as string;
      const success = Boolean(data.success);
      const duration = formatDurationMs(data.duration_seconds as number | undefined);
      const parts = [`Tool finished: ${toolName}`];
      if (duration) {
        parts.push(duration);
      }
      parts.push(success ? "success" : "failed");
      return {
        kind: "tool_call_result",
        summary: parts.join(" — "),
        detail: (data.summary as string) || undefined,
        meta: data,
      };
    }
    case "assistant_message": {
      const id = data.id as number;
      const agentId = data.agent_id as string | null;
      const agentPart = agentId ? `, agent: ${agentId}` : "";
      return {
        kind: "assistant_message",
        summary: `Assistant message saved (#${id}${agentPart})`,
        meta: data,
      };
    }
    case "done": {
      const finishReason = (data.finish_reason as string) ?? "unknown";
      const duration = formatDurationMs(data.duration_seconds as number | undefined);
      const parts = [`Turn complete (${finishReason})`];
      if (duration) {
        parts.push(duration);
      }
      return {
        kind: "done",
        summary: parts.join(" — "),
        meta: data,
      };
    }
    case "error": {
      return {
        kind: "error",
        summary: `Error: ${(data.message as string) ?? "Unknown error"}`,
        meta: data,
      };
    }
    default:
      return {
        kind: "info",
        summary: eventName,
        meta: data,
      };
  }
}

export function useStatusLog() {
  const [entries, setEntries] = useState<StatusLogEntry[]>([]);

  const appendFromEvent = useCallback(
    (eventName: string, data: Record<string, unknown>) => {
      const formatted = formatStatusLogEntry(eventName, data);
      setEntries((prev) => [
        ...prev,
        {
          ...formatted,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ]);
    },
    [],
  );

  const startTurn = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        kind: "info",
        summary: "— New turn —",
      },
    ]);
  }, []);

  const clearLog = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    appendFromEvent,
    startTurn,
    clearLog,
  };
}
