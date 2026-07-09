// stack_sandbox/frontend_web/src/modules/auth/routes.tsx

// Auth module route fragments: the /login route and shell routes (pages nested
// under AppShell). Exported for composition in app/routes.tsx.

import { Route } from "react-router-dom";

import { RedirectIfAuthed } from "./components/RedirectIfAuthed";
import { LoginPage } from "./pages/LoginPage";

export const authLoginRoute = (
  <Route
    path="/login"
    element={
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    }
  />
);

