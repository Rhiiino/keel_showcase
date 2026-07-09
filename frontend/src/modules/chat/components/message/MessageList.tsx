// stack_sandbox/frontend_web/src/modules/chat/components/message/MessageList.tsx

// Scrollable message history with optional live streaming assistant bubble.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { AgentAvatar } from "../common/AgentAvatar";
import type { Message } from "../../api";
import {
  assistantBubbleAgentId,
  buildReplyByUserMessageId,
} from "../../lib/message";
import { ChatConversationEmptyState } from "./ChatConversationEmptyState";
import { MessageBubbleCopyButton } from "./MessageBubbleCopyButton";
import { MessageMarkdown } from "./MessageMarkdown";
import { MessageMetadata } from "./MessageMetadata";
import { TypingDots } from "./TypingDots";

type MessageListProps = {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingAgentId?: string | null;
  driverAgentId?: string | null;
};

const ASSISTANT_AVATAR_SIZE = "h-8 w-8";

function toggleOnActivate(event: KeyboardEvent<HTMLDivElement>, onToggle: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle();
  }
}

export function MessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingContent = "",
  streamingAgentId = null,
  driverAgentId = null,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);

  const visibleMessages = messages.filter(
    (message) => message.role === "user" || message.role === "assistant",
  );

  const replyByUserMessageId = useMemo(
    () => buildReplyByUserMessageId(visibleMessages),
    [visibleMessages],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, streamingContent, isStreaming]);

  const toggleExpanded = (messageId: number) => {
    setExpandedMessageId((current) => (current === messageId ? null : messageId));
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-stone-500">
        Loading messages…
      </div>
    );
  }

  if (visibleMessages.length === 0 && !isStreaming) {
    return (
      <ChatConversationEmptyState driverAgentId={driverAgentId ?? "keel"} />
    );
  }

  return (
    <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {visibleMessages.map((message) => {
          const isUser = message.role === "user";
          const isExpanded = expandedMessageId === message.id;

          const assistantAgentId = isUser
            ? null
            : assistantBubbleAgentId(message);

          return (
            <div
              key={message.id}
              className={[
                "flex",
                isUser ? "justify-end" : "items-end justify-start",
              ].join(" ")}
            >
              {!isUser && assistantAgentId ? (
                <AgentAvatar
                  agentId={assistantAgentId}
                  sizeClassName={ASSISTANT_AVATAR_SIZE}
                />
              ) : null}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleExpanded(message.id)}
                onKeyDown={(event) =>
                  toggleOnActivate(event, () => toggleExpanded(message.id))
                }
                className={[
                  "relative max-w-[85%] cursor-pointer rounded-2xl px-4 pb-3 pl-4 pr-10 pt-8 text-left transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/40",
                  isUser
                    ? "chat-user-bubble text-sm leading-relaxed text-stone-100"
                    : [
                        "border border-stone-800 bg-stone-950/60 text-stone-200 hover:border-stone-700",
                        assistantAgentId ? "ml-2" : "",
                      ].join(" "),
                  isExpanded
                    ? isUser
                      ? "chat-user-bubble-expanded"
                      : "border-stone-700 ring-1 ring-stone-700/50"
                    : "",
                ].join(" ")}
              >
                <MessageBubbleCopyButton
                  content={message.content}
                  variant={isUser ? "user" : "assistant"}
                />
                {isUser ? (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <MessageMarkdown content={message.content} />
                )}
                {isExpanded && (
                  <MessageMetadata
                    message={message}
                    replyMessage={replyByUserMessageId.get(message.id) ?? null}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-end justify-start">
            {streamingAgentId ? (
              <AgentAvatar
                agentId={streamingAgentId}
                sizeClassName={ASSISTANT_AVATAR_SIZE}
              />
            ) : null}
            <div
              className={[
                "relative max-w-[85%] rounded-2xl border border-stone-800 bg-stone-950/60 px-4 pb-3 pl-4 pr-10 pt-8 text-stone-200",
                streamingAgentId ? "ml-2" : "",
              ].join(" ")}
            >
              {streamingContent ? (
                <>
                  <MessageBubbleCopyButton content={streamingContent} />
                  <MessageMarkdown content={streamingContent} />
                </>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
