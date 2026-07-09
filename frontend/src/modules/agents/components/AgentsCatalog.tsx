// stack_sandbox/frontend_web/src/modules/agents/components/AgentsCatalog.tsx

// Agents page layout: Keel orchestrator card + scalable sub-agent tile grid.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { NAVIGATION_PAGE_KEYS } from "../../../app/navigation/navigationStackConfig";
import { usePageNavigationState } from "../../../app/navigation/usePageNavigationState";
import { agentsQueryKeys, fetchAgents, type AgentSummary } from "../api";
import { AgentDetailAside } from "./AgentDetailAside";
import { KeelOrchestratorCard } from "./KeelOrchestratorCard";
import { SubAgentTile } from "./SubAgentTile";

type AgentsCatalogProps = {
  /** When set (e.g. from `/agents?agent=baysic`), open that sub-agent detail on load. */
  initialSubagentId?: string | null;
};

export function AgentsCatalog({ initialSubagentId = null }: AgentsCatalogProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keelExpanded, setKeelExpanded] = useState(false);
  const [selectedSubagentId, setSelectedSubagentId] = useState<string | null>(null);
  const [detailLayoutOpen, setDetailLayoutOpen] = useState(false);

  usePageNavigationState(NAVIGATION_PAGE_KEYS.agents, {
    capture: () => ({
      selectedSubagentId,
      keelExpanded,
    }),
    restore: (state) => {
      if (!state) {
        return;
      }
      if (typeof state.keelExpanded === "boolean") {
        setKeelExpanded(state.keelExpanded);
      }
      if (
        state.selectedSubagentId === null ||
        typeof state.selectedSubagentId === "string"
      ) {
        setSelectedSubagentId(state.selectedSubagentId as string | null);
      }
    },
  });

  const handleDetailLayoutOpenChange = useCallback((open: boolean) => {
    setDetailLayoutOpen(open);
  }, []);

  const agentsQuery = useQuery({
    queryKey: agentsQueryKeys.catalog(),
    queryFn: fetchAgents,
  });

  const { orchestrator, subagents } = useMemo(() => {
    const list = agentsQuery.data ?? [];
    return {
      orchestrator: list.find((agent) => agent.is_orchestrator) ?? null,
      subagents: list.filter((agent) => !agent.is_orchestrator),
    };
  }, [agentsQuery.data]);

  const syncAgentSearchParam = useCallback(
    (agentId: string | null, keelOpen: boolean) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (keelOpen && orchestrator) {
            next.set("agent", orchestrator.id);
          } else if (agentId) {
            next.set("agent", agentId);
          } else {
            next.delete("agent");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, orchestrator],
  );

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agentsQuery.data ?? []) {
      map.set(agent.id, agent.display_name);
    }
    return map;
  }, [agentsQuery.data]);

  const selectedSubagent = useMemo(
    () => subagents.find((agent) => agent.id === selectedSubagentId) ?? null,
    [subagents, selectedSubagentId],
  );

  useEffect(() => {
    const agentFromUrl = searchParams.get("agent") ?? initialSubagentId;
    if (!agentFromUrl) {
      return;
    }

    if (orchestrator && agentFromUrl === orchestrator.id) {
      setKeelExpanded(true);
      setSelectedSubagentId(null);
      return;
    }

    if (subagents.length === 0) {
      return;
    }

    const match = subagents.find((agent) => agent.id === agentFromUrl);
    if (!match) {
      return;
    }
    setKeelExpanded(false);
    setSelectedSubagentId(match.id);
  }, [searchParams, initialSubagentId, subagents, orchestrator]);

  const detailAgent: AgentSummary | null =
    keelExpanded && orchestrator
      ? orchestrator
      : selectedSubagent;

  /** True while the detail pane is open or animating closed (keeps layout tracks in sync). */
  const detailPanelActive = detailLayoutOpen || detailAgent !== null;

  if (agentsQuery.isLoading) {
    return (
      <p className="py-12 text-center text-sm text-stone-500">Loading agents…</p>
    );
  }

  if (agentsQuery.isError) {
    return (
      <p className="py-12 text-center text-sm text-red-400">Failed to load agents.</p>
    );
  }

  if (!agentsQuery.data?.length) {
    return (
      <p className="py-12 text-center text-sm text-stone-500">No agents registered.</p>
    );
  }

  const delegateNames =
    orchestrator?.delegates_to.map((id) => agentNameById.get(id) ?? id) ?? [];

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          className={[
            "flex w-full min-w-0 flex-col gap-8 pb-6",
            detailPanelActive ? "min-h-0 overflow-y-auto pr-4 scrollbar-hidden" : "",
          ].join(" ")}
        >
          {orchestrator && (
            <section aria-labelledby="orchestrator-heading">
              <h2
                id="orchestrator-heading"
                className="mb-3 font-mono text-[10px] uppercase tracking-widest text-stone-600"
              >
                Orchestrator
              </h2>
              <KeelOrchestratorCard
                agent={orchestrator}
                delegateNames={delegateNames}
                expanded={keelExpanded}
                onToggle={() => {
                  const nextKeelOpen = !keelExpanded;
                  setSelectedSubagentId(null);
                  setKeelExpanded(nextKeelOpen);
                  syncAgentSearchParam(null, nextKeelOpen);
                }}
              />
            </section>
          )}

          {subagents.length > 0 && (
            <section aria-labelledby="subagents-heading">
              <h2
                id="subagents-heading"
                className="mb-3 font-mono text-[10px] uppercase tracking-widest text-stone-600"
              >
                Sub-agents
              </h2>
              <div className="flex flex-wrap gap-4 sm:gap-5">
                {subagents.map((agent) => (
                  <SubAgentTile
                    key={agent.id}
                    agent={agent}
                    selected={selectedSubagentId === agent.id && !keelExpanded}
                    onSelect={() => {
                      const nextSubagentId =
                        selectedSubagentId === agent.id ? null : agent.id;
                      setKeelExpanded(false);
                      setSelectedSubagentId(nextSubagentId);
                      syncAgentSearchParam(nextSubagentId, false);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div
        className={[
          "h-full min-h-0 min-w-0 shrink-0 overflow-hidden",
          "transition-[width] duration-300 ease-out motion-reduce:transition-none",
          detailPanelActive ? "w-[62%] max-w-[60rem]" : "w-0",
        ].join(" ")}
      >
        <AgentDetailAside
          agent={detailAgent}
          onLayoutOpenChange={handleDetailLayoutOpenChange}
        />
      </div>
    </div>
  );
}
