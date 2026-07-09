// stack_sandbox/frontend_web/src/modules/chat/pages/ChatPage.tsx

// Chat page: status panel, message history, and streaming composer.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { chatQueryKeys, fetchConversations, fetchMessages } from "../api";
import { ChatComposer } from "../components/composer";
import { MessageList } from "../components/message";
import { StatusPanel } from "../components/status";
import { useChatStream } from "../hooks/useChatStream";
import { useStatusLog } from "../hooks/useStatusLog";
import { useStatusPanelLayout } from "../hooks/useStatusPanelLayout";
import { useStatusPanelTabLayout } from "../hooks/useStatusPanelTabLayout";
import { STATUS_PANEL_TAB_IDS } from "../lib/status";

function parseConversationIdParam(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationFromUrl = parseConversationIdParam(
    searchParams.get("conversation"),
  );

  const {
    layout: statusTabLayout,
    activeTabId: activeStatusTab,
    selectTab: selectStatusTab,
    dockTab: dockStatusTab,
    undockTabFromStack: undockStatusTab,
    resizePaneDivider: resizeStatusPaneDivider,
    paneHeightFractions: statusPaneHeightFractions,
  } = useStatusPanelTabLayout(STATUS_PANEL_TAB_IDS.general);

  const { entries, appendFromEvent, startTurn, clearLog } = useStatusLog();
  const {
    width: statusPanelWidth,
    side: statusPanelSide,
    isResizing: isStatusPanelResizing,
    isRepositioning: isStatusPanelRepositioning,
    onResizePointerDown: onStatusPanelResize,
    onRepositionPointerDown: onStatusPanelReposition,
  } = useStatusPanelLayout();

  const conversationsQuery = useQuery({
    queryKey: [...chatQueryKeys.conversations(), "global"] as const,
    queryFn: () => fetchConversations({ global_only: true }),
  });

  const conversations = conversationsQuery.data ?? [];

  const selectedConversationId = useMemo(() => {
    if (conversations.length === 0) {
      return conversationFromUrl;
    }
    if (
      conversationFromUrl !== null &&
      conversations.some((conversation) => conversation.id === conversationFromUrl)
    ) {
      return conversationFromUrl;
    }
    return conversations[0].id;
  }, [conversations, conversationFromUrl]);

  const selectConversation = useCallback(
    (conversationId: number) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set("conversation", String(conversationId));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (selectedConversationId === null) {
      return;
    }
    if (conversationFromUrl === selectedConversationId) {
      return;
    }
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("conversation", String(selectedConversationId));
        return next;
      },
      { replace: true },
    );
  }, [conversationFromUrl, selectedConversationId, setSearchParams]);

  const messagesQuery = useQuery({
    queryKey: chatQueryKeys.messages(selectedConversationId ?? 0),
    queryFn: () => fetchMessages(selectedConversationId!),
    enabled: selectedConversationId !== null,
  });

  const invalidateMessages = useCallback(() => {
    if (selectedConversationId === null) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: chatQueryKeys.messages(selectedConversationId),
    });
  }, [queryClient, selectedConversationId]);

  const handleStreamComplete = useCallback(() => {
    invalidateMessages();
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
  }, [queryClient, invalidateMessages]);

  const {
    isStreaming,
    streamingContent,
    activeAgentId,
    streamError,
    sendMessage,
    clearStreamError,
  } = useChatStream({
    onUserMessage: invalidateMessages,
    onComplete: handleStreamComplete,
    onTurnStart: startTurn,
    onLogEvent: appendFromEvent,
  });

  const handleCreated = (conversationId: number) => {
    selectConversation(conversationId);
  };

  const handleDeleted = (deletedId: number) => {
    if (selectedConversationId !== deletedId) {
      return;
    }
    const remaining = conversations.filter((conversation) => conversation.id !== deletedId);
    if (remaining[0]) {
      selectConversation(remaining[0].id);
      return;
    }
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("conversation");
        return next;
      },
      { replace: true },
    );
  };

  const handleSend = (content: string) => {
    if (selectedConversationId === null) {
      return;
    }
    clearStreamError();
    void sendMessage(selectedConversationId, content);
  };

  const statusPanel = (
    <StatusPanel
      side={statusPanelSide}
      width={statusPanelWidth}
      isResizing={isStatusPanelResizing}
      isRepositioning={isStatusPanelRepositioning}
      onResizePointerDown={onStatusPanelResize}
      onRepositionPointerDown={onStatusPanelReposition}
      layout={statusTabLayout}
      activeTabId={activeStatusTab}
      onSelectTab={selectStatusTab}
      onDockTab={dockStatusTab}
      onUndockTab={undockStatusTab}
      paneHeightFractions={statusPaneHeightFractions}
      onResizePaneDivider={resizeStatusPaneDivider}
      selectedConversationId={selectedConversationId}
      onSelect={selectConversation}
      onCreated={handleCreated}
      onDeleted={handleDeleted}
      logEntries={entries}
      onClearLog={clearLog}
      isStreaming={isStreaming}
    />
  );

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const streamingAgentId =
    activeAgentId ?? selectedConversation?.driver_agent_id ?? null;

  const chatMain = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <MessageList
        messages={messagesQuery.data ?? []}
        isLoading={messagesQuery.isLoading && selectedConversationId !== null}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamingAgentId={streamingAgentId}
        driverAgentId={selectedConversation?.driver_agent_id ?? null}
      />

      {streamError && (
        <div className="mx-4 mb-2 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300 sm:mx-6">
          {streamError}
        </div>
      )}

      <ChatComposer
        disabled={selectedConversationId === null || isStreaming}
        onSend={handleSend}
      />
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      {statusPanelSide === "left" && statusPanel}
      {chatMain}
      {statusPanelSide === "right" && statusPanel}
    </div>
  );
}
