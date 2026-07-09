// keel_web/src/main.tsx

// React entry point. Mounts the app with StrictMode, BrowserRouter, providers,
// and the top-level AppRoutes component.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AppProviders } from "./app/providers";
import { AppRoutes } from "./app/routes";
import { applyThemeToDocument, readStoredThemeId } from "./modules/settings/lib/theme";
import "./index.css";

applyThemeToDocument(readStoredThemeId());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
