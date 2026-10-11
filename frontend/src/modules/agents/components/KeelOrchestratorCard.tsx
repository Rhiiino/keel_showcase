// stack_sandbox/frontend_web/src/modules/agents/components/KeelOrchestratorCard.tsx

// Featured beveled card for the Keel orchestrator agent.

import { orchestratorPortraitSrc } from "../lib";
import type { AgentSummary } from "../api";

type KeelOrchestratorCardProps = {
  agent: AgentSummary;
  delegateNames: string[];
  expanded: boolean;
  onToggle: () => void;
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={[
        "h-5 w-5 shrink-0 text-stone-500 transition",
        expanded ? "rotate-180" : "",
      ].join(" ")}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function KeelOrchestratorCard({
  agent,
  delegateNames,
  expanded,
  onToggle,
}: KeelOrchestratorCardProps) {
  return (
    <article
      className={[
        "overflow-hidden rounded-xl border border-stone-600/50",
        "bg-gradient-to-br from-stone-800/90 via-stone-900 to-stone-950",
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_8px_rgba(0,0,0,0.4),0_8px_28px_rgba(0,0,0,0.4)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-5 p-5 text-left transition hover:bg-stone-900/40 sm:gap-6 sm:p-6"
      >
        <div
          className={[
            "flex h-24 w-24 shrink-0 items-center justify-center rounded-xl sm:h-28 sm:w-28",
            "border border-lime-400/20 bg-stone-950/60",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.35)]",
          ].join(" ")}
        >
          <img
            src={orchestratorPortraitSrc(agent)}
            alt=""
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-stone-100 sm:text-2xl">{agent.display_name}</h2>
            <span className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime-400/90 ring-1 ring-lime-400/25 bg-lime-400/10">
              Orchestrator
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-stone-600">{agent.id}</p>
          <p className="mt-2 line-clamp-2 text-base text-stone-400">{agent.description}</p>
          {delegateNames.length > 0 && (
            <p className="mt-2 text-sm text-stone-500">
              Delegates to{" "}
              <span className="text-stone-300">{delegateNames.join(", ")}</span>
            </p>
          )}
        </div>

        <ChevronIcon expanded={expanded} />
      </button>
    </article>
  );
}
