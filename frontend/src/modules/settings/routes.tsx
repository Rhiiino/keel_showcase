// stack_sandbox/frontend_web/src/modules/settings/routes.tsx

// Settings route nested under AppShell.

import { Route } from "react-router-dom";

import { SettingsPage } from "./pages/SettingsPage";

export const settingsShellRoutes = (
  <>
    <Route path="settings" element={<SettingsPage />} />
  </>
);
