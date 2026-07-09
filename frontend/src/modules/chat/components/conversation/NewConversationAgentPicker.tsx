// stack_sandbox/frontend_web/src/modules/chat/components/conversation/NewConversationAgentPicker.tsx

// Dropdown to pick a driver agent before creating a global chat conversation.

import { useEffect, useRef, useState } from "react";

import type { AgentSummary } from "../../../agents/api";
import { AgentAvatar } from "../common";

const KEEL_AGENT_ID = "keel";

type NewConversationAgentPickerProps = {
  agents: AgentSummary[];
  isLoading: boolean;
  isCreating: boolean;
  onSelectAgent: (agentId: string) => void;
};

function sortAgentsForPicker(agents: AgentSummary[]): AgentSummary[] {
  const keel = agents.find((agent) => agent.id === KEEL_AGENT_ID);
  const rest = agents
    .filter((agent) => agent.id !== KEEL_AGENT_ID)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  return keel ? [keel, ...rest] : rest;
}

export function NewConversationAgentPicker({
  agents,
  isLoading,
  isCreating,
  onSelectAgent,
}: NewConversationAgentPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const sortedAgents = sortAgentsForPicker(agents);

  const handleSelect = (agentId: string) => {
    setOpen(false);
    onSelectAgent(agentId);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="New chat"
        aria-label="New chat"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        disabled={isCreating || isLoading}
        className="rounded p-1 text-stone-500 transition hover:bg-stone-800 hover:text-lime-400 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose an agent"
          className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-stone-700 bg-stone-900 py-1 shadow-lg"
        >
          {isLoading && (
            <p className="px-3 py-2 text-xs text-stone-500">Loading agents…</p>
          )}

          {!isLoading && sortedAgents.length === 0 && (
            <p className="px-3 py-2 text-xs text-stone-500">No agents available.</p>
          )}

          {!isLoading &&
            sortedAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                role="option"
                disabled={isCreating}
                onClick={() => handleSelect(agent.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-stone-100 transition hover:bg-stone-800 disabled:opacity-50"
              >
                <AgentAvatar agentId={agent.id} sizeClassName="h-7 w-7" />
                <span className="truncate">{agent.display_name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
