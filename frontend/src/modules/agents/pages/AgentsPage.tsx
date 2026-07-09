// stack_sandbox/frontend_web/src/modules/agents/pages/AgentsPage.tsx

// Top-level Agents route — orchestrator and sub-agent catalog.

import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { AppShellContent } from "../../../app/shell/AppShellContent";
import { ListPageTitle } from "../../../views/list/primitives/ListPageTitle";
import { agentsQueryKeys, fetchAgents } from "../api";
import { AgentEditorProvider } from "../context/AgentEditorContext";
import { AgentEditorActions } from "../components/AgentEditorActions";
import { AgentsCatalog } from "../components/AgentsCatalog";

export function AgentsPage() {
  const [searchParams] = useSearchParams();
  const initialSubagentId = searchParams.get("agent");

  const agentsQuery = useQuery({
    queryKey: agentsQueryKeys.catalog(),
    queryFn: fetchAgents,
  });

  return (
    <AgentEditorProvider>
      <AppShellContent>
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-start justify-between gap-4 overflow-visible">
            <div>
              <ListPageTitle
                title="Agents"
                recordCount={agentsQuery.data?.length}
                className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl"
              />
              <p className="mt-2 max-w-xl text-sm text-stone-500">
                Keel and registered sub-agents. Per-chat behavior rules are managed in{" "}
                <Link
                  to="/chat"
                  className="text-stone-400 underline decoration-stone-600 underline-offset-2 hover:text-stone-300"
                >
                  Chat
                </Link>{" "}
                (Rules tab).
              </p>
            </div>
            <AgentEditorActions />
          </header>

          <div className="mt-8 min-h-0 flex-1 overflow-hidden">
            <AgentsCatalog initialSubagentId={initialSubagentId} />
          </div>
        </div>
      </AppShellContent>
    </AgentEditorProvider>
  );
}
