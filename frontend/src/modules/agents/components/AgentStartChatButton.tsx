// stack_sandbox/frontend_web/src/modules/agents/components/AgentStartChatButton.tsx

// Creates a global chat conversation for the agent and navigates to Chat.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { chatQueryKeys, createConversation } from "../../chat/api";
import { subagentStartChatButtonClassName } from "../lib/agentDisplay";

type AgentStartChatButtonProps = {
  agentId: string;
  displayName: string;
};

function ChatBubbleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 2c-2.236 0-4.298.732-5.96 1.968A7.966 7.966 0 0 0 2 10c0 1.523.425 2.948 1.164 4.162.203.324.406.637.598.932l-1.05 3.468a.75.75 0 0 0 .933.933l3.468-1.05a8.96 8.96 0 0 0 2.395 1.285A7.966 7.966 0 0 0 10 18c4.418 0 8-3.582 8-8s-3.582-8-8-8Zm-1.25 4.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Zm4 0a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5Zm-4 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AgentStartChatButton({
  agentId,
  displayName,
}: AgentStartChatButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accentClassName = subagentStartChatButtonClassName(agentId);

  const createMutation = useMutation({
    mutationFn: () => createConversation({ driver_agent_id: agentId }),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      navigate(`/chat?conversation=${conversation.id}`);
    },
  });

  const label = createMutation.isPending ? "Starting chat…" : "Start chat";

  return (
    <div className="flex w-56 flex-col items-stretch gap-1.5">
      <button
        type="button"
        disabled={createMutation.isPending}
        aria-label={`Start a new chat with ${displayName}`}
        onClick={() => createMutation.mutate()}
        className={[
          "group inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5",
          "border bg-gradient-to-b from-stone-800/95 via-stone-900 to-stone-950",
          "text-sm font-medium tracking-wide transition duration-200",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.35),0_4px_14px_rgba(0,0,0,0.35)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-2px_4px_rgba(0,0,0,0.3),0_6px_18px_rgba(0,0,0,0.45)]",
          "disabled:cursor-wait disabled:opacity-60",
          accentClassName,
        ].join(" ")}
      >
        <ChatBubbleIcon />
        <span>{label}</span>
      </button>

      {createMutation.isError && (
        <p className="text-center text-xs text-red-400" role="alert">
          {createMutation.error.message}
        </p>
      )}
    </div>
  );
}
