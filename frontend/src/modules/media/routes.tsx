// keel_web/src/modules/media/routes.tsx

// Media module routes rendered inside AppShell. Composed in app/routes.tsx.

import { Route } from "react-router-dom";

import { MediaModuleLayout } from "./MediaModuleLayout";
import { MediaCreatePage } from "./pages/MediaCreatePage";
import { MediaDetailPage } from "./pages/MediaDetailPage";
import { MediaPanelPage } from "./pages/MediaPanelPage";
import { MediaPanelsListPage } from "./pages/MediaPanelsListPage";
import { MediaPage } from "./pages/MediaPage";

export const mediaShellRoutes = (
  <Route path="media" element={<MediaModuleLayout />}>
    <Route path="new" element={<MediaCreatePage />} />
    <Route path="folders/:folderId" element={<MediaPage />} />
    <Route path="panels/:panelId" element={<MediaPanelPage />} />
    <Route path="panels" element={<MediaPanelsListPage />} />
    <Route path=":mediaId" element={<MediaDetailPage />} />
    <Route index element={<MediaPage />} />
  </Route>
);
