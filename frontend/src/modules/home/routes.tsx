// stack_sandbox/frontend_web/src/modules/home/routes.tsx

// Home module route fragments for the authenticated shell.

import { Route } from "react-router-dom";

import { HomePage } from "./pages/HomePage";

/** Routes rendered inside AppShell (shared nav + main content area). */
export const homeShellRoutes = (
  <>
    <Route index element={<HomePage />} />
  </>
);
