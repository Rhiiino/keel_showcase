// stack_sandbox/frontend_web/src/modules/intelligence/routes.tsx

// Intelligence module routes — hub, models, and tools.

import { Route } from "react-router-dom";

import { IntelligencePage } from "./pages/IntelligencePage";
import { ModelsPage } from "./pages/ModelsPage";
import { ToolsPage } from "./pages/ToolsPage";

export const intelligenceShellRoutes = (
  <>
    <Route path="intelligence" element={<IntelligencePage />} />
    <Route path="intelligence/models" element={<ModelsPage />} />
    <Route path="intelligence/tools" element={<ToolsPage />} />
  </>
);
