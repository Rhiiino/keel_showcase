// stack_sandbox/frontend_web/src/modules/projects/routes.tsx

// Projects module routes rendered inside AppShell. Composed in app/routes.tsx.

import { Route } from "react-router-dom";

import { ProjectsModuleLayout } from "./ProjectsModuleLayout";
import { ProjectCreatePage } from "./pages/ProjectCreatePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectWorkspacePage } from "./pages/ProjectWorkspacePage";
import { ProjectWorkspaceRedirect } from "./pages/ProjectWorkspaceRedirect";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectsTagsPage } from "./pages/ProjectsTagsPage";

export const projectsShellRoutes = (
  <>
    <Route
      path="projects/:projectId/workspace/:canvasId"
      element={<ProjectWorkspacePage />}
    />
    <Route path="projects/:projectId/workspace" element={<ProjectWorkspaceRedirect />} />

    <Route path="projects" element={<ProjectsModuleLayout />}>
      <Route path="tags" element={<ProjectsTagsPage />} />
      <Route path="new" element={<ProjectCreatePage />} />
      <Route path=":projectId" element={<ProjectDetailPage />} />
      <Route index element={<ProjectsPage />} />
    </Route>
  </>
);
