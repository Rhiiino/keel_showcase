// stack_sandbox/frontend_web/src/modules/agents/routes.tsx

// Agents module routes rendered inside AppShell. Composed in app/routes.tsx.

import { Route } from "react-router-dom";

import { AgentsPage } from "./pages/AgentsPage";

export const agentsShellRoutes = (
  <>
    <Route path="agents" element={<AgentsPage />} />
  </>
);
