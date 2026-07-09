// keel_web/src/app/routes.tsx

// Top-level route manifest. Composes login and authenticated shell routes
// (RequireAuth → AppShell) from enabled module manifests.

import { Fragment } from "react";
import { Route, Routes } from "react-router-dom";

import { RequireAuth } from "../modules/auth/components/RequireAuth";
import { enabledModules, moduleManifests } from "./modules/registry";
import { AppShell } from "./shell/AppShell";

const enabled = enabledModules(moduleManifests);

export function AppRoutes() {
  return (
    <Routes>
      {enabled.map((module) =>
        module.publicRoutes ? (
          <Fragment key={module.key}>{module.publicRoutes}</Fragment>
        ) : null,
      )}

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          {enabled.map((module) =>
            module.shellRoutes ? (
              <Fragment key={module.key}>{module.shellRoutes}</Fragment>
            ) : null,
          )}
        </Route>
      </Route>
    </Routes>
  );
}
