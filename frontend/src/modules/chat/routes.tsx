// stack_sandbox/frontend_web/src/modules/chat/routes.tsx

// Chat module routes rendered inside AppShell (shared nav + main content area).
// Exported for composition in app/routes.tsx.

import { Route } from "react-router-dom";

import { ChatPage } from "./pages/ChatPage";

export const chatShellRoutes = (
  <>
    <Route path="chat" element={<ChatPage />} />
  </>
);
