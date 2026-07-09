// stack_sandbox/frontend_web/src/modules/agents/components/SubAgentTile.tsx

// Square beveled tile for one sub-agent in the Agents grid.

import {
  subagentDisplayNameClassName,
  subagentPortraitImageClassName,
  subagentPortraitSrc,
} from "../lib";
import type { AgentSummary } from "../api";

type SubAgentTileProps = {
  agent: AgentSummary;
  selected: boolean;
  onSelect: () => void;
};

function PortraitPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-violet-950/80 via-stone-900 to-stone-950 ring-1 ring-inset ring-violet-500/20"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-14 w-14 text-violet-400/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path
          d="M12 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-5 13v-1.5a5 5 0 0 1 10 0V19H7Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function SubAgentTile({ agent, selected, onSelect }: SubAgentTileProps) {
  const portraitSrc = subagentPortraitSrc(agent.id, agent.media);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${agent.display_name}, sub-agent`}
      className={[
        "group relative flex aspect-square w-40 shrink-0 flex-col overflow-hidden rounded-xl text-left sm:w-48",
        "border border-stone-600/55",
        "bg-gradient-to-br from-stone-800/95 via-stone-900 to-stone-950",
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_6px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.35)]",
        "transition duration-200",
        "hover:border-violet-400/45 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.14),inset_0_-3px_6px_rgba(0,0,0,0.35),0_10px_28px_rgba(0,0,0,0.5)]",
        selected
          ? "border-violet-400/55 ring-2 ring-violet-400/35 ring-offset-2 ring-offset-stone-950"
          : "",
      ].join(" ")}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-5">
        {portraitSrc ? (
          <img
            src={portraitSrc}
            alt=""
            className={subagentPortraitImageClassName(agent.id)}
          />
        ) : (
          <PortraitPlaceholder />
        )}
      </div>

      <div className="shrink-0 border-t border-stone-700/70 bg-stone-950/90 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p
          className={[
            "truncate text-base font-medium",
            subagentDisplayNameClassName(agent.id),
          ].join(" ")}
        >
          {agent.display_name}
        </p>
        <p className="truncate font-mono text-xs text-stone-500">{agent.id}</p>
      </div>
    </button>
  );
}
