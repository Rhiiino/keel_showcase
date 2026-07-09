// keel_web/src/modules/focus/routes.tsx

import { Route } from "react-router-dom";

import { FocusFormPage } from "./pages/FocusFormPage";
import { FocusHubRoute } from "./pages/FocusHubRoute";

export const focusShellRoutes = (
  <>
    <Route path="focus" element={<FocusHubRoute />} />
    <Route path="focus/lists/:listId" element={<FocusFormPage />} />
  </>
);
