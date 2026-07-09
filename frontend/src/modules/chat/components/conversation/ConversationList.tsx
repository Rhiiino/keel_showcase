// stack_sandbox/frontend_web/src/modules/chat/components/conversation/ConversationList.tsx

// Conversation list with select, create, rename, and delete (General tab body).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import { agentsQueryKeys, fetchAgents } from "../../../agents/api";
import { conversationListAvatarSizeClassName } from "../../../agents/lib";
import {
  chatQueryKeys,
  conversationTitle,
  createConversation,
  deleteConversation,
  fetchConversations,
  reorderConversations,
  updateConversation,
  type Conversation,
} from "../../api";
import {
  moveConversationToInsertIndex,
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../lib/conversationReorder";
import { AgentAvatar } from "../common";
import { GeneralTabSection } from "../status/GeneralTabSection";
import { ConversationInsertIndicator } from "./ConversationInsertIndicator";
import { ConversationRowMenu } from "./ConversationRowMenu";
import { NewConversationAgentPicker } from "./NewConversationAgentPicker";

const GLOBAL_CONVERSATIONS_QUERY_KEY = [
  ...chatQueryKeys.conversations(),
  "global",
] as const;

type ConversationListProps = {
  selectedConversationId: number | null;
  onSelect: (conversationId: number) => void;
  onDeleted: (deletedId: number) => void;
  onCreated: (conversationId: number) => void;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

function agentAvatarHoverRingClassName(agentId: string): string {
  if (agentId === "keel") {
    return "hover:ring-lime-400/35 focus-visible:ring-lime-400/45";
  }
  return "hover:ring-violet-400/35 focus-visible:ring-violet-400/45";
}

export function ConversationList({
  selectedConversationId,
  onSelect,
  onDeleted,
  onCreated,
}: ConversationListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [draggingConversationId, setDraggingConversationId] = useState<
    number | null
  >(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<number, HTMLLIElement>());

  const conversationsQuery = useQuery({
    queryKey: GLOBAL_CONVERSATIONS_QUERY_KEY,
    queryFn: () => fetchConversations({ global_only: true }),
  });

  const agentsQuery = useQuery({
    queryKey: agentsQueryKeys.catalog(),
    queryFn: fetchAgents,
  });

  const createMutation = useMutation({
    mutationFn: (driverAgentId: string) =>
      createConversation({ driver_agent_id: driverAgentId }),
    onSuccess: (conversation) => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      onCreated(conversation.id);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateConversation(id, { title }),
    onSuccess: () => {
      setActionError(null);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      onDeleted(deletedId);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (conversationIds: number[]) =>
      reorderConversations({
        conversation_ids: conversationIds,
        global_only: true,
      }),
    onMutate: async (conversationIds) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: GLOBAL_CONVERSATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Conversation[]>(
        GLOBAL_CONVERSATIONS_QUERY_KEY,
      );
      if (!previous) {
        return { previous };
      }

      const byId = new Map(previous.map((conversation) => [conversation.id, conversation]));
      const reordered = conversationIds
        .map((id) => byId.get(id))
        .filter((conversation): conversation is Conversation => conversation !== undefined);
      queryClient.setQueryData(GLOBAL_CONVERSATIONS_QUERY_KEY, reordered);
      return { previous };
    },
    onError: (err: Error, _conversationIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GLOBAL_CONVERSATIONS_QUERY_KEY, context.previous);
      }
      setActionError(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
  });

  const clearDragState = useCallback(() => {
    setDraggingConversationId(null);
    setDropInsertIndex(null);
  }, []);

  const handleDragStart = useCallback(
    (conversationId: number, event: DragEvent<HTMLDivElement>) => {
      if (reorderMutation.isPending || editingId !== null) {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
      setTransparentDragImage(event.dataTransfer);
      setDraggingConversationId(conversationId);
      const startIndex = (conversationsQuery.data ?? []).findIndex(
        (conversation) => conversation.id === conversationId,
      );
      setDropInsertIndex(startIndex === -1 ? 0 : startIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(conversationId));
    },
    [conversationsQuery.data, editingId, reorderMutation.isPending],
  );

  const handleListDragOver = useCallback(
    (event: DragEvent<HTMLUListElement>) => {
      if (draggingConversationId === null) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const conversations = conversationsQuery.data ?? [];
      const rowRects = conversations.flatMap((conversation) => {
        const row = rowRefs.current.get(conversation.id);
        if (!row) {
          return [];
        }
        const rect = row.getBoundingClientRect();
        return [{ top: rect.top, bottom: rect.bottom }];
      });

      if (rowRects.length === 0) {
        return;
      }

      const nextIndex = resolveInsertIndexFromPointer(event.clientY, rowRects);
      setDropInsertIndex((current) =>
        current === nextIndex ? current : nextIndex,
      );
    },
    [conversationsQuery.data, draggingConversationId],
  );

  const setRowRef = useCallback(
    (conversationId: number, node: HTMLLIElement | null) => {
      if (node) {
        rowRefs.current.set(conversationId, node);
        return;
      }
      rowRefs.current.delete(conversationId);
    },
    [],
  );

  const handleDrop = useCallback(() => {
    const draggedId = draggingConversationId;
    const insertIndex = dropInsertIndex;
    clearDragState();

    if (draggedId === null || insertIndex === null) {
      return;
    }

    const current = conversationsQuery.data ?? [];
    const reordered = moveConversationToInsertIndex(
      current,
      draggedId,
      insertIndex,
    );
    if (reordered === current) {
      return;
    }
    reorderMutation.mutate(reordered.map((conversation) => conversation.id));
  }, [
    clearDragState,
    conversationsQuery.data,
    draggingConversationId,
    dropInsertIndex,
    reorderMutation,
  ]);

  const startEditing = (id: number, currentTitle: string | null) => {
    setEditingId(id);
    setEditTitle(conversationTitle(currentTitle));
  };

  const commitEdit = (id: number) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate({ id, title: trimmed });
  };

  const handleDelete = (id: number, title: string | null) => {
    const label = conversationTitle(title);
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const conversations = conversationsQuery.data ?? [];

  const agentDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agentsQuery.data ?? []) {
      map.set(agent.id, agent.display_name);
    }
    return map;
  }, [agentsQuery.data]);

  return (
    <GeneralTabSection
      title="Conversations"
      className="flex min-h-0 flex-1 flex-col bg-stone-950/20"
      headerAction={
        <NewConversationAgentPicker
          agents={agentsQuery.data ?? []}
          isLoading={agentsQuery.isLoading}
          isCreating={createMutation.isPending}
          onSelectAgent={(agentId) => createMutation.mutate(agentId)}
        />
      }
    >
      {actionError && (
        <p className="px-4 py-2 text-xs text-red-400">{actionError}</p>
      )}

      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
        {conversationsQuery.isLoading && (
          <p className="px-4 py-6 text-sm text-stone-500">Loading…</p>
        )}

        {conversationsQuery.isError && (
          <p className="px-4 py-6 text-sm text-red-400">
            Failed to load conversations.
          </p>
        )}

        {!conversationsQuery.isLoading && conversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-stone-500">
            No conversations yet.
          </p>
        )}

        <ul
          className="py-2"
          onDragOver={handleListDragOver}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop();
          }}
        >
          {conversations.map((conversation, index) => {
            const isSelected = conversation.id === selectedConversationId;
            const isEditing = editingId === conversation.id;
            const driverAgentId = conversation.driver_agent_id;
            const avatarOpensAgentPage = isSelected;
            const agentDisplayName =
              agentDisplayNameById.get(driverAgentId) ?? driverAgentId;
            const isDraggingRow = conversation.id === draggingConversationId;

            return (
              <li
                key={conversation.id}
                ref={(node) => setRowRef(conversation.id, node)}
                className={[
                  "relative",
                  isDraggingRow ? "opacity-40" : "",
                ].join(" ")}
              >
                {draggingConversationId !== null &&
                dropInsertIndex === index ? (
                  <ConversationInsertIndicator position="top" />
                ) : null}
                {draggingConversationId !== null &&
                dropInsertIndex === conversations.length &&
                index === conversations.length - 1 ? (
                  <ConversationInsertIndicator position="bottom" />
                ) : null}
                  <div
                    draggable={!isEditing && !reorderMutation.isPending}
                    onDragStart={(event) =>
                      handleDragStart(conversation.id, event)
                    }
                    onDragEnd={clearDragState}
                    className={[
                      "group relative flex items-start gap-2 px-3 py-1 pr-7",
                      isSelected ? "bg-stone-800/50" : "hover:bg-stone-900/50",
                      isEditing || reorderMutation.isPending
                        ? ""
                        : "cursor-grab active:cursor-grabbing",
                    ].join(" ")}
                  >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        autoFocus
                        maxLength={200}
                        onChange={(event) => setEditTitle(event.target.value)}
                        onBlur={() => commitEdit(conversation.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitEdit(conversation.id);
                          }
                          if (event.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full rounded border border-stone-700 bg-stone-950 px-2 py-1 text-sm text-stone-100 focus:border-lime-400/40 focus:outline-none"
                      />
                    ) : (
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-100">
                            {conversationTitle(conversation.title)}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {formatRelativeTime(conversation.updated_at)}
                          </p>
                        </div>
                        {!avatarOpensAgentPage ? (
                          <AgentAvatar
                            agentId={driverAgentId}
                            sizeClassName={conversationListAvatarSizeClassName(
                              driverAgentId,
                            )}
                          />
                        ) : null}
                      </div>
                    )}
                  </button>

                  {!isEditing && avatarOpensAgentPage ? (
                    <button
                      type="button"
                      title={`View ${agentDisplayName}`}
                      aria-label={`View ${agentDisplayName} on Agents page`}
                      onClick={() =>
                        navigate(`/agents?agent=${encodeURIComponent(driverAgentId)}`)
                      }
                      className={[
                        "shrink-0 rounded-full p-0.5 transition",
                        "hover:bg-stone-800/80 hover:ring-2",
                        "focus-visible:outline-none focus-visible:ring-2",
                        agentAvatarHoverRingClassName(driverAgentId),
                      ].join(" ")}
                    >
                      <AgentAvatar
                        agentId={driverAgentId}
                        sizeClassName={conversationListAvatarSizeClassName(
                          driverAgentId,
                        )}
                      />
                    </button>
                  ) : null}

                  {!isEditing ? (
                    <ConversationRowMenu
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                      items={[
                        {
                          id: "rename",
                          label: "Rename",
                          onSelect: () =>
                            startEditing(conversation.id, conversation.title),
                        },
                        {
                          id: "delete",
                          label: "Delete",
                          tone: "danger",
                          onSelect: () =>
                            handleDelete(conversation.id, conversation.title),
                        },
                      ]}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </GeneralTabSection>
  );
}
