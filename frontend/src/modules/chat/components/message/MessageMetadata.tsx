// stack_sandbox/frontend_web/src/modules/chat/components/message/MessageMetadata.tsx

// Expandable metadata panel for a chat message (timestamps, agents, tools).

import type { ReactNode } from "react";

import type { Message } from "../../api";
import {
  agentNameClass,
  agentsForMessage,
  formatAgentDisplayName,
  formatMessageTimestamp,
  formatToolDuration,
  toolCallsForMessage,
} from "../../lib/message";
import { toolCategoryLabel } from "../../lib/tools";
import { ToolCategoryIcon } from "../status/ToolCategoryIcon";

type MessageMetadataProps = {
  message: Message;
  /** When set on a user message, shows agents/tools from the paired assistant reply. */
  replyMessage?: Message | null;
};

type MetadataSurface = "user" | "assistant";

function metadataStyles(surface: MetadataSurface) {
  const isUser = surface === "user";
  return {
    divider: isUser ? "border-white/15" : "border-stone-800/80",
    label: isUser ? "text-stone-300" : "text-stone-500",
    value: isUser ? "text-stone-200" : "text-stone-400",
    muted: isUser ? "text-stone-300" : "text-stone-600",
    section: isUser ? "text-stone-300" : "text-stone-600",
    agentPill: isUser
      ? "rounded-md border border-white/20 bg-black/25 px-2 py-0.5 font-mono text-[11px]"
      : "rounded-md border border-stone-800 bg-stone-900/60 px-2 py-0.5 font-mono text-[11px]",
    toolPill: isUser
      ? "flex flex-wrap items-center gap-1.5 rounded-md border border-white/15 bg-black/20 px-2 py-1"
      : "flex flex-wrap items-center gap-1.5 rounded-md border border-stone-800/80 bg-stone-900/40 px-2 py-1",
    toolName: isUser ? "font-mono text-[11px] text-stone-100" : "font-mono text-[11px] text-stone-300",
    toolMeta: isUser ? "text-[10px] text-stone-300" : "text-[10px] text-stone-600",
  };
}

function MetadataRow({
  label,
  children,
  surface,
}: {
  label: string;
  children: ReactNode;
  surface: MetadataSurface;
}) {
  const styles = metadataStyles(surface);

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span
        className={`shrink-0 font-mono text-[10px] uppercase tracking-wider sm:w-20 ${styles.label}`}
      >
        {label}
      </span>
      <div className={`min-w-0 flex-1 text-xs ${styles.value}`}>{children}</div>
    </div>
  );
}

function AgentList({
  agentIds,
  surface,
}: {
  agentIds: string[];
  surface: MetadataSurface;
}) {
  const styles = metadataStyles(surface);

  if (agentIds.length === 0) {
    return <span className={styles.muted}>None</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {agentIds.map((agentId) => (
        <li key={agentId} className={[styles.agentPill, agentNameClass(agentId)].join(" ")}>
          {formatAgentDisplayName(agentId)}
        </li>
      ))}
    </ul>
  );
}

function ToolList({ message, surface }: { message: Message; surface: MetadataSurface }) {
  const styles = metadataStyles(surface);
  const tools = toolCallsForMessage(message);

  if (tools.length === 0) {
    return <span className={styles.muted}>None</span>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {tools.map((tool) => {
        const duration = formatToolDuration(tool.duration_seconds);
        return (
          <li key={tool.id} className={styles.toolPill}>
            <ToolCategoryIcon category={tool.category} size="xs" />
            <span className={styles.toolName}>{tool.tool_name}</span>
            {tool.category && (
              <span className={styles.toolMeta}>{toolCategoryLabel(tool.category)}</span>
            )}
            {duration && <span className={styles.toolMeta}>{duration}</span>}
            {tool.success === false && (
              <span className="text-[10px] text-red-300/90">failed</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function MessageMetadata({ message, replyMessage = null }: MessageMetadataProps) {
  const isUser = message.role === "user";
  const surface: MetadataSurface = isUser ? "user" : "assistant";
  const styles = metadataStyles(surface);
  const turnMessage = isUser ? replyMessage : message;
  const agents = turnMessage ? agentsForMessage(turnMessage) : [];
  const updatedDiffers =
    message.updated_at && message.updated_at !== message.created_at;

  return (
    <div
      className={`mt-3 space-y-2.5 border-t pt-3 text-left ${styles.divider}`}
      onClick={(event) => event.stopPropagation()}
    >
      <MetadataRow label="Sent" surface={surface}>
        {formatMessageTimestamp(message.created_at)}
      </MetadataRow>

      {updatedDiffers && (
        <MetadataRow label="Edited" surface={surface}>
          {formatMessageTimestamp(message.updated_at)}
        </MetadataRow>
      )}

      {isUser && !replyMessage && (
        <p className={`text-[11px] ${styles.muted}`}>No reply yet.</p>
      )}

      {turnMessage && (
        <>
          {isUser && replyMessage && (
            <p className={`font-mono text-[10px] uppercase tracking-wider ${styles.section}`}>
              Response
            </p>
          )}

          <MetadataRow label="Agents" surface={surface}>
            <AgentList agentIds={agents} surface={surface} />
          </MetadataRow>

          <MetadataRow label="Tools" surface={surface}>
            <ToolList message={turnMessage} surface={surface} />
          </MetadataRow>

          {!isUser && (message.provider || message.model) && (
            <MetadataRow label="Model" surface={surface}>
              <span className="font-mono text-[11px] text-stone-400">
                {[message.provider, message.model].filter(Boolean).join(" · ")}
              </span>
            </MetadataRow>
          )}

          {!isUser &&
            (message.input_tokens != null || message.output_tokens != null) && (
              <MetadataRow label="Tokens" surface={surface}>
                <span className="font-mono text-[11px] text-stone-400">
                  {message.input_tokens?.toLocaleString() ?? "—"} in ·{" "}
                  {message.output_tokens?.toLocaleString() ?? "—"} out
                </span>
              </MetadataRow>
            )}
        </>
      )}
    </div>
  );
}
