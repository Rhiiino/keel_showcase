// stack_sandbox/frontend_web/src/modules/chat/api.ts

// Chat module API layer: types, TanStack Query keys, REST helpers, and SSE streaming.

import { apiFetch, getApiBaseUrl } from "../../lib/api";
import { parseSseStream } from "../../lib/sse";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type ToolCallSummary = {
  id: number;
  tool_name: string;
  category: string | null;
  call_order: number;
  duration_seconds: number | null;
  success: boolean | null;
};

export type Conversation = {
  id: number;
  user_id: number;
  title: string | null;
  driver_agent_id: string;
  project_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ConversationCreatePayload = {
  title?: string;
  driver_agent_id?: string;
  project_id?: number;
};

export type Message = {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  agent_id: string | null;
  agents_used: string[];
  provider: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  tool_calls: ToolCallSummary[];
  created_at: string;
  updated_at: string;
};

export type ConversationUpdatePayload = {
  title: string;
};

export type ConversationReorderPayload = {
  conversation_ids: number[];
  global_only?: boolean;
  project_id?: number;
};

export type StreamRequest = {
  content: string;
  canvas_context?: Record<string, unknown> | null;
};

export type StreamTurnOptions = {
  canvasContext?: Record<string, unknown> | null;
};

export type ChatModel = {
  id: string;
  provider: string;
  display_name: string;
  max_context_window: number;
  input_price_per_1m: number | null;
  output_price_per_1m: number | null;
};

export type ModelProviderGroup = {
  provider: string;
  models: ChatModel[];
};

export type ChatPreferences = {
  provider: string;
  model_id: string;
  max_context_window: number;
};

export type ChatPreferencesUpdate = {
  provider: string;
  model_id: string;
};

export type ChatRule = {
  id: number;
  title: string;
  content: string;
  agent_ids: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ChatRuleCreatePayload = {
  title: string;
  content: string;
  agent_ids: string[];
  is_active?: boolean;
};

export type ChatRuleUpdatePayload = {
  title?: string;
  content?: string;
  agent_ids?: string[];
  is_active?: boolean;
  sort_order?: number;
};

export type StreamEventHandlers = {
  onUserMessage?: (data: { id: number; content: string }) => void;
  onAgentSelected?: (data: { agent_id: string; delegated: boolean }) => void;
  onDelta?: (data: { content: string }) => void;
  onToolCallStart?: (data: {
    tool_name: string;
    category: string | null;
    call_order: number;
  }) => void;
  onToolCallResult?: (data: {
    tool_name: string;
    category?: string | null;
    success: boolean;
    summary: string;
    duration_seconds?: number;
  }) => void;
  onAssistantMessage?: (data: {
    id: number;
    agent_id: string | null;
    content: string;
  }) => void;
  onDone?: (data: {
    finish_reason: string;
    usage: Record<string, unknown> | null;
    duration_seconds?: number;
  }) => void;
  onError?: (data: { message: string }) => void;
};

const credentials = "include" as const;

export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
  messages: (conversationId: number) =>
    [...chatQueryKeys.all, "messages", conversationId] as const,
  models: () => [...chatQueryKeys.all, "models"] as const,
  preferences: () => [...chatQueryKeys.all, "preferences"] as const,
  rules: () => [...chatQueryKeys.all, "rules"] as const,
};

export function fetchConversations(params?: {
  global_only?: boolean;
  project_id?: number;
}): Promise<Conversation[]> {
  const search = new URLSearchParams();
  if (params?.global_only) {
    search.set("global_only", "true");
  }
  if (params?.project_id !== undefined) {
    search.set("project_id", String(params.project_id));
  }
  const query = search.toString();
  const path = query ? `/chat/conversations?${query}` : "/chat/conversations";
  return apiFetch<Conversation[]>(path, { credentials });
}

export function createConversation(
  payload: ConversationCreatePayload = {},
): Promise<Conversation> {
  return apiFetch<Conversation>("/chat/conversations", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateConversation(
  conversationId: number,
  payload: ConversationUpdatePayload,
): Promise<Conversation> {
  return apiFetch<Conversation>(`/chat/conversations/${conversationId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function reorderConversations(
  payload: ConversationReorderPayload,
): Promise<Conversation[]> {
  return apiFetch<Conversation[]>("/chat/conversations/reorder", {
    method: "PUT",
    credentials,
    body: payload,
  });
}

export function deleteConversation(conversationId: number): Promise<void> {
  return apiFetch<void>(`/chat/conversations/${conversationId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchMessages(conversationId: number): Promise<Message[]> {
  return apiFetch<Message[]>(
    `/chat/conversations/${conversationId}/messages`,
    { credentials },
  ).then((messages) =>
    messages.map((message) => ({
      ...message,
      agents_used: message.agents_used ?? [],
      tool_calls: message.tool_calls ?? [],
    })),
  );
}

export function fetchModels(): Promise<ModelProviderGroup[]> {
  return apiFetch<ModelProviderGroup[]>("/chat/models", { credentials });
}

export function fetchChatPreferences(): Promise<ChatPreferences> {
  return apiFetch<ChatPreferences>("/chat/preferences", { credentials });
}

export function updateChatPreferences(
  payload: ChatPreferencesUpdate,
): Promise<ChatPreferences> {
  return apiFetch<ChatPreferences>("/chat/preferences", {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function fetchRules(): Promise<ChatRule[]> {
  return apiFetch<ChatRule[]>("/chat/rules", { credentials });
}

export function createRule(payload: ChatRuleCreatePayload): Promise<ChatRule> {
  return apiFetch<ChatRule>("/chat/rules", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateRule(
  ruleId: number,
  payload: ChatRuleUpdatePayload,
): Promise<ChatRule> {
  return apiFetch<ChatRule>(`/chat/rules/${ruleId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteRule(ruleId: number): Promise<void> {
  return apiFetch<void>(`/chat/rules/${ruleId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function streamTurn(
  conversationId: number,
  content: string,
  handlers: StreamEventHandlers,
  options: StreamTurnOptions = {},
): Promise<void> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const body: StreamRequest = { content };
  if (options.canvasContext !== undefined && options.canvasContext !== null) {
    body.canvas_context = options.canvasContext;
  }
  const response = await fetch(
    `${base}/chat/conversations/${conversationId}/stream`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  await parseSseStream(response, (eventName, data) => {
    switch (eventName) {
      case "user_message":
        handlers.onUserMessage?.(data as { id: number; content: string });
        break;
      case "agent_selected":
        handlers.onAgentSelected?.(
          data as { agent_id: string; delegated: boolean },
        );
        break;
      case "delta":
        handlers.onDelta?.(data as { content: string });
        break;
      case "tool_call_start":
        handlers.onToolCallStart?.(
          data as {
            tool_name: string;
            category: string | null;
            call_order: number;
          },
        );
        break;
      case "tool_call_result":
        handlers.onToolCallResult?.(
          data as {
            tool_name: string;
            category?: string | null;
            success: boolean;
            summary: string;
            duration_seconds?: number;
          },
        );
        break;
      case "assistant_message":
        handlers.onAssistantMessage?.(
          data as { id: number; agent_id: string | null; content: string },
        );
        break;
      case "done":
        handlers.onDone?.(
          data as {
            finish_reason: string;
            usage: Record<string, unknown> | null;
            duration_seconds?: number;
          },
        );
        break;
      case "error":
        handlers.onError?.(data as { message: string });
        break;
      default:
        break;
    }
  });
}

export const DEFAULT_CONVERSATION_TITLE = "New conversation";

export function conversationTitle(title: string | null | undefined): string {
  const trimmed = title?.trim();
  return trimmed ? trimmed : DEFAULT_CONVERSATION_TITLE;
}
