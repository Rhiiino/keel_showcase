// stack_sandbox/frontend_web/src/modules/chat/hooks/useChatStream.ts

// Ephemeral streaming state for a chat turn (deltas, agent).
// Not React Query — invalidated on completion via parent callback.

import { useCallback, useState } from "react";

import { ApiError } from "../../../lib/api";
import { streamTurn, type StreamTurnOptions } from "../api";

type UseChatStreamOptions = {
  onComplete?: () => void;
  onUserMessage?: () => void;
  onTurnStart?: () => void;
  onTurnEnd?: () => void;
  onLogEvent?: (eventName: string, data: Record<string, unknown>) => void;
};

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { onComplete, onUserMessage, onTurnStart, onTurnEnd, onLogEvent } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const logEvent = useCallback(
    (eventName: string, data: Record<string, unknown>) => {
      onLogEvent?.(eventName, data);
    },
    [onLogEvent],
  );

  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
      options: StreamTurnOptions = {},
    ) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) {
        return;
      }

      setIsStreaming(true);
      setStreamingContent("");
      setActiveAgentId(null);
      setStreamError(null);
      onTurnStart?.();

      let sawError = false;

      try {
        await streamTurn(conversationId, trimmed, {
          onUserMessage: (data) => {
            logEvent("user_message", data);
            onUserMessage?.();
          },
          onAgentSelected: (data) => {
            setActiveAgentId(data.agent_id);
            logEvent("agent_selected", data);
          },
          onDelta: (data) => {
            if (data.content) {
              setStreamingContent((prev) => prev + data.content);
            }
          },
          onToolCallStart: (data) => {
            logEvent("tool_call_start", data);
          },
          onToolCallResult: (data) => {
            logEvent("tool_call_result", data);
          },
          onAssistantMessage: (data) => {
            logEvent("assistant_message", data);
          },
          onDone: (data) => {
            logEvent("done", data);
          },
          onError: (data) => {
            sawError = true;
            setStreamError(data.message);
            logEvent("error", data);
          },
        }, options);
      } catch (err) {
        sawError = true;
        const message =
          err instanceof ApiError ? err.message : "Failed to send message.";
        setStreamError(message);
        logEvent("error", { message });
      } finally {
        setIsStreaming(false);
        onTurnEnd?.();
        if (!sawError) {
          onComplete?.();
        }
      }
    },
    [isStreaming, onComplete, onTurnEnd, onUserMessage, onTurnStart, logEvent],
  );

  const clearStreamError = useCallback(() => {
    setStreamError(null);
  }, []);

  return {
    isStreaming,
    streamingContent,
    activeAgentId,
    streamError,
    sendMessage,
    clearStreamError,
  };
}
