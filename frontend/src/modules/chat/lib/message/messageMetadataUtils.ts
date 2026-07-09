// stack_sandbox/frontend_web/src/modules/chat/lib/message/messageMetadataUtils.ts

// Helpers for expandable message metadata (agents, tools, timestamps).

import type { Message, ToolCallSummary } from "../../api";

export function formatMessageTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatAgentDisplayName(agentId: string): string {
  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

export function agentNameClass(agentId: string): string {
  return agentId === "keel" ? "text-lime-300/90" : "text-violet-400";
}

/** Agents involved in a turn; falls back to agent_id for older rows. */
export function agentsForMessage(message: Message): string[] {
  const agentsUsed = message.agents_used ?? [];
  if (agentsUsed.length > 0) {
    return agentsUsed;
  }
  if (message.agent_id) {
    return [message.agent_id];
  }
  return [];
}

/** Primary agent to show beside an assistant bubble (direct responder). */
export function assistantBubbleAgentId(message: Message): string | null {
  if (message.agent_id) {
    return message.agent_id;
  }
  const agents = agentsForMessage(message);
  return agents.at(-1) ?? null;
}

export function formatToolDuration(seconds: number | null | undefined): string | null {
  if (seconds == null) {
    return null;
  }
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

export function toolCallsForMessage(message: Message): ToolCallSummary[] {
  return message.tool_calls ?? [];
}

/** Map each user message id to the assistant reply that followed it. */
export function buildReplyByUserMessageId(messages: Message[]): Map<number, Message> {
  const map = new Map<number, Message>();
  for (let index = 0; index < messages.length - 1; index += 1) {
    const current = messages[index];
    const next = messages[index + 1];
    if (current.role === "user" && next.role === "assistant") {
      map.set(current.id, next);
    }
  }
  return map;
}
